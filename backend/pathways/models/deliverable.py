from django.db import models
from pathways.models import User


class Deliverable(models.Model):
    TYPE_CHOICES = [
        ("homework", "Homework"),
        ("test", "Test"),
        ("checkin", "Check-in"),
        ("resource", "Resource"),
    ]
    
    type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    created_at = models.DateTimeField(auto_now_add=True)
    due_at = models.DateTimeField(null=True, blank=True)
    assigned_to = models.ManyToManyField(User, blank=True)
    title = models.CharField(max_length=255)
    details = models.TextField(blank=True)
    mandatory = models.BooleanField(default=True)
    out_of = models.IntegerField(null=True, blank=True)
    estimated_time = models.DurationField(null=True, blank=True)
    number_of_questions = models.IntegerField(null=True, blank=True)
    tags = models.JSONField(default=list, blank=True)  # str[]
    handouts = models.ManyToManyField('Material', blank=True)
    
    class Meta:
        abstract = True

class Test(Deliverable):
    shuffle_questions = models.BooleanField(default=False)
    time_limit = models.DurationField(null=True, blank=True)
    show_correct_answers = models.BooleanField(default=False)

class Homework(Deliverable):
    pass

class CheckIn(Deliverable):
    max_responses = models.IntegerField(null=True, blank=True)

class Resource(Deliverable):
    # Overrides: no submission, grade, out_of, due_at
    pass

class Question(models.Model):
    content = models.TextField()
    options = models.JSONField(default=list, blank=True)  # Optional for MCQs
    solution = models.TextField()
    explanation = models.TextField(blank=True)
    points = models.IntegerField(default=1)
    attempt_count = models.IntegerField(default=0)
    skipped = models.BooleanField(default=False)
    tags = models.JSONField(default=list, blank=True)
    first_correct_attempt = models.BooleanField(default=False)
    type = models.CharField(max_length=50)
    learning_goal = models.TextField(blank=True)
    background = models.JSONField(default=list, blank=True)  # str[]
    time_spent = models.DurationField(null=True, blank=True)
    difficulty = models.IntegerField()  # 1 = easy, 2 = medium, 3 = hard

class UserSubmission(models.Model):
    submitted_by = models.ForeignKey(User, on_delete=models.CASCADE)
    submission = models.ManyToManyField('Material', blank=True)
    comments = models.ManyToManyField('Comment', blank=True)
    date_submitted = models.DateTimeField(auto_now_add=True)
    grade = models.IntegerField(null=True, blank=True)
    attempts = models.IntegerField(default=1)
    skipped = models.BooleanField(default=False)
    time_spent = models.DurationField(null=True, blank=True)
    late = models.BooleanField(default=False)
    started_at = models.DateTimeField(null=True, blank=True)

