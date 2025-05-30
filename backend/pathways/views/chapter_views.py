# chapter_views.py

from rest_framework import status
from rest_framework.decorators import api_view, action
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet
from ..models import Chapter
from ..serializers import ChapterSerializer, ModuleSerializer


class ChapterViewSet(ModelViewSet):
    queryset = Chapter.objects.all()
    serializer_class = ChapterSerializer

    @action(detail=True, methods=['get'])
    def modules(self, request, pk=None):
        chapter = self.get_object()
        modules = chapter.modules.all()
        serializer = ModuleSerializer(modules, many=True)
        return Response(serializer.data)


@api_view(['GET', 'POST'])
def chapter_list(request):
    if request.method == 'GET':
        chapters = Chapter.objects.all()
        serializer = ChapterSerializer(chapters, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        serializer = ChapterSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'POST', 'PUT', 'PATCH', 'DELETE'])
def chapter_detail(request, chapter_id=None):
    if request.method == 'GET':
        if chapter_id:
            try:
                chapter = Chapter.objects.get(pk=chapter_id)
                serializer = ChapterSerializer(chapter)
                return Response(serializer.data, status=status.HTTP_200_OK)
            except Chapter.DoesNotExist:
                return Response({"error": "Chapter not found"}, status=status.HTTP_404_NOT_FOUND)
        else:
            pathway_id = request.data.get('pathway') or request.query_params.get('pathway')
            if pathway_id:
                chapters = Chapter.objects.filter(pathway_id=pathway_id)
                serializer = ChapterSerializer(chapters, many=True)
                return Response(serializer.data, status=status.HTTP_200_OK)
            else:
                chapters = Chapter.objects.all()
                serializer = ChapterSerializer(chapters, many=True)
                return Response(serializer.data, status=status.HTTP_200_OK)

    elif request.method == 'POST':
        serializer = ChapterSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method in ['PUT', 'PATCH']:
        try:
            chapter = Chapter.objects.get(pk=chapter_id)
            serializer = ChapterSerializer(
                chapter, data=request.data, partial=(request.method == 'PATCH'))
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Chapter.DoesNotExist:
            return Response({"error": "Chapter not found"}, status=status.HTTP_404_NOT_FOUND)

    elif request.method == 'DELETE':
        try:
            chapter = Chapter.objects.get(pk=chapter_id)
            chapter.delete()
            return Response({"message": "Chapter deleted successfully."}, status=status.HTTP_204_NO_CONTENT)
        except Chapter.DoesNotExist:
            return Response({"error": "Chapter not found"}, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
def chapter_modules(request, pk):
    try:
        chapter = Chapter.objects.get(pk=pk)
    except Chapter.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)

    modules = chapter.modules.all()
    serializer = ModuleSerializer(modules, many=True)
    return Response(serializer.data)
