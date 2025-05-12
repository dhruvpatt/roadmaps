# module_views.py

from rest_framework import status
from rest_framework.decorators import api_view, action
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet
from ..models import Module
from ..serializers import ModuleSerializer, ContentSerializer, MessageSerializer


class ModuleViewSet(ModelViewSet):
    queryset = Module.objects.all()
    serializer_class = ModuleSerializer

    @action(detail=True, methods=['get'])
    def contents(self, request, pk=None):
        module = self.get_object()
        contents = module.contents.all()
        serializer = ContentSerializer(contents, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def chat_history(self, request, pk=None):
        module = self.get_object()
        messages = module.chat_history.all().order_by('timestamp')
        serializer = MessageSerializer(messages, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def add_message(self, request, pk=None):
        module = self.get_object()
        serializer = MessageSerializer(data=request.data)

        if serializer.is_valid():
            serializer.save(module=module)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'POST'])
def module_list(request):
    if request.method == 'GET':
        modules = Module.objects.all()
        serializer = ModuleSerializer(modules, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        serializer = ModuleSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'DELETE'])
def module_detail(request, pk):
    try:
        module = Module.objects.get(pk=pk)
    except Module.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        serializer = ModuleSerializer(module)
        return Response(serializer.data)

    elif request.method == 'PUT':
        serializer = ModuleSerializer(module, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        module.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['GET'])
def module_contents(request, pk):
    try:
        module = Module.objects.get(pk=pk)
    except Module.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)

    contents = module.contents.all()
    serializer = ContentSerializer(contents, many=True)
    return Response(serializer.data)


@api_view(['GET'])
def module_chat_history(request, pk):
    try:
        module = Module.objects.get(pk=pk)
    except Module.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)

    messages = module.chat_history.all().order_by('timestamp')
    serializer = MessageSerializer(messages, many=True)
    return Response(serializer.data)


@api_view(['POST'])
def module_add_message(request, pk):
    try:
        module = Module.objects.get(pk=pk)
    except Module.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)

    serializer = MessageSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save(module=module)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
