from django.db import models
import uuid
from django.contrib.auth.models import AbstractUser, Group, Permission

class User(AbstractUser):
    TEACHER = 'teacher'
    STUDENT = 'student'
    ROLE_CHOICES = [
        (TEACHER, 'Teacher'),
        (STUDENT, 'Student'),
    ]
    email = models.EmailField(unique=True, blank=False)
    password = models.CharField(max_length=255)
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default=STUDENT)
    preferences = models.JSONField(blank=True, default=list)  # Use JSONField for compatibility with SQLite

    groups = models.ManyToManyField(
        Group,
        related_name="pathways_users",
        blank=True
    )
    user_permissions = models.ManyToManyField(
        Permission,
        related_name="pathways_user_permissions",
        blank=True
    )

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.get_role_display()})"


class Roadmap(models.Model):
    STRICT = 'strict'
    CASUAL = 'casual'
    MODE_CHOICES = [
        (STRICT, 'Strict'),
        (CASUAL, 'Casual'),
    ]

    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='roadmaps')
    details = models.TextField(max_length=10000)
    mode = models.CharField(max_length=10, choices=MODE_CHOICES, default=CASUAL)
    title = models.CharField(max_length=255)
    grade = models.CharField(max_length=255, default='Unspecified')
    learning_goals = models.JSONField(blank=True, default='list')
    def __str__(self):
        return f"Roadmap by {self.owner.username}"


class Chapter(models.Model):
    name = models.CharField(max_length=255)
    roadmap = models.ForeignKey(Roadmap, on_delete=models.CASCADE, related_name='chapters')
    status = models.CharField(max_length=50, default='not_started')
    next_chapters = models.ManyToManyField('self', blank=True, symmetrical=False, related_name='previous_chapters')

    def __str__(self):
        return self.name


class Question(models.Model):
    TEXT = 'text'
    MULTIPLE_CHOICE = 'multiple_choice'
    CODE = 'code'
    TYPE_CHOICES = [
        (TEXT, 'Text'),
        (MULTIPLE_CHOICE, 'Multiple Choice'),
        (CODE, 'Code'),
    ]

    question = models.TextField()
    solution = models.TextField()
    type = models.CharField(max_length=20, choices=TYPE_CHOICES)

    def __str__(self):
        return self.question[:50]


class Quiz(models.Model):
    questions = models.ManyToManyField(Question, related_name='quizzes')
    scores = models.JSONField(blank=True, default=list)  # Use JSONField for SQLite
    failed_questions = models.ManyToManyField(Question, related_name='failed_in_quizzes', blank=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='quizzes')

    def __str__(self):
        return f"Quiz for {self.user.username}"


class Module(models.Model):
    name = models.CharField(max_length=255)
    chapter = models.ForeignKey(Chapter, on_delete=models.CASCADE, related_name='modules')
    prerequisites = models.ManyToManyField('self', blank=True, symmetrical=False, related_name='dependent_modules')
    yt_video = models.URLField(blank=True, null=True)
    practice = models.ForeignKey(Quiz, on_delete=models.SET_NULL, null=True, blank=True, related_name='modules')
    status = models.CharField(max_length=50, default='not_started')
    next_modules = models.ManyToManyField('self', blank=True, symmetrical=False, related_name='previous_modules')
    learning_goals = models.JSONField(blank=True, default=list)  # Use JSONField for SQLite
    feedback = models.TextField(blank=True, null=True)
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='Module')
    content_list = models.ManyToManyField('Content', blank=True, related_name='modules')

    def __str__(self):
        return self.name


class Content(models.Model):
    CONTENT = 'content'
    HTML = 'html'
    VIDEO = 'video'
    TYPE_CHOICES = [
        (CONTENT, 'Content'),
        (HTML, 'HTML'),
        (VIDEO, 'Video'),
    ]

    type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    content = models.TextField()
    module = models.ForeignKey(Module, on_delete=models.CASCADE, related_name='contents')

    def __str__(self):
        return f"{self.get_type_display()} for {self.module.name}"


class Message(models.Model):
    USER = 'user'
    SYSTEM = 'system'
    TYPE_CHOICES = [
        (USER, 'User'),
        (SYSTEM, 'System'),
    ]

    type = models.CharField(max_length=10, choices=TYPE_CHOICES)
    content = models.TextField()
    module = models.ForeignKey(Module, on_delete=models.CASCADE, related_name='chat_history')
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.get_type_display()} message in {self.module.name}"


class Classroom(models.Model):
    join_id = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    name = models.CharField(max_length=255)
    teachers = models.ManyToManyField(User, related_name='teaching_classrooms')
    students = models.ManyToManyField(User, related_name='enrolled_classrooms')

    def __str__(self):
        return self.name


class Subject(models.Model):
    classroom = models.ForeignKey(Classroom, on_delete=models.CASCADE, related_name='subjects')
    topic = models.CharField(max_length=255)
    master_scaffold = models.TextField()
    progress = models.FloatField(default=0.0)
    student_roadmap = models.ForeignKey(Roadmap, on_delete=models.CASCADE, related_name='subjects')

    def __str__(self):
        return f"{self.topic} in {self.classroom.name}"

