import json
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.backend.settings')  # Replace 'your_project_name' with the actual project name
django.setup()

import time
from rest_framework.views import APIView
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .models import Pathway, User, Chapter, Module, Subject, Classroom
from .serializers import QueryRequestSerializer, ChapterSerializer, SubjectSerializer, PathwaySerializer
from django.db import transaction
from datetime import datetime, timedelta
from django.conf import settings
from .utils import get_llm_response
from .schemas import *

from rest_framework.pagination import PageNumberPagination
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status


# class PerceptionAgent:
#     def generate_insights(self, topic, learning_goals, grade, user_chapters):
#         # Build a more detailed prompt based on topic complexity
#         is_complex = any(word in topic.lower() for word in [
#             "advanced", "complex", "comprehensive", "in-depth", "quantum", "analysis",
#             "systems", "theory", "engineering", "calculus", "philosophy"
#         ])
#
#         prompt = f"""
#         You are a curriculum design expert helping to plan a comprehensive learning pathway.
#
#         TOPIC: '{topic}'
#         GRADE LEVEL: '{grade}'
#         USER-SUGGESTED CHAPTERS: {user_chapters or "None provided"}
#
#         HIGH-LEVEL LEARNING GOALS: {', '.join([f"'{g}'" for g in learning_goals])}
#
#         {"This appears to be a complex, advanced topic that will require comprehensive coverage.\n"
#          "Your insights should address:\n"
#          "0. Expand and refine the initial learning goals into 8–12 SMART objectives.\n"
#          "1. The breadth of subtopics needed (suggest at least 5–8 major areas).\n"
#          "2. The depth required for each subtopic (multiple modules per area).\n"
#          "3. Necessary scaffolding concepts that must be covered.\n"
#          "4. Potential interdependencies between concepts.\n"
#          "5. How to structure progressive difficulty across the curriculum.\n"
#         if is_complex else ""
#         }
#
#         Next:
#
#         Analyze this information deeply and provide strategic insights covering:
#         1. The full scope of what should be covered to master this topic
#         2. The logical sequence for introducing concepts (scaffolding)
#         3. Key focus areas to emphasize based on the learning goals
#         4. Appropriate depth and breadth given the grade level
#         5. How complex or multifaceted the topic is and how many distinct chapters/modules would be appropriate
#         6. Potential challenges students might face and how to address them
#
#         Return a JSON object in this form:
#         {{
#           "expanded_learning_goals": [
#             "Goal 1 (SMART-formatted)",
#             "Goal 2",
#             … up to 12 …
#           ],
#           "insights": "Detailed paragraph with curriculum planning insights",
#           "estimated_complexity": "LOW|MEDIUM|HIGH|VERY HIGH",
#           "recommended_structure": {{
#             "chapters_needed": <number>,
#             "approximate_modules_needed": <number>,
#             "key_areas": ["area1", "area2", …]
#           }}
#         }}
#         """
#
#         try:
#             result = get_llm_response(prompt, temperature=0.7, response_model=EnhancedInsightResponse)
#             print(f"Perception insights: {result}")
#             return result
#         except Exception as e:
#             print(e)
#             raise ValueError(f"Error generating insights: {e}")

