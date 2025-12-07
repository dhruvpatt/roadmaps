from django.db import models
from django.db.models import JSONField            # ✅ still fine to import

class DifficultyBreakdown(models.Model):
    count = models.IntegerField()
    accuracy = models.FloatField()

class ProgressEntry(models.Model):
    week = models.IntegerField()
    grade = models.FloatField()
    engagement_score = models.IntegerField()

class Analytics(models.Model):
    student = models.ForeignKey(
        'pathways.User',
        on_delete=models.CASCADE,
        related_name='analytics_rows',
        null=True, blank=True
    )
    classroom = models.ForeignKey('pathways.Classroom', on_delete=models.CASCADE)

    average_grade              = models.FloatField(null=True, blank=True)
    completion_rate            = models.FloatField(null=True, blank=True)
    accuracy_rate              = models.FloatField(null=True, blank=True)
    avg_score_per_question     = models.FloatField(null=True, blank=True)
    avg_score_per_deliverable  = models.FloatField(null=True, blank=True)
    avg_attempts_per_question  = models.FloatField(null=True, blank=True)
    skipped_questions          = models.IntegerField(null=True, blank=True)
    skipped_rate               = models.FloatField(null=True, blank=True)

    mastered_topics  = models.JSONField(blank=True, default=list)   # 🛠 fixed
    struggled_topics = models.JSONField(blank=True, default=list)   # 🛠 fixed

    easy   = models.OneToOneField(DifficultyBreakdown, on_delete=models.CASCADE, related_name='easy_for')
    medium = models.OneToOneField(DifficultyBreakdown, on_delete=models.CASCADE, related_name='medium_for')
    hard   = models.OneToOneField(DifficultyBreakdown, on_delete=models.CASCADE, related_name='hard_for')

    avg_time_spent           = models.DurationField(null=True, blank=True)
    avg_time_per_question    = models.DurationField(null=True, blank=True)
    avg_time_per_deliverable = models.DurationField(null=True, blank=True)
    engagement_score         = models.IntegerField(null=True, blank=True)
    lateness_rate            = models.FloatField(null=True, blank=True)
    active_days              = models.IntegerField(null=True, blank=True)
    last_active              = models.DateTimeField(null=True, blank=True)
    first_active             = models.DateTimeField(null=True, blank=True)
    learning_velocity        = models.FloatField(null=True, blank=True)
    retention_estimate       = models.FloatField(null=True, blank=True)
    procrastination_index    = models.FloatField(null=True, blank=True)
    consistency_score        = models.FloatField(null=True, blank=True)

    progress_over_time = models.JSONField(blank=True, null=True)
    teacher_feedback = models.JSONField(
        default=list,
        blank=True,
        null=True,
    )
