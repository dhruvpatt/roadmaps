from rest_framework.views import APIView
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from rest_framework.generics import ListAPIView
from rest_framework import status
from rest_framework.exceptions import ValidationError
from django.http import JsonResponse
from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from pathways.utils import attach_mock_students_to_classroom, populate_mock_data_for_classroom
from pathways.models.classroom import Classroom, Material, User
from pathways.serializers import ClassroomSerializer, CreateClassroomSerializer
import json

class StandardResultsSetPagination(PageNumberPagination):
    page_size = 15
    page_size_query_param = "page_size"
    max_page_size = 100


class ClassroomListView(ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = ClassroomSerializer
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        user = self.request.user
        search_query = self.request.query_params.get("search", "").strip().lower()

        if user.role == "teacher":
            queryset = Classroom.objects.filter(teachers=user)
        else:
            queryset = Classroom.objects.filter(students=user)

        if search_query:
            queryset = queryset.filter(
                Q(name__icontains=search_query) |
                Q(details__icontains=search_query)
            )

        return queryset.order_by("name")

    def list(self, request, *args, **kwargs):
        try:
            queryset = self.get_queryset()
            page = self.paginate_queryset(queryset)
            if page is not None:
                serializer = self.get_serializer(page, many=True, context={"request": request})
                return self.get_paginated_response(serializer.data)

            serializer = self.get_serializer(queryset, many=True, context={"request": request})
            return Response(serializer.data)

        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response(
                {"detail": "Failed to fetch classrooms", "error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ClassroomCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user

        if user.role != 'teacher':
            return Response(
                {'detail': 'Only teachers can create classrooms.'},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = CreateClassroomSerializer(
            data=request.data,
            context={'request': request}
        )

        try:
            if serializer.is_valid(raise_exception=True):
                classroom = serializer.save()
                
                attach_mock_students_to_classroom(classroom, number_of_students=10)

                # populate_mock_data_for_classroom(classroom.id)
                return Response(
                    ClassroomSerializer(classroom, context={"request": request}).data,
                    status=status.HTTP_201_CREATED
                )
        except ValidationError as ve:
            print("Validation error:", ve.detail)
            return Response(ve.detail, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            import traceback
            print("Unhandled exception:", str(e))
            traceback.print_exc()
            return Response(
                {"detail": "Something went wrong.", "error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class ClassroomDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, id):
        try:
            classroom = get_object_or_404(Classroom, id=id)
            return Response(
                ClassroomSerializer(classroom, context={"request": request}).data
            )
        except Exception as e:
            import traceback
            print("Error fetching classroom:", str(e))
            traceback.print_exc()
            return Response(
                {"detail": "Could not retrieve classroom", "error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def delete(self, request, id):
        try:
            classroom = get_object_or_404(Classroom, id=id)
            classroom.delete()
            return Response(
                {"detail": "Classroom deleted"}, status=status.HTTP_204_NO_CONTENT
            )
        except Exception as e:
            import traceback
            print("Error deleting classroom:", str(e))
            traceback.print_exc()
            return Response(
                {"detail": "Could not delete classroom", "error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def join_classroom_student(request):
    try:
        join_id = request.data.get('join_id')
        user = request.user
        classroom = get_object_or_404(Classroom, join_id=join_id)

        if user.role != 'student':
            return Response({'detail': 'Only students can join as students.'}, status=400)

        classroom.students.add(user)

        return Response(
            ClassroomSerializer(classroom, context={"request": request}).data
        )
    except Exception as e:
        import traceback
        print("Error joining classroom as student:", str(e))
        traceback.print_exc()
        return Response(
            {"detail": "Could not join classroom", "error": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def join_classroom_teacher(request):
    try:
        join_id = request.data.get('join_id')
        user = request.user
        classroom = get_object_or_404(Classroom, join_id=join_id)

        if user.role != 'teacher':
            return Response({'detail': 'Only teachers can join as teachers.'}, status=400)

        classroom.teachers.add(user)

        return Response(
            ClassroomSerializer(classroom, context={"request": request}).data
        )
    except Exception as e:
        import traceback
        print("Error joining classroom as teacher:", str(e))
        traceback.print_exc()
        return Response(
            {"detail": "Could not join classroom", "error": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@require_http_methods(["GET"])
def get_announcements_view(request, classroom_id):
    try:
        classroom = Classroom.objects.get(id=classroom_id)
        announcements = classroom.stream.filter(type="announcement").order_by("-id")
        data = [
            {
                "id": a.id,
                "title": a.title,
                "details": a.details,
                "created_by": a.created_by.username,
                "created_at": a.created_by.date_joined.strftime('%Y-%m-%d'),
            }
            for a in announcements
        ]
        return JsonResponse({"announcements": data})
    except Classroom.DoesNotExist:
        return JsonResponse({"error": "Classroom not found"}, status=404)


@csrf_exempt
@require_http_methods(["POST"])
def create_announcement_view(request, classroom_id):
    try:
        body = json.loads(request.body)
        title = body.get("title")
        details = body.get("details")
        user_id = body.get("creator_user_id")

        if not all([title, details, user_id]):
            return JsonResponse({"error": "Missing fields"}, status=400)

        classroom = Classroom.objects.get(id=classroom_id)
        creator = User.objects.get(id=user_id)

        announcement = Material.objects.create(
            type="announcement",
            title=title,
            details=details,
            created_by=creator
        )
        classroom.stream.add(announcement)

        return JsonResponse({
            "id": announcement.id,
            "message": "Announcement created successfully"
        })

    except (Classroom.DoesNotExist, User.DoesNotExist):
        return JsonResponse({"error": "Invalid classroom or user"}, status=404)
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)