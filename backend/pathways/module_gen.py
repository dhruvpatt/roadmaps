import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.backend.settings')
django.setup()

from google import genai
from google.genai import types
from rest_framework.views import APIView
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .models import Module, User, Content, Message, Quiz
from django.conf import settings
from datetime import datetime, timedelta
import json
import time
from pathways.serializers import ModuleSerializer
from django.shortcuts import get_object_or_404
import requests

# Gemini API key setup
api_key = getattr(settings, 'LLM_API_KEY')
client = genai.Client(api_key=api_key)
yt_key = getattr(settings, 'YT_API_KEY')
def search_youtube_video(query):
    url = "https://www.googleapis.com/youtube/v3/search"
    params = {
        "part": "snippet",
        "q": query,
        "key": yt_key,
        "maxResults": 1,
        "type": "video"
    }

    res = requests.get(url, params=params)
    data = res.json()

    if "items" in data and data["items"]:
        video_id = data["items"][0]["id"]["videoId"]
        return f"https://www.youtube.com/watch?v={video_id}"

    return None  # No valid video found
def clean_response(response):
    splitted = response.split('```json')
    if len(splitted) < 2:
        raise ValueError("No JSON part found in the input string.")

    # Extract the JSON part and remove trailing backticks
    return splitted[1].split('```')[0].strip()
class PerceptionAgent:
    def analyze_context(self, module_name, learning_goals, prerequisites_feedback, user_preferences):
        prompt = f"""
        Analyze the following context for creating content for a module titled '{module_name}':
        - Learning Goals: {', '.join(learning_goals)}
        - Feedback from Prerequisite Modules: {prerequisites_feedback}
        - User Preferences: {user_preferences}

        Provide a refined set of insights or themes that the content should focus on, ensuring alignment with prior knowledge, goals, and learner-specific preferences (e.g., learning disabilities, visual learning, need for breaks).
        """
        generation_config = types.GenerateContentConfig(temperature=0.7)
        response = client.models.generate_content(
            model='gemini-2.0-flash-lite-preview',
            contents=prompt,
            config=generation_config
        )
        return response.text

class ContentGenerationAgent:
    def generate_content(self, module_name, learning_goals, insights, user_preferences):
        prompt = f"""
        Based on the insights: '{insights}' for the module '{module_name}' with learning goals {', '.join(learning_goals)}, generate educational content.
        The user has the following preferences: {user_preferences}.

        The content should be personalized according to these preferences (e.g., visual emphasis, accessibility considerations, pacing recommendations).

        Return a JSON list of dictionaries. Each dictionary must include:
        - type: one of ['html', 'content', 'video']
        - content: the actual content or interactive structure

        Guidelines:
        - For 'html' components: Use clean, valid HTML with headings, or static components visually support understanding. Focus on building lightweight, static visual representations using semantic HTML and good structure — like graphs and visualizations. DO NOT include actual image files (<img>) or attempt to embed media.
        - For 'content': Use plain text or markdown-formatted explanations use asmath package when doing math DO NOT use . DO NOT include HTML tags.
        - For 'video': DO NOT provide a YouTube URL directly
            - INSTEAD, return a search query string describing the video needed (e.g., "Introduction to derivatives")
            - This query will be used to fetch a real YouTube video via API

        DO NOT include explanations outside of the JSON — the result will be shown directly to the user.
        NO NOT HAVE ANY HTML IN IF THE TYPE IS CONTENT THIS IS THE MOST IMPORTANT PART!!!!
        DO NOT USE HTML TO REDER MATH DO THAT IN content type objects resever HTML blocks for headings and visualizations/interactive components!!
        Example:
        [
          {{"type": "html", "content": "<h2>Understanding Functions</h2><ul><li>Inputs and outputs</li><li>Notation: f(x)</li></ul>"}},
          {{"type": "content", "content": "A function relates each input to exactly one output. For example, f(x) = x + 1."}},
          {{"type": "video", "content": "Introdiction "}},
        ]

        EVERYTHING YOU RETURN WILL BE RENDERED AS IS. DO NOT ADD META COMMENTARY. DO NOT ADD EXTRA EXPLANATIONS OUTSIDE THE JSON.
        KEEP HTML SIMPLE, AND INTERACTIVE BLOCKS STRUCTURED.
        """
        generation_config = types.GenerateContentConfig(temperature=0.7)
        response = client.models.generate_content(
            model='gemini-2.0-flash-lite-preview',
            contents=prompt,
            config=generation_config
        )
        return clean_response(response.text)

