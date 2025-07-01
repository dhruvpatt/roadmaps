from django.db import models
from django.conf import settings

class Organization(models.Model):
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=12, unique=True)
    owner = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        related_name="owned_organization",
        null=True,
        blank=True,
        on_delete=models.SET_NULL
    )
    admins = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name="admin_organizations",
        blank=True
    )
    teachers = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name="teacher_organizations",
        blank=True
    )
    students = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name="student_organizations",
        blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True)


    def __str__(self):
        return self.name
