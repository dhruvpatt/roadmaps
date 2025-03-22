import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.backend.settings')  # Replace 'your_project_name' with the actual project name
django.setup()

import time
from google import genai
from google.genai import types  # Assuming Gemini text generation endpoint is like OpenAI's GPT-3

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import Roadmap, User, Chapter, Module
from .serializers import QueryRequestSerializer
from django.db import transaction
from datetime import datetime, timedelta
from django.conf import settings

# Set the Gemini API key (adjust based on actual implementation)
api_key = getattr(settings, 'LLM_API_KEY')
client = genai.Client(api_key=api_key)


# Agent Classes

class PerceptionAgent:
    def generate_insights(self, topic, learning_goals, grade):
        prompt = f"Based on the topic '{topic}', learning goals '{learning_goals}', and grade level '{grade}', " \
                 f"provide insights and high-level objectives for the lesson."
        try:
            generation_config = types.GenerateContentConfig(temperature=0.7)

            response = client.models.generate_content(
                model='gemini-2.0-flash-lite-preview',
                contents=prompt,
                config=generation_config
            )
            print(response.text)
            return response.text
        except Exception as e:
            raise ValueError(f"Error generating insights: {e}")

def clean_response(response):
    splitted = response.split('```json')
    if len(splitted) < 2:
        raise ValueError("No JSON part found in the input string.")

    # Extract the JSON part and remove trailing backticks
    return splitted[1].split('```')[0].strip()
class GenerationAgent:
    def generate_roadmap(self, perception_data, topic, learning_goals, grade, mode):
        prompt = f"""
        Based on the following insights '{perception_data}', generate a detailed roadmap for teaching the topic '{topic}' to students in grade '{grade}', ensuring that the learning goals {', '.join([f"'{goal}'" for goal in learning_goals])} are effectively covered.
        The roadmap should be divided into modules that are aligned with the following:
        - The grade level ('{grade}') to ensure the content is age-appropriate.
        - The learning goals ({', '.join([f"'{goal}'" for goal in learning_goals])}) to ensure each module is directly tied to those goals.
        - The mode ('{mode}') will dictate the complexity of the content, where 'STRICT' means each module should have a well-defined structure, while 'CASUAL' means more flexible and exploratory content.

        For each module, provide the following parameters:
        - name: A concise title for the module.
        - chapter: the corresponding chapter name it should be the exact name of the chapter 
        - learning_goals: A list of objectives the students should achieve by the end of the module should have a high degree of exellency.
        - module_description: A brief overview of the content and approach for this module.
        - prerequisite_modules: A list of prior modules required for this one to make sense (if any).
        - next_modules: A list of modules that should logically follow this one in the learning path.
        
        For each Chapter, provide the following parameters:
        - name: A consice name for the chapter that describes all the modules
        - next: the next Chapter 

        The output should be a list of dictionary objects where the keys are the parameter names (name, learning_goals, module_description, prerequisite_modules, next_modules).
        It should also have a list of Chapters that comes before the list of modules where the chapters encapsulate a set of modules try to make it so there are mutliple modules for a chapter
        Each module should be a dictionary that contains the details for that module. It should only be teh list THERE SHOULD BE NO WORDS BEFORE OR AFTER THE LISTS
        EX: 
        [
        [{{"name": "Chapter 1: NAME FOR CHAPTER ONE, "next": "Chapter 2"}}, {{"name: Chapter 2", "next": None}}]
        [{{"name": "Module 1", "learning_goals": ["Goal 1", "Goal 2"], "module_description": "Description", "prerequisite_modules": ["Module 0"], "next_modules": ["Module 2"], "chapter":"Chapter 1: NAME FOR CHAPTER ONE"}}, ...]
        ]
        MAKE SURE THERE ARE NO TRAILING COMMAS
        """
        try:
            generation_config = types.GenerateContentConfig(temperature=0.7)
            response = client.models.generate_content(
                model='gemini-2.0-flash-lite-preview',
                contents=prompt,
                config=generation_config
            )
            roadmap = clean_response(response.text)
            print(f"roadmap gen: {roadmap}")

            # Assuming the response is a valid JSON format like:
            # [{"name": "Module 1", "learning_goals": ["Goal 1", "Goal 2"], "module_description": "Description", "prerequisite_modules": ["Module 0"], "next_modules": ["Module 2"]}, ...]
            # Try to parse it as a list of dictionaries.
            import json
            try:
                module_list = json.loads(roadmap)
            except json.JSONDecodeError:
                raise ValueError("The response from the model is not a valid JSON list of dictionaries.")

            # Return the parsed list of modules
            return module_list

        except Exception as e:
            print(f"ERROR generating roadmap: {e}")
            raise ValueError(f"Error generating roadmap: {e}")


