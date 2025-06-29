import secrets
from rest_framework import serializers
from pathways.models import Material, Unit, Week, Comment, Classroom, MaterialType, AssignmentSubmission, ALLOWED_MATERIAL_TYPES
from pathways.serializers.user_serializer import UserSerializer


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
