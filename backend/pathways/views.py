# views.py

from rest_framework import status
from rest_framework.views import APIView
from rest_framework.decorators import api_view, action
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet
from django.shortcuts import get_object_or_404
from django.contrib.auth import authenticate
from .models import User, Roadmap, Chapter, Question, Quiz, Module, Content, Message, Classroom, Subject
from .serializers import (UserSerializer, RoadmapSerializer, ChapterSerializer,
                          QuestionSerializer, QuizSerializer, ModuleSerializer,
                          ContentSerializer, MessageSerializer, ClassroomSerializer,
                          SubjectSerializer, ClassroomDetailSerializer)


class StudentAnalyticsAPIView(APIView):
    def get(self, request, user_id):
        try:
            user = User.objects.get(pk=user_id)
            all_roadmaps = user.roadmaps.all()
            total = all_roadmaps.count()
            completed = 0
            active_roadmaps = 0

            for roadmap in all_roadmaps:
                if all(ch.status == 'completed' for ch in roadmap.chapters.all()):
                    completed += 1
                else:
                    active_roadmaps += 1

            return Response({
                "user": user.username,
                "total_roadmaps": total,
                "completed_roadmaps": completed,
                "active_roadmaps": active_roadmaps
            })
        except User.DoesNotExist:
            return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class TeacherAnalyticsAPIView(APIView):
    def get(self, request, user_id):
        try:
            user = User.objects.get(pk=user_id)

            if user.role != "teacher":
                return Response({"error": "User is not a teacher."}, status=status.HTTP_400_BAD_REQUEST)

            classrooms = user.teaching_classrooms.all()
            classroom_count = classrooms.count()

            # Get total number of students across classrooms
            student_ids = set()
            for classroom in classrooms:
                for student in classroom.students.all():
                    student_ids.add(student.id)
            total_students = len(student_ids)

            # Get only teacher's own roadmaps
            teacher_roadmaps = Roadmap.objects.filter(owner=user)
            total_roadmaps = teacher_roadmaps.count()
            active_pathways = teacher_roadmaps.exclude(chapters__status='completed').distinct().count()

            return Response({
                "user": user.username,
                "classrooms": classroom_count,
                "total_students": total_students,
                "total_roadmaps": total_roadmaps,
                "active_pathways": active_pathways
            })

        except User.DoesNotExist:
            return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# User ViewSet
