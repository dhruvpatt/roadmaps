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
from rest_framework.exceptions import NotFound


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
        return queryset.order_by("-created_at")

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

            if not is_member(user, classroom):
                return Response({"detail": "Not allowed."}, status=403)

            # Serialize classroom (without materials for now)
            data = ClassroomSerializer(classroom, context={"request": request}).data

            # Paginate classroom.materials
            paginator = StandardResultsSetPagination()
            materials_qs = classroom.materials.order_by("-created_at").all()
            paginated_materials = paginator.paginate_queryset(materials_qs, request)

            # Attach paginated materials into the data
            data["materials"] = MaterialSerializer(paginated_materials, many=True, context={"request": request}).data
            data["materials_page"] = paginator.page.number
            data["materials_has_next"] = paginator.page.has_next()

            return Response(data)

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
        search_query = self.request.query_params.get("search", "").strip().lower()

        classrooms = Classroom.objects.filter(Q(students=user) | Q(teachers=user)).distinct()
        queryset = Material.objects.filter(classroom__in=classrooms)

        if search_query:
            queryset = queryset.filter(
                Q(title__icontains=search_query) |
                Q(details__icontains=search_query)
            )

        return queryset.order_by("-created_at")


    def list(self, request, *args, **kwargs):
        try:
            queryset = self.get_queryset()
            page = self.paginate_queryset(queryset)
            if page is not None:
                print(f"Materials on this page: {len(page)}")  # ✅ Add this
                serializer = self.get_serializer(page, many=True, context={"request": request})
                return self.get_paginated_response(serializer.data)
            
            print(f"Total materials before pagination: {queryset.count()}")
            serializer = self.get_serializer(queryset, many=True, context={"request": request})
            return Response(serializer.data)
        except NotFound: 
            return Response({
                'count': queryset.count(),
                'next': None,
                'previous': None,
                'results': [],
            })  
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
        print("request data:", request.data)
        user = request.user
        data = request.data.copy()
        files = request.FILES.getlist("files")

        # Safely extract and normalize input values
        title = data.get("title")
        details = data.get("details")
        classroom_id = data.get("classroom")
        content_raw = data.get("content")
        type_keys_raw = data.getlist("type_keys") if hasattr(data, "getlist") else data.get("type_keys", [])

        # Normalize type_keys
        if isinstance(type_keys_raw, str):
            type_keys = [type_keys_raw]
        elif isinstance(type_keys_raw, list):
            type_keys = type_keys_raw
        else:
            type_keys = list(type_keys_raw) if type_keys_raw else []

        # Validate classroom
        classroom = get_object_or_404(Classroom, id=classroom_id)

        # RBAC: Only teachers in classroom can create
        if not is_teacher_in_classroom(user, classroom):
            return Response({"detail": "Only teachers in this classroom can add materials."}, status=403)

        # Validate required fields
        errors = {}
        for field_name, value in [("title", title), ("details", details), ("type_keys", type_keys)]:
            if not value:
                errors[field_name] = f"{field_name.capitalize()} is required."

        # Validate type_keys
        valid_types = list(MaterialType.objects.values_list("key", flat=True))
        for key in type_keys:
            if key not in valid_types:
                errors["type_keys"] = f"Invalid type: {key}"

        # Parse existing content (JSON string)
        try:
            existing_content = json.loads(content_raw) if content_raw else []
            # Filter out blob URLs that were only for preview
            existing_content = [
                item for item in existing_content
                if not item.get("url", "").startswith("blob:")
            ]

        except json.JSONDecodeError:
            errors["content"] = "Content must be valid JSON."

        if not isinstance(existing_content, list):
            existing_content = list(existing_content)

        # Build file_info
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
                    "type": "file",
                    "url": file_url,
                    "filename": f.name,
                    "mimetype": f.content_type,
                    "size": f.size
                })

        combined_content = existing_content + file_info if file_info else existing_content

        if errors:
            print(errors)
            return Response(errors, status=status.HTTP_400_BAD_REQUEST)

        # Final serializer payload
        serializer_data = {
            "title": title,
            "details": details,
            "content": combined_content,
            "type_keys": type_keys,
            "classroom": classroom.id
        }

        serializer = MaterialSerializer(data=serializer_data, context={"request": request})
        try:
            if serializer.is_valid(raise_exception=True):
                with transaction.atomic():
                    material = serializer.save(created_by=user, classroom=classroom)
                    print("✅ Saved material content:", material.content)
                    print("✅ Full material object:", material.__dict__)
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

            print("Incoming data:", data)

            # Process files and build new file content blocks
            new_file_blocks = []
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

                    new_file_blocks.append({
                        "type": "file",
                        "url": file_url,
                        "filename": f.name,
                        "mimetype": f.content_type,
                        "size": f.size
                    })

            # Merge with existing non-file content
            existing_content = material.content or []
            non_file_content = [c for c in existing_content if c.get("type") != "file"]
            combined_content = non_file_content + new_file_blocks
            data["content"] = json.dumps(combined_content)

            # Handle type_keys (normalize + fetch actual MaterialType instances)
            raw_type_keys = data.getlist("type_keys") if hasattr(data, "getlist") else data.get("type_keys", [])

            if isinstance(raw_type_keys, list) and len(raw_type_keys) == 1 and ',' in raw_type_keys[0]:
                raw_type_keys = [k.strip() for k in raw_type_keys[0].split(',')]
            elif isinstance(raw_type_keys, str):
                raw_type_keys = [raw_type_keys]

            material_type_objs = MaterialType.objects.filter(key__in=raw_type_keys)
            if material_type_objs.count() != len(raw_type_keys):
                return Response({"type_keys": "One or more provided keys are invalid."}, status=400)

            # Replace type_keys with their corresponding IDs
            data.setlist("type_keys", [mt.key for mt in material_type_objs])

            # Serialize and save
            serializer = MaterialSerializer(material, data=data, partial=True, context={"request": request})
            if serializer.is_valid(raise_exception=True):
                updated = serializer.save()
                return Response(MaterialSerializer(updated, context={"request": request}).data)

        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response(
                {"detail": "Could not update material", "error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

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