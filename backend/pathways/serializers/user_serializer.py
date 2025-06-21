# serializers.py
from rest_framework import serializers
from django.contrib.auth import get_user_model
from pathways.models.user import User, MissedDeliverable, Session, Attendance

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

class MissedDeliverableSerializer(serializers.ModelSerializer):
    deliverable_repr = serializers.SerializerMethodField()

    class Meta:
        model = MissedDeliverable
        fields = ["id", "deliverable_repr", "content_type", "object_id"]

    def get_deliverable_repr(self, obj):
        return str(obj.deliverable)
# serializers/user_serializer.py
class SessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Session
        fields = ['id', 'date', 'topic', 'classroom']
        read_only_fields = ['id']


    def create(self, validated_data):
        # Handle classroom assignment if passed as ID
        return super().create(validated_data)

class AttendanceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Attendance
        fields = ('id', 'student', 'session', 'status')