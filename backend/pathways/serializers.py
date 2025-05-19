# serializers.py

from rest_framework import serializers
from pathways.models import User, Pathway, Chapter, Question, Quiz, Module, Content, Message, Classroom, Subject


class QueryRequestSerializer(serializers.Serializer):
    # Topic of the lesson
    topic = serializers.CharField(max_length=255, required=True)
    title = serializers.CharField(max_length=255, required=True)
    # Learning goals for the lesson
    learning_goals = serializers.ListField(
        child=serializers.CharField(max_length=255),
        required=True
    )

    # Grade level of the students
    grade = serializers.ChoiceField(
        choices=[
            ('K', 'Kindergarten'),
            ('1', '1st Grade'),
            ('2', '2nd Grade'),
            ('3', '3rd Grade'),
            ('4', '4th Grade'),
            ('5', '5th Grade'),
            ('6', '6th Grade'),
            ('7', '7th Grade'),
            ('8', '8th Grade'),
            ('9', '9th Grade'),
            ('10', '10th Grade'),
            ('11', '11th Grade'),
            ('12', '12th Grade')
        ], )
    # Mode (STRICT or CASUAL)
    mode = serializers.ChoiceField(choices=['STRICT', 'CASUAL'], required=True)
    userid = serializers.IntegerField()
    details = serializers.CharField(max_length=1000, allow_blank=True, required=False)
    chapters = serializers.CharField(max_length=1000)
    published = serializers.BooleanField(default=False)
    classroom = serializers.CharField(required=False, allow_null=True, default="")
    # Optional: Add other fields if necessary
    # For example, you can include additional optional parameters here

    def validate(self, data):
        """
        Custom validation if needed. For example:
        - Check if the learning goals match the grade level
        - Ensure that mode and learning goals are consistent
        """
        topic = data.get("topic")
        learning_goals = data.get("learning_goals")
        grade = data.get("grade")
        mode = data.get("mode")
        userid = data.get("userId")

        return data


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'first_name', 'last_name', 'email', 'role', 'preferences', 'password']
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        user = User(**validated_data)
        if password:
            user.password = password
        user.save()
        return user


class ContentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Content
        fields = [
            'id',
            'module',
            'type',
            'block_type',
            'content',
            'transition_text',
            'styling',
        ]

class MessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = ['id', 'type', 'content', 'module', 'timestamp']

class QuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Question
        fields = ['id', 'question', 'solution', 'type', 'answer']

class QuizSerializer(serializers.ModelSerializer):
    questions = QuestionSerializer(many=True, read_only=True)
    failed_questions = QuestionSerializer(many=True, read_only=True)

    class Meta:
        model = Quiz
        fields = ['id', 'questions', 'scores', 'failed_questions', 'user']

class ModuleSerializer(serializers.ModelSerializer):
    contents = ContentSerializer(source='content_list', many=True, read_only=True)
    chat_history = MessageSerializer(many=True, read_only=True)
    prerequisites = serializers.PrimaryKeyRelatedField(many=True, read_only=True)
    next_modules = serializers.PrimaryKeyRelatedField(many=True, read_only=True)
    class Meta:
        model = Module
        fields = [
            'id', 'name', 'chapter', 'prerequisites', 'contents', 'yt_video',
            'practice', 'status', 'next_modules', 'learning_goals',
            'feedback', 'chat_history'
        ]

class ChapterSerializer(serializers.ModelSerializer):
    modules = ModuleSerializer(many=True, read_only=True)
    next_chapters = serializers.PrimaryKeyRelatedField(many=True, read_only=True)

    class Meta:
        model = Chapter
        fields = ['id', 'name', 'pathway', 'status', 'next_chapters', 'modules']

class PathwaySerializer(serializers.ModelSerializer):
    chapters = ChapterSerializer(many=True, read_only=True)

    class Meta:
        model = Pathway
        fields = [
            'id', 'owner', 'title', 'details', 'mode', 'grade',
            'learning_goals', 'progress', 'chapters', 'published', "classroom"
        ]

class SubjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subject
        fields = ['id', 'classroom', 'topic', 'master_scaffold', 'progress', 'student_pathway']

class ClassroomSerializer(serializers.ModelSerializer):
    subjects = SubjectSerializer(many=True, read_only=True)

    class Meta:
        model = Classroom
        fields = ['id', 'join_id', 'name', 'teachers', 'students', 'subjects']


class StudentSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'first_name', 'last_name', 'email', 'role']

class SubjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subject
        fields = ['id', 'topic', 'master_scaffold', 'progress', 'student_pathway']

class ClassroomDetailSerializer(serializers.ModelSerializer):
    students = StudentSerializer(many=True, read_only=True)
    subjects = SubjectSerializer(many=True, read_only=True)

    class Meta:
        model = Classroom
        fields = ['id', 'name', 'join_id', 'students', 'subjects']

