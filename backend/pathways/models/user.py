# models/user.py
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.contrib.contenttypes.fields import GenericRelation, GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.core.validators import MinValueValidator, MaxValueValidator
from pathways.models.classroom import Classroom


class User(AbstractUser):
    ROLE_CHOICES = [
        ("student", "Student"),
        ("teacher", "Teacher"),
        # ("organization_admin", "Organization Admin"),
        # ("admin", "Admin"),
    ]

    email = models.EmailField(unique=True)
    grade = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(12)],
        blank=True,
        null=True
    )
    age = models.IntegerField(
        validators=[MinValueValidator(5), MaxValueValidator(120)],
        blank=True,
        null=True
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default="student")

    USERNAME_FIELD = "username"
    REQUIRED_FIELDS = ["email", "first_name", "last_name"]

class MissedDeliverable(models.Model):
    attendance = models.ForeignKey('Attendance', on_delete=models.CASCADE, related_name='missed_items')

    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.PositiveIntegerField()
    deliverable = GenericForeignKey('content_type', 'object_id')


class Session(models.Model):
    classroom = models.ForeignKey(Classroom, on_delete=models.CASCADE, related_name="sessions")
    date = models.DateField(auto_now_add=False, default=None)
    topic = models.CharField(max_length=255, blank=True, null=True)

    def __str__(self):
        return f"{self.classroom.name} - {self.date} - {self.topic}"

class Attendance(models.Model):
    student = models.ForeignKey(User, on_delete=models.CASCADE)
    session = models.ForeignKey(Session, on_delete=models.CASCADE, related_name="attendance_records")
    status = models.CharField(max_length=10, choices=[
        ('present','Present'),
        ('late','Late'),
        ('absent','Absent'),
        ('excused','Excused'),
    ])
    
    missed_items = GenericRelation(MissedDeliverable)

    class Meta:
        unique_together = ('student', 'session')
