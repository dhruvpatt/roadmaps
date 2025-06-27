from django.db import models


class Deliverable(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey('pathways.User', on_delete=models.CASCADE, related_name='created_%(class)ss')
    assigned_to = models.ManyToManyField(
        'pathways.User',
        blank=True,
        related_name='%(class)s_assigned_to'
    )
    due_date = models.DateTimeField()
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    mandatory = models.BooleanField(default=True)
    points_possible = models.IntegerField(default=100)
    estimated_time = models.DurationField(null=True, blank=True)
    tags = models.JSONField(default=list, blank=True)
    handouts = models.ManyToManyField('pathways.Material', blank=True)
    classroom = models.ForeignKey(
        'pathways.Classroom',
        on_delete=models.CASCADE,
        related_name='%(class)ss'
    )
    is_published = models.BooleanField(default=True)
    updated_at = models.DateTimeField(auto_now=True)
    instructions = models.TextField(blank=True)
    
    class Meta:
        abstract = True

class Test(Deliverable):
    shuffle_questions = models.BooleanField(default=False)
    time_limit = models.DurationField(null=True, blank=True)
    show_correct_answers = models.BooleanField(default=False)
    number_of_questions = models.IntegerField(null=True, blank=True)
    attempts = models.IntegerField(default=1)

class Homework(Deliverable):
    pass

class CheckIn(Deliverable):
    max_responses = models.IntegerField(null=True, blank=True)

class Assignment(Deliverable):
    ASSIGNMENT_TYPES = (
        ('essay', 'Essay'),
        ('project', 'Project'),
        ('homework', 'Homework'),
    )

    assignment_type = models.CharField(max_length=20, choices=ASSIGNMENT_TYPES, default='homework')

class Question(models.Model):
    QUESTION_TYPES = (
        ('Multiple Choice', 'Multiple Choice'),
        ('Multiple Select', 'Multiple Select'),
        ('True/False', 'True/False'),
        ('Short Answer', 'Short Answer'),
        ('Essay', 'Essay'),
        ('Fill in the Blank', 'Fill in the Blank'),
        ('Matching', 'Matching'),
    )
    
    DIFFICULTY_LEVELS = (
        (1, 'Easy'),
        (2, 'Medium'),
        (3, 'Hard'),
    )
    
    test = models.ForeignKey(Test, on_delete=models.CASCADE, related_name='questions')
    type = models.CharField(max_length=50, choices=QUESTION_TYPES, default='Multiple Choice')
    prompt = models.TextField()
    options = models.JSONField(default=list, blank=True)  # For multiple choice options
    correct = models.JSONField(blank=True)  # Can be string or list for multiple answers
    difficulty = models.IntegerField(choices=DIFFICULTY_LEVELS, default=2)
    points = models.IntegerField(default=1)
    category = models.CharField(max_length=100, blank=True)
    explanation = models.TextField(blank=True)
    tags = models.JSONField(default=list, blank=True)
    order = models.IntegerField(default=0)  # For question ordering
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Additional fields for specific question types
    left_items = models.JSONField(default=list, blank=True)  # For matching questions
    right_items = models.JSONField(default=list, blank=True)  # For matching questions
    matches = models.JSONField(default=dict, blank=True)  # For matching question answers
    
    class Meta:
        ordering = ['order', 'created_at']

class UserSubmission(models.Model):
    submitted_by = models.ForeignKey('pathways.User', on_delete=models.CASCADE)
    submission = models.ManyToManyField('pathways.Material', blank=True)
    comments = models.ManyToManyField('pathways.Comment', blank=True)
    date_submitted = models.DateTimeField(auto_now_add=True)
    grade = models.IntegerField(null=True, blank=True)
    attempts = models.IntegerField(default=1)
    skipped = models.BooleanField(default=False)
    time_spent = models.DurationField(null=True, blank=True)
    late = models.BooleanField(default=False)
    started_at = models.DateTimeField(null=True, blank=True)

