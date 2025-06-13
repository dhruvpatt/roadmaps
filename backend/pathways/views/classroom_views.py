from rest_framework.views import APIView
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from rest_framework.generics import ListAPIView
from rest_framework import status
from rest_framework.exceptions import ValidationError
from django.db.models import Q


from django.shortcuts import get_object_or_404

from pathways.models.classroom import Classroom
from pathways.serializers import ClassroomSerializer, CreateClassroomSerializer


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
