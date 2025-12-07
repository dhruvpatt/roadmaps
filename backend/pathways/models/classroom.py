# models/classroom.py
from django.db import models
from pathways.models.organization import Organization

ALLOWED_MATERIAL_TYPES = (
    ("file", "File"),
    ("link", "Link"),
    ("announcement", "Announcement"),
    ("general", "General"),
)

class MaterialType(models.Model):
    key = models.CharField(max_length=20, unique=True, choices=ALLOWED_MATERIAL_TYPES)
    label = models.CharField(max_length=50)

    def __str__(self):
        return self.label

    class Meta:
        verbose_name = "Material Type"
        verbose_name_plural = "Material Types"

class MaterialView(models.Model):
    user = models.ForeignKey('pathways.User', on_delete=models.CASCADE)
    material = models.ForeignKey('Material', on_delete=models.CASCADE)
    time_viewed = models.DurationField(null=True, blank=True)
    last_viewed = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ("user", "material")

class Material(models.Model):
    types = models.ManyToManyField(MaterialType, related_name="materials")
    title = models.CharField(max_length=1000, null=True, blank=True)
    created_by = models.ForeignKey('pathways.User', on_delete=models.CASCADE)
    content = models.JSONField(blank=True, null=True)
    likes = models.IntegerField(default=0)
    viewed_by = models.ManyToManyField(
        'pathways.User',
        through='MaterialView',
        related_name='viewed_materials',
        blank=True
    )
    classroom = models.ForeignKey('Classroom', on_delete=models.CASCADE, related_name="materials", null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

class Classroom(models.Model):
    organization = models.ForeignKey(
        Organization, 
        on_delete=models.CASCADE,
        related_name="classrooms"
    )
    name = models.CharField(max_length=255)
    join_id = models.CharField(max_length=20, unique=True)
    students = models.ManyToManyField('pathways.User', related_name='joined_classrooms', blank=True)
    teachers = models.ManyToManyField('pathways.User', related_name='teaching_classrooms', blank=True)
    details = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
class Unit(models.Model):
    name = models.CharField(max_length=255)
    classroom = models.ForeignKey(Classroom, on_delete=models.CASCADE, related_name='units')
    description = models.TextField(blank=True)
    analytics = models.OneToOneField("pathways.Analytics", on_delete=models.CASCADE, null=True, blank=True)
    student_analytics = models.ManyToManyField("pathways.Analytics", related_name='unit_student_analytics', blank=True)

class Week(models.Model):
    unit = models.ForeignKey(Unit, on_delete=models.CASCADE, related_name='weeks')
    learning_goal = models.TextField(blank=True)
    analytics = models.OneToOneField("pathways.Analytics", on_delete=models.CASCADE, null=True, blank=True)
    student_analytics = models.ManyToManyField("pathways.Analytics", related_name='week_student_analytics', blank=True)
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    materials = models.ManyToManyField('Material', related_name='weeks', blank=True)
    tests = models.ManyToManyField('Test', related_name='weeks', blank=True)
    assignments = models.ManyToManyField('Assignment', related_name='weeks', blank=True)


    def __str__(self):
        return f"Week {self.pk} ({self.start_date} - {self.end_date})"




class AssignmentSubmission(models.Model):
    STATUS_CHOICES = (
        ('submitted', 'Submitted'),
        ('graded', 'Graded'),
        ('late', 'Late'),
        ('missing', 'Missing'),
    )
    
    assignment = models.ForeignKey('pathways.Assignment', on_delete=models.CASCADE, related_name='submissions')
    student = models.ForeignKey("pathways.User", on_delete=models.CASCADE)
    content = models.JSONField(blank=True, null=True)
    submitted_at = models.DateTimeField(auto_now_add=True)
    grade = models.FloatField(null=True, blank=True)
    feedback = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='submitted')
    
    class Meta:
        unique_together = ('assignment', 'student')

class Comment(models.Model):
    content = models.TextField(null=True, blank=True)
    posted_by = models.ForeignKey("pathways.User", on_delete=models.CASCADE)
    material = models.ForeignKey(Material, on_delete=models.CASCADE, related_name='comments', null=True, blank=True)
    date = models.DateTimeField(auto_now_add=True)
    replied_to = models.ForeignKey('self', null=True, blank=True, on_delete=models.CASCADE)
    is_deleted = models.BooleanField(default=False)
    edited = models.BooleanField(default=False) 

