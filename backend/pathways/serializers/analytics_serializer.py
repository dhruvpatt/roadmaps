from rest_framework import serializers
from pathways.models import Analytics, DifficultyBreakdown

class DifficultyBreakdownSerializer(serializers.ModelSerializer):
    class Meta:
        model = DifficultyBreakdown
        fields = ["count", "accuracy"]

class ProgressEntrySerializer(serializers.Serializer):
    week = serializers.IntegerField()
    grade = serializers.FloatField()
    engagement_score = serializers.IntegerField()

class AnalyticsSerializer(serializers.ModelSerializer):
    easy = DifficultyBreakdownSerializer()
    medium = DifficultyBreakdownSerializer()
    hard = DifficultyBreakdownSerializer()
    progress_over_time = ProgressEntrySerializer(many=True, required=False)

    class Meta:
        model = Analytics
        fields = "__all__"

