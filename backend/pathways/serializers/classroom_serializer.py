import secrets
from rest_framework import serializers
from pathways.models import Material, Unit, Week, Comment, Classroom, MaterialType, AssignmentSubmission, ALLOWED_MATERIAL_TYPES
from pathways.serializers.user_serializer import UserSerializer
from pathways.serializers.analytics_serializer import AnalyticsSerializer
from pathways.serializers.deliverable_serializer import AssignmentSerializer

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
            "id", "types", "type_keys", "title", "created_by",
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

    def get_assignments(self, obj):
        from pathways.serializers.deliverable_serializer import AssignmentSerializer
        return AssignmentSerializer(obj.assignments.all(), many=True).data
    def validate(self, data):
        title = data.get('title', '') or getattr(self.instance, 'title', '')
        content = data.get('content', []) or getattr(self.instance, 'content', [])

        has_title = bool(title.strip())
        has_content = bool(content)

        # Allowed material types
        allowed_types = dict(ALLOWED_MATERIAL_TYPES).keys()

        # Validate content types
        for item in content:
            item_type = item.get("type")
            if item_type not in allowed_types:
                raise serializers.ValidationError(
                    f"Unsupported content type '{item_type}'. Allowed types: {', '.join(allowed_types)}."
                )

        # Enforce: title XOR announcement
        has_announcement = any(item.get("type") == "announcement" for item in content)
        if has_title and has_announcement:
            raise serializers.ValidationError("Material cannot have both a title and an announcement.")

        # Enforce: at least one of title or content
        if not has_title and not has_content:
            raise serializers.ValidationError("Material must have at least a title or a content item.")

        # Enforce: only one announcement allowed
        if sum(1 for item in content if item.get("type") == "announcement") > 1:
            raise serializers.ValidationError("Only one announcement is allowed per material.")

        # Enforce: only one general allowed
        if sum(1 for item in content if item.get("type") == "general") > 1:
            raise serializers.ValidationError("Only one general content item is allowed per material.")

        return data


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



class ClassroomSerializer(serializers.ModelSerializer):
    teachers = UserSerializer(many=True, read_only=True)
    students = UserSerializer(many=True, read_only=True)
    units = UnitSerializer(many=True, read_only=True)
    materials = MaterialSerializer(many=True, read_only=True)
    assignments = serializers.SerializerMethodField()

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
        
    def get_assignments(self, obj):
        return AssignmentSerializer(obj.assignments.all(), many=True).data