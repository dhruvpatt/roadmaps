from rest_framework import serializers
from django.contrib.auth import get_user_model
from pathways.models import Attendance, MissedDeliverable, Classroom

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    role = serializers.ChoiceField(choices=[("student", "student"), ("teacher", "teacher")])

    class Meta:
        model = User
        fields = [
            "id", "username", "email", "first_name", "last_name",
            "password", "grade", "age", "role"
        ]

    def create(self, validated_data):
        password = validated_data.pop("password")
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


class MissedDeliverableSerializer(serializers.ModelSerializer):
    deliverable_repr = serializers.SerializerMethodField()

    class Meta:
        model = MissedDeliverable
        fields = ["id", "deliverable_repr", "content_type", "object_id"]

    def get_deliverable_repr(self, obj):
        return str(obj.deliverable)

class AttendanceSerializer(serializers.ModelSerializer):
    student = UserSerializer(read_only=True)
    classroom = serializers.PrimaryKeyRelatedField(queryset=Classroom.objects.all())
    missed_items = MissedDeliverableSerializer(many=True, read_only=True)

    class Meta:
        model = Attendance
        fields = ["id", "student", "classroom", "status", "date", "missed_items"]
