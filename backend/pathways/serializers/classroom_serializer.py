import secrets
from rest_framework import serializers
from pathways.models import Material, Unit, Week, Comment, Classroom
from pathways.serializers.user_serializer import UserSerializer
from pathways.serializers.analytics_serializer import AnalyticsSerializer


class MaterialSerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)
    viewed_by = UserSerializer(many=True, read_only=True)
    comments = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Material
        fields = [
            "id", "type", "title", "details", "created_by",
            "content", "likes", "viewed_by", "time_viewed",
            "last_viewed", "comments"
        ]

    def get_comments(self, obj):
        return CommentSerializer(Comment.objects.filter(material=obj), many=True).data


class CreateCommentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Comment
        fields = ['content', 'replied_to']

    def validate_content(self, value):
        if not value.strip():
            raise serializers.ValidationError(
                "Comment content cannot be empty.")
        return value


class CommentSerializer(serializers.ModelSerializer):
    posted_by = UserSerializer(read_only=True)
    replied_to = serializers.PrimaryKeyRelatedField(
        queryset=Comment.objects.all(), required=False)
    replies = serializers.SerializerMethodField()

    class Meta:
        model = Comment
        fields = ["id", "content", "posted_by",
                  "date", "replied_to", "edited", "replies"]

    def get_replies(self, obj):
        replies = Comment.objects.filter(replied_to=obj)
        return CommentSerializer(replies, many=True).data

    def to_representation(self, instance):
        rep = super().to_representation(instance)
        if instance.is_deleted:
            rep["content"] = "[deleted]"
            rep["posted_by"] = None
        return rep

    def to_representation(self, instance):
        rep = super().to_representation(instance)
        if instance.is_deleted:
            rep["content"] = "[deleted]"
            rep["posted_by"] = None
        return rep


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
        fields = ['name', 'details']

    def create(self, validated_data):
        # Get the current user from context
        print(validated_data)
        request = self.context.get('request')
        user = getattr(request, 'user', None)
        # Fallback in case context not set
        if user is None or not user.is_authenticated:
            raise serializers.ValidationError(
                'Authentication credentials were not provided.')

        # Generate a unique, URL-safe join code
        join_id = secrets.token_urlsafe(6)
        while Classroom.objects.filter(join_id=join_id).exists():
            join_id = secrets.token_urlsafe(6)

        # Create the classroom instance
        classroom = Classroom.objects.create(
            name=validated_data['name'],
            join_id=join_id,
            details=validated_data['details'] if 'details' in validated_data else ""
        )
        # Add the creator as a teacher
        classroom.teachers.add(user)

        return classroom


class ClassroomSerializer(serializers.ModelSerializer):
    teachers = UserSerializer(many=True, read_only=True)
    students = UserSerializer(many=True, read_only=True)
    stream = MaterialSerializer(many=True, read_only=True)
    units = UnitSerializer(many=True, read_only=True)

    class Meta:
        model = Classroom
        fields = [
            "id",
            "name",
            "join_id",
            "details",
            "teachers",
            "students",
            "stream",
            "units",
        ]
