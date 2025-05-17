from django.db import models
from django.contrib.auth.models import Group, Permission, BaseUserManager, AbstractBaseUser
import random
import string
class CustomUserManager(BaseUserManager):
    def get_by_natural_key(self, email):
        return self.get(email=email)

    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("Email must be provided")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)
        return self.create_user(email, password, **extra_fields)

class User(AbstractBaseUser):
    TEACHER = 'teacher'
    STUDENT = 'student'
    ROLE_CHOICES = [
        (TEACHER, 'Teacher'),
        (STUDENT, 'Student'),
    ]
    username = None  # 🔥 Remove username field
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []  # No username required
    first_name = models.CharField(max_length=255)
    last_name = models.CharField(max_length=255)
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
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    is_superuser = models.BooleanField(default=False)
    objects = CustomUserManager()

    def has_perm(self, perm, obj=None):
        return self.is_superuser

    def has_module_perms(self, app_label):
        return self.is_superuser


def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.get_role_display()})"


class Pathway(models.Model):
    STRICT = 'strict'
    CASUAL = 'casual'
    MODE_CHOICES = [
        (STRICT, 'Strict'),
        (CASUAL, 'Casual'),
    ]

    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='pathways')
    classroom = models.ForeignKey('Classroom', on_delete=models.CASCADE, related_name='pathways', blank=True, null=True)
    details = models.CharField(max_length=10000, blank=True)
    mode = models.CharField(max_length=10, choices=MODE_CHOICES, default=CASUAL)
    title = models.CharField(max_length=255)
    grade = models.CharField(max_length=255, default='Unspecified')
    learning_goals = models.JSONField(blank=True, default=list)
    progress = models.IntegerField(default=0)
    published = models.BooleanField(default=False)
    def __str__(self):
        return f"Pathway by {self.owner.username}"


class Chapter(models.Model):
    name = models.CharField(max_length=255)
    pathway = models.ForeignKey(Pathway, on_delete=models.CASCADE, related_name='chapters')
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
    ]

    question = models.TextField()
    solution = models.TextField()
    type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    answer = models.CharField(max_length=1000, blank=True) # student inputted answer
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

def generate_join_id(length=6):
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=length))

class Classroom(models.Model):
    join_id = models.CharField(max_length=6, unique=True, default=generate_join_id)
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
    student_pathway = models.ForeignKey(Pathway, on_delete=models.CASCADE, related_name='subjects')

    def __str__(self):
        return f"{self.topic} in {self.classroom.name}"

