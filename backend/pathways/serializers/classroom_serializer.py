import secrets
from rest_framework import serializers
from pathways.models import Material, Unit, Week, Comment, Classroom
from pathways.serializers.user_serializer import UserSerializer
from pathways.serializers.analytics_serializer import AnalyticsSerializer


class MaterialSerializer(serializers.ModelSerializer):
    class Meta:
        model = Material
        fields = "__all__"


class CommentSerializer(serializers.ModelSerializer):
    posted_by = UserSerializer(read_only=True)
    replied_to = serializers.PrimaryKeyRelatedField(queryset=Comment.objects.all(), required=False)

    class Meta:
        model = Comment
        fields = ["id", "content", "posted_by", "date", "replied_to"]


class WeekSerializer(serializers.ModelSerializer):
    analytics = AnalyticsSerializer(read_only=True)
    student_analytics = AnalyticsSerializer(many=True, read_only=True)

    class Meta:
        model = Week
        fields = [
            "id", "learning_goal", "analytics", "student_analytics"
        ]


class UnitSerializer(serializers.ModelSerializer):
    analytics = AnalyticsSerializer(read_only=True)
    student_analytics = AnalyticsSerializer(many=True, read_only=True)
    weeks = WeekSerializer(many=True, read_only=True)

    class Meta:
        model = Unit
        fields = [
            "id", "name", "description", "analytics",
            "student_analytics", "weeks"
        ]


class CreateClassroomSerializer(serializers.ModelSerializer):
    """
    Serializer for creating a new Classroom.
    Only the `name` is required from the client;
    `join_id` is auto-generated and the requesting user is added as a teacher.
    """
    class Meta:
        model = Classroom
        fields = ['name']

    def create(self, validated_data):
        # Get the current user from context
        request = self.context.get('request')
        user = getattr(request, 'user', None)
        # Fallback in case context not set
        if user is None or not user.is_authenticated:
            raise serializers.ValidationError('Authentication credentials were not provided.')

        # Generate a unique, URL-safe join code
        join_id = secrets.token_urlsafe(6)
        while Classroom.objects.filter(join_id=join_id).exists():
            join_id = secrets.token_urlsafe(6)

        # Create the classroom instance
        classroom = Classroom.objects.create(
            name=validated_data['name'],
            join_id=join_id,
        )
        # Add the creator as a teacher
        classroom.teachers.add(user)

        return classroom


class ClassroomSerializer(serializers.ModelSerializer):
    """
    Read-only serializer including join_id, students, and teachers.
    """
    teachers = serializers.PrimaryKeyRelatedField(many=True, read_only=True)
    students = serializers.PrimaryKeyRelatedField(many=True, read_only=True)

    class Meta:
        model = Classroom
        fields = ['id', 'name', 'join_id', 'teachers', 'students']