class UserViewSet(ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer

    @action(detail=True, methods=['get'])
    def roadmaps(self, request, pk=None):
        user = self.get_object()
        roadmaps = user.roadmaps.all()
        serializer = RoadmapSerializer(roadmaps, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def classrooms(self, request, pk=None):
        user = self.get_object()
        if user.role == User.TEACHER:
            classrooms = user.teaching_classrooms.all()
        else:
            classrooms = user.enrolled_classrooms.all()
        serializer = ClassroomSerializer(classrooms, many=True)
        return Response(serializer.data)


# Roadmap ViewSet
class RoadmapViewSet(ModelViewSet):
    queryset = Roadmap.objects.all()
    serializer_class = RoadmapSerializer

    @action(detail=True, methods=['get'])
    def chapters(self, request, pk=None):
        roadmap = self.get_object()
        chapters = roadmap.chapters.all()
        serializer = ChapterSerializer(chapters, many=True)
        return Response(serializer.data)


# Chapter ViewSet
class ChapterViewSet(ModelViewSet):
    queryset = Chapter.objects.all()
    serializer_class = ChapterSerializer

    @action(detail=True, methods=['get'])
    def modules(self, request, pk=None):
        chapter = self.get_object()
        modules = chapter.modules.all()
        serializer = ModuleSerializer(modules, many=True)
        return Response(serializer.data)


# Question ViewSet
class QuestionViewSet(ModelViewSet):
    queryset = Question.objects.all()
    serializer_class = QuestionSerializer


# Quiz ViewSet
class QuizViewSet(ModelViewSet):
    queryset = Quiz.objects.all()
    serializer_class = QuizSerializer

    @action(detail=True, methods=['post'])
    def submit_answer(self, request, pk=None):
        quiz = self.get_object()
        question_id = request.data.get('question_id')
        answer = request.data.get('answer')

        question = get_object_or_404(Question, id=question_id)

        # Simple checking mechanism - can be improved based on question type
        is_correct = answer.strip().lower() == question.solution.strip().lower()

        if not is_correct:
            quiz.failed_questions.add(question)

        return Response({'correct': is_correct})


# Module ViewSet
class ModuleViewSet(ModelViewSet):
    queryset = Module.objects.all()
    serializer_class = ModuleSerializer

    @action(detail=True, methods=['get'])
    def contents(self, request, pk=None):
        module = self.get_object()
        contents = module.contents.all()
        serializer = ContentSerializer(contents, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def chat_history(self, request, pk=None):
        module = self.get_object()
        messages = module.chat_history.all().order_by('timestamp')
        serializer = MessageSerializer(messages, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def add_message(self, request, pk=None):
        module = self.get_object()
        serializer = MessageSerializer(data=request.data)

        if serializer.is_valid():
            serializer.save(module=module)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# Content ViewSet
class ContentViewSet(ModelViewSet):
    queryset = Content.objects.all()
    serializer_class = ContentSerializer


# Message ViewSet
class MessageViewSet(ModelViewSet):
    queryset = Message.objects.all()
    serializer_class = MessageSerializer


# Classroom ViewSet
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


# Subject ViewSet
class SubjectViewSet(ModelViewSet):
    queryset = Subject.objects.all()
    serializer_class = SubjectSerializer


@api_view(['POST'])
def create_user(request):
    serializer = UserSerializer(data=request.data)

    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['PUT'])
def update_user(request, pk):
    try:
        user = User.objects.get(pk=pk)
    except User.DoesNotExist:
        return Response({"detail": "User not found."}, status=status.HTTP_404_NOT_FOUND)

    # Remove the email field from the request data to prevent it from being updated
    # if 'email' in request.data:
    #     del request.data['email']

    serializer = UserSerializer(user, data=request.data)

    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
def login_with_email(request):
    email = request.data.get("email")
    password = request.data.get("password")

    if not email or not password:
        return Response({"error": "Email and password are required."}, status=status.HTTP_400_BAD_REQUEST)

    try:
        user = User.objects.get(email=email)
        print("user", user.email, user.password)
        print("email, pass", email, password)
        if user and user.password == password:
            return Response({
                "message": "Login successful",
                "user": {
                    "id": user.id,
                    "first_name": user.first_name,
                    "last_name": user.last_name,
                    "email": user.email,
                    "role": user.role
                }
            }, status=status.HTTP_200_OK)
        else:
            return Response({"error": "Invalid credentials."}, status=status.HTTP_401_UNAUTHORIZED)
    except User.DoesNotExist:
        return Response({"error": "User with this email does not exist."}, status=status.HTTP_404_NOT_FOUND)

# Function-based views for API endpoints
@api_view(['GET'])
def user_list(request):
    if request.method == 'GET':
        users = User.objects.all()
        serializer = UserSerializer(users, many=True)
        return Response(serializer.data)

@api_view(['GET'])
def student_list(request):
    if request.method == 'GET':
        students = User.objects.filter(role='student')
        serializer = UserSerializer(students, many=True)
        return Response(serializer.data)


@api_view(['GET', 'POST'])
def user_detail(request, pk):
    try:
        user = User.objects.get(pk=pk)
    except User.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        serializer = UserSerializer(user)
        return Response(serializer.data)

    elif request.method == 'POST':
        serializer = UserSerializer(user, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
def user_roadmaps(request, pk):
    try:
        user = User.objects.get(pk=pk)
    except User.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)

    roadmaps = user.roadmaps.all()
    serializer = RoadmapSerializer(roadmaps, many=True)
    return Response(serializer.data)


@api_view(['GET'])
def user_classrooms(request, pk):
    try:
        user = User.objects.get(pk=pk)
    except User.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)

    if user.role == User.TEACHER:
        classrooms = user.teaching_classrooms.all()
    else:
        classrooms = user.enrolled_classrooms.all()

    serializer = ClassroomSerializer(classrooms, many=True)
    return Response(serializer.data)


@api_view(['GET', 'POST'])
def roadmap_list(request):
    if request.method == 'GET':
        roadmaps = Roadmap.objects.all()
        serializer = RoadmapSerializer(roadmaps, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        serializer = RoadmapSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'DELETE'])
def roadmap_detail(request, pk):
    try:
        roadmap = Roadmap.objects.get(pk=pk)
    except Roadmap.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        serializer = RoadmapSerializer(roadmap)
        return Response(serializer.data)

    elif request.method == 'PUT':
        serializer = RoadmapSerializer(roadmap, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        roadmap.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['GET'])
def roadmap_chapters(request, pk):
    try:
        roadmap = Roadmap.objects.get(pk=pk)
    except Roadmap.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)

    chapters = roadmap.chapters.all()
    serializer = ChapterSerializer(chapters, many=True)
    return Response(serializer.data)


