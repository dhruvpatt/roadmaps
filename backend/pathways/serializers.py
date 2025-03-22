# serializers.py

from rest_framework import serializers
from .models import User, Roadmap, Chapter, Question, Quiz, Module, Content, Message, Classroom, Subject


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'email', 'role', 'preferences']
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        user = User(**validated_data)
        if password:
            user.set_password(password)
        user.save()
        return user


class ContentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Content
        fields = ['id', 'type', 'content', 'module']


class MessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = ['id', 'type', 'content', 'module', 'timestamp']


class QuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Question
        fields = ['id', 'question', 'solution', 'type']


class QuizSerializer(serializers.ModelSerializer):
    questions = QuestionSerializer(many=True, read_only=True)

    class Meta:
        model = Quiz
        fields = ['id', 'questions', 'scores', 'failed_questions', 'user']


class ModuleSerializer(serializers.ModelSerializer):
    contents = ContentSerializer(many=True, read_only=True)
    chat_history = MessageSerializer(many=True, read_only=True)

    class Meta:
        model = Module
        fields = ['id', 'name', 'chapter', 'prerequisite', 'contents', 'yt_video',
                  'practice', 'status', 'next_modules', 'learning_goals',
                  'feedback', 'chat_history']


class ChapterSerializer(serializers.ModelSerializer):
    modules = ModuleSerializer(many=True, read_only=True)

    class Meta:
        model = Chapter
        fields = ['id', 'name', 'roadmap', 'status', 'next_chapters', 'modules']


class RoadmapSerializer(serializers.ModelSerializer):
    chapters = ChapterSerializer(many=True, read_only=True)

    class Meta:
        model = Roadmap
        fields = ['id', 'owner', 'scaffold', 'mode', 'chapters']


class SubjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subject
        fields = ['id', 'classroom', 'topic', 'master_scaffold', 'progress', 'student_roadmap']


class ClassroomSerializer(serializers.ModelSerializer):
    subjects = SubjectSerializer(many=True, read_only=True)
    teachers = UserSerializer(many=True, read_only=True)
    students = UserSerializer(many=True, read_only=True)

    class Meta:
        model = Classroom
        fields = ['id', 'join_id', 'name', 'teachers', 'students', 'subjects']
