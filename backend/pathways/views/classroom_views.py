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
from pathways.models.classroom import Classroom, Material, User, Comment
from pathways.serializers import ClassroomSerializer, CreateClassroomSerializer, MaterialSerializer
import json
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from rest_framework.parsers import MultiPartParser, FormParser

from rest_framework import generics, permissions
from pathways.models import Material
from rest_framework.exceptions import PermissionDenied


ALLOWED_MIME_TYPES = {
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/svg+xml",
    "video/mp4",
    "video/quicktime",
    "video/x-msvideo",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
}
MAX_FILE_SIZE_MB = 10


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
                
                students = attach_mock_students_to_classroom(classroom, number_of_students=10)
                populate_mock_data_for_classroom(classroom.id, students=students)

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


class FileUploadView(APIView):
    parser_classes = [MultiPartParser, FormParser]
    permission_classes = [IsAuthenticated]

    def post(self, request, format=None):
        file = request.FILES.get("file")
        if not file:
            return Response({"error": "No file provided."}, status=400)

        if file.content_type not in ALLOWED_MIME_TYPES:
            return Response({"error": "Unsupported file type."}, status=400)

        if file.size > MAX_FILE_SIZE_MB * 1024 * 1024:
            return Response({"error": "File too large (max 10MB)."}, status=400)

        # Generate a unique filename
        ext = file.name.split(".")[-1]
        filename = f"{uuid.uuid4()}.{ext}"
        path = default_storage.save(f"uploads/materials/{filename}", ContentFile(file.read()))
        file_url = default_storage.url(path)

        return Response({"url": file_url, "filename": file.name})


class MaterialListCreateView(generics.ListCreateAPIView):
    queryset = Material.objects.all().order_by("-id")
    serializer_class = MaterialSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

class MaterialRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Material.objects.all()
    serializer_class = MaterialSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_update(self, serializer):
        material = self.get_object()
        if material.created_by != self.request.user:
            raise PermissionDenied("You cannot edit this material.")
        serializer.save()

    def perform_destroy(self, instance):
        if instance.created_by != self.request.user:
            raise PermissionDenied("You cannot delete this material.")
        instance.delete()


@api_view(['GET', 'POST', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def comment_view(request, material_id=None, comment_id=None):
    user = request.user

    try:
        # GET comments for a material
        if request.method == "GET" and material_id:
            material = get_object_or_404(Material, id=material_id)
            comments = Comment.objects.filter(material=material, replied_to=None).exclude(is_deleted=True)
            return Response(CommentSerializer(comments, many=True).data)

        # POST new comment or reply
        if request.method == "POST":
            data = request.data.copy()
            parent_comment = None

            if comment_id:
                parent_comment = get_object_or_404(Comment, id=comment_id)
                material = parent_comment.material
                data["replied_to"] = parent_comment.id
            else:
                material = get_object_or_404(Material, id=material_id)

            serializer = CreateCommentSerializer(data=data)
            if serializer.is_valid(raise_exception=True):
                comment = serializer.save(posted_by=user, material=material)
                return Response(CommentSerializer(comment).data, status=status.HTTP_201_CREATED)

        if request.method == "PATCH" and comment_id:
            comment = get_object_or_404(Comment, id=comment_id)
            if comment.posted_by != user:
                return Response({"error": "Unauthorized"}, status=403)

            serializer = CreateCommentSerializer(comment, data=request.data, partial=True)
            if serializer.is_valid(raise_exception=True):
                serializer.save(edited=True)  # 👈 Flag it as edited
                return Response(CommentSerializer(comment).data)

        # DELETE = soft-delete
        if request.method == "DELETE" and comment_id:
            comment = get_object_or_404(Comment, id=comment_id)
            if comment.posted_by != user:
                return Response({"error": "Unauthorized"}, status=403)
            comment.is_deleted = True
            comment.content = ""
            comment.save()
            return Response({"message": "Comment deleted"}, status=204)

        return Response({"error": "Unsupported operation"}, status=400)

    except Exception as e:
        import traceback
        traceback.print_exc()
        return Response(
            {"error": "Comment operation failed", "detail": str(e)},
            status=500
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