@api_view(['GET', 'POST'])
def chapter_list(request):
    if request.method == 'GET':
        chapters = Chapter.objects.all()
        serializer = ChapterSerializer(chapters, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        serializer = ChapterSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'DELETE'])
def chapter_detail(request, pk):
    try:
        chapter = Chapter.objects.get(pk=pk)
    except Chapter.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        serializer = ChapterSerializer(chapter)
        return Response(serializer.data)

    elif request.method == 'PUT':
        serializer = ChapterSerializer(chapter, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        chapter.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['GET'])
def chapter_modules(request, pk):
    try:
        chapter = Chapter.objects.get(pk=pk)
    except Chapter.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)

    modules = chapter.modules.all()
    serializer = ModuleSerializer(modules, many=True)
    return Response(serializer.data)


@api_view(['GET', 'POST'])
def module_list(request):
    if request.method == 'GET':
        modules = Module.objects.all()
        serializer = ModuleSerializer(modules, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        serializer = ModuleSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'DELETE'])
def module_detail(request, pk):
    try:
        module = Module.objects.get(pk=pk)
    except Module.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        serializer = ModuleSerializer(module)
        return Response(serializer.data)

    elif request.method == 'PUT':
        serializer = ModuleSerializer(module, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        module.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['GET'])
def module_contents(request, pk):
    try:
        module = Module.objects.get(pk=pk)
    except Module.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)

    contents = module.contents.all()
    serializer = ContentSerializer(contents, many=True)
    return Response(serializer.data)


@api_view(['GET'])
def module_chat_history(request, pk):
    try:
        module = Module.objects.get(pk=pk)
    except Module.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)

    messages = module.chat_history.all().order_by('timestamp')
    serializer = MessageSerializer(messages, many=True)
    return Response(serializer.data)


@api_view(['POST'])
def module_add_message(request, pk):
    try:
        module = Module.objects.get(pk=pk)
    except Module.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)

    serializer = MessageSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save(module=module)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'POST'])
def classroom_list(request):
    if request.method == 'GET':
        classrooms = Classroom.objects.all()
        serializer = ClassroomSerializer(classrooms, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        serializer = ClassroomSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'DELETE'])
def classroom_detail(request, pk):
    try:
        classroom = Classroom.objects.get(pk=pk)
    except Classroom.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        serializer = ClassroomSerializer(classroom)
        return Response(serializer.data)

    elif request.method == 'PUT':
        serializer = ClassroomSerializer(classroom, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        classroom.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['POST'])
def classroom_join(request):
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


@api_view(['GET'])
def classroom_subjects(request, pk):
    try:
        classroom = Classroom.objects.get(pk=pk)
    except Classroom.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)

    subjects = classroom.subjects.all()
    serializer = SubjectSerializer(subjects, many=True)
    return Response(serializer.data)


@api_view(['GET', 'POST'])
def subject_list(request):
    if request.method == 'GET':
        subjects = Subject.objects.all()
        serializer = SubjectSerializer(subjects, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        serializer = SubjectSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'DELETE'])
def subject_detail(request, pk):
    try:
        subject = Subject.objects.get(pk=pk)
    except Subject.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        serializer = SubjectSerializer(subject)
        return Response(serializer.data)

    elif request.method == 'PUT':
        serializer = SubjectSerializer(subject, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        subject.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['GET', 'POST'])
def question_list(request):
    if request.method == 'GET':
        questions = Question.objects.all()
        serializer = QuestionSerializer(questions, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        serializer = QuestionSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'DELETE'])
