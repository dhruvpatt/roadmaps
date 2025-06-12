from rest_framework import serializers
from pathways.models import Deliverable, Question
from pathways.models.deliverable import Test, Homework, CheckIn, Resource, UserSubmission


from pathways.serializers.user_serializer import UserSerializer
from pathways.serializers.classroom_serializer import MaterialSerializer
from pathways.serializers.classroom_serializer import CommentSerializer

class DeliverableBaseSerializer(serializers.ModelSerializer):
    assigned_to = UserSerializer(many=True, read_only=True)
    handouts = MaterialSerializer(many=True, read_only=True)

    class Meta:
        model = Deliverable  # Abstract, not used directly
        exclude = []

class QuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Question
        fields = "__all__"

class UserSubmissionSerializer(serializers.ModelSerializer):
    submitted_by = UserSerializer(read_only=True)
    submission = MaterialSerializer(many=True, read_only=True)
    comments = CommentSerializer(many=True, read_only=True)

    class Meta:
        model = UserSubmission
        fields = "__all__"

class TestSerializer(DeliverableBaseSerializer):
    class Meta(DeliverableBaseSerializer.Meta):
        model = Test

class HomeworkSerializer(DeliverableBaseSerializer):
    class Meta(DeliverableBaseSerializer.Meta):
        model = Homework

class CheckInSerializer(DeliverableBaseSerializer):
    class Meta(DeliverableBaseSerializer.Meta):
        model = CheckIn

class ResourceSerializer(DeliverableBaseSerializer):
    class Meta(DeliverableBaseSerializer.Meta):
        model = Resource





