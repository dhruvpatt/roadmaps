# consolidated_pathway_views.py

import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.backend.settings')
django.setup()

from rest_framework.decorators import api_view, action
from rest_framework.response import Response
from rest_framework import status
from rest_framework.viewsets import ModelViewSet
from django.core.paginator import Paginator
from django.db.models import Q
from django.conf import settings

from pathways.models import Module, User, Content, Pathway, Classroom, Quiz, Question, Message, Chapter, Subject
from pathways.serializers import ClassroomSerializer, SubjectSerializer, ClassroomDetailSerializer

# -------------------- CLASSROOM VIEWSET --------------------

class ClassroomViewSet(ModelViewSet):
    queryset = Classroom.objects.all()
    serializer_class = ClassroomSerializer

    @action(detail=False, methods=['post'])
    def join(self, request):
        join_id = request.data.get('join_id')
        user_id = request.data.get('user_id')

        try:
            classroom = Classroom.objects.get(join_id=join_id)
            user = User.objects.get(id=user_id)

            if user.role == User.TEACHER:
                classroom.teachers.add(user)
            else:
                classroom.students.add(user)

            return Response({'status': 'Joined classroom successfully'})
        except Classroom.DoesNotExist:
            return Response({'error': 'Invalid join ID'}, status=status.HTTP_404_NOT_FOUND)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=True, methods=['get'])
    def subjects(self, request, pk=None):
        classroom = self.get_object()
        subjects = classroom.subjects.all()
        serializer = SubjectSerializer(subjects, many=True)
        return Response(serializer.data)

# -------------------- CLASSROOM CRUD + ANALYTICS --------------------

