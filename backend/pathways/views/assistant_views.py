from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from pathways.utils.assistant.assistant import ask_assistant


class AssistantView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        html = request.data.get('html')
        messages = request.data.get('messages') 

        if not html or not messages:
            return Response({"error": "Missing html or message"}, status=status.HTTP_400_BAD_REQUEST)

        response = ask_assistant(html=html, messages=messages)
        return Response({"response": response}, status=status.HTTP_200_OK)
