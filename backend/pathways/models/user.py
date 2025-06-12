# models/user.py
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.contrib.contenttypes.fields import GenericRelation, GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.core.validators import MinValueValidator, MaxValueValidator


class User(AbstractUser):
    ROLE_CHOICES = [
        ("student", "Student"),
        ("teacher", "Teacher"),
        ("organization_admin", "Organization Admin"),
        ("admin", "Admin"),
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


class Attendance(models.Model):
    STATUS_CHOICES = [
        ('present', 'Present'),
        ('late', 'Late'),
        ('absent', 'Absent'),
        ('excused', 'Excused'),
    ]

    student = models.ForeignKey(User, on_delete=models.CASCADE)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES)
    date = models.DateField()
    
    missed_items = GenericRelation(MissedDeliverable)
