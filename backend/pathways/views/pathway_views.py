# consolidated_pathway_views.py

import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.backend.settings')
django.setup()

import time
from datetime import datetime, timedelta
from typing import List, Optional

from django.conf import settings
from django.db import transaction
from rest_framework.viewsets import ModelViewSet
from rest_framework.decorators import api_view, action
from rest_framework.response import Response
from rest_framework import status
from rest_framework.pagination import PageNumberPagination
from rest_framework.views import APIView

from pathways.models import Pathway, User, Chapter, Module, Subject, Classroom, Quiz, Question, Content
from pathways.serializers import QueryRequestSerializer, ChapterSerializer, SubjectSerializer, PathwaySerializer
from pathways.utils import get_llm_response
from pathways.schemas import *


#region AGENTS

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
            "next": "Chapter 2 name", learning_goals: ["goal1", "goal2"] }},
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
        
        chapters = result.chapters
        for chapter in chapters: 
            mandatory_quiz = self.generate_required_quiz(perception_data, chapter.name, chapter.learning_goals, grade)
            chapter.required_quiz = mandatory_quiz
                    
        return chapters

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
        print(f"Generated chapters: {chapters}")
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

    def generate_required_quiz(self, perception_data, chapter, learning_goals, grade, quiz_duration=30):
        
        prompt = f"""
        You are an assessment design expert helping to create a quiz for the chapter '{chapter}'. Your goal is to generate a quiz that
        effectively assesses the learning goals {', '.join([f"'{goal}'" for goal in learning_goals])} for students in grade '{grade}'.
        
        The quiz should include a variety of multiple-choice questions, true/false questions, and short answer questions (also known as text).
        The quiz should be designed to be challenging but fair, and should cover the key concepts and skills outlined in the chapter.
        The quiz should be designed to be completed in {quiz_duration} minutes for students in grade '{grade}'.
        
        Return a JSON object with the following structure: 
        {{
            "quiz_title": "Quiz for Chapter '{chapter}'",
            "quiz_duration": "quiz duration in minutes",
            "questions": [
                {{
                    "question": "Question text",
                    "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
                    "correct_answer": "Correct answer text",
                    "type": "multiple_choice" or "true_false" or "text"
                }},
                ...
            ],
        }}
        """
        result = get_llm_response(
            prompt,
            temperature=0.7,
            response_model=QuizStructure,
            mode="parsed"
        )
        print("Generated mandatory quiz:", result)
        return result
        
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

#endregion