class EvaluationAgent:
    def evaluate(self, content_list):
        prompt = f"""
        You are evaluating a generated educational module with the following content structure:

        {content_list}

        Your task is to validate this content based on the following criteria:

        1. **JSON Validity**: Ensure the structure is a valid JSON list of dictionaries. Each dictionary must include:
           - A "type" field (one of ['html', 'content', 'video'])
           - A "content" field containing a valid value based on type

        2. **Type-Content Consistency**:
           - If "type" is "html": "content" must be a string of clean, valid HTML. It must render meaningfully and clearly in a learning environment. No scripts or broken tags.
           - If "type" is "content": "content" must be plain text or markdown, not HTML.
           - If "type" is "video": "content" must be a valid and working YouTube video URL. Do not allow placeholder text or fake links.

        3. **HTML Validation**:
           - All HTML must be syntactically correct (properly closed tags, valid nesting).
           - HTML should enhance understanding — like headings, lists, tips — and must be simple enough to render properly in a web-based learning environment.

        5. **Completeness**:
           - There should be at least one content block explaining the topic.
           - Visual aids (html) and videos (if present) must support the topic and learning goals.
           - All blocks should make sense together and follow a logical flow.

        If all checks pass, respond exactly: **Valid**

        If any issue is found, respond exactly: **Incomplete**, followed by a brief reason.
        """

        generation_config = types.GenerateContentConfig(temperature=0.7)
        response = client.models.generate_content(
            model='gemini-2.0-flash-lite-preview',
            contents=prompt,
            config=generation_config
        )
        evaluation = response.text.strip().lower()
        return 'valid' in evaluation