class PerceptionAgent:
    def generate_insights(
        self,
        topic: str,
        learning_goals: List[str],
        grade: str,
        user_chapters: Optional[List[str]],
    ):

        # 2. Build the full prompt
        prompt = f"""
        You are a curriculum design expert planning a roadmap for the topic '{topic}' at grade level {grade}.

        USER-SUGGESTED CHAPTERS: {user_chapters or "None provided"}

        HIGH-LEVEL LEARNING GOALS USER SUBMITTED: {', '.join(learning_goals)}

        Follow this step-by-step reasoning process:

        **Step 1: Identify Subdomains and Subskills**
        - Break down the topic into major conceptual areas (e.g., multivariable limits, partial derivatives, vector calculus).
        - Within each area, identify key subskills that should be taught at increasing levels of depth.

        **Step 2: Expand Learning Goals**
        - For each subdomain, expand the learning goals into **50–80 specific, measurable objectives**.
        - These should include foundational knowledge (definitions, basic calculations), procedural skills (methods, problem-solving), and conceptual understanding (why something works).
        - If existing goals are too broad or few, generate intermediary goals to fill logical gaps.

        **Step 3: Scaffold the Learning Progression**
        - Organize objectives in logical order, from introductory to advanced.
        - Highlight dependencies (e.g., directional derivatives require gradients).
        - Suggest which goals are best taught together in the same module.

        **Step 4: Anticipate Challenges**
        - Identify 3–5 common student difficulties at this grade level.
        - Suggest ways to address them through curriculum design, pacing, or tool use.

        **Step 5: Summarize as a JSON Structure**
        Return exactly one JSON object in the following format:
        {{
        "expanded_learning_goals": [ /* 50–80 granular, measurable goals */ ],
        "insights": "Summarize scope, challenges, and sequencing strategy.",
        "estimated_complexity": "LOW | MEDIUM | HIGH | VERY HIGH",
        "recommended_structure": {{
            "chapters_needed": <int>,
            "approximate_modules_needed": <int>,
            "key_areas": [<str>, ...]
        }}
        }}

        Use clear academic language. Avoid vague or duplicate goals. Think step-by-step.
        """

        # 3. Call the LLM
        result: EnhancedInsightResponse = get_llm_response(
            prompt,
            temperature=0.7,
            response_model=EnhancedInsightResponse,
            mode="dumps",
            max_tokens=3000
        )
        return result

class GenerationAgent:
    def generate_chapters(self, perception_data, topic, learning_goals, grade, mode, user_chapters):
        complexity_guidance = ""
        if topic and (any(word in topic.lower() for word in ["advanced", "complex", "comprehensive", "in-depth"]) or
                      perception_data['estimated_complexity'] in ['HIGH', 'VERY HIGH']):
            complexity_guidance = """
            This is a complex/advanced topic that requires comprehensive coverage. Please create:
            - At least 5-8 chapters to cover the breadth of this topic
            - Ensure proper depth with interconnected prerequisites
            """

        prompt = f"""
        You are a cirriculum design expert helping to plan a comprehensive learning roadmap.
        Based on the following insights '{perception_data}', generate a list of chapter names for teaching the topic '{topic}' to students in grade '{grade}', 
        ensuring that the learning goals {', '.join([f"'{goal}'" for goal in learning_goals])} are effectively covered. For each chapter also include a set of learning goals
        for that specific chapter.
        
        USER SUGGESTED CHAPTERS: {user_chapters}

        COMPLEXITY: {complexity_guidance}

        Return a JSON array of chapter objects:
        [
          {{
            "name": "Chapter 1 name",
            "learning_goals": ["Goal 1 of this chapter", "Goal 2 of this chapter"],
            "next": "Chapter 2 name" }},
          ...
        ]
        Do not include any additional explanation.
        """

        result = get_llm_response(
            prompt,
            temperature=0.7,
            response_model=ChapterListStructure,
            mode="parsed"
        )
        print("Result chapters", result.chapters)
        return result.chapters

    def generate_modules_for_chapter(self, chapter_name, perception_data, topic, learning_goals, grade, mode, complexity_level):
        complexity_guidance = ""
        if complexity_level == "HIGH":
            complexity_guidance = """
                • Include at least 4–6 modules for this chapter.
                • Each module should dive deep into sub-concepts and include advanced examples.
                """
        elif complexity_level == "MEDIUM":
            complexity_guidance = """
                • Include 2–4 modules for this chapter.
                • Provide clear explanations and a couple of illustrative examples.
                """
        else:  # LOW
            complexity_guidance = """
                • Include 1–2 modules for this chapter.
                • Focus on the core definitions only.
                """

        prompt = f"""
            For the chapter '{chapter_name}', generate detailed modules that address the learning goals…
            {complexity_guidance} {', '.join([f"'{goal}'" for goal in learning_goals])}.
        Each module should include:
        - name: a concise module title
        - chapter: '{chapter_name}'
        - learning_goals: a list of specific objectives
        - module_description: what the module covers
        - prerequisite_modules: list of module names that must be completed first
        - next_modules: list of modules that logically follow

        Use the same JSON format as before and return an array of module objects.
        The audience is {grade} graders 
        Do not include explanations.
        """
        result = get_llm_response(
            prompt,
            temperature=0.7,
            response_model=ModuleListStructure,
            mode="parsed"
        )
        return result.modules

    def generate_pathway(self, perception_data, topic, learning_goals, grade, mode, user_chapters, complexity_level="MEDIUM"):
        # Step 1: Generate chapters
        chapters = self.generate_chapters(perception_data, topic, learning_goals, grade, mode, user_chapters)
        print(f"Generated chapters: {chapters}")
        # Step 2: Generate modules per chapter, one at a time
        all_modules = []
        for chapter in chapters:
            chapter_modules = self.generate_modules_for_chapter(
                chapter.name,
                perception_data,
                topic,
                learning_goals,
                grade,
                mode,
                complexity_level
            )
            all_modules.extend(chapter_modules)

        return PathwayStructure(chapters=chapters, modules=all_modules)


