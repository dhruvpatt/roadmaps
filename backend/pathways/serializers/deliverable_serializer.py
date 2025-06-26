from rest_framework import serializers
from pathways.models import Question
from pathways.models.deliverable import (
    Deliverable, Assignment, Test, Homework, CheckIn, UserSubmission
)
from pathways.serializers.user_serializer import UserSerializer


class DeliverableSerializer(serializers.ModelSerializer):
    assigned_to = UserSerializer(many=True, read_only=True)
    created_by = UserSerializer(read_only=True)

    def get_handouts(self, obj):
        from pathways.serializers.classroom_serializer import MaterialSerializer
        return MaterialSerializer(obj.handouts.all(), many=True).data
    
    handouts = serializers.SerializerMethodField()

    class Meta:
        model = Deliverable
        fields = [
            'id', 'created_at', 'created_by', 'due_date', 'assigned_to',
            'title', 'description', 'mandatory', 'points_possible', 'estimated_time',
            'tags', 'handouts', 'classroom', 'is_published', 'updated_at', 'instructions'
        ]


class AssignmentSerializer(DeliverableSerializer):
    submission_count = serializers.SerializerMethodField()

    class Meta(DeliverableSerializer.Meta):
        model = Assignment
        fields = DeliverableSerializer.Meta.fields + ['assignment_type', 'submission_count']

    def get_submission_count(self, obj):
        return obj.submissions.count() if hasattr(obj, 'submissions') else 0


class TestSerializer(DeliverableSerializer):
    class Meta(DeliverableSerializer.Meta):
        model = Test
        fields = DeliverableSerializer.Meta.fields + [
            'shuffle_questions', 'time_limit', 'show_correct_answers', 'number_of_questions'
        ]


class HomeworkSerializer(DeliverableSerializer):
    class Meta(DeliverableSerializer.Meta):
        model = Homework
        fields = DeliverableSerializer.Meta.fields


class CheckInSerializer(DeliverableSerializer):
    class Meta(DeliverableSerializer.Meta):
        model = CheckIn
        fields = DeliverableSerializer.Meta.fields + ['max_responses']


class QuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Question
        fields = '__all__'
        