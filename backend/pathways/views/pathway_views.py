# pathway_views.py

from rest_framework import status
from rest_framework.decorators import api_view, action
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet
from django.db import transaction
from ..models import Pathway
from ..serializers import PathwaySerializer, ChapterSerializer


class PathwayViewSet(ModelViewSet):
    queryset = Pathway.objects.all()
    serializer_class = PathwaySerializer

    @action(detail=True, methods=['get'])
    def chapters(self, request, pk=None):
        pathway = self.get_object()
        chapters = pathway.chapters.all()
        serializer = ChapterSerializer(chapters, many=True)
        return Response(serializer.data)


@api_view(['GET', 'POST'])
def pathway_list(request):
    if request.method == 'GET':
        pathways = Pathway.objects.all()
        serializer = PathwaySerializer(pathways, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        serializer = PathwaySerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
def pathway_detail(request, pk):
    try:
        pathway = Pathway.objects.get(pk=pk)
    except Pathway.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        serializer = PathwaySerializer(pathway)
        return Response(serializer.data)

    elif request.method == 'PUT':
        serializer = PathwaySerializer(pathway, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'PATCH':
        serializer = PathwaySerializer(pathway, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        pathway.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['GET'])
def pathway_chapters(request, pk):
    try:
        pathway = Pathway.objects.get(pk=pk)
    except Pathway.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)

    chapters = pathway.chapters.all()
    serializer = ChapterSerializer(chapters, many=True)
    return Response(serializer.data)

@api_view(['POST'])
@transaction.atomic
def assign_pathway_to_user(request):
    pathway_id = request.data.get("pathway_id")

    try:
        pathway = Pathway.objects.get(pk=pathway_id)
        pathway.published = True
        pathway.save()

        serialized = PathwaySerializer(pathway)
        return Response({
            "message": "Pathway successfully marked as published.",
            "pathway": serialized.data
        }, status=status.HTTP_200_OK)

    except Pathway.DoesNotExist:
        return Response({"error": "Pathway not found"}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
