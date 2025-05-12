# urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from pathways.views.analytics_views import StudentAnalyticsAPIView, TeacherAnalyticsAPIView
from pathways.views.user_views import user_list, user_classrooms, create_user, update_user, user_detail, user_roadmaps, login_with_email, student_list, update_preferences
from pathways.views.roadmap_views import roadmap_list, roadmap_detail, roadmap_chapters
from pathways.views.classroom_views import get_user_classrooms, get_classroom
from pathways.roadmaps_views import RoadmapGenerationAPIView, get_all_roadmaps, get_roadmap_by_id, update_roadmap, \
    delete_roadmap, get_all_subjects, get_subject_by_id, create_subject, update_subject, delete_subject, \
    get_all_chapters, get_chapter_by_id, create_chapter, update_chapter, delete_chapter, get_user_roadmaps, publish_roadmap_to_classroom
from pathways.module_gen import ModuleContentGenerationAPIView, ModuleAssistantAPIView, get_module, create_lecture_materials, update_module_video
from pathways.quiz_gen import QuizGenerationAPIView, QuizEvaluationAPIView, get_quiz_results
from pathways.classroom_views import classroom_analytics, classroom_student_details, join_classroom_as_student, \
    join_classroom_as_teacher, create_classroom, student_classroom_analytics
from pathways.views.module_views import mark_module_completed
from pathways.views.roadmap_views import assign_roadmap_to_user

from django.contrib import admin

router = DefaultRouter()

urlpatterns = [
    # ViewSet URLs
    path('admin/', admin.site.urls),
    path('generate-roadmap/', RoadmapGenerationAPIView.as_view(), name='generate-roadmap'),
    path('generate-module/', ModuleContentGenerationAPIView.as_view(), name='generate-module'),
    path('module-assistant/', ModuleAssistantAPIView.as_view(), name='module-assistant'),
    path('api/get-module/', get_module),
    path('api/update-module-video/', update_module_video),
    path('api/create-lecture-materials/', create_lecture_materials),

    path('api/gen-quiz/', QuizGenerationAPIView.as_view(), name='generate-quiz'),
    path('api/evaluate-quiz/', QuizEvaluationAPIView.as_view(), name='evaluate-quiz'),
    path('api/get-quiz-results/<int:quiz_id>/', get_quiz_results),
    path('api/student-analytics/<int:user_id>/', StudentAnalyticsAPIView.as_view(), name='get-student-analytics'),
    path('api/teacher-analytics/<int:user_id>/', TeacherAnalyticsAPIView.as_view(), name='get-teacher-analytics'),

    # Function-based view URLs
    path('api/users/', user_list, name='user-list'),
    path('api/create-user/', create_user, name='create-user'),
    path('api/update-user/<int:pk>', update_user, name='update-user'),
    path('api/users/<int:pk>/', user_detail, name='user-detail'),
    path('api/users/<int:pk>/roadmaps/', user_roadmaps, name='user-roadmaps'),
    path('api/users/<int:pk>/classrooms/', user_classrooms, name='user-classrooms'),
    path('api/login-with-email/', login_with_email),
    path('api/get-all-students/', student_list, name='student-list'),


    path('api/roadmaps/', roadmap_list, name='roadmap-list'),
    path('api/roadmaps/<int:pk>/', roadmap_detail, name='roadmap-detail'),
    path('api/roadmaps/<int:pk>/chapters/', roadmap_chapters, name='roadmap-chapters'),
    path('get-user-roadmaps/', get_user_roadmaps),
    path("publish-roadmap-to-classroom/", publish_roadmap_to_classroom),
    path("publish-roadmap/", assign_roadmap_to_user, name="publish-roadmap"),

    path("mark-module-completed/", mark_module_completed, name="mark-module-as-complete"),


    # Subject CRUD
    path('subjects/', get_all_subjects),
    path('subjects/<int:subject_id>/', get_subject_by_id),
    path('subjects/create/', create_subject),
    path('subjects/<int:subject_id>/update/', update_subject),
    path('subjects/<int:subject_id>/delete/', delete_subject),

    # Chapter CRUD
    path('chapters/', get_all_chapters),
    path('chapters/<int:chapter_id>/', get_chapter_by_id),
    path('chapters/create/', create_chapter),
    path('chapters/<int:chapter_id>/update/', update_chapter),
    path('chapters/<int:chapter_id>/delete/', delete_chapter),

    # Classroom endpoints
    path('classroom/create/', create_classroom),
    path('classroom/join/student/', join_classroom_as_student),
    path('classroom/join/teacher/', join_classroom_as_teacher),
    path('classroom/<int:classroom_id>/analytics/', classroom_analytics),
    path('classroom/<int:classroom_id>/students/', classroom_student_details),
    path('student-classroom-analytics/', student_classroom_analytics),
    path("get-user-classrooms/", get_user_classrooms, name="get-user-classrooms"),
    path("get-classroom/", get_classroom, name="get-classroom"),

    path("update-preferences/", update_preferences, name="update-preferences"),

]