@api_view(['GET', 'POST', 'PUT', 'DELETE'])
def classroom_detail(request, pk=None):
    if request.method == 'GET':
        user_id = request.GET.get("user_id") or request.data.get("user_id")
        search_query = request.GET.get("search", "").strip().lower()
        page = int(request.GET.get('page', 1))

        if not user_id:
            return Response({"error": "user_id is required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

        if pk is not None:
            try:
                classroom = Classroom.objects.get(pk=pk)
                # Check access control: user must be teacher or student in this classroom
                if not classroom.teachers.filter(id=user.id).exists() and not classroom.students.filter(id=user.id).exists():
                    return Response({"error": "You do not have permission to access this classroom"}, status=status.HTTP_403_FORBIDDEN)

                serializer = ClassroomDetailSerializer(classroom)
                return Response(serializer.data)
            except Classroom.DoesNotExist:
                return Response({"error": "Classroom not found"}, status=status.HTTP_404_NOT_FOUND)

        # If no pk, return paginated list of user classrooms
        if user.role == User.TEACHER:
            classrooms = user.teaching_classrooms.all()
        else:
            classrooms = user.enrolled_classrooms.all()

        if search_query:
            classrooms = classrooms.filter(Q(name__icontains=search_query) | Q(join_id__icontains=search_query))

        paginator = Paginator(classrooms, 15)
        page_obj = paginator.get_page(page)

        serializer = ClassroomSerializer(page_obj.object_list, many=True)
        return Response({
            "count": paginator.count,
            "total_pages": paginator.num_pages,
            "results": serializer.data
        }, status=status.HTTP_200_OK)

    elif request.method == 'POST':
        try:
            name = request.data.get("name")
            teacher_id = request.data.get("teacher_id")

            teacher = User.objects.get(pk=teacher_id)
            classroom = Classroom.objects.create(name=name)
            classroom.teachers.add(teacher)
            classroom.save()

            return Response({
                "message": "Classroom created successfully.",
                "classroom_id": classroom.id,
                "join_id": classroom.join_id
            }, status=status.HTTP_201_CREATED)

        except User.DoesNotExist:
            return Response({"error": "Teacher user not found."}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    elif request.method in ['PUT']:
        try:
            classroom = Classroom.objects.get(pk=pk)
        except Classroom.DoesNotExist:
            return Response({"error": "Classroom not found"}, status=status.HTTP_404_NOT_FOUND)

        serializer = ClassroomDetailSerializer(classroom, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        try:
            classroom = Classroom.objects.get(pk=pk)
            classroom.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Classroom.DoesNotExist:
            return Response({"error": "Classroom not found"}, status=status.HTTP_404_NOT_FOUND)

    return Response({"error": "Method not allowed"}, status=status.HTTP_405_METHOD_NOT_ALLOWED)



@api_view(['GET'])
def classroom_analytics(request, classroom_id):
    try:
        classroom = Classroom.objects.get(pk=classroom_id)
        students = classroom.students.all()
        total_pathways = Subject.objects.filter(classroom=classroom).values('student_pathway').distinct().count()
        quiz_scores = []
        for student in students:
            subjects = Subject.objects.filter(classroom=classroom, student_pathway__owner=student)
            for subject in subjects:
                pathway = subject.student_pathway
                for chapter in pathway.chapters.all():
                    for module in chapter.modules.all():
                        quiz = module.practice
                        if quiz and quiz.user == student and quiz.scores:
                            latest_score = quiz.scores[-1]
                            score = latest_score.get('score', 0)
                            total = latest_score.get('total', 0)
                            if total > 0:
                                quiz_scores.append((score / total) * 100)
        average_quiz_score = round(sum(quiz_scores) / len(quiz_scores), 2) if quiz_scores else 0
        return Response({"classroom": classroom.name, "total_students": students.count(), "total_pathways": total_pathways, "average_quiz_score_percent": average_quiz_score})
    except Classroom.DoesNotExist:
        return Response({"error": "Classroom not found"}, status=status.HTTP_404_NOT_FOUND)

@api_view(['GET'])
def student_classroom_analytics(request):
    try:
        student_id = request.GET.get('student_id')
        classroom_id = request.GET.get('classroom_id')

        student = User.objects.get(pk=student_id)
        classroom = Classroom.objects.get(pk=classroom_id)

        subjects = Subject.objects.filter(classroom=classroom, student_pathway__owner=student)
        quiz_scores = []
        pathway_progress = []

        for subject in subjects:
            pathway = subject.student_pathway
            chapters = pathway.chapters.all()
            total_modules = sum(ch.modules.count() for ch in chapters)
            completed_modules = sum(ch.modules.filter(status='completed').count() for ch in chapters)
            if total_modules > 0:
                pathway_progress.append((completed_modules / total_modules) * 100)

            for chapter in chapters:
                for module in chapter.modules.all():
                    quiz = module.practice
                    if quiz and quiz.user == student and quiz.scores:
                        latest_score = quiz.scores[-1]
                        score = latest_score.get('score', 0)
                        total = latest_score.get('total', 0)
                        if total > 0:
                            quiz_scores.append((score / total) * 100)

        avg_quiz_score = round(sum(quiz_scores) / len(quiz_scores), 2) if quiz_scores else 0
        avg_progress = round(sum(pathway_progress) / len(pathway_progress), 2) if pathway_progress else 0

        return Response({
            "student": f"{student.first_name} {student.last_name}",
            "classroom": classroom.name,
            "average_quiz_score_percent": avg_quiz_score,
            "total_pathways": subjects.count(),
            "average_pathway_progress_percent": avg_progress
        }, status=status.HTTP_200_OK)

    except User.DoesNotExist:
        return Response({"error": "Student not found"}, status=status.HTTP_404_NOT_FOUND)
    except Classroom.DoesNotExist:
        return Response({"error": "Classroom not found"}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def classroom_student_details(request, classroom_id):
    try:
        classroom = Classroom.objects.get(pk=classroom_id)
        students = classroom.students.all()
        student_data = []

        for student in students:
            quiz_scores = []
            pathway_progress = []
            feedback_notes = []

            subjects = Subject.objects.filter(classroom=classroom, student_pathway__owner=student)
            for subject in subjects:
                pathway = subject.student_pathway
                chapters = pathway.chapters.all()
                total_modules = sum(ch.modules.count() for ch in chapters)
                completed_modules = sum(ch.modules.filter(status='completed').count() for ch in chapters)

                if total_modules > 0:
                    pathway_progress.append((completed_modules / total_modules) * 100)

                for chapter in chapters:
                    for module in chapter.modules.all():
                        quiz = module.practice
                        if quiz and quiz.user == student and quiz.scores:
                            latest_score = quiz.scores[-1]
                            score = latest_score.get('score', 0)
                            total = latest_score.get('total', 0)
                            if total > 0:
                                quiz_scores.append((score / total) * 100)
                        if module.feedback:
                            feedback_notes.append(module.feedback)

            avg_quiz_score = round(sum(quiz_scores) / len(quiz_scores), 2) if quiz_scores else 0
            avg_progress = round(sum(pathway_progress) / len(pathway_progress), 2) if pathway_progress else 0

            student_data.append({
                "name": f"{student.first_name} {student.last_name}",
                "email": student.email,
                "quiz_average_percent": avg_quiz_score,
                "pathway_progress_percent": avg_progress,
                "notes": feedback_notes
            })

        return Response({"students": student_data}, status=status.HTTP_200_OK)

    except Classroom.DoesNotExist:
        return Response({"error": "Classroom not found"}, status=status.HTTP_404_NOT_FOUND)

def handle_classroom_join(request, role=None):
    join_id = request.data.get('join_id')
    user_id = request.data.get('user_id')

    if not join_id or not user_id:
        return Response({'error': 'join_id and user_id are required'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        classroom = Classroom.objects.get(join_id=join_id)
        user = User.objects.get(id=user_id)

        if role:
            if user.role != role:
                return Response({'error': f"User must be a {role.lower()} to join through this endpoint."}, status=status.HTTP_400_BAD_REQUEST)

        if user.role == User.TEACHER:
            classroom.teachers.add(user)
        else:
            classroom.students.add(user)

        return Response({'status': 'Joined classroom successfully'})
    except Classroom.DoesNotExist:
        return Response({'error': 'Invalid join ID'}, status=status.HTTP_404_NOT_FOUND)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['POST'])
def join_classroom_as_student(request):
    return handle_classroom_join(request, role=User.STUDENT)

@api_view(['POST'])
def join_classroom_as_teacher(request):
    return handle_classroom_join(request, role=User.TEACHER)

@api_view(['POST'])
def classroom_join(request):  # generic join, no role enforced
    return handle_classroom_join(request)
