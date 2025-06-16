from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DefaultUserAdmin
from django.contrib.contenttypes.admin import GenericTabularInline
from .models.user import User, Attendance, MissedDeliverable
from .models import (
    Classroom, Unit, Week, Material,
    Test, Homework, CheckIn, Resource,
    Question, Comment
)

# —— User admin —— #
@admin.register(User)
class CustomUserAdmin(DefaultUserAdmin):
    model = User
    list_display = (
        'username', 'email', 'first_name', 'last_name', 'id',
        'role', 'grade', 'age', 'is_staff', 'is_active'
    )
    list_filter = ('role', 'is_staff', 'is_superuser', 'is_active')
    search_fields = ('username', 'email', 'first_name', 'last_name')
    ordering = ('username',)
    fieldsets = DefaultUserAdmin.fieldsets + (
        (None, {'fields': ('role', 'grade', 'age')}),
    )
    add_fieldsets = DefaultUserAdmin.add_fieldsets + (
        (None, {'fields': ('role', 'grade', 'age')}),
    )

# —— Inline for generic “missed deliverables” —— #
class MissedDeliverableInline(GenericTabularInline):
    model = MissedDeliverable
    ct_field = 'content_type'
    ct_fk_field = 'object_id'
    extra = 0
    verbose_name = "Missed Deliverable"
    verbose_name_plural = "Missed Deliverables"

# —— Attendance admin —— #
@admin.register(Attendance)
class AttendanceAdmin(admin.ModelAdmin):
    list_display = ('student', 'status', 'date', 'missed_count')
    list_filter = ('status', 'date')
    search_fields = ('student__username', 'student__email')
    inlines = [MissedDeliverableInline]

    def missed_count(self, obj):
        return obj.missed_items.count()
    missed_count.short_description = 'Missed Items'

# —— MissedDeliverable admin —— #
@admin.register(MissedDeliverable)
class MissedDeliverableAdmin(admin.ModelAdmin):
    list_display = ('attendance', 'content_type', 'object_id', 'deliverable')
    list_filter = ('content_type',)
    search_fields = ('attendance__student__username',)


# —— Admin for all core models —— #

@admin.register(Classroom)
class ClassroomAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'join_id', 'details')
    search_fields = ('name', 'join_id')


@admin.register(Unit)
class UnitAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'classroom', 'description')
    search_fields = ('name', 'classroom__name')


@admin.register(Week)
class WeekAdmin(admin.ModelAdmin):
    list_display = ('id', 'unit', 'learning_goal')
    search_fields = ('unit__name', 'learning_goal')


@admin.register(Material)
class MaterialAdmin(admin.ModelAdmin):
    list_display = ('id', 'display_types', 'title', 'created_by', 'likes')
    search_fields = ('title', 'created_by__username')

    def display_types(self, obj):
        return ", ".join([t.label for t in obj.types.all()])
    display_types.short_description = "Types"


@admin.register(Test)
class TestAdmin(admin.ModelAdmin):
    list_display = ('id', 'title', 'type', 'mandatory', 'out_of', 'shuffle_questions', 'time_limit')
    search_fields = ('title',)
    filter_horizontal = ('assigned_to', 'handouts')


@admin.register(Homework)
class HomeworkAdmin(admin.ModelAdmin):
    list_display = ('id', 'title', 'type', 'mandatory', 'out_of')
    search_fields = ('title',)
    filter_horizontal = ('assigned_to', 'handouts')


@admin.register(CheckIn)
class CheckInAdmin(admin.ModelAdmin):
    list_display = ('id', 'title', 'type', 'max_responses')
    search_fields = ('title',)
    filter_horizontal = ('assigned_to', 'handouts')


@admin.register(Resource)
class ResourceAdmin(admin.ModelAdmin):
    list_display = ('id', 'title', 'type', 'mandatory')
    search_fields = ('title',)
    filter_horizontal = ('handouts',)


@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = ('id', 'content', 'type', 'points', 'difficulty', 'first_correct_attempt')
    search_fields = ('content', 'tags')


@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ('id', 'content', 'posted_by', 'date', 'replied_to')
    search_fields = ('content', 'posted_by__username')