def question_detail(request, pk):
    try:
        question = Question.objects.get(pk=pk)
    except Question.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        serializer = QuestionSerializer(question)
        return Response(serializer.data)

    elif request.method == 'PUT':
        serializer = QuestionSerializer(question, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        question.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['GET', 'POST'])
def quiz_list(request):
    if request.method == 'GET':
        quizzes = Quiz.objects.all()
        serializer = QuizSerializer(quizzes, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        serializer = QuizSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'DELETE'])
def quiz_detail(request, pk):
    try:
        quiz = Quiz.objects.get(pk=pk)
    except Quiz.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        serializer = QuizSerializer(quiz)
        return Response(serializer.data)

    elif request.method == 'PUT':
        serializer = QuizSerializer(quiz, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        quiz.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['POST'])
def quiz_submit_answer(request, pk):
    try:
        quiz = Quiz.objects.get(pk=pk)
    except Quiz.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)

    question_id = request.data.get('question_id')
    answer = request.data.get('answer')

    try:
        question = Question.objects.get(id=question_id)
    except Question.DoesNotExist:
        return Response({'error': 'Question not found'}, status=status.HTTP_404_NOT_FOUND)

    # Simple checking mechanism - can be improved based on question type
    is_correct = answer.strip().lower() == question.solution.strip().lower()

    if not is_correct:
        quiz.failed_questions.add(question)

    return Response({'correct': is_correct})


@api_view(['GET', 'POST'])
def content_list(request):
    if request.method == 'GET':
        contents = Content.objects.all()
        serializer = ContentSerializer(contents, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        serializer = ContentSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'DELETE'])
def content_detail(request, pk):
    try:
        content = Content.objects.get(pk=pk)
    except Content.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        serializer = ContentSerializer(content)
        return Response(serializer.data)

    elif request.method == 'PUT':
        serializer = ContentSerializer(content, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        content.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['GET', 'POST'])
def message_list(request):
    if request.method == 'GET':
        messages = Message.objects.all()
        serializer = MessageSerializer(messages, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        serializer = MessageSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'DELETE'])
def message_detail(request, pk):
    try:
        message = Message.objects.get(pk=pk)
    except Message.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        serializer = MessageSerializer(message)
        return Response(serializer.data)

    elif request.method == 'PUT':
        serializer = MessageSerializer(message, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        message.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['POST'])
def get_user_classrooms(request):
    user_id = request.data.get('user_id')

    if not user_id:
        return Response({"error": "user_id is required"}, status=status.HTTP_400_BAD_REQUEST)

    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

    if user.role == User.TEACHER:
        classrooms = user.teaching_classrooms.all()
    else:
        classrooms = user.enrolled_classrooms.all()

    serializer = ClassroomSerializer(classrooms, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


# @api_view(['POST'])
# def get_classroom(request):
    
#     classroom_id = request.data.get('classroom_id')
#     user_id = request.data.get("user_id")
#     print("get classroom hit")
#     if not classroom_id:
#         return Response({"error": "classroom_id is required"}, status=status.HTTP_400_BAD_REQUEST)
    
#     if not user_id:
#         return Response({"error": "user_id is required"}, status=status.HTTP_400_BAD_REQUEST)
    
#     try: 
#         classroom = Classroom.objects.get(id=classroom_id)
#         serializer = ClassroomSerializer(classroom)
#         return Response(serializer.data, status=status.HTTP_200_OK)
#     except Classroom.DoesNotExist:
#         return Response({"error": "Classroom not found"}, status=status.HTTP_404_NOT_FOUND)
    
@api_view(['POST'])
def get_classroom(request):
    classroom_id = request.data.get('classroom_id')
    user_id = request.data.get("user_id")

    print("get classroom hit")

    if not classroom_id:
        return Response({"error": "classroom_id is required"}, status=status.HTTP_400_BAD_REQUEST)

    if not user_id:
        return Response({"error": "user_id is required"}, status=status.HTTP_400_BAD_REQUEST)

    try:
        classroom = Classroom.objects.get(id=classroom_id)
        serializer = ClassroomDetailSerializer(classroom)
        return Response(serializer.data, status=status.HTTP_200_OK)
    except Classroom.DoesNotExist:
        return Response({"error": "Classroom not found"}, status=status.HTTP_404_NOT_FOUND)