class EvaluationAgent:
    def evaluate(self, pathway, learning_goals, topic):
        # Determine minimum complexity requirements based on topic
        is_complex_topic = any(word in topic.lower() for word in [
            "advanced", "complex", "comprehensive", "in-depth", "quantum", "analysis",
            "systems", "theory", "engineering", "calculus", "philosophy",
            "biochemistry", "microbiology", "algorithms"
        ])

        min_chapters = 5 if is_complex_topic else 3
        min_modules = 15 if is_complex_topic else 8
        min_modules_per_chapter = 3 if is_complex_topic else 2

        prompt = f"""
        Evaluate the pathway '{pathway}' based on learning goals '{learning_goals}' for topic '{topic}'.

        Requirements:
        1. Valid JSON structure
        2. All module prerequisites exist
        3. All chapters and modules have appropriate names
        4. At least {min_chapters} chapters for sufficient topic coverage
        5. At least {min_modules} total modules across all chapters
        6. At least {min_modules_per_chapter} modules per chapter on average
        7. Every learning goal is addressed by at least one module
        8. For complex topics, depth of content is adequate

        Return a JSON object:

        {{
            "evaluation": "Valid" or "Incomplete: [specific reason]",
            "suggested_improvements": "[if incomplete, specific suggestions for more chapters/modules]",
            "chapters_count": [number of chapters],
            "modules_count": [number of modules],
            "coverage_score": [1-10 score measuring how well learning goals are covered]
        }}

        If the pathway meets all criteria, mark as "Valid". Otherwise, provide specific improvement suggestions.
        """

        try:
            result = get_llm_response(prompt, temperature=0.6, response_model=EnhancedEvaluationFeedback, max_tokens=2000)
            print(f"Evaluation result: {result}")

            # Check if it meets our minimum requirements
            has_min_modules = len(pathway.modules) >= min_modules
            has_min_chapters = len(pathway.chapters) >= min_chapters

            # Simple heuristic to count learning goal coverage
            covered_goals = set()
            for module in pathway.modules:
                for goal in module.learning_goals:
                    covered_goals.add(goal.lower())

            all_learning_goals_covered = all(
                any(goal.lower() in covered_goal for covered_goal in covered_goals)
                for goal in learning_goals
            )

            # Return detailed result
            return {
                "is_valid": result["evaluation"].strip().lower().startswith("valid"),
                "suggestions": result.get("suggested_improvements", ""),
                "stats": {
                    "chapters": len(pathway.chapters),
                    "modules": len(pathway.modules),
                    "coverage": result.get("coverage_score", 0)
                }
            }
        except Exception as e:
            raise ValueError(f"Error evaluating pathway: {e}")


