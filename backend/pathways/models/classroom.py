# models/classroom.py
from django.db import models
from pathways.models import User, Analytics

class Material(models.Model):
    TYPE_CHOICES = [
        ("file", "File"),
        ("url", "URL"),
        ("announcement", "Announcement"),
        ("general", "General"),
    ]
    type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    title = models.CharField(max_length=255)
    details = models.TextField(blank=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
    content = models.JSONField(blank=True, null=True)
    likes = models.IntegerField(default=0)
    viewed_by = models.ManyToManyField(User, related_name='viewed_materials', blank=True)
    time_viewed = models.DurationField(null=True, blank=True)
    last_viewed = models.DateTimeField(null=True, blank=True)

class Classroom(models.Model):
    name = models.CharField(max_length=255)
    stream = models.ManyToManyField(Material, blank=True)
    analytics = models.OneToOneField(Analytics, on_delete=models.CASCADE, null=True, blank=True)
    join_id = models.CharField(max_length=20, unique=True)
    students = models.ManyToManyField(User, related_name='joined_classrooms', blank=True)
    teachers = models.ManyToManyField(User, related_name='teaching_classrooms', blank=True)
    
class Unit(models.Model):
    name = models.CharField(max_length=255)
    classroom = models.ForeignKey(Classroom, on_delete=models.CASCADE, related_name='units')
    description = models.TextField(blank=True)
    analytics = models.OneToOneField(Analytics, on_delete=models.CASCADE, null=True, blank=True)
    student_analytics = models.ManyToManyField(Analytics, related_name='unit_student_analytics', blank=True)

class Week(models.Model):
    unit = models.ForeignKey(Unit, on_delete=models.CASCADE, related_name='weeks')
    learning_goal = models.TextField(blank=True)
    analytics = models.OneToOneField(Analytics, on_delete=models.CASCADE, null=True, blank=True)
    student_analytics = models.ManyToManyField(Analytics, related_name='week_student_analytics', blank=True)

class Comment(models.Model):
    content = models.TextField()
    posted_by = models.ForeignKey(User, on_delete=models.CASCADE)
    date = models.DateTimeField(auto_now_add=True)
    replied_to = models.ForeignKey('self', null=True, blank=True, on_delete=models.CASCADE)