class ModuleContentGenerationAPIView(APIView):
    def post(self, request):
        module_id = request.data.get('module_id')
        user_id = request.data.get('user_id')

        if not module_id or not user_id:
            return Response({"error": "module_id and user_id are required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            module = Module.objects.get(pk=module_id)
            user = User.objects.get(pk=user_id)

            learning_goals = module.learning_goals or []
            feedback_list = [prereq.feedback for prereq in module.prerequisites.all() if prereq.feedback]
            prerequisites_feedback = "\n".join(feedback_list)
            user_preferences = user.preferences or []

            perception_agent = PerceptionAgent()
            generation_agent = ContentGenerationAgent()
            evaluation_agent = EvaluationAgent()

            start_time = datetime.now()
            timeout = timedelta(minutes=5)
            max_iterations = 5
            iteration = 0

            while iteration < max_iterations:
                try:
                    iteration += 1
                    print("PERCEPTION")
                    print("+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++")
                    insights = perception_agent.analyze_context(module.name, learning_goals, prerequisites_feedback, user_preferences)
                    print("+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++")
                    print("Generation")
                    print("+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++")
                    content_list = generation_agent.generate_content(module.name, learning_goals, insights, user_preferences)
                    print("+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++")

                    if evaluation_agent.evaluate(content_list):
                        print("EVALUATE: TRUE")
                        content_objects = []
                        content_data = json.loads(content_list)

                        for item in content_data:
                            if item['type'] == 'video':
                                query = item['content']
                                resolved_url = search_youtube_video(query)
                                if resolved_url:
                                    item['content'] = resolved_url
                                else:
                                    # Optionally skip if no valid video was found
                                    print(f"No valid video found for query: {query}")
                                    continue
                            content = Content.objects.create(
                                module=module,  # this sets the FK
                                type=item['type'],
                                content=item['content']
                            )
                            content_objects.append(content)
                        # Now add these to the ManyToMany field manually
                        module.content_list.set(content_objects)
                        quiz = Quiz.objects.create(user=user)  # associate with user
                        module.practice = quiz
                        module.save()
                        # this sets content_list with ordering
                        return Response({"message": f"Content generated and saved in {iteration} iterations."}, status=status.HTTP_201_CREATED)

                    if datetime.now() - start_time > timeout:
                        return Response({"error": "Timeout reached, content generation failed."}, status=status.HTTP_408_REQUEST_TIMEOUT)
                    time.sleep(2)
                except Exception as e:
                    print(e)

            return Response({"error": "Minimum iterations reached without valid content."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        except Module.DoesNotExist:
            return Response({"error": "Module not found."}, status=status.HTTP_404_NOT_FOUND)
        except User.DoesNotExist:
            return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class ModuleAssistantAPIView(APIView):
    def post(self, request):
        module_id = request.data.get("module_id")
        message = request.data.get("message")

        if not module_id or not message:
            return Response({"error": "module_id and message are required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            module = Module.objects.get(pk=module_id)
            # Save user message to history
            user_msg = Message.objects.create(module=module, content=message, type='user')

            # Prepare conversation history
            history = Message.objects.filter(module=module).order_by("timestamp")
            chat_log = "\n".join([
                f"User: {msg.content}" if msg.type == 'user' else f"AI: {msg.content}"
                for msg in history
            ])

            prompt = f"""
            You are an AI assistant helping a student with the module titled "{module.name}".
            Here's the conversation so far:
            {chat_log}

            Respond helpfully and clearly to the last user message.
            """

            config = types.GenerateContentConfig(temperature=0.7)
            response = client.models.generate_content(
                model='gemini-2.0-flash-lite-preview',
                contents=prompt,
                config=config
            )

            assistant_reply = response.text.strip()

            # Save assistant message to history
            Message.objects.create(module=module, content=assistant_reply, type='system')

            return Response({"reply": assistant_reply}, status=status.HTTP_200_OK)

        except Module.DoesNotExist:
            return Response({"error": "Module not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ModuleFeedbackAPIView(APIView):
    def post(self, request):
        module_id = request.data.get("module_id")

        if not module_id:
            return Response({"error": "module_id is required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            module = Module.objects.get(pk=module_id)
            user = module.owner

            # Gather chat history
            messages = Message.objects.filter(module=module).order_by("timestamp")
            chat_log = "\n".join([
                f"User: {m.content}" if m.type == 'user' else f"AI: {m.content}"
                for m in messages
            ])

            # Gather failed questions
            failed = []
            for quiz in user.quizzes.filter(modules=module):
                for question in quiz.failed_questions.all():
                    failed.append(f"Q: {question.question} | A: {question.answer} | Solution: {question.solution}")

            failed_block = "\n".join(failed)

            # Build feedback prompt
            prompt = f"""
            You are a learning assistant. Analyze the following:

            1. Chat History:
            {chat_log}

            2. Missed Quiz Questions:
            {failed_block}

            Provide feedback about the student's learning progress in this module, including misunderstandings, learning style hints, or recommendations.
            Then suggest updates to their learning preferences as a JSON list of recommendations.

            Format:
            {{
              "feedback": "...",
              "updated_preferences": ["Visual learner", "Needs slower pacing", ...]
            }}
            """

            config = types.GenerateContentConfig(temperature=0.7)
            response = client.models.generate_content(
                model='gemini-2.0-flash-lite-preview',
                contents=prompt,
                config=config
            )

            result = json.loads(clean_response(response.text))

            module.feedback = result.get("feedback", "")
            module.save()

            existing_prefs = set(user.preferences or [])
            updated_prefs = set(result.get("updated_preferences", []))
            user.preferences = list(existing_prefs.union(updated_prefs))
            user.save()

            return Response({
                "feedback": module.feedback,
                "updated_preferences": user.preferences
            }, status=status.HTTP_200_OK)

        except Module.DoesNotExist:
            return Response({"error": "Module not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
def roadmap_progress(request, roadmap_id):
    try:
        roadmap = Roadmap.objects.get(pk=roadmap_id)
        chapters = roadmap.chapters.all()
        total_modules = sum(ch.modules.count() for ch in chapters)
        completed_modules = sum(ch.modules.filter(status='completed').count() for ch in chapters)

        progress = (completed_modules / total_modules) * 100 if total_modules > 0 else 0
        return Response({"progress_percent": round(progress, 2)}, status=status.HTTP_200_OK)

    except Roadmap.DoesNotExist:
        return Response({"error": "Roadmap not found"}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
def roadmap_chapter_count(request, roadmap_id):
    try:
        roadmap = Roadmap.objects.get(pk=roadmap_id)
        chapter_count = roadmap.chapters.count()
        return Response({"chapter_count": chapter_count}, status=status.HTTP_200_OK)

    except Roadmap.DoesNotExist:
        return Response({"error": "Roadmap not found"}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
def get_module(request):
    module_id = request.data.get('module_id')
    user_id = request.data.get('user_id')

    if not module_id or not user_id:
        return Response({"error": "module_id and user_id are required"}, status=status.HTTP_400_BAD_REQUEST)

    try:
        module = Module.objects.get(pk=module_id)
        user = User.objects.get(pk=user_id)

        if module.content_list.count() == 0:
            # Trigger content generation
            generate_url = "http://localhost:8000/generate-module/"
            response = requests.post(generate_url, json={
                "module_id": module_id,
                "user_id": user_id
            })

            if response.status_code != 201:
                return Response({"error": "Content generation failed"}, status=response.status_code)

            module.refresh_from_db()
            module.status = "in_progress"
            module.save()

        serializer = ModuleSerializer(module)
        return Response(serializer.data, status=status.HTTP_200_OK)

    except Module.DoesNotExist:
        return Response({"error": "Module not found"}, status=status.HTTP_404_NOT_FOUND)
    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)



