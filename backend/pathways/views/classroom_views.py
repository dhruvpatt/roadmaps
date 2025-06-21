import json
import uuid

from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from django.db import transaction
from django.db.models import Q
from django.http import JsonResponse
from django.shortcuts import get_object_or_404

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.exceptions import ValidationError, PermissionDenied
from rest_framework.generics import ListAPIView
from rest_framework.pagination import PageNumberPagination
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from pathways.models.classroom import Classroom, Material, Comment, MaterialType
from pathways.models.user import User
from pathways.serializers import (
    ClassroomSerializer,
    CreateClassroomSerializer,
    MaterialSerializer,
    CommentSerializer,
    CreateCommentSerializer,
)
from pathways.utils import attach_mock_students_to_classroom, create_mock_deliverables_for_classroom, create_mock_materials_for_classroom
from pathways.models.classroom import Classroom, Material
from pathways.models.user import User

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

#region Helpers
def is_teacher_in_classroom(user, classroom):
    return classroom.teachers.filter(id=user.id).exists()

def is_student_in_classroom(user, classroom):
    return classroom.students.filter(id=user.id).exists()

def is_member_in_classroom(user, classroom):
    return is_teacher_in_classroom(user, classroom) or is_student_in_classroom(user, classroom)

def is_teacher(user, classroom):
    return classroom.teachers.filter(id=user.id).exists()

def is_student(user, classroom):
    return classroom.students.filter(id=user.id).exists()

def is_member(user, classroom):
    return is_teacher(user, classroom) or is_student(user, classroom)

#endregion



class StandardResultsSetPagination(PageNumberPagination):
    page_size = 10  # Default page size
    page_size_query_param = "page_size"
    max_page_size = 25

    def get_page_size(self, request):
        try:
            page_size = int(request.query_params.get(self.page_size_query_param, self.page_size))
            # Clamp between 1 and max_page_size
            if page_size < 1:
                return 1
            if page_size > self.max_page_size:
                return self.max_page_size
            return page_size
        except (ValueError, TypeError):
            return self.page_size


#region Classroom Views

