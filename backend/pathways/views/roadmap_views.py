# roadmap_views.py

from rest_framework import status
from rest_framework.decorators import api_view, action
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet
from django.db import transaction
from ..models import Roadmap
from ..serializers import RoadmapSerializer, ChapterSerializer


class RoadmapViewSet(ModelViewSet):
    queryset = Roadmap.objects.all()
    serializer_class = RoadmapSerializer

    @action(detail=True, methods=['get'])
    def chapters(self, request, pk=None):
        roadmap = self.get_object()
        chapters = roadmap.chapters.all()
        serializer = ChapterSerializer(chapters, many=True)
        return Response(serializer.data)


@api_view(['GET', 'POST'])
def roadmap_list(request):
    if request.method == 'GET':
        roadmaps = Roadmap.objects.all()
        serializer = RoadmapSerializer(roadmaps, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        serializer = RoadmapSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
def roadmap_detail(request, pk):
    try:
        roadmap = Roadmap.objects.get(pk=pk)
    except Roadmap.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        serializer = RoadmapSerializer(roadmap)
        return Response(serializer.data)

    elif request.method == 'PUT':
        serializer = RoadmapSerializer(roadmap, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'PATCH':
        serializer = RoadmapSerializer(roadmap, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        roadmap.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['GET'])
def roadmap_chapters(request, pk):
    try:
        roadmap = Roadmap.objects.get(pk=pk)
    except Roadmap.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)

    chapters = roadmap.chapters.all()
    serializer = ChapterSerializer(chapters, many=True)
    return Response(serializer.data)

@api_view(['POST'])
@transaction.atomic
def assign_roadmap_to_user(request):
    roadmap_id = request.data.get("roadmap_id")

    try:
        roadmap = Roadmap.objects.get(pk=roadmap_id)
        roadmap.published = True
        roadmap.save()

        serialized = RoadmapSerializer(roadmap)
        return Response({
            "message": "Roadmap successfully marked as published.",
            "roadmap": serialized.data
        }, status=status.HTTP_200_OK)

    except Roadmap.DoesNotExist:
        return Response({"error": "Roadmap not found"}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
