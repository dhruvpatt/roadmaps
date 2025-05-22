from rest_framework import generics, permissions
from rest_framework.exceptions import PermissionDenied
from pathways.models import Quiz
from pathways.serializers import QuizSerializer


class QuizDetailAPIView(generics.RetrieveAPIView):
    """
    GET /api/quizzes/{pk}/
    Returns the Quiz (and nested questions) only if it belongs to the requesting user.
    """
    queryset = Quiz.objects.all()
    serializer_class = QuizSerializer
    permission_classes = [permissions.AllowAny]

    def get_object(self):
        quiz = super().get_object()
        return quiz