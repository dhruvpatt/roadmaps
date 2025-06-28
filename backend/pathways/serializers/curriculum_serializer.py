from rest_framework import serializers
from pathways.models.classroom import Classroom, Unit, Week, Material
from pathways.serializers.analytics_serializer import AnalyticsSerializer
from pathways.serializers.user_serializer import UserSerializer
from pathways.serializers.deliverable_serializer import AssignmentSerializer

class WeekSerializer(serializers.ModelSerializer):
    analytics = AnalyticsSerializer(read_only=True)
    student_analytics = AnalyticsSerializer(many=True, read_only=True)

    class Meta:
        model = Week
        fields = [
            'id',
            'learning_goal',
            'analytics',
            'student_analytics',
        ]

class UnitSerializer(serializers.ModelSerializer):
    analytics = AnalyticsSerializer(read_only=True)
    student_analytics = AnalyticsSerializer(many=True, read_only=True)
    weeks = WeekSerializer(many=True, read_only=True)

    class Meta:
        model = Unit
        fields = [
            'id',
            'name',
            'description',
            'analytics',
            'student_analytics',
            'weeks',
        ]