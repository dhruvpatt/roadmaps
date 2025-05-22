# pathway_views.py

from rest_framework import status
from rest_framework.decorators import api_view, action
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet
from django.db import transaction
from ..models import Pathway, User, Module
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
@transaction.atomic
def pathway_detail(request, pk):
    try:
        pathway = Pathway.objects.get(pk=pk)
    except Pathway.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        serializer = PathwaySerializer(pathway)
        return Response(serializer.data)
    
    elif request.method == 'PATCH':
        try:
            user_id = request.data.get("userid")
            if pathway.owner.id != user_id:
                return Response({"error": "User cannot modify this pathway"}, status=status.HTTP_401_UNAUTHORIZED)

            updated_modules = request.data.get("modules", [])

            with transaction.atomic():
                module_lookup = {mod.id: mod for mod in Module.objects.filter(chapter__pathway=pathway)}

                for mdata in updated_modules:
                    mod = module_lookup.get(mdata["id"])
                    if not mod:
                        continue

                    mod.name = mdata.get("name", mod.name)
                    mod.learning_goals = mdata.get("learning_goals", mod.learning_goals)
                    mod.contents.set([])  # optional: clear existing if needed

                    mod.save()

            serializer = PathwaySerializer(pathway)
            return Response(serializer.data, status=status.HTTP_200_OK)

        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    elif request.method == 'PUT':
        try:

            print(request.data["classroom"])
            pathway = Pathway.objects.get(pk=pk)
            if pathway.owner.id != request.data.get("userid", None):
                return Response({"error": "User cannot update this pathway"}, status=status.HTTP_401_UNAUTHORIZED)

            pathway.title = request.data.get("title", pathway.title)
            pathway.details = request.data.get("details", pathway.details)
            pathway.mode = request.data.get("mode", pathway.mode)
            pathway.grade = request.data.get("grade", pathway.grade)
            pathway.learning_goals = request.data.get("learning_goals", pathway.learning_goals)
            pathway.progress = request.data.get("progress", pathway.progress)
            
            if request.data.get("classroom", None) is not None:
                classroom_id = request.data.get("classroom", {}).get("id", None)
                if classroom_id:
                    try:
                        from pathways.models import Classroom  # adjust import if needed
                        classroom = Classroom.objects.get(id=classroom_id)
                        pathway.classroom = classroom
                    except Classroom.DoesNotExist:
                        return Response({"error": "Classroom not found"}, status=status.HTTP_400_BAD_REQUEST)
            else:
                pathway.classroom = None

            pathway.save()

            # optionally update chapters here if needed

            serializer = PathwaySerializer(pathway)
            return Response(serializer.data, status=status.HTTP_200_OK)

        except Pathway.DoesNotExist:
            return Response({"error": "Pathway not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

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
