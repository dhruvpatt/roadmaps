# views.py
from django.contrib.auth import authenticate, login, logout
from django.views.decorators.csrf import ensure_csrf_cookie
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework import status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.generics import ListAPIView
from pathways.serializers import ClassroomStudentSerializer
from pathways.serializers.user_serializer import UserSerializer
from pathways.models import User, Classroom
from django.middleware.csrf import get_token
from django.db.models import Prefetch
from pathways.models.analytics import Analytics

class StudentListView(ListAPIView):         
    serializer_class = ClassroomStudentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        classroom_id = self.kwargs["classroom_id"]
        classroom = Classroom.objects.get(pk=classroom_id)

        return classroom.students.all()

    def get_serializer_context(self):
        context = super().get_serializer_context()
        classroom = Classroom.objects.get(pk=self.kwargs["classroom_id"])
        context["classroom"] = classroom
        return context
    
@api_view(["GET"])
@permission_classes([AllowAny])
@ensure_csrf_cookie
def get_csrf_token(request):
    return Response({"detail": "CSRF cookie set"})


class UserView(APIView):
    permission_classes = [permissions.AllowAny]
    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

    def patch(self, request):
        serializer = UserSerializer(
            request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request):
        request.user.delete()
        return Response({"detail": "User deleted"}, status=status.HTTP_204_NO_CONTENT)


class UserSignupView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        print(request.data)
        data = request.data.copy()
        allowed_roles = ["student", "teacher"]
        if "role" in data and data["role"] not in allowed_roles:
            return Response(
                {"role": "Invalid role. Allowed: student or teacher."},
                status=status.HTTP_400_BAD_REQUEST
            )
        serializer = UserSerializer(data=data)
        if serializer.is_valid():
            user = serializer.save()
            return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)

        errors = serializer.errors
        custom_errors = {}

        if 'username' in errors:
            custom_errors['username'] = "This username is already taken."
        if 'email' in errors:
            custom_errors['email'] = "An account with this email already exists."

        if not custom_errors:
            custom_errors = errors

        return Response(custom_errors, status=status.HTTP_400_BAD_REQUEST)

class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        print("🚨 Incoming login request")
        print("Headers:", request.headers)
        print("Cookies:", request.COOKIES)
        print("Session key:", request.session.session_key)
        print("Request user (before login):", request.user)

        username = request.data.get("username")
        password = request.data.get("password")
        print(f"Username: {username}, Password: {password}")

        if request.user.is_authenticated:
            logout(request)
            
        user = authenticate(request, username=username, password=password)
        if user is not None:
            login(request, user)
            request.session.save()
            print("✅ Login successful:", user.username)
            print("Session key (after login):", request.session.session_key)
            return Response({"detail": "Logged in", "user": UserSerializer(user).data}, status=status.HTTP_200_OK)

        print("❌ Invalid credentials")
        return Response({"detail": "Invalid credentials"}, status=status.HTTP_400_BAD_REQUEST)


class LogoutView(APIView):
    def post(self, request):
        logout(request)
        return Response({"detail": "Logged out"}, status=status.HTTP_200_OK)