class EvaluationAgent:
    def evaluate(self, roadmap, learning_goals):
        prompt = f"""
            Evaluate the roadmap '{roadmap}' based on the learning goals '{learning_goals}'. 
            Is the roadmap valid and complete?
            Return in the output Valid or Incomplete return incomplete if there are trailing commas or other syntax errors that would make a json.load() call fail
            If it is incomplete or there are prequisites missing or missmatches between modules give constructive
            feedback and return do not have valid anywhere in the string
            """
        try:
            generation_config = types.GenerateContentConfig(temperature=0.7)

            response = client.models.generate_content(
                model='gemini-2.0-flash-lite-preview',
                contents=prompt,
                config=generation_config
            )
            evaluation_result = response.text
            print(f"EVALUATION: {evaluation_result}")
            if 'valid' in evaluation_result.lower():
                return True
            return False
        except Exception as e:
            raise ValueError(f"Error evaluating roadmap: {e}")


# API View to Trigger Agentic Workflow

class RoadmapGenerationAPIView(APIView):
    serializer_class = QueryRequestSerializer

    def post(self, request):
        serializer = self.serializer_class(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        try:
            title = serializer.validated_data['title']
            topic = serializer.validated_data['topic']
            learning_goals = serializer.validated_data['learning_goals']
            grade = serializer.validated_data['grade']
            user_id = serializer.validated_data['userid']
            details = serializer.validated_data['details']
            mode = serializer.validated_data.get('mode', 'CASUAL')  # Default mode is CASUAL

            user = User.objects.get(pk=user_id)
            # Create agent instances
            perception_agent = PerceptionAgent()
            generation_agent = GenerationAgent()
            evaluation_agent = EvaluationAgent()

            # Time settings
            timeout_duration = timedelta(seconds=60 * 5)  # 1-minute timeout
            start_time = datetime.now()

            while True:
                # Step 1: Perception Agent generates insights
                print("PERCEPTION")
                print("+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++")
                perception_data = perception_agent.generate_insights(topic, learning_goals, grade)
                print("+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++")

                # Step 2: Generation Agent creates the roadmap with prerequisite and next module mapping
                print("GENERATION")
                print("+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++")
                module_list = generation_agent.generate_roadmap(perception_data, topic, learning_goals, grade, mode)
                print("+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++")

                if evaluation_agent.evaluate(module_list, learning_goals):
                    print("inside")
                    roadmap_object = Roadmap(
                        title=title,
                        owner=user,
                        details=details,
                        mode=mode,
                        learning_goals=learning_goals,
                        grade=grade
                    )
                    roadmap_object.save()
                    print("CREATED ROADMAP")
                    chapters = dict()
                    for chapter in module_list[0]:
                        chapters[chapter['name']] = Chapter.objects.create(
                            name=chapter['name'], roadmap=roadmap_object
                        )
                    for chapter in module_list[0]:
                        if chapter['next']:
                            chapters[chapter['name']].next = chapters.get(chapter['next'])
                            chapters[chapter['name']].save()
                    print("CREATED CHAPTERS")
                    modules = {}

                    # Step 1: Create all modules without setting "next_modules" or "prerequisite_modules" yet
                    for module_data in module_list[1]:
                        modules[module_data['name']] = Module.objects.create(
                            name=module_data['name'],
                            owner=user,
                            chapter=chapters[module_data['chapter']],  # Assign the correct chapter
                            learning_goals=module_data['learning_goals'],  # Use module-specific goals
                        )

                    # Step 2: Update "prerequisite_modules" and "next_modules"
                    for module_data in module_list[1]:
                        module_instance = modules[module_data['name']]

                        # Link prerequisite modules
                        module_instance.prerequisites.set(
                            [modules[prerequisite] for prerequisite in module_data['prerequisite_modules'] if
                             prerequisite in modules]
                        )

                        # Link next modules
                        module_instance.next_modules.set(
                            [modules[next_module] for next_module in module_data['next_modules'] if
                             next_module in modules]
                        )

                    print("CREATED MODULES")
                    return Response({"roadmap": roadmap_object.id}, status=status.HTTP_201_CREATED)

                # Timeout check
                if datetime.now() - start_time > timeout_duration:
                    return Response({"error": "Timeout reached, roadmap generation failed."},
                                    status=status.HTTP_408_REQUEST_TIMEOUT)

                # Optional: Add a small delay to prevent hitting API limits
                time.sleep(2)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
