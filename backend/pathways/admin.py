from django.contrib import admin
from .models import User, Roadmap, Chapter, Question, Quiz, Module, Content, Message, Classroom, Subject
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

# Register User model with the custom admin interface
@admin.register(User)
class UserAdmin(BaseUserAdmin):
    model = User
    list_display = ('email', 'role')
    ordering = ('email',)

    fieldsets = (
        (None, {'fields': ('email', 'password', 'role', 'preferences')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
    )

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'password1', 'password2', 'role', 'preferences',)}
        ),
    )

    search_fields = ('email',)


# Register Roadmap model with custom admin interface
class RoadmapAdmin(admin.ModelAdmin):
    list_display = ('title', 'owner', 'mode', 'grade')
    search_fields = ('title', 'owner__username')
    list_filter = ('mode',)
    ordering = ('title',)

admin.site.register(Roadmap, RoadmapAdmin)


# Register Chapter model with custom admin interface
class ChapterAdmin(admin.ModelAdmin):
    list_display = ('name', 'roadmap', 'status')
    search_fields = ('name', 'roadmap__title')
    list_filter = ('status',)
    ordering = ('name',)

admin.site.register(Chapter, ChapterAdmin)


# Register Question model with custom admin interface
class QuestionAdmin(admin.ModelAdmin):
    list_display = ('question', 'type')
    search_fields = ('question',)
    list_filter = ('type',)
    ordering = ('question',)

admin.site.register(Question, QuestionAdmin)


# Register Quiz model with custom admin interface
class QuizAdmin(admin.ModelAdmin):
    list_display = ('user', 'id')
    search_fields = ('user__username',)
    ordering = ('user',)

admin.site.register(Quiz, QuizAdmin)


# Register Module model with custom admin interface
class ModuleAdmin(admin.ModelAdmin):
    list_display = ('name', 'chapter', 'status', 'owner', 'get_prerequisites')  # Fields to display in the list view
    search_fields = ('name', 'chapter__name', 'owner__username')  # Enable search by name, chapter name, and owner
    list_filter = ('status', 'chapter')  # Add filters for status and chapter
    filter_horizontal = ('prerequisites', 'next_modules')  # Allows for a more user-friendly many-to-many interface
    raw_id_fields = ('owner', 'chapter')  # Use a raw ID widget for better performance in large datasets
    ordering = ('chapter', 'name')  # Default ordering in the list view

    def get_prerequisites(self, obj):
        return ", ".join([p.name for p in obj.prerequisites.all()])
    get_prerequisites.short_description = 'Prerequisites'

admin.site.register(Module, ModuleAdmin)


# Register Content model with custom admin interface
class ContentAdmin(admin.ModelAdmin):
    list_display = ('get_type_display', 'module', 'content')
    search_fields = ('module__name',)
    list_filter = ('type',)
    ordering = ('module',)

admin.site.register(Content, ContentAdmin)


# Register Message model with custom admin interface
class MessageAdmin(admin.ModelAdmin):
    list_display = ('type', 'content', 'module', 'timestamp')
    search_fields = ('module__name', 'content')
    list_filter = ('type',)
    ordering = ('timestamp',)

admin.site.register(Message, MessageAdmin)


# Register Classroom model with custom admin interface
class ClassroomAdmin(admin.ModelAdmin):
    list_display = ('name', 'join_id')
    search_fields = ('name', 'join_id')
    ordering = ('name',)

admin.site.register(Classroom, ClassroomAdmin)


# Register Subject model with custom admin interface
class SubjectAdmin(admin.ModelAdmin):
    list_display = ('topic', 'classroom', 'progress')
    search_fields = ('topic', 'classroom__name')
    list_filter = ('progress',)
    ordering = ('topic',)

admin.site.register(Subject, SubjectAdmin)