class ClassroomListView(ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = ClassroomSerializer
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        user = self.request.user
        search_query = self.request.query_params.get("search", "").strip().lower()

        # Only show classrooms user belongs to (student or teacher)
        queryset = Classroom.objects.filter(Q(teachers=user) | Q(students=user)).distinct()
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
            import traceback; traceback.print_exc()
            return Response(
                {"detail": "Failed to fetch classrooms", "error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class ClassroomCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        if user.role != 'teacher':
            return Response({'detail': 'Only teachers can create classrooms.'}, status=status.HTTP_403_FORBIDDEN)

        serializer = CreateClassroomSerializer(data=request.data, context={'request': request})
        try:
            if serializer.is_valid(raise_exception=True):
                classroom = serializer.save()
                classroom.refresh_from_db()

                print("Request user id:", user.id)
                print("Classroom teachers:", list(classroom.teachers.values_list('id', flat=True)))
                print("is_member_in_classroom:", is_member(user, classroom))
                # Add mock students
                students = attach_mock_students_to_classroom(classroom, number_of_students=10)

                teachers = list(classroom.teachers.all())

                materials = create_mock_materials_for_classroom(classroom, teachers=teachers, count_per_type=15)

                # Populate all mock data: units, weeks, materials, tests, homeworks, etc.
                create_mock_deliverables_for_classroom(materials, classroom.id, students=students)

                return Response(
                    ClassroomSerializer(classroom, context={"request": request}).data,
                    status=status.HTTP_201_CREATED
                )
        except ValidationError as ve:
            print("Validation error:", ve.detail)
            return Response(ve.detail, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            import traceback; traceback.print_exc()
            return Response(
                {"detail": "Something went wrong.", "error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class ClassroomDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, id):
        try:
            classroom = get_object_or_404(Classroom, id=id)
            user = request.user
            print("User id:", user.id)
            print("Teachers:", list(classroom.teachers.values_list('id', flat=True)))
            print("Students:", list(classroom.students.values_list('id', flat=True)))
            print("is_member:", is_member(user, classroom))
            if not is_member(user, classroom):
                return Response({"detail": "Not allowed."}, status=403)
            return Response(ClassroomSerializer(classroom, context={"request": request}).data)
        except Exception as e:
            import traceback; traceback.print_exc()
            return Response(
                {"detail": "Could not retrieve classroom", "error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def delete(self, request, id):
        try:
            classroom = get_object_or_404(Classroom, id=id)
            user = request.user
            # Only teachers of this classroom can delete it
            if not is_teacher(user, classroom):
                return Response({"detail": "Only teachers can delete classroom."}, status=403)
            classroom.delete()
            return Response(
                {"detail": "Classroom deleted"}, status=status.HTTP_204_NO_CONTENT
            )
        except Exception as e:
            import traceback; traceback.print_exc()
            return Response(
                {"detail": "Could not delete classroom", "error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

#endregion

#region Material Views

class MaterialListView(ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = MaterialSerializer
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        user = self.request.user
        classrooms = Classroom.objects.filter(Q(students=user) | Q(teachers=user)).distinct()
        return Material.objects.filter(classroom__in=classrooms).order_by("created_at")

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
            import traceback; traceback.print_exc()
            return Response(
                {"detail": "Failed to fetch materials", "error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class MaterialCreateView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def post(self, request):
        user = request.user
        data = request.data.copy()
        files = request.FILES.getlist("files")
        classroom_id = data.get("classroom")
        classroom = get_object_or_404(Classroom, id=classroom_id)

        # RBAC: Only teachers in classroom can create
        if not is_teacher_in_classroom(user, classroom):
            return Response({"detail": "Only teachers in this classroom can add materials."}, status=403)

        # Validate required fields
        errors = {}
        required_fields = ["title", "details", "types"]
        for field in required_fields:
            if not data.get(field):
                errors[field] = f"{field.capitalize()} is required."

        # Validate types
        type_keys = data.getlist("types") if hasattr(data, "getlist") else data.get("types", [])
        if isinstance(type_keys, str):
            # If single type is sent as a string, convert to list
            type_keys = [type_keys]
        valid_types = list(MaterialType.objects.values_list("key", flat=True))
        for key in type_keys:
            if key not in valid_types:
                errors["types"] = f"Invalid type: {key}"

        file_info = []
        if files:
            for f in files:
                if f.content_type not in ALLOWED_MIME_TYPES:
                    errors["files"] = f"Unsupported file type: {f.content_type}"
                    break
                if f.size > MAX_FILE_SIZE_MB * 1024 * 1024:
                    errors["files"] = f"File too large: {f.name} (max {MAX_FILE_SIZE_MB}MB)."
                    break
                ext = f.name.split(".")[-1]
                filename = f"{uuid.uuid4()}.{ext}"
                path = default_storage.save(f"uploads/materials/{filename}", ContentFile(f.read()))
                file_url = default_storage.url(path)
                file_info.append({
                    "url": file_url,
                    "filename": f.name,
                    "mimetype": f.content_type,
                    "size": f.size
                })
        # Content can be empty for some material types, so don't error if not files

        if errors:
            return Response(errors, status=status.HTTP_400_BAD_REQUEST)

        data["created_by"] = user.id
        data["content"] = file_info
        data["classroom"] = classroom.id

        serializer = MaterialSerializer(data=data, context={"request": request})
        try:
            if serializer.is_valid(raise_exception=True):
                with transaction.atomic():
                    material = serializer.save(created_by=user, classroom=classroom)
                    # Set types M2M (serializer doesn't always do this with SlugRelatedField)
                    if type_keys:
                        material.types.set(MaterialType.objects.filter(key__in=type_keys))
                return Response(MaterialSerializer(material, context={"request": request}).data, status=status.HTTP_201_CREATED)
        except Exception as e:
            import traceback; traceback.print_exc()
            return Response(
                {"detail": "Could not create material.", "error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class MaterialDetailView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get(self, request, id):
        try:
            user = request.user
            material = get_object_or_404(Material, id=id)
            classroom = material.classroom
            if not classroom or not is_member_in_classroom(user, classroom):
                return Response({"detail": "Not allowed."}, status=403)
            return Response(MaterialSerializer(material, context={"request": request}).data)
        except Exception as e:
            import traceback; traceback.print_exc()
            return Response(
                {"detail": "Could not retrieve material", "error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    def put(self, request, id):
        try:
            user = request.user
            material = get_object_or_404(Material, id=id)
            classroom = material.classroom
            if not classroom or not (material.created_by == user or is_teacher_in_classroom(user, classroom)):
                return Response({"detail": "Not allowed."}, status=403)
            data = request.data.copy()
            files = request.FILES.getlist("files")

            file_info = material.content or []
            if files:
                for f in files:
                    if f.content_type not in ALLOWED_MIME_TYPES:
                        return Response({"files": f"Unsupported file type: {f.content_type}"}, status=400)
                    if f.size > MAX_FILE_SIZE_MB * 1024 * 1024:
                        return Response({"files": f"File too large: {f.name} (max {MAX_FILE_SIZE_MB}MB)."}, status=400)
                    ext = f.name.split(".")[-1]
                    filename = f"{uuid.uuid4()}.{ext}"
                    path = default_storage.save(f"uploads/materials/{filename}", ContentFile(f.read()))
                    file_url = default_storage.url(path)
                    file_info.append({
                        "url": file_url,
                        "filename": f.name,
                        "mimetype": f.content_type,
                        "size": f.size
                    })
                data["content"] = file_info

            serializer = MaterialSerializer(material, data=data, partial=True, context={"request": request})
            if serializer.is_valid(raise_exception=True):
                material = serializer.save()
                # Update types if present
                type_keys = data.getlist("types") if hasattr(data, "getlist") else data.get("types", [])
                if isinstance(type_keys, str):
                    type_keys = [type_keys]
                if type_keys:
                    material.types.set(MaterialType.objects.filter(key__in=type_keys))
                return Response(MaterialSerializer(material, context={"request": request}).data)
        except Exception as e:
            import traceback; traceback.print_exc()
            return Response({"detail": "Could not update material", "error": str(e)}, status=500)


    def delete(self, request, id):
        try:
            user = request.user
            material = get_object_or_404(Material, id=id)
            classroom = material.classroom
            if not classroom or not (material.created_by == user or is_teacher_in_classroom(user, classroom)):
                return Response({"detail": "Not allowed."}, status=403)
            material.delete()
            return Response({"detail": "Material deleted"}, status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            import traceback; traceback.print_exc()
            return Response({"detail": "Could not delete material", "error": str(e)}, status=500)

#endregion

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