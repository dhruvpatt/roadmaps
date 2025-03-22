import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.backend.settings')
django.setup()

from google import genai
from google.genai import types
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import Module, User, Content
from django.conf import settings
from datetime import datetime, timedelta
import json
import time

# Gemini API key setup
api_key = getattr(settings, 'LLM_API_KEY')
client = genai.Client(api_key=api_key)

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
        - content: the actual content or recommendation
        For html components focus of creating appealing visualization that will further the students understanding 
        for content this is the core lecture material 
        For video these are link to youtube videos these should be education in nature
        Example:
        [
          {{"type": "html", "content": "<h2>Understanding Fractions</h2><p>...</p>"}},
          {{"type": "content", "content": "Fractions represent parts of a whole..."}},
          {{"type": "video", "content": "Intro to Fractions by Khan Academy"}}
        ]
        NO TEXT BEFORE OR AFTER THE JSON.
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
        Evaluate the following content structure: {content_list}
        Check for JSON validity, relevance to learning goals, and overall completeness.
        Respond with either 'Valid' or 'Incomplete'. If incomplete, provide a reason.
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
                    content_list = json.loads(content_list)
                    for item in content_list:
                        Content.objects.create(
                            module=module,
                            type=item['type'],
                            content=item['content']
                        )
                    return Response({"message": f"Content generated and saved in {iteration} iterations."}, status=status.HTTP_201_CREATED)

                if datetime.now() - start_time > timeout:
                    return Response({"error": "Timeout reached, content generation failed."}, status=status.HTTP_408_REQUEST_TIMEOUT)
                time.sleep(2)

            return Response({"error": "Minimum iterations reached without valid content."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        except Module.DoesNotExist:
            return Response({"error": "Module not found."}, status=status.HTTP_404_NOT_FOUND)
        except User.DoesNotExist:
            return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
