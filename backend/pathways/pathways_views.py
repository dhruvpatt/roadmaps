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
        - Break down the topic into major conceptual areas.
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
                      perception_data['estimated_complexity'] in ['VERY HIGH']):
            complexity_guidance = """
            This is a complex/advanced topic that requires comprehensive coverage. Please create:
            - At least 12-14 chapters to cover the breadth of this topic
            - Ensure proper depth with interconnected prerequisites
            """
        elif perception_data['estimated_complexity'] in ['LOW']:
            complexity_guidance = """
            This is a basic topic. Please create:
            - At least 1-5 chapters to cover the essential concepts
            - Ensure clear connections between chapters
            """
        elif perception_data['estimated_complexity'] in ['MEDIUM']:
            complexity_guidance = """
            This is a basic/introduction topic. Please create:
            - At least 5-8 chapters to cover the essential concepts
            - Ensure clear connections between chapters
            """
        else:
            complexity_guidance = """
            This is a basic/introduction topic. Please create:
            - At least 8-12 chapters to cover the essential concepts
            - Ensure clear connections between chapters
            """

        prompt = f"""
        You are building a textbook for the topic '{topic}' at grade level {grade}.
        Based on the following insights '{perception_data}', generate a list of chapter names for teaching the topic '{topic}' to students in grade '{grade}', 
        ensuring that the learning goals {', '.join([f"'{goal}'" for goal in learning_goals])} are effectively covered.
        
        USER SUGGESTED CHAPTERS: {user_chapters}

        COMPLEXITY: {complexity_guidance}

        Return a JSON array of chapter objects:
        [
          {{ "name": "Chapter 1 name", "next": "Chapter 2 name", learning_goals: ["goal1", "goal2"] }},
          ...
        ]
        GUIDLINES:
        - Each chapter should have a unique name.
        - The 'next' field should point to the next chapter in the sequence.
        - If there is no next chapter, set 'next' to ''.
        - Do not include any additional explanation.
        - The audience is {grade} graders.
        - Chapters should be interconnected and build on each other
        - Chapters should cover similar amounts of learning goals 
        - Chapters should should not be on one topic only, but rather on a few topics that are interconnected try your best to group interconnected topics together
        """

        result = get_llm_response(
            prompt,
            temperature=0.7,
            response_model=ChapterListStructure,
            mode="parsed"
        )
        return result.chapters

    def generate_modules_for_chapter(self, chapter_name, perception_data, topic, learning_goals, grade, mode, complexity_level, covered, titles):
        complexity_guidance = ""
        if complexity_level == "HIGH":
            complexity_guidance = """
                • Include at least 8–12 modules for this chapter.
                • Each module should dive deep into sub-concepts and include advanced examples.
                """
        elif complexity_level == "MEDIUM":
            complexity_guidance = """
                • Include 4–8 modules for this chapter.
                • Provide clear explanations and a couple of illustrative examples.
                """
        else:  # LOW
            complexity_guidance = """
                • Include 1–4 modules for this chapter.
                • Focus on the core definitions only.
                """
        prompt = f"""
        You are an expert curriculum designer.  
        Goal: For the chapter '{chapter_name}', generate a JSON array of detailed module objects that together cover these learning goals: {', '.join(learning_goals)}.  

        Context:  
        - Complexity level(not hard requirement but good guidline): {complexity_guidance}  
        - Already covered goals: {covered}  
        - Module titles already used across *all previous chapters*: {titles}  
        - Target audience: Grade {grade} students  

        Uniqueness requirement:  
        - **Do not** reuse any module title in {titles}.  
        - Ensure each module is **distinct** in focus and phrasing from those in other chapters.  
        - If a learning goal overlaps with an earlier chapter’s goal, emphasize the *new* perspective or application unique to this chapter’s content.  

        Each module object must include exactly these fields (in this order):  
        1. name               – concise, unique title  
        2. chapter            – '{chapter_name}'  
        3. learning_goals     – a list of specific objectives (subset of the chapter goals)  
        4. module_description – a 1–2 sentence summary, highlighting what makes it chapter-specific  
        5. prerequisite_modules – list of module titles to complete first (if none, use [])  
        6. next_modules       – list of module titles that logically follow (if none, use [])  

        Requirements:  
        - Return *only* valid JSON (no extra text).  
        - Generate at least one module per goal, but no more than two.  
        - If a proposed module’s title or focus feels too similar to any in {titles}, rename it and shift its emphasis.
        - Avoid vague or generic titles.  
        """
        result = get_llm_response(
            prompt,
            temperature=0.7,
            response_model=ModuleListStructure,
            mode="parsed"
        )
        # print(f"Generated modules for chapter '{chapter_name}': {result}")
        return result.modules

    def generate_pathway(self, perception_data, topic, learning_goals, grade, mode, user_chapters, complexity_level="MEDIUM"):
        # Step 1: Generate chapters
        chapters = self.generate_chapters(perception_data, topic, learning_goals, grade, mode, user_chapters)

        # Step 2: Generate modules per chapter, one at a time
        all_modules = []
        covered_goals = set()
        existing_titles = set()

        for chapter in chapters:
            # generate only for goals not yet covered
            new_goals = [g for g in chapter.learning_goals if g not in covered_goals]
            chapter_modules = self.generate_modules_for_chapter(
                chapter_name=chapter.name,
                perception_data=perception_data,
                topic=topic,
                learning_goals=new_goals,
                grade=grade,
                mode=mode,
                complexity_level=complexity_level,
                covered=covered_goals,
                titles=list(existing_titles),
            )

            # accumulate
            all_modules.extend(chapter_modules)
            covered_goals.update(chapter.learning_goals)
            existing_titles.update(m.name for m in chapter_modules)

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
        # Handle classroom attribute: can be an object or an integer id
        classroom_data = request.data.get("classroom")

        if isinstance(classroom_data, dict):
            classroom_id = classroom_data.get("id")
            if classroom_id is not None:
                request.data["classroom"] = classroom_id

        serializer = self.serializer_class(data=request.data)
        if not serializer.is_valid():
            return Response({"serializer" : serializer.errors, "Error": "serialization problem"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            title = serializer.validated_data['title']
            topic = serializer.validated_data['topic']
            learning_goals = serializer.validated_data['learning_goals']
            grade = serializer.validated_data['grade']
            user_id = serializer.validated_data['userid']
            details = serializer.validated_data['details']
            mode = serializer.validated_data.get('mode', 'CASUAL')
            user_chapters = serializer.validated_data.get('chapters')

            classroom_data = serializer.validated_data.get('classroom')
            classroom = None
            if classroom_data and isinstance(classroom_data, dict):
                classroom_id = classroom_data.get("id")
                if classroom_id:
                    try:
                        classroom = Classroom.objects.get(id=classroom_id)
                    except Classroom.DoesNotExist:
                        return Response({"error": "Classroom not found"}, status=status.HTTP_400_BAD_REQUEST)

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
                        if mode.upper() == "CASUAL":
                            # Remove all dependencies
                            for module_instance in modules.values():
                                module_instance.prerequisites.clear()
                                module_instance.next_modules.clear()
                                module_instance.save()
                        else:
                            # STRICT mode
                            # First, assign existing dependencies
                            for module_data in module_list.modules:
                                module_instance = modules[module_data.name]

                                # Keep original defined prerequisites
                                prereq_instances = [
                                    modules[prerequisite] for prerequisite in module_data.prerequisite_modules if prerequisite in modules
                                ]
                                module_instance.prerequisites.set(prereq_instances)

                                # Keep original defined next_modules
                                next_instances = [
                                    modules[next_module] for next_module in module_data.next_modules if next_module in modules
                                ]
                                module_instance.next_modules.set(next_instances)

                                module_instance.save()

                            # Then augment with linear dependencies (1 -> 2 -> 3) in each chapter
                            for chapter in module_list.chapters:
                                chapter_modules = [m for m in module_list.modules if m.chapter == chapter.name]

                                # To prevent cycles, enforce strict linear order: 1->2->3->...
                                for i in range(len(chapter_modules) - 1):
                                    current = modules[chapter_modules[i].name]
                                    next_mod = modules[chapter_modules[i + 1].name]

                                    # Remove any existing backward dependency to break cycles
                                    if current in next_mod.next_modules.all():
                                        next_mod.next_modules.remove(current)
                                    if next_mod in current.prerequisites.all():
                                        current.prerequisites.remove(next_mod)

                                    # Now set only the forward dependency
                                    if next_mod not in current.next_modules.all():
                                        current.next_modules.add(next_mod)
                                    if current not in next_mod.prerequisites.all():
                                        next_mod.prerequisites.add(current)

                                    current.save()
                                    next_mod.save()


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
    classroom_id = request.data.get("classroom_id")
    search_query = request.GET.get("search", "")

    print(request.data)
    
    try:
        user = User.objects.get(pk=user_id)

        if classroom_id:
            try:
                classroom = Classroom.objects.get(pk=classroom_id)
            except Classroom.DoesNotExist:
                return Response({"error": "Classroom not found"}, status=status.HTTP_404_NOT_FOUND)
            # Check membership
            is_teacher = classroom.teachers.filter(id=user.id).exists()
            is_student = classroom.students.filter(id=user.id).exists()


            all_pathways = Pathway.objects.all()
            # print("ALL Pathways in DB:")
            # for p in all_pathways:
            #     print(f"- ID: {p.id}, Title: {p.title}, Classroom: {p.classroom_id}, Owner: {p.owner_id}")

            if not is_teacher and not is_student:
                return Response({"error": "You do not belong to this classroom"}, status=status.HTTP_403_FORBIDDEN)

            pathways = Pathway.objects.filter(
                classroom=classroom,
                title__icontains=search_query
            ).order_by("id")

        else:
            pathways = Pathway.objects.filter(
                owner=user,
                title__icontains=search_query
            ).order_by("id")

        print(pathways)

        paginator = PageNumberPagination()
        paginator.page_size = 15
        result_page = paginator.paginate_queryset(pathways, request)
        serializer = PathwaySerializer(result_page, many=True)
        return paginator.get_paginated_response(serializer.data)

    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

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