# classroom_views.py

from rest_framework import status
from rest_framework.decorators import api_view, action
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet
from ..models import Classroom, User
from ..serializers import ClassroomSerializer, SubjectSerializer, ClassroomDetailSerializer

from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.core.paginator import Paginator
from django.db.models import Q



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


@api_view(['POST'])
def get_user_classrooms(request):
    user_id = request.data.get('user_id')
    search_query = request.GET.get('search', '').strip().lower()
    page = int(request.GET.get('page', 1))

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

    if search_query:
        classrooms = classrooms.filter(Q(name__icontains=search_query) | Q(join_id__icontains=search_query))

    paginator = Paginator(classrooms, 15)
    page_obj = paginator.get_page(page)

    serializer = ClassroomSerializer(page_obj.object_list, many=True)

    return Response({
        "count": paginator.count,
        "total_pages": paginator.num_pages,
        "results": serializer.data
    }, status=status.HTTP_200_OK)


@api_view(['GET', 'PUT', 'DELETE'])
def classroom_detail(request, pk):
    print("HEREEREE")
    try:
        classroom = Classroom.objects.get(pk=pk)
    except Classroom.DoesNotExist:
        return Response({"error": "Classroom not found"}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        serializer = ClassroomDetailSerializer(classroom)
        return Response(serializer.data)

    elif request.method == 'PUT':
        serializer = ClassroomDetailSerializer(classroom, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        classroom.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)