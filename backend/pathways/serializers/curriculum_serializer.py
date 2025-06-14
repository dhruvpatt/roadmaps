# serializers.py
from rest_framework import serializers
from pathways.models.classroom import Classroom, Unit, Week, Material

class WeekSerializer(serializers.ModelSerializer):
    class Meta:
        model = Week
        fields = ['id', 'learning_goal', 'analytics', 'student_analytics']

class UnitSerializer(serializers.ModelSerializer):
    weeks = WeekSerializer(many=True, read_only=True)
    
    class Meta:
        model = Unit
        fields = ['id', 'name', 'description', 'weeks', 'analytics', 'student_analytics']

class MaterialSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    
    class Meta:
        model = Material
        fields = ['id', 'type', 'title', 'details', 'created_by', 'created_by_name', 
                  'content', 'likes', 'viewed_by', 'time_viewed', 'last_viewed']

class ClassroomDetailSerializer(serializers.ModelSerializer):
    units = UnitSerializer(many=True, read_only=True)
    stream = MaterialSerializer(many=True, read_only=True)
    teachers = serializers.StringRelatedField(many=True, read_only=True)
    students = serializers.StringRelatedField(many=True, read_only=True)
    student_count = serializers.SerializerMethodField()
    teacher_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Classroom
        fields = ['id', 'name', 'details', 'join_id', 'units', 'stream', 
                  'teachers', 'students', 'student_count', 'teacher_count', 'analytics']
    
    def get_student_count(self, obj):
        return obj.students.count()
    
    def get_teacher_count(self, obj):
        return obj.teachers.count()

class ClassroomSerializer(serializers.ModelSerializer):
    student_count = serializers.SerializerMethodField()
    teacher_count = serializers.SerializerMethodField()
    has_units = serializers.SerializerMethodField()
    
    class Meta:
        model = Classroom
        fields = ['id', 'name', 'details', 'join_id', 'student_count', 
                  'teacher_count', 'has_units']
    
    def get_student_count(self, obj):
        return obj.students.count()
    
    def get_teacher_count(self, obj):
        return obj.teachers.count()
    
    def get_has_units(self, obj):
        return obj.units.exists()