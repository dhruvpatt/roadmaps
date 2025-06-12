from rest_framework import serializers
from django.contrib.auth import get_user_model
from pathways.models import Attendance

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ["id", "username", "email", "first_name", "last_name", "password", "grade", "age", "role"]

    def create(self, validated_data):
        password = validated_data.pop("password")
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user

class AttendanceSerializer(serializers.ModelSerializer):
    student = UserSerializer(read_only=True)
    missed_deliverables = serializers.PrimaryKeyRelatedField(many=True, read_only=True)

    class Meta:
        model = Attendance
        fields = "__all__"
