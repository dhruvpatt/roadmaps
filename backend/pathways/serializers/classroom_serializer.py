import secrets
from rest_framework import serializers
from pathways.models import Material, Unit, Week, Comment, Classroom, MaterialType, ClassroomAssignment, AssignmentSubmission
from pathways.serializers.user_serializer import UserSerializer
from pathways.serializers.analytics_serializer import AnalyticsSerializer

class MaterialTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = MaterialType
        fields = ("key", "label")

class MaterialViewSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    class Meta:
        model = Material
        fields = ("user", "time_viewed", "last_viewed")

class MaterialSerializer(serializers.ModelSerializer):
    types = MaterialTypeSerializer(many=True, read_only=True)
    type_keys = serializers.SlugRelatedField(
        queryset=MaterialType.objects.all(),
        many=True,
        slug_field="key",
        write_only=True,
        source="types"
    )
    created_by = UserSerializer(read_only=True)
    comments = serializers.SerializerMethodField()
    viewed_by = serializers.SerializerMethodField()

    class Meta:
        model = Material
        fields = [
            "id", "types", "type_keys", "title", "details", "created_by",
            "content", "likes", "viewed_by", "comments", "created_at"
        ]

    def get_comments(self, obj):
        return CommentSerializer(obj.comments.all(), many=True).data

    def get_viewed_by(self, obj):
        return UserSerializer(obj.viewed_by.all(), many=True).data

    def create(self, validated_data):
        types = validated_data.pop('types', [])
        material = Material.objects.create(**validated_data)
        if types:
            material.types.set(types)
        return material

    def update(self, instance, validated_data):
        types = validated_data.pop('types', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if types is not None:
            instance.types.set(types)
        instance.save()
        return instance


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


class AssignmentSubmissionSerializer(serializers.ModelSerializer):
    student = UserSerializer(read_only=True)
    
    class Meta:
        model = AssignmentSubmission
        fields = ['id', 'assignment', 'student', 'content', 'submitted_at', 'grade', 'feedback', 'status']

class ClassroomAssignmentSerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)
    submissions = AssignmentSubmissionSerializer(many=True, read_only=True)
    submission_count = serializers.SerializerMethodField()
    
    class Meta:
        model = ClassroomAssignment
        fields = [
            'id', 'title', 'description', 'instructions', 'created_by', 'classroom',
            'due_date', 'points_possible', 'assignment_type', 'content', 'is_published',
            'created_at', 'updated_at', 'submissions', 'submission_count'
        ]
    
    def get_submission_count(self, obj):
        return obj.submissions.count()

class ClassroomSerializer(serializers.ModelSerializer):
    teachers = UserSerializer(many=True, read_only=True)
    students = UserSerializer(many=True, read_only=True)
    units = UnitSerializer(many=True, read_only=True)
    materials = MaterialSerializer(many=True, read_only=True)
    assignments = ClassroomAssignmentSerializer(many=True, read_only=True)

    class Meta:
        model = Classroom
        fields = [
            "id",
            "name",
            "join_id",
            "details",
            "teachers",
            "students",
            "materials",
            "assignments",
            "units",
        ]
