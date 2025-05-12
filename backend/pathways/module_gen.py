import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.backend.settings')
django.setup()

from rest_framework.views import APIView
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .models import Module, User, Content, Message
from django.conf import settings
from datetime import datetime, timedelta
import json
import time
from pathways.serializers import ModuleSerializer
from django.shortcuts import get_object_or_404
import requests
from .utils import get_llm_response
from .schemas import *




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

class PerceptionAgent:
    def analyze_context(self, module_name, learning_goals, prerequisites_feedback, user_preferences):
        prompt = f"""
        Analyze the following context for creating content for a module titled '{module_name}':
        - Learning Goals: {', '.join(learning_goals)}
        - Feedback from Prerequisite Modules: {prerequisites_feedback}
        - User Preferences: {user_preferences}

        Provide a refined set of insights or themes that the content should focus on, ensuring alignment with prior knowledge, goals, and learner-specific preferences.
        """
        return get_llm_response(prompt)

class ContentGenerationAgent:
    def generate_content(self, module_name, learning_goals, insights, user_preferences):
        prompt = f"""
        Based on the insights: '{insights}' for the module '{module_name}' with learning goals {', '.join(learning_goals)}, generate educational content.
        The user has the following preferences: {user_preferences}.

        The content should be personalized according to these preferences.

        Return a list of content items, each with:
        - type: one of ['html', 'content', 'video']
        - content: the actual content or interactive structure
        """
        return get_llm_response(prompt, response_model=ContentList)

class EvaluationAgent:
    def evaluate(self, content_list):
        prompt = f"""
        Evaluate the following educational content for structure and completeness:

        {content_list}

        Respond with 'Valid' if the content meets all criteria, or 'Incomplete' with reasons.
        """
        response = get_llm_response(prompt)
        return response.lower().startswith('valid')
    
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
                        content_data = pyjson.loads(content_list)

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
                        module.content_list.set(content_objects)  # this sets content_list with ordering
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
            # Save user message
            Message.objects.create(module=module, content=message, type='user')

            # Prepare full chat history
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
            assistant_reply = get_llm_response(prompt)  # Plain text response

            # Save assistant reply
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
            Then suggest updates to their learning preferences.
            """

            result = get_llm_response(prompt, response_model=FeedbackResponse)

            module.feedback = result.feedback
            module.save()

            existing_prefs = set(user.preferences or [])
            updated_prefs = set(result.updated_preferences)
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
            generate_url = "https://pathwaysbackend-856935426396.us-central1.run.app/generate-module/"
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

@api_view(['POST'])
def update_module_video(request):
    module_id = request.data.get('module_id')
    video_url = request.data.get('video_url')

    if not module_id or not video_url:
        return Response({"error": "module_id and video_url are required"}, status=status.HTTP_400_BAD_REQUEST)

    try:
        module = Module.objects.get(pk=module_id)
        module.yt_video = video_url
        module.save()

        return Response({"message": "Module video updated successfully.", "video_url": module.yt_video}, status=status.HTTP_200_OK)

    except Module.DoesNotExist:
        return Response({"error": "Module not found"}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(["POST"])
def create_lecture_materials(request):
    module_id = request.data.get("module_id")
    if not module_id:
        return Response({"error": "module_id is required"}, status=status.HTTP_400_BAD_REQUEST)

    try:
        module = Module.objects.get(pk=module_id)

        # Gather context
        chat_history = Message.objects.filter(module=module).order_by("timestamp")
        chat_log = "\n".join([
            f"User: {msg.content}" if msg.type == "user" else f"AI: {msg.content}"
            for msg in chat_history
        ])
        content_texts = [c.content for c in module.contents.all() if c.type != "video"]
        content_combined = "\n".join(content_texts)
        feedback = module.feedback or "No feedback provided."

        # Get LaTeX slides
        latex_prompt = f"""
        You are a LaTeX slide generator. Write a Beamer presentation based on the following content.

        Module Title: {module.name}
        Learning Goals: {', '.join(module.learning_goals)}
        Feedback: {feedback}

        Educational Content:
        {content_combined}

        Chat Interaction Summary:
        {chat_log}

        Only return the LaTeX code, starting with \\documentclass{{beamer}} and ending with \\end{{document}}.
        Keep it simple and avoid any imports beyond Beamer defaults.
        """
        latex_output = get_llm_response(latex_prompt)  # String response
        print("LaTeX Output:", latex_output)

        # Get slide narration script (structured)
        script_prompt = f"""
        Given the following LaTeX Beamer slide content, generate a corresponding script to be read aloud per slide.

        LaTeX Slides:
        {latex_output}

        Format the response as JSON:
        {{
          "scripts": {{
            "1": "...",
            "2": "..."
          }}
        }}
        Do not add explanations outside the JSON.
        """
        script_result = get_llm_response(script_prompt, response_model=SlideScript)

        return Response({
            "latex": latex_output,
            "script": script_result.scripts
        }, status=status.HTTP_200_OK)

    except Module.DoesNotExist:
        return Response({"error": "Module not found"}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    