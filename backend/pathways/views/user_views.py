# user_views.py

from rest_framework import status
from rest_framework.views import APIView
from rest_framework.decorators import api_view, action
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet
from django.shortcuts import get_object_or_404
from ..models import User
from ..serializers import UserSerializer, RoadmapSerializer, ClassroomSerializer


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


@api_view(['POST'])
def update_preferences(request):
    user_id = request.data.get("user_id")
    preferences = request.data.get("preferences")

    if not user_id:
        return Response({"error": "user_id is required"}, status=status.HTTP_400_BAD_REQUEST)

    try:
        user = User.objects.get(id=user_id)
        user.preferences = preferences
        user.save()

        serialized = UserSerializer(user)
        return Response({
            "message": "User preferences updated",
            "user": serialized.data
        }, status=status.HTTP_200_OK)

    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
