from django.shortcuts import get_object_or_404
from django.contrib.auth import authenticate
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny

from pathways.models.classroom import Classroom
from pathways.models.user import User
from pathways.serializers import ClassroomSerializer, CreateClassroomSerializer


class ClassroomViewSet(viewsets.ModelViewSet):
    """
    API endpoints for managing Classrooms.
    Supports listing, creating, retrieving, and deleting classrooms,
    as well as joining as a student or teacher.
    """
    queryset = Classroom.objects.all()
    lookup_field = 'id'
    permission_classes = [AllowAny]

    def get_serializer_class(self):
        if self.action == 'create':
            return CreateClassroomSerializer
        return ClassroomSerializer

    def get_queryset(self):
        """
        Return classrooms for the authenticated user,
        using the new teachers/students M2M relationships.
        """
        user = self.request.user
        # debug-log which user we’re filtering for
        print(f"Fetching classrooms for user: {user!r}")

        # Teachers see the ones they lead; students see the ones they’ve joined
        if getattr(user, "role", None) == "teacher":
            qs = Classroom.objects.filter(teachers=user)
        else:
            qs = Classroom.objects.filter(students=user)

        # optional search by name
        # search = self.request.query_params.get("search", "").strip()
        # if search:
        #     print(f"Filtering classrooms by search term: '{search}'")
        #     qs = qs.filter(name__icontains=search)

        return qs.order_by("name")

    def create(self, request, *args, **kwargs):
        user = get_object_or_404(User, pk=request.data['teacher_id'])
        if not user or user.role != 'teacher':
            print(request.data)
            return Response(
                {'detail': 'Only teachers can create classrooms.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        request.data['user'] = user
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        classroom = serializer.save(created_by=user)
        return Response(
            ClassroomSerializer(classroom).data,
            status=status.HTTP_201_CREATED
        )

    @action(detail=False, methods=['post'], url_path='join/student')
    def join_student(self, request):
        join_id = request.data.get('join_id')
        user_id = request.data.get('user_id')
        classroom = get_object_or_404(Classroom, join_id=join_id)
        user = get_object_or_404(User, pk=user_id)

        if user.role != 'student':
            return Response(
                {'detail': 'Only students can join as students.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        classroom.students.add(user)
        classroom.save()
        return Response(
            ClassroomSerializer(classroom).data,
            status=status.HTTP_200_OK
        )

    @action(detail=False, methods=['post'], url_path='join/teacher')
    def join_teacher(self, request):
        join_id = request.data.get('join_id')
        user_id = request.data.get('user_id')
        classroom = get_object_or_404(Classroom, join_id=join_id)
        user = get_object_or_404(User, pk=user_id)

        if user.role != 'teacher':
            return Response(
                {'detail': 'Only teachers can join as teachers.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        classroom.teachers.add(user)
        classroom.save()
        return Response(
            ClassroomSerializer(classroom).data,
            status=status.HTTP_200_OK
        )
