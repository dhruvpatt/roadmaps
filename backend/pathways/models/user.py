# models/user.py
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.contrib.contenttypes.fields import GenericRelation, GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.core.validators import MinValueValidator, MaxValueValidator
from pathways.models.classroom import Classroom
import uuid
from django.utils import timezone
from datetime import timedelta


class User(AbstractUser):
    ROLE_CHOICES = [
        ("student", "Student"),
        ("teacher", "Teacher"),
        ("org_admin", "Organization Admin"),
        ("parent", "Parent"),
    ]

    email = models.EmailField(unique=True)
    grade = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(12)],
        blank=True, null=True
    )
    age = models.IntegerField(
        validators=[MinValueValidator(5), MaxValueValidator(120)],
        blank=True, null=True
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default="student")

    organization = models.ForeignKey(
        'Organization', 
        on_delete=models.CASCADE,
        related_name="users",
        null=True, blank=True
    )

    # Only used for students under 13
    parent = models.ForeignKey(
        "self",
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name="children"
    )

    pending_parent_approval = models.BooleanField(default=False)
    is_email_confirmed = models.BooleanField(default=False)



    # Parental consent field (if you want to track approval)
    parent_email = models.EmailField(blank=True, null=True)
    # (You can also add favorite_things as a JSONField or similar)
    favorite_things = models.JSONField(default=list, blank=True)

    USERNAME_FIELD = "username"
    REQUIRED_FIELDS = ["email", "first_name", "last_name"]

    def is_student(self):
        return self.role == "student"

    def is_teacher(self):
        return self.role == "teacher"

    def is_org_admin(self):
        return self.role == "org_admin"

    def is_parent(self):
        return self.role == "parent"

class ParentInvite(models.Model):
    student = models.OneToOneField(User, on_delete=models.CASCADE, related_name="parent_invite")
    parent_email = models.EmailField()
    invite_token = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    accepted = models.BooleanField(default=False)

class EmailConfirmationToken(models.Model):
    user = models.OneToOneField('pathways.User', on_delete=models.CASCADE, related_name="email_token")
    token = models.UUIDField(default=uuid.uuid4(), editable=False, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    is_used = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.user.email} - {self.token}"
    
    def is_expired(self):
        return self.created_at < timezone.now() - timedelta(hours=1)

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
