import secrets
from rest_framework import serializers
from pathways.models import Material, Unit, Week, Comment, Classroom, MaterialType, AssignmentSubmission, ALLOWED_MATERIAL_TYPES
from pathways.serializers.user_serializer import UserSerializer
from pathways.serializers.comment_serializer import CommentSerializer

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
        content = data.get('content', []) or getattr(
            self.instance, 'content', [])

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
        has_announcement = any(
            item.get("type") == "announcement" for item in content)
        if has_title and has_announcement:
            raise serializers.ValidationError(
                "Material cannot have both a title and an announcement.")

        # Enforce: at least one of title or content
        if not has_title and not has_content:
            raise serializers.ValidationError(
                "Material must have at least a title or a content item.")

        # Enforce: only one announcement allowed
        if sum(1 for item in content if item.get("type") == "announcement") > 1:
            raise serializers.ValidationError(
                "Only one announcement is allowed per material.")

        # Enforce: only one general allowed
        if sum(1 for item in content if item.get("type") == "general") > 1:
            raise serializers.ValidationError(
                "Only one general content item is allowed per material.")

        return data