class PathwayGenerationAPIView(APIView):
    serializer_class = QueryRequestSerializer

    def post(self, request):
        if isinstance(request.data.get("classroom"), dict):
            classroom_obj = request.data["classroom"]
            classroom_id = classroom_obj.get("id")
            if not classroom_id:
                return Response({"error": "Classroom object must contain an 'id' field."}, status=status.HTTP_400_BAD_REQUEST)
            request.data["classroom"] = classroom_id

        serializer = self.serializer_class(data=request.data)
        if not serializer.is_valid():
            return Response({"serializer": serializer.errors, "Error": "serialization problem"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            title = serializer.validated_data['title']
            topic = serializer.validated_data['topic']
            learning_goals = serializer.validated_data['learning_goals']
            grade = serializer.validated_data['grade']
            user_id = serializer.validated_data['userid']
            details = serializer.validated_data['details']
            mode = serializer.validated_data.get('mode', 'CASUAL')
            user_chapters = serializer.validated_data.get('chapters')
            classroom_id = serializer.validated_data.get('classroom')

            classroom = Classroom.objects.get(id=classroom_id) if classroom_id else None
            user = User.objects.get(pk=user_id)

            perception_agent = PerceptionAgent()
            generation_agent = GenerationAgent()
            evaluation_agent = EvaluationAgent()

            max_attempts = 5
            timeout_duration = timedelta(seconds=300)
            start_time = datetime.now()

            for attempt in range(max_attempts):
                perception_data = perception_agent.generate_insights(topic, learning_goals, grade, user_chapters)
                learning_goals = perception_data["expanded_learning_goals"]
                module_list = generation_agent.generate_pathway(perception_data, topic, learning_goals, grade, mode, user_chapters, perception_data['estimated_complexity'])
                evaluation_result = evaluation_agent.evaluate(module_list, learning_goals, topic)

                if evaluation_result['is_valid']:
                    pathway_object = Pathway.objects.create(
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

                    chapters = {}
                    for chapter in module_list.chapters:
                        new_chapter = Chapter.objects.create(
                            name=chapter.name,
                            pathway=pathway_object,
                            chapter_learning_goals=chapter.learning_goals
                        )
                        if chapter.required_quiz:
                            quiz = Quiz.objects.create(user=user, name=chapter.required_quiz.quiz_title)
                            questions = []
                            for q in chapter.required_quiz.questions:
                                q_instance = Question.objects.create(
                                    question=q.question,
                                    solution=q.correct_answer,
                                    type=q.type,
                                    choices=q.options if q.type == "multiple_choice" else (['True', 'False'] if q.type == "true_false" else [])
                                )
                                questions.append(q_instance)
                            quiz.questions.set(questions)
                            new_chapter.required_quiz = quiz
                            new_chapter.save()
                        chapters[chapter.name] = new_chapter

                    for chapter in module_list.chapters:
                        if chapter.next:
                            chapters[chapter.name].next = chapters.get(chapter.next)
                            chapters[chapter.name].save()

                    modules = {}
                    for module_data in module_list.modules:
                        modules[module_data.name] = Module.objects.create(
                            name=module_data.name,
                            owner=user,
                            chapter=chapters[module_data.chapter],
                            learning_goals=module_data.learning_goals
                        )

                    for module_data in module_list.modules:
                        mod_instance = modules[module_data.name]
                        mod_instance.prerequisites.set([modules[p] for p in module_data.prerequisite_modules if p in modules])
                        mod_instance.next_modules.set([modules[n] for n in module_data.next_modules if n in modules])
                        mod_instance.save()

                    return Response({
                        "pathway": pathway_object.id,
                        "stats": evaluation_result["stats"]
                    }, status=status.HTTP_201_CREATED)

                if datetime.now() - start_time > timeout_duration:
                    return Response({"error": "Timeout reached, pathway generation failed."}, status=status.HTTP_408_REQUEST_TIMEOUT)

                time.sleep(2)

            return Response({
                "error": "Failed to generate a comprehensive pathway after multiple attempts.",
                "suggestions": evaluation_result.get('suggestions', "Try providing more specific learning goals.")
            }, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# -------------------- VIEWSETS --------------------

class PathwayViewSet(ModelViewSet):
    queryset = Pathway.objects.all()
    serializer_class = PathwaySerializer

    @action(detail=True, methods=['get'])
    def chapters(self, request, pk=None):
        pathway = self.get_object()
        chapters = pathway.chapters.all()
        serializer = ChapterSerializer(chapters, many=True)
        return Response(serializer.data)

@api_view(['GET', 'POST', 'PUT', 'PATCH', 'DELETE'])
def pathway_detail(request, pk=None):
    print("Request data:", request.data)
    if request.method == 'GET':
        user_id = request.GET.get("user_id") or request.data.get("user_id")
        classroom_id = request.GET.get("classroom_id") or request.data.get("classroom_id")
        search_query = request.GET.get("search", "").strip()

        if not user_id:
            return Response({"error": "user_id is required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

        if pk is not None:
            try:
                pathway = Pathway.objects.get(pk=pk)
                if pathway.owner.id != user.id:
                    return Response({"error": "You do not have permission to access this pathway"}, status=status.HTTP_403_FORBIDDEN)
                serializer = PathwaySerializer(pathway)
                return Response(serializer.data, status=status.HTTP_200_OK)
            except Pathway.DoesNotExist:
                return Response({"error": "Pathway not found"}, status=status.HTTP_404_NOT_FOUND)

        # If no pk: list pathways for user
        try:
            if classroom_id:
                classroom = Classroom.objects.get(pk=classroom_id)
                if not classroom.teachers.filter(id=user.id).exists() and not classroom.students.filter(id=user.id).exists():
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

            paginator = PageNumberPagination()
            paginator.page_size = 15
            result_page = paginator.paginate_queryset(pathways, request)
            serializer = PathwaySerializer(result_page, many=True)
            return paginator.get_paginated_response(serializer.data)

        except Classroom.DoesNotExist:
            return Response({"error": "Classroom not found"}, status=status.HTTP_404_NOT_FOUND)

    elif request.method == 'POST':
        serializer = PathwaySerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method in ['PUT', 'PATCH']:
        try:
            pathway = Pathway.objects.get(pk=pk)
            serializer = PathwaySerializer(pathway, data=request.data, partial=(request.method == 'PATCH'))
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Pathway.DoesNotExist:
            return Response({"error": "Pathway not found"}, status=status.HTTP_404_NOT_FOUND)

    elif request.method == 'DELETE':
        try:
            pathway = Pathway.objects.get(pk=pk)
            pathway.delete()
            return Response({"message": "Pathway deleted successfully."}, status=status.HTTP_204_NO_CONTENT)
        except Pathway.DoesNotExist:
            return Response({"error": "Pathway not found"}, status=status.HTTP_404_NOT_FOUND)

    return Response({"error": "Method not implemented"}, status=status.HTTP_405_METHOD_NOT_ALLOWED)

@api_view(['GET'])
def pathway_chapters(request, pk):
    try:
        pathway = Pathway.objects.get(pk=pk)
    except Pathway.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)

    chapters = pathway.chapters.all()
    serializer = ChapterSerializer(chapters, many=True)
    return Response(serializer.data)

@api_view(['GET', 'POST', 'PUT', 'PATCH', 'DELETE'])
def subject_detail(request, subject_id=None):
    if request.method == 'GET':
        if subject_id:
            try:
                subject = Subject.objects.get(pk=subject_id)
                serializer = SubjectSerializer(subject)
                return Response(serializer.data, status=status.HTTP_200_OK)
            except Subject.DoesNotExist:
                return Response({"error": "Subject not found"}, status=status.HTTP_404_NOT_FOUND)
        else:
            subjects = Subject.objects.all()
            serializer = SubjectSerializer(subjects, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)

    elif request.method == 'POST':
        serializer = SubjectSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method in ['PUT', 'PATCH']:
        try:
            subject = Subject.objects.get(pk=subject_id)
            serializer = SubjectSerializer(subject, data=request.data, partial=(request.method == 'PATCH'))
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Subject.DoesNotExist:
            return Response({"error": "Subject not found"}, status=status.HTTP_404_NOT_FOUND)

    elif request.method == 'DELETE':
        try:
            subject = Subject.objects.get(pk=subject_id)
            subject.delete()
            return Response({"message": "Subject deleted successfully."}, status=status.HTTP_204_NO_CONTENT)
        except Subject.DoesNotExist:
            return Response({"error": "Subject not found"}, status=status.HTTP_404_NOT_FOUND)

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

        if pathway.published:
            return Response({"message": "Pathway already published."}, status=status.HTTP_200_OK)

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

        pathway.published = True
        pathway.save()

        serialized_pathway = PathwaySerializer(Pathway.objects.get(pk=pathway_id)).data

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




    user_id = request.data.get("user_id")
    classroom_id = request.data.get("classroom_id")
    search_query = request.GET.get("search", "")

    try:
        user = User.objects.get(pk=user_id)

        if classroom_id:
            classroom = Classroom.objects.get(pk=classroom_id)
            if not classroom.teachers.filter(id=user.id).exists() and not classroom.students.filter(id=user.id).exists():
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

        paginator = PageNumberPagination()
        paginator.page_size = 15
        result_page = paginator.paginate_queryset(pathways, request)
        serializer = PathwaySerializer(result_page, many=True)
        return paginator.get_paginated_response(serializer.data)

    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
    except Classroom.DoesNotExist:
        return Response({"error": "Classroom not found"}, status=status.HTTP_404_NOT_FOUND)