class PathwayGenerationAPIView(APIView):
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
            classroom = None
            if classroomCode:
                classroom = Classroom.objects.get(join_id=classroomCode)

            user = User.objects.get(pk=user_id)

            # Create agent instances
            perception_agent = PerceptionAgent()
            generation_agent = GenerationAgent()
            evaluation_agent = EvaluationAgent()

            # Time settings
            max_attempts = 5  # Maximum number of generation attempts
            timeout_duration = timedelta(seconds=60 * 5)  # 5-minute timeout
            start_time = datetime.now()

            for attempt in range(max_attempts):
                # Step 1: Perception Agent generates insights
                print(f"PERCEPTION - Attempt {attempt + 1}/{max_attempts}")
                print("+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++")
                perception_data = perception_agent.generate_insights(topic, learning_goals, grade, user_chapters)
                print(f"PERCEPTION DATA: {perception_data}")
                learning_goals = perception_data["expanded_learning_goals"]
                print("+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++")

                # Step 2: Generation Agent creates the pathway with prerequisite and next module mapping
                print(f"GENERATION - Attempt {attempt + 1}/{max_attempts}")
                print("+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++")
                module_list = generation_agent.generate_pathway(perception_data, topic, learning_goals, grade, mode,
                                                                user_chapters, perception_data['estimated_complexity'])
                print(f"Generated Chapters: {module_list.chapters}")
                print(f"Generated Modules: {module_list.modules}")
                print("+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++")

                # Step 3: Enhanced evaluation
                print(f"EVALUATION - Attempt {attempt + 1}/{max_attempts}")
                evaluation_result = evaluation_agent.evaluate(module_list, learning_goals, topic)
                print(evaluation_result)
                print(f"Evaluation stats: Chapters={evaluation_result['stats']['chapters']}, "
                      f"Modules={evaluation_result['stats']['modules']}, "
                      f"Coverage={evaluation_result['stats']['coverage']}")

                if  evaluation_result['is_valid']:
                    print("Pathway evaluation passed!")
                    try:
                        pathway_object = Pathway(
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
                        pathway_object.save()

                        print("CREATED PATHWAY")
                        chapters = dict()
                        for chapter in module_list.chapters:
                            chapters[chapter.name] = Chapter.objects.create(
                                name=chapter.name, pathway=pathway_object
                            )
                        for chapter in module_list.chapters:
                            if chapter.next:
                                chapters[chapter.name].next = chapters.get(chapter.next)
                                chapters[chapter.name].save()

                        print("CREATED CHAPTERS")
                        modules = {}

                        # Step 1: Create all modules without setting "next_modules" or "prerequisite_modules" yet
                        for module_data in module_list.modules:
                            modules[module_data.name] = Module.objects.create(
                                name=module_data.name,
                                owner=user,
                                chapter=chapters[module_data.chapter],
                                learning_goals=module_data.learning_goals,
                            )

                        # Step 2: Update "prerequisite_modules" and "next_modules"
                        for module_data in module_list.modules:
                            module_instance = modules[module_data.name]

                            module_instance.prerequisites.set(
                                [modules[prerequisite] for prerequisite in module_data.prerequisite_modules if
                                 prerequisite in modules]
                            )

                            module_instance.next_modules.set(
                                [modules[next_module] for next_module in module_data.next_modules if
                                 next_module in modules]
                            )
                            module_instance.save()

                        print("CREATED MODULES")
                        return Response({
                            "pathway": pathway_object.id,
                            "stats": {
                                "chapters": len(module_list.chapters),
                                "modules": len(module_list.modules),
                                "coverage_score": evaluation_result['stats']['coverage']
                            }
                        }, status=status.HTTP_201_CREATED)
                    except Exception as e:
                        import traceback
                        print("Error creating pathway:")
                        traceback.print_exc()
                        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                else:
                    print(f"Pathway evaluation failed. Suggestions: {evaluation_result['suggestions']}")
                    # Continue to next attempt with different temperature/parameters

                # Timeout check
                if datetime.now() - start_time > timeout_duration:
                    return Response({"error": "Timeout reached, pathway generation failed."},
                                    status=status.HTTP_408_REQUEST_TIMEOUT)

                # Small delay between attempts
                time.sleep(2)

            # If we reach here, all attempts failed
            return Response({
                "error": "Failed to generate a comprehensive pathway after multiple attempts.",
                "suggestions": evaluation_result.get('suggestions',
                                                     "Try providing more specific learning goals or chapter structure.")
            }, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def get_all_pathways(request):
    user_id = request.GET.get("user_id")
    try:
        user = User.objects.get(pk=user_id)
        pathways = Pathway.objects.filter(owner=user)
        serializer = PathwaySerializer(pathways, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

@api_view(['POST'])
@transaction.atomic
def publish_pathway_to_classroom(request):
    pathway_id = request.data.get("pathway_id")
    classroom_id = request.data.get("classroom_id")
    topic = request.data.get("topic", "Untitled Topic")
    master_scaffold = request.data.get("master_scaffold", "")

    try:
        pathway = Pathway.objects.get(pk=pathway_id)
        classroom = Classroom.objects.get(pk=classroom_id)
        students = classroom.students.all()

        for student in students:
            student_pathway = Pathway.objects.create(
                owner=student,
                title=pathway.title,
                details=pathway.details,
                mode=pathway.mode,
                grade=pathway.grade,
                learning_goals=pathway.learning_goals,
                progress=0,
                classroom=classroom
            )

            chapter_map = {}
            for chapter in pathway.chapters.all():
                new_chapter = Chapter.objects.create(
                    name=chapter.name,
                    pathway=student_pathway,
                    status='not_started'
                )
                chapter_map[chapter.id] = new_chapter

            module_map = {}
            for chapter in pathway.chapters.all():
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

            for module in pathway.chapters.all().prefetch_related('modules'):
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
                student_pathway=student_pathway
            )

        return Response({"message": "Pathway and structure published to classroom successfully."}, status=status.HTTP_201_CREATED)

    except Pathway.DoesNotExist:
        return Response({"error": "Pathway not found"}, status=status.HTTP_404_NOT_FOUND)
    except Classroom.DoesNotExist:
        return Response({"error": "Classroom not found"}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
def get_pathway_by_id(request, pathway_id):
    try:
        pathway = Pathway.objects.get(pk=pathway_id)
        serializer = PathwaySerializer(pathway)
        return Response(serializer.data, status=status.HTTP_200_OK)
    except Pathway.DoesNotExist:
        return Response({"error": "Pathway not found"}, status=status.HTTP_404_NOT_FOUND)

@api_view(['POST'])
def get_user_pathways(request):
    user_id = request.data.get("user_id")
    search_query = request.GET.get("search", "")

    try:
        user = User.objects.get(pk=user_id)
        pathways = Pathway.objects.filter(owner=user, title__icontains=search_query).order_by("id")

        paginator = PageNumberPagination()
        paginator.page_size = 15
        result_page = paginator.paginate_queryset(pathways, request)
        serializer = PathwaySerializer(result_page, many=True)

        return paginator.get_paginated_response(serializer.data)

    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

@api_view(['PUT'])
def update_pathway(request, pathway_id):
    try:
        pathway = Pathway.objects.get(pk=pathway_id)

        pathway.title = request.data.get("title", pathway.title)
        pathway.details = request.data.get("details", pathway.details)
        pathway.mode = request.data.get("mode", pathway.mode)
        pathway.grade = request.data.get("grade", pathway.grade)
        pathway.learning_goals = request.data.get("learning_goals", pathway.learning_goals)
        pathway.progress = request.data.get("progress", pathway.progress)

        pathway.save()

        serializer = PathwaySerializer(pathway)
        return Response(serializer.data, status=status.HTTP_200_OK)

    except Pathway.DoesNotExist:
        return Response({"error": "Pathway not found"}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# @api_view(['POST'])
# @transaction.atomic
# def publish_pathway_to_classroom(request):
#     pathway_id = request.data.get("pathway_id")
#     classroom_id = request.data.get("classroom_id")
#     topic = request.data.get("topic", "Untitled Topic")
#     master_scaffold = request.data.get("master_scaffold", "")

#     try:
#         pathway = Pathway.objects.get(pk=pathway_id)
#         classroom = Classroom.objects.get(pk=classroom_id)
#         students = classroom.students.all()

#         for student in students:
#             student_pathway = Pathway.objects.create(
#                 owner=student,
#                 title=pathway.title,
#                 details=pathway.details,
#                 mode=pathway.mode,
#                 grade=pathway.grade,
#                 learning_goals=pathway.learning_goals,
#                 progress=0,
#                 published=True
#             )

#             chapter_map = {}
#             for chapter in pathway.chapters.all():
#                 new_chapter = Chapter.objects.create(
#                     name=chapter.name,
#                     pathway=student_pathway,
#                     status='not_started'
#                 )
#                 chapter_map[chapter.id] = new_chapter

#             module_map = {}
#             for chapter in pathway.chapters.all():
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

#             for module in pathway.chapters.all().prefetch_related('modules'):
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
#                 student_pathway=student_pathway
#             )

#         return Response({"message": "Pathway and structure published to classroom successfully."}, status=status.HTTP_201_CREATED)

#     except Pathway.DoesNotExist:
#         return Response({"error": "Pathway not found"}, status=status.HTTP_404_NOT_FOUND)
#     except Classroom.DoesNotExist:
#         return Response({"error": "Classroom not found"}, status=status.HTTP_404_NOT_FOUND)
#     except Exception as e:
#         return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
@api_view(['POST'])
@transaction.atomic
def publish_pathway_to_classroom(request):
    pathway_id = request.data.get("pathway_id")
    classroom_id = request.data.get("classroom_id")
    topic = request.data.get("topic", "Untitled Topic")
    master_scaffold = request.data.get("master_scaffold", "")
    print("classroomId", classroom_id)
    try:
        pathway = Pathway.objects.get(pk=pathway_id)
        classroom = Classroom.objects.get(pk=classroom_id)
        students = classroom.students.all()

        created_pathways = []

        for student in students:
            student_pathway = Pathway.objects.create(
                owner=student,
                title=pathway.title,
                details=pathway.details,
                mode=pathway.mode,
                grade=pathway.grade,
                learning_goals=pathway.learning_goals,
                progress=0,
                published=True,
                classroom=classroom
            )

            chapter_map = {}
            for chapter in pathway.chapters.all():
                new_chapter = Chapter.objects.create(
                    name=chapter.name,
                    pathway=student_pathway,
                    status='not_started'
                )
                chapter_map[chapter.id] = new_chapter

            module_map = {}
            for chapter in pathway.chapters.all():
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

            for module in pathway.chapters.all().prefetch_related('modules'):
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
                student_pathway=student_pathway
            )

            created_pathways.append(student_pathway)

        serialized_pathways = PathwaySerializer(created_pathways, many=True).data
        serialized_pathway = PathwaySerializer(pathway).data
        return Response({
            "message": "Pathway and structure published to classroom successfully.",
            "pathway": serialized_pathway
        }, status=status.HTTP_201_CREATED)

    except Pathway.DoesNotExist:
        return Response({"error": "Pathway not found"}, status=status.HTTP_404_NOT_FOUND)
    except Classroom.DoesNotExist:
        return Response({"error": "Classroom not found"}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['DELETE'])
def delete_pathway(request, pathway_id):
    try:
        pathway = Pathway.objects.get(pk=pathway_id)
        pathway.delete()
        return Response({"message": "Pathway deleted successfully."}, status=status.HTTP_204_NO_CONTENT)
    except Pathway.DoesNotExist:
        return Response({"error": "Pathway not found"}, status=status.HTTP_404_NOT_FOUND)

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