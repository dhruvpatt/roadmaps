import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.backend.settings')  # Replace 'your_project_name' with the actual project name
django.setup()

import time
from google import genai
from google.genai import types  # Assuming Gemini text generation endpoint is like OpenAI's GPT-3

from rest_framework.views import APIView
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .models import Roadmap, User, Chapter, Module, Subject, Classroom
from .serializers import QueryRequestSerializer, ChapterSerializer, SubjectSerializer, RoadmapSerializer
from django.db import transaction
from datetime import datetime, timedelta
from django.conf import settings

# Set the Gemini API key (adjust based on actual implementation)
api_key = getattr(settings, 'LLM_API_KEY')
client = genai.Client(api_key=api_key)


# Agent Classes

class PerceptionAgent:
    def generate_insights(self, topic, learning_goals, grade, user_chpters):
        prompt = f"Based on the topic '{topic}', learning goals '{learning_goals}', and grade level '{grade}', " \
                 f"provide insights and high-level objectives for the lesson and format it using these chapters :{user_chpters}."

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
    def generate_roadmap(self, perception_data, topic, learning_goals, grade, mode, user_chapters):
        prompt = f"""
        Based on the following insights '{perception_data}', generate a detailed roadmap for teaching the topic '{topic}' to students in grade '{grade}', ensuring that the learning goals {', '.join([f"'{goal}'" for goal in learning_goals])} are effectively covered.
        The roadmap should be divided into modules that are aligned with the following:
        - THESE ARE THE CHAPTERS INPUTTED BY THE USER TO SERVE AS A GUIDLINE: {user_chapters}
        - The grade level ('{grade}') to ensure the content is age-appropriate.
        - The learning goals ({', '.join([f"'{goal}'" for goal in learning_goals])}) to ensure each module is directly tied to those goals.
        - The mode ('{mode}') will dictate the complexity of the content, where 'STRICT' means each module should have a well-defined structure, while 'CASUAL' means more flexible and exploratory content.

        For each module, provide the following parameters:
        - name: A concise title for the module.
        - chapter: the corresponding chapter name it should be the exact name of the chapter 
        - learning_goals: A list of objectives the students should achieve by the end of the module should have a high degree of exellency.
        - module_description: A brief overview of the content and approach for this module.
        - prerequisite_modules: A list of prior modules required for this one to make sense (if any) **IT SHOULD BE THE EXACT NAME OF THE MODULE**.
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
            If it is incomplete or there are prequisites missing or missmatches between prerequiste names and the module names give constructive
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
            mode = serializer.validated_data.get('mode', 'CASUAL')
            user_chapters = serializer.validated_data.get('chapters')
            classroomCode = serializer.validated_data.get('classroom')
            
            classroom = Classroom.objects.get(join_id=classroomCode)
            print("CLASROOM:", classroom)
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
                perception_data = perception_agent.generate_insights(topic, learning_goals, grade, user_chapters)
                print("+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++")

                # Step 2: Generation Agent creates the roadmap with prerequisite and next module mapping
                print("GENERATION")
                print("+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++")
                module_list = generation_agent.generate_roadmap(perception_data, topic, learning_goals, grade, mode, user_chapters)
                print("+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++")

                if evaluation_agent.evaluate(module_list, learning_goals):
                    print("inside")
                    print("DEBUG:", title, user, details, mode, learning_goals, grade)
                    try:
                        roadmap_object = Roadmap(
                            title=title,
                            owner=user,
                            details=details,
                            mode=mode,
                            learning_goals=learning_goals,
                            grade=grade,
                            published=False,
                            progress=0,
                            classroom=classroom
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

                        roadmap_object.chapter_count = len(module_list[0])
                        roadmap_object.save()

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

                            module_instance.prerequisites.set(
                                [modules[prerequisite] for prerequisite in module_data['prerequisite_modules'] if
                                 prerequisite in modules]
                            )

                            module_instance.next_modules.set(
                                [modules[next_module] for next_module in module_data['next_modules'] if
                                 next_module in modules]
                            )

                        print("CREATED MODULES")
                        return Response({"roadmap": roadmap_object.id}, status=status.HTTP_201_CREATED)
                    except Exception as e:
                        print(e)

                # Timeout check
                if datetime.now() - start_time > timeout_duration:
                    return Response({"error": "Timeout reached, roadmap generation failed."},
                                    status=status.HTTP_408_REQUEST_TIMEOUT)

                # Optional: Add a small delay to prevent hitting API limits
                time.sleep(2)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def get_all_roadmaps(request):
    user_id = request.GET.get("user_id")
    try:
        user = User.objects.get(pk=user_id)
        roadmaps = Roadmap.objects.filter(owner=user)
        serializer = RoadmapSerializer(roadmaps, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

@api_view(['POST'])
@transaction.atomic
def publish_roadmap_to_classroom(request):
    roadmap_id = request.data.get("roadmap_id")
    classroom_id = request.data.get("classroom_id")
    topic = request.data.get("topic", "Untitled Topic")
    master_scaffold = request.data.get("master_scaffold", "")

    try:
        roadmap = Roadmap.objects.get(pk=roadmap_id)
        classroom = Classroom.objects.get(pk=classroom_id)
        students = classroom.students.all()

        for student in students:
            student_roadmap = Roadmap.objects.create(
                owner=student,
                title=roadmap.title,
                details=roadmap.details,
                mode=roadmap.mode,
                grade=roadmap.grade,
                learning_goals=roadmap.learning_goals,
                progress=0
            )

            chapter_map = {}
            for chapter in roadmap.chapters.all():
                new_chapter = Chapter.objects.create(
                    name=chapter.name,
                    roadmap=student_roadmap,
                    status='not_started'
                )
                chapter_map[chapter.id] = new_chapter

            module_map = {}
            for chapter in roadmap.chapters.all():
                for module in chapter.modules.all():
                    new_module = Module.objects.create(
                        name=module.name,
                        chapter=chapter_map[chapter.id],
                        owner=student,
                        yt_video=module.yt_video,
                        status='not_started',
                        learning_goals=module.learning_goals,
                        feedback=""
                    )
                    for content in module.content_list.all():
                        Content.objects.create(
                            type=content.type,
                            content=content.content,
                            module=new_module
                        )
                    module_map[module.id] = new_module

            for module in roadmap.chapters.all().prefetch_related('modules'):
                for original_module in module.modules.all():
                    new_module = module_map[original_module.id]
                    new_module.prerequisites.set([
                        module_map[prereq.id] for prereq in original_module.prerequisites.all()
                    ])
                    new_module.next_modules.set([
                        module_map[next.id] for next in original_module.next_modules.all()
                    ])

            Subject.objects.create(
                classroom=classroom,
                topic=topic,
                master_scaffold=master_scaffold,
                progress=0.0,
                student_roadmap=student_roadmap
            )

        return Response({"message": "Roadmap and structure published to classroom successfully."}, status=status.HTTP_201_CREATED)

    except Roadmap.DoesNotExist:
        return Response({"error": "Roadmap not found"}, status=status.HTTP_404_NOT_FOUND)
    except Classroom.DoesNotExist:
        return Response({"error": "Classroom not found"}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
def get_roadmap_by_id(request, roadmap_id):
    try:
        roadmap = Roadmap.objects.get(pk=roadmap_id)
        serializer = RoadmapSerializer(roadmap)
        return Response(serializer.data, status=status.HTTP_200_OK)
    except Roadmap.DoesNotExist:
        return Response({"error": "Roadmap not found"}, status=status.HTTP_404_NOT_FOUND)

@api_view(['POST'])
def get_user_roadmaps(request):
    user_id = request.data.get("user_id")
    print("user_id", user_id)
    try:
        user = User.objects.get(pk=user_id)
        roadmaps = Roadmap.objects.filter(owner=user)
        serializer = RoadmapSerializer(roadmaps, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

@api_view(['PUT'])
def update_roadmap(request, roadmap_id):
    try:
        roadmap = Roadmap.objects.get(pk=roadmap_id)

        roadmap.title = request.data.get("title", roadmap.title)
        roadmap.details = request.data.get("details", roadmap.details)
        roadmap.mode = request.data.get("mode", roadmap.mode)
        roadmap.grade = request.data.get("grade", roadmap.grade)
        roadmap.learning_goals = request.data.get("learning_goals", roadmap.learning_goals)
        roadmap.progress = request.data.get("progress", roadmap.progress)

        roadmap.save()

        serializer = RoadmapSerializer(roadmap)
        return Response(serializer.data, status=status.HTTP_200_OK)

    except Roadmap.DoesNotExist:
        return Response({"error": "Roadmap not found"}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# @api_view(['POST'])
# @transaction.atomic
# def publish_roadmap_to_classroom(request):
#     roadmap_id = request.data.get("roadmap_id")
#     classroom_id = request.data.get("classroom_id")
#     topic = request.data.get("topic", "Untitled Topic")
#     master_scaffold = request.data.get("master_scaffold", "")

#     try:
#         roadmap = Roadmap.objects.get(pk=roadmap_id)
#         classroom = Classroom.objects.get(pk=classroom_id)
#         students = classroom.students.all()

#         for student in students:
#             student_roadmap = Roadmap.objects.create(
#                 owner=student,
#                 title=roadmap.title,
#                 details=roadmap.details,
#                 mode=roadmap.mode,
#                 grade=roadmap.grade,
#                 learning_goals=roadmap.learning_goals,
#                 progress=0,
#                 published=True
#             )

#             chapter_map = {}
#             for chapter in roadmap.chapters.all():
#                 new_chapter = Chapter.objects.create(
#                     name=chapter.name,
#                     roadmap=student_roadmap,
#                     status='not_started'
#                 )
#                 chapter_map[chapter.id] = new_chapter

#             module_map = {}
#             for chapter in roadmap.chapters.all():
#                 for module in chapter.modules.all():
#                     # Clone quiz
#                     new_quiz = None
#                     if module.practice:
#                         new_quiz = Quiz.objects.create(user=student)
#                         for q in module.practice.questions.all():
#                             new_question = Question.objects.create(
#                                 question=q.question,
#                                 solution=q.solution,
#                                 type=q.type
#                             )
#                             new_quiz.questions.add(new_question)

#                     new_module = Module.objects.create(
#                         name=module.name,
#                         chapter=chapter_map[chapter.id],
#                         owner=student,
#                         yt_video=module.yt_video,
#                         status='not_started',
#                         learning_goals=module.learning_goals,
#                         feedback="",
#                         practice=new_quiz
#                     )
#                     for content in module.content_list.all():
#                         Content.objects.create(
#                             type=content.type,
#                             content=content.content,
#                             module=new_module
#                         )
#                     module_map[module.id] = new_module

#             for module in roadmap.chapters.all().prefetch_related('modules'):
#                 for original_module in module.modules.all():
#                     new_module = module_map[original_module.id]
#                     new_module.prerequisites.set([
#                         module_map[prereq.id] for prereq in original_module.prerequisites.all()
#                     ])
#                     new_module.next_modules.set([
#                         module_map[next.id] for next in original_module.next_modules.all()
#                     ])

#             Subject.objects.create(
#                 classroom=classroom,
#                 topic=topic,
#                 master_scaffold=master_scaffold,
#                 progress=0.0,
#                 student_roadmap=student_roadmap
#             )

#         return Response({"message": "Roadmap and structure published to classroom successfully."}, status=status.HTTP_201_CREATED)

#     except Roadmap.DoesNotExist:
#         return Response({"error": "Roadmap not found"}, status=status.HTTP_404_NOT_FOUND)
#     except Classroom.DoesNotExist:
#         return Response({"error": "Classroom not found"}, status=status.HTTP_404_NOT_FOUND)
#     except Exception as e:
#         return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
@api_view(['POST'])
@transaction.atomic
def publish_roadmap_to_classroom(request):
    roadmap_id = request.data.get("roadmap_id")
    classroom_id = request.data.get("classroom_id")
    topic = request.data.get("topic", "Untitled Topic")
    master_scaffold = request.data.get("master_scaffold", "")
    print("classroomId", classroom_id)
    try:
        roadmap = Roadmap.objects.get(pk=roadmap_id)
        classroom = Classroom.objects.get(pk=classroom_id)
        students = classroom.students.all()

        created_roadmaps = []

        for student in students:
            student_roadmap = Roadmap.objects.create(
                owner=student,
                title=roadmap.title,
                details=roadmap.details,
                mode=roadmap.mode,
                grade=roadmap.grade,
                learning_goals=roadmap.learning_goals,
                progress=0,
                published=True,
                classroom=classroom
            )

            chapter_map = {}
            for chapter in roadmap.chapters.all():
                new_chapter = Chapter.objects.create(
                    name=chapter.name,
                    roadmap=student_roadmap,
                    status='not_started'
                )
                chapter_map[chapter.id] = new_chapter

            module_map = {}
            for chapter in roadmap.chapters.all():
                for module in chapter.modules.all():
                    new_quiz = None
                    if module.practice:
                        new_quiz = Quiz.objects.create(user=student)
                        for q in module.practice.questions.all():
                            new_question = Question.objects.create(
                                question=q.question,
                                solution=q.solution,
                                type=q.type
                            )
                            new_quiz.questions.add(new_question)

                    new_module = Module.objects.create(
                        name=module.name,
                        chapter=chapter_map[chapter.id],
                        owner=student,
                        yt_video=module.yt_video,
                        status='not_started',
                        learning_goals=module.learning_goals,
                        feedback="",
                        practice=new_quiz
                    )
                    for content in module.content_list.all():
                        Content.objects.create(
                            type=content.type,
                            content=content.content,
                            module=new_module
                        )
                    module_map[module.id] = new_module

            for module in roadmap.chapters.all().prefetch_related('modules'):
                for original_module in module.modules.all():
                    new_module = module_map[original_module.id]
                    new_module.prerequisites.set([
                        module_map[prereq.id] for prereq in original_module.prerequisites.all()
                    ])
                    new_module.next_modules.set([
                        module_map[next.id] for next in original_module.next_modules.all()
                    ])

            Subject.objects.create(
                classroom=classroom,
                topic=topic,
                master_scaffold=master_scaffold,
                progress=0.0,
                student_roadmap=student_roadmap
            )

            created_roadmaps.append(student_roadmap)

        serialized_roadmaps = RoadmapSerializer(created_roadmaps, many=True).data
        serialized_roadmap = RoadmapSerializer(roadmap).data
        return Response({
            "message": "Roadmap and structure published to classroom successfully.",
            "roadmap": serialized_roadmap
        }, status=status.HTTP_201_CREATED)

    except Roadmap.DoesNotExist:
        return Response({"error": "Roadmap not found"}, status=status.HTTP_404_NOT_FOUND)
    except Classroom.DoesNotExist:
        return Response({"error": "Classroom not found"}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['DELETE'])
def delete_roadmap(request, roadmap_id):
    try:
        roadmap = Roadmap.objects.get(pk=roadmap_id)
        roadmap.delete()
        return Response({"message": "Roadmap deleted successfully."}, status=status.HTTP_204_NO_CONTENT)
    except Roadmap.DoesNotExist:
        return Response({"error": "Roadmap not found"}, status=status.HTTP_404_NOT_FOUND)

# -------------------- SUBJECT CRUD --------------------

@api_view(['GET'])
def get_all_subjects(request):
    subjects = Subject.objects.all()
    serializer = SubjectSerializer(subjects, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)

@api_view(['GET'])
def get_subject_by_id(request, subject_id):
    try:
        subject = Subject.objects.get(pk=subject_id)
        serializer = SubjectSerializer(subject)
        return Response(serializer.data, status=status.HTTP_200_OK)
    except Subject.DoesNotExist:
        return Response({"error": "Subject not found"}, status=status.HTTP_404_NOT_FOUND)

@api_view(['POST'])
def create_subject(request):
    serializer = SubjectSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['PUT'])
def update_subject(request, subject_id):
    try:
        subject = Subject.objects.get(pk=subject_id)
        serializer = SubjectSerializer(subject, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    except Subject.DoesNotExist:
        return Response({"error": "Subject not found"}, status=status.HTTP_404_NOT_FOUND)

@api_view(['DELETE'])
def delete_subject(request, subject_id):
    try:
        subject = Subject.objects.get(pk=subject_id)
        subject.delete()
        return Response({"message": "Subject deleted successfully."}, status=status.HTTP_204_NO_CONTENT)
    except Subject.DoesNotExist:
        return Response({"error": "Subject not found"}, status=status.HTTP_404_NOT_FOUND)

# -------------------- CHAPTER CRUD --------------------

@api_view(['GET'])
def get_all_chapters(request):
    chapters = Chapter.objects.all()
    serializer = ChapterSerializer(chapters, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)

@api_view(['GET'])
def get_chapter_by_id(request, chapter_id):
    try:
        chapter = Chapter.objects.get(pk=chapter_id)
        serializer = ChapterSerializer(chapter)
        return Response(serializer.data, status=status.HTTP_200_OK)
    except Chapter.DoesNotExist:
        return Response({"error": "Chapter not found"}, status=status.HTTP_404_NOT_FOUND)

@api_view(['POST'])
def create_chapter(request):
    serializer = ChapterSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['PUT'])
def update_chapter(request, chapter_id):
    try:
        chapter = Chapter.objects.get(pk=chapter_id)
        serializer = ChapterSerializer(chapter, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    except Chapter.DoesNotExist:
        return Response({"error": "Chapter not found"}, status=status.HTTP_404_NOT_FOUND)

@api_view(['DELETE'])
def delete_chapter(request, chapter_id):
    try:
        chapter = Chapter.objects.get(pk=chapter_id)
        chapter.delete()
        return Response({"message": "Chapter deleted successfully."}, status=status.HTTP_204_NO_CONTENT)
    except Chapter.DoesNotExist:
        return Response({"error": "Chapter not found"}, status=status.HTTP_404_NOT_FOUND)
