# admin.py
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DefaultUserAdmin
from django.contrib.contenttypes.admin import GenericTabularInline
from .models.user import User, Attendance, MissedDeliverable

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
    # add the extra fields into the default UserAdmin fieldsets:
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
