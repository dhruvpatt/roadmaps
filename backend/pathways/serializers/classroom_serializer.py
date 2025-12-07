import secrets
from rest_framework import serializers
from pathways.models import Material, Unit, Week, Comment, Classroom, MaterialType, AssignmentSubmission, ALLOWED_MATERIAL_TYPES
from pathways.serializers.user_serializer import UserSerializer
from pathways.serializers.deliverable_serializer import AssignmentSerializer
from pathways.serializers.curriculum_serializer import UnitSerializer
from pathways.serializers.material_serializer import MaterialSerializer


class CreateCommentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Comment
        fields = ['content', 'replied_to']

    def validate_content(self, value):
        if not value.strip():
            raise serializers.ValidationError(
                "Comment content cannot be empty.")
        return value


class UpdateCommentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Comment
        fields = ['content', 'replied_to', 'edited']
        read_only_fields = ['edited']

    def update(self, instance, validated_data):
        instance.content = validated_data.get('content', instance.content)
        replied_to = validated_data.get('replied_to', instance.replied_to)
        if replied_to and replied_to.material_id != instance.material_id:
            raise serializers.ValidationError(
                "Cannot reply to comment from another material.")
        instance.replied_to = replied_to
        instance.edited = True
        instance.save()
        return instance


class CommentSerializer(serializers.ModelSerializer):
    posted_by = UserSerializer(read_only=True)
    replied_to = serializers.PrimaryKeyRelatedField(
        queryset=Comment.objects.all(), required=False)
    replies = serializers.SerializerMethodField()

    class Meta:
        model = Comment
        fields = ["id", "content", "posted_by",
                  "date", "replied_to", "edited", "is_deleted", "replies"]

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
            organization=user.organization,
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
        fields = ['id', 'assignment', 'student', 'content',
                  'submitted_at', 'grade', 'feedback', 'status']


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
