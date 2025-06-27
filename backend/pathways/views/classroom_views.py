import json
import uuid

from django.core.files.base import ContentFile
from django.utils import timezone
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

from pathways.models.classroom import Classroom, Material, Comment, MaterialType, AssignmentSubmission
from pathways.models.deliverable import Assignment, Test, Question
from pathways.models.user import User
from pathways.serializers import (
    ClassroomSerializer,
    CreateClassroomSerializer,
    MaterialSerializer,
    CommentSerializer,
    CreateCommentSerializer,
    AssignmentSubmissionSerializer,
)
from pathways.serializers.deliverable_serializer import AssignmentSerializer, TestSerializer, QuestionSerializer
from pathways.utils import attach_mock_students_to_classroom, create_mock_deliverables_for_classroom, create_mock_materials_for_classroom, create_mock_assignments_for_classroom
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

# region Helpers


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

# endregion


class StandardResultsSetPagination(PageNumberPagination):
    page_size = 10  # Default page size
    page_size_query_param = "page_size"
    max_page_size = 25

    def get_page_size(self, request):
        try:
            page_size = int(request.query_params.get(
                self.page_size_query_param, self.page_size))
            # Clamp between 1 and max_page_size
            if page_size < 1:
                return 1
            if page_size > self.max_page_size:
                return self.max_page_size
            return page_size
        except (ValueError, TypeError):
            return self.page_size


# region Classroom Views

class ClassroomListView(ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = ClassroomSerializer
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        user = self.request.user
        search_query = self.request.query_params.get(
            "search", "").strip().lower()

        # Only show classrooms user belongs to (student or teacher)
        queryset = Classroom.objects.filter(
            Q(teachers=user) | Q(students=user)).distinct()
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
                serializer = self.get_serializer(
                    page, many=True, context={"request": request})
                return self.get_paginated_response(serializer.data)
            serializer = self.get_serializer(
                queryset, many=True, context={"request": request})
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
        print(f"User: {user}, Role: {getattr(user, 'role', 'NO_ROLE')}")
        print(f"Request data: {request.data}")
        
        if user.role != 'teacher':
            return Response({'detail': 'Only teachers can create classrooms.'}, status=status.HTTP_403_FORBIDDEN)

        serializer = CreateClassroomSerializer(
            data=request.data, context={'request': request})
        
        if not serializer.is_valid():
            print(f"Serializer errors: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            classroom = serializer.save()
            if serializer.is_valid(raise_exception=True):
                classroom = serializer.save()
                classroom.refresh_from_db()
                # Add mock students
                students = attach_mock_students_to_classroom(
                    classroom, number_of_students=10)

                teachers = list(classroom.teachers.all())
                # create_mock_materials_for_classroom(
                #     classroom, teachers=teachers, count_per_type=5)

                # # Add mock assignments
                # print("Creating mock assignments...")
                # create_mock_assignments_for_classroom(
                #     classroom, teachers=teachers, count=8)
                # print("Mock assignments creation completed.")

                materials = create_mock_materials_for_classroom(
                    classroom, teachers=teachers, count_per_type=15)

                # Populate all mock data: units, weeks, materials, tests, homeworks, etc.
                # create_mock_deliverables_for_classroom(
                #     materials, classroom.id, students=students)

                return Response(
                    ClassroomSerializer(classroom, context={
                                        "request": request}).data,
                    status=status.HTTP_201_CREATED
                )
            return Response(
                ClassroomSerializer(classroom, context={"request": request}).data,
                status=status.HTTP_201_CREATED
            )
        except ValidationError as ve:
            print("Validation error:", ve.detail)
            return Response({"detail": str(ve)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            import traceback
            print("Exception in ClassroomCreateView:", str(e))
            print("Request data:", request.data)
            print("User:", request.user)
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
            user = request.user

            if not is_member(user, classroom):
                return Response({"detail": "Not allowed."}, status=403)

            # Serialize classroom (without materials for now)
            data = ClassroomSerializer(
                classroom, context={"request": request}).data

            # Paginate classroom.materials
            paginator = StandardResultsSetPagination()
            materials_qs = classroom.materials.order_by("-created_at").all()
            paginated_materials = paginator.paginate_queryset(
                materials_qs, request)

            # Attach paginated materials into the data
            data["materials"] = MaterialSerializer(
                paginated_materials, many=True, context={"request": request}).data
            data["materials_page"] = paginator.page.number
            data["materials_has_next"] = paginator.page.has_next()

            return Response(data)

        except Exception as e:
            import traceback
            traceback.print_exc()
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
            import traceback
            traceback.print_exc()
            return Response(
                {"detail": "Could not delete classroom", "error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

# endregion

# region Material Views


class MaterialListView(ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = MaterialSerializer
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        user = self.request.user
        search_query = self.request.query_params.get(
            "search", "").strip().lower()

        classrooms = Classroom.objects.filter(
            Q(students=user) | Q(teachers=user)).distinct()
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
                serializer = self.get_serializer(
                    page, many=True, context={"request": request})
                return self.get_paginated_response(serializer.data)

            print(f"Total materials before pagination: {queryset.count()}")
            serializer = self.get_serializer(
                queryset, many=True, context={"request": request})
            return Response(serializer.data)
        except NotFound:
            return Response({
                'count': queryset.count(),
                'next': None,
                'previous': None,
                'results': [],
            })
        except Exception as e:
            import traceback
            traceback.print_exc()
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

        # ✅ Safely extract data without deepcopying file objects
        title = request.data.get("title")
        classroom_id = request.data.get("classroom")
        content_raw = request.data.get("content")
        type_keys_raw = request.data.getlist("type_keys") if hasattr(
            request.data, "getlist") else request.data.get("type_keys", [])
        files = request.FILES.getlist("files")

        # Normalize type_keys
        if isinstance(type_keys_raw, str):
            type_keys = [type_keys_raw]
        elif isinstance(type_keys_raw, list):
            type_keys = type_keys_raw
        else:
            type_keys = list(type_keys_raw) if type_keys_raw else []

        classroom = get_object_or_404(Classroom, id=classroom_id)

        if not is_teacher_in_classroom(user, classroom):
            return Response({"detail": "Only teachers in this classroom can add materials."}, status=403)

        errors = {}

        # Validate required fields
        if not type_keys:
            errors["type_keys"] = "Type keys are required."

        # Validate and parse content
        existing_content = []
        if isinstance(content_raw, str):
            try:
                existing_content = json.loads(content_raw)
            except json.JSONDecodeError:
                errors["content"] = "Content must be valid JSON."
        elif isinstance(content_raw, list):
            existing_content = content_raw
        elif content_raw is not None:
            errors["content"] = "Content must be a list or JSON string."

        # Remove blob URLs
        existing_content = [
            item for item in existing_content
            if not item.get("url", "").startswith("blob:")
        ]

        # Validate type_keys
        valid_types = list(MaterialType.objects.values_list("key", flat=True))
        for key in type_keys:
            if key not in valid_types:
                errors["type_keys"] = f"Invalid type: {key}"

        # Validate files
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
                path = default_storage.save(
                    f"uploads/materials/{filename}", ContentFile(f.read()))
                file_url = default_storage.url(path)

                file_info.append({
                    "type": "file",
                    "url": file_url,
                    "filename": f.name,
                    "mimetype": f.content_type,
                    "size": f.size
                })

        combined_content = existing_content + \
            file_info if file_info else existing_content

        if errors:
            print("Validation errors:", errors)
            return Response(errors, status=status.HTTP_400_BAD_REQUEST)

        serializer_data = {
            "title": title,
            "content": combined_content,
            "type_keys": type_keys,
            "classroom": classroom.id
        }

        serializer = MaterialSerializer(
            data=serializer_data, context={"request": request})
        try:
            if serializer.is_valid(raise_exception=True):
                with transaction.atomic():
                    material = serializer.save(
                        created_by=user, classroom=classroom)
                    print("✅ Saved material content:", material.content)
                return Response(MaterialSerializer(material, context={"request": request}).data, status=status.HTTP_201_CREATED)
        except Exception as e:
            import traceback
            traceback.print_exc()
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
            import traceback
            traceback.print_exc()
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

            files = request.FILES.getlist("files")

            # SAFELY get a mutable dict without deepcopy issues
            data = dict(request.data.items())
            print("Incoming data:", data)

            # Handle and parse content
            raw_content = data.get("content")
            try:
                content = json.loads(raw_content) if isinstance(raw_content, str) else raw_content
                if not isinstance(content, list):
                    raise ValueError
            except Exception:
                return Response({"content": "Invalid content format."}, status=400)

            # Handle uploaded files
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

            # Combine content + uploaded files
            full_content = content + new_file_blocks
            data["content"] = full_content

            # Normalize type_keys
            raw_type_keys = request.data.getlist("type_keys") if hasattr(request.data, "getlist") else data.get("type_keys", [])
            if isinstance(raw_type_keys, str):
                raw_type_keys = [raw_type_keys]
            elif isinstance(raw_type_keys, list) and len(raw_type_keys) == 1 and ',' in raw_type_keys[0]:
                raw_type_keys = [k.strip() for k in raw_type_keys[0].split(',')]

            material_type_objs = MaterialType.objects.filter(key__in=raw_type_keys)
            if material_type_objs.count() != len(raw_type_keys):
                return Response({"type_keys": "One or more provided keys are invalid."}, status=400)

            data["type_keys"] = [mt.key for mt in material_type_objs]

            # Save changes
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
            import traceback
            traceback.print_exc()
            return Response({"detail": "Could not delete material", "error": str(e)}, status=500)

# endregion

# region Assignment Views


class AssignmentListView(ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = AssignmentSerializer
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        classroom_id = self.kwargs.get('classroom_id')
        classroom = get_object_or_404(Classroom, id=classroom_id)
        user = self.request.user

        if not is_member(user, classroom):
            return Assignment.objects.none()

        queryset = Assignment.objects.filter(
            classroom=classroom, is_published=True)
        return queryset.order_by('-created_at')


class AssignmentCreateView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def post(self, request, classroom_id):
        classroom = get_object_or_404(Classroom, id=classroom_id)
        user = request.user

        if not is_teacher(user, classroom):
            return Response({'detail': 'Only teachers can create assignments.'}, status=403)

        data = request.data.copy()
        data['classroom'] = classroom.id

        serializer = AssignmentSerializer(
            data=data, context={'request': request})
        if serializer.is_valid():
            assignment = serializer.save(created_by=user, classroom=classroom)
            return Response(AssignmentSerializer(assignment, context={'request': request}).data, status=201)
        return Response(serializer.errors, status=400)


class AssignmentDetailView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get(self, request, id):
        assignment = get_object_or_404(Assignment, id=id)
        user = request.user

        if not is_member(user, assignment.classroom):
            return Response({'detail': 'Not allowed.'}, status=403)

        return Response(AssignmentSerializer(assignment, context={'request': request}).data)

    def put(self, request, id):
        assignment = get_object_or_404(Assignment, id=id)
        user = request.user

        if not is_teacher(user, assignment.classroom):
            return Response({'detail': 'Only teachers can edit assignments.'}, status=403)

        serializer = AssignmentSerializer(
            assignment, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            assignment = serializer.save()
            return Response(AssignmentSerializer(assignment, context={'request': request}).data)
        return Response(serializer.errors, status=400)

    def delete(self, request, id):
        assignment = get_object_or_404(Assignment, id=id)
        user = request.user

        if not is_teacher(user, assignment.classroom):
            return Response({'detail': 'Only teachers can delete assignments.'}, status=403)

        assignment.delete()
        return Response({'detail': 'Assignment deleted'}, status=204)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def submit_assignment(request, assignment_id):
    assignment = get_object_or_404(Assignment, id=assignment_id)
    user = request.user

    if not is_student(user, assignment.classroom):
        return Response({'detail': 'Only students can submit assignments.'}, status=403)

    # Check if already submitted
    existing_submission = AssignmentSubmission.objects.filter(
        assignment=assignment, student=user).first()
    if existing_submission:
        return Response({'detail': 'Assignment already submitted.'}, status=400)

    data = request.data.copy()
    submission = AssignmentSubmission.objects.create(
        assignment=assignment,
        student=user,
        content=data.get('content', {}),
        status='late' if timezone.now() > assignment.due_date else 'submitted'
    )

    return Response(AssignmentSubmissionSerializer(submission).data, status=201)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def assignment_submissions(request, assignment_id):
    assignment = get_object_or_404(Assignment, id=assignment_id)
    user = request.user

    if not is_teacher(user, assignment.classroom):
        return Response({'detail': 'Only teachers can view submissions.'}, status=403)

    submissions = AssignmentSubmission.objects.filter(assignment=assignment)
    return Response(AssignmentSubmissionSerializer(submissions, many=True).data)


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def grade_submission(request, submission_id):
    submission = get_object_or_404(AssignmentSubmission, id=submission_id)
    user = request.user

    if not is_teacher(user, submission.assignment.classroom):
        return Response({'detail': 'Only teachers can grade submissions.'}, status=403)

    data = request.data
    submission.grade = data.get('grade')
    submission.feedback = data.get('feedback', '')
    submission.status = 'graded'
    submission.save()

    return Response(AssignmentSubmissionSerializer(submission).data)

# endregion

# region Test Views

class TestListView(ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = TestSerializer
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        classroom_id = self.kwargs.get('classroom_id')
        classroom = get_object_or_404(Classroom, id=classroom_id)
        user = self.request.user

        if not is_member(user, classroom):
            return Test.objects.none()

        # Teachers can see all tests (published and unpublished)
        # Students can only see published tests
        if is_teacher(user, classroom):
            queryset = Test.objects.filter(classroom=classroom)
        else:
            queryset = Test.objects.filter(classroom=classroom, is_published=True)
        
        return queryset.order_by('-created_at')


class TestCreateView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def post(self, request, classroom_id):
        classroom = get_object_or_404(Classroom, id=classroom_id)
        user = request.user

        if not is_teacher(user, classroom):
            return Response({'detail': 'Only teachers can create tests.'}, status=403)

        data = request.data.copy()
        data['classroom'] = classroom.id

        serializer = TestSerializer(
            data=data, context={'request': request})
        if serializer.is_valid():
            test = serializer.save(created_by=user, classroom=classroom)
            return Response(TestSerializer(test, context={'request': request}).data, status=201)
        return Response(serializer.errors, status=400)


class TestDetailView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get(self, request, id):
        test = get_object_or_404(Test, id=id)
        user = request.user

        if not is_member(user, test.classroom):
            return Response({'detail': 'Not allowed.'}, status=403)

        return Response(TestSerializer(test, context={'request': request}).data)

    def put(self, request, id):
        test = get_object_or_404(Test, id=id)
        user = request.user

        if not is_teacher(user, test.classroom):
            return Response({'detail': 'Only teachers can edit tests.'}, status=403)

        serializer = TestSerializer(
            test, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            test = serializer.save()
            return Response(TestSerializer(test, context={'request': request}).data)
        return Response(serializer.errors, status=400)

    def delete(self, request, id):
        test = get_object_or_404(Test, id=id)
        user = request.user

        if not is_teacher(user, test.classroom):
            return Response({'detail': 'Only teachers can delete tests.'}, status=403)

        test.delete()
        return Response({'detail': 'Test deleted'}, status=204)

# endregion

# region Question Views

class QuestionListView(ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = QuestionSerializer
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        test_id = self.kwargs.get('test_id')
        test = get_object_or_404(Test, id=test_id)
        user = self.request.user

        if not is_member(user, test.classroom):
            return Question.objects.none()

        return Question.objects.filter(test=test).order_by('order', 'created_at')


class QuestionCreateView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def post(self, request, test_id):
        test = get_object_or_404(Test, id=test_id)
        user = request.user

        if not is_teacher(user, test.classroom):
            return Response({'detail': 'Only teachers can create questions.'}, status=403)

        data = request.data.copy()
        data['test'] = test.id

        serializer = QuestionSerializer(
            data=data, context={'request': request})
        if serializer.is_valid():
            question = serializer.save()
            return Response(QuestionSerializer(question, context={'request': request}).data, status=201)
        return Response(serializer.errors, status=400)


class QuestionDetailView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get(self, request, id):
        question = get_object_or_404(Question, id=id)
        user = request.user

        if not is_member(user, question.test.classroom):
            return Response({'detail': 'Not allowed.'}, status=403)

        return Response(QuestionSerializer(question, context={'request': request}).data)

    def put(self, request, id):
        question = get_object_or_404(Question, id=id)
        user = request.user

        if not is_teacher(user, question.test.classroom):
            return Response({'detail': 'Only teachers can edit questions.'}, status=403)

        serializer = QuestionSerializer(
            question, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            question = serializer.save()
            return Response(QuestionSerializer(question, context={'request': request}).data)
        return Response(serializer.errors, status=400)

    def delete(self, request, id):
        question = get_object_or_404(Question, id=id)
        user = request.user

        if not is_teacher(user, question.test.classroom):
            return Response({'detail': 'Only teachers can delete questions.'}, status=403)

        question.delete()
        return Response({'detail': 'Question deleted'}, status=204)

# endregion


@api_view(['GET', 'POST', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def comment_view(request, material_id=None, comment_id=None):
    user = request.user

    try:
        # GET comments for a material
        if request.method == "GET" and material_id:
            material = get_object_or_404(Material, id=material_id)
            comments = Comment.objects.filter(
                material=material, replied_to=None).exclude(is_deleted=True)
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

            serializer = CreateCommentSerializer(
                comment, data=request.data, partial=True)
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
