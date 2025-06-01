# urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from pathways.views.analytics_views import StudentAnalyticsAPIView, TeacherAnalyticsAPIView
from pathways.views.user_views import user_list, user_classrooms, create_user, update_user, user_detail, user_pathways, login_with_email, student_list, update_user_preferences

from pathways.views.classroom_views import classroom_detail, classroom_analytics, classroom_student_details, join_classroom_as_student, \
    join_classroom_as_teacher, student_classroom_analytics

from pathways.views.pathway_views import PathwayGenerationAPIView, \
    publish_pathway_to_classroom, pathway_detail, pathway_chapters, subject_detail

from pathways.views.chapter_views import chapter_detail

from pathways.module_gen import ModuleContentGenerationAPIView, ModuleAssistantAPIView, get_module, create_lecture_materials, update_module_video
from pathways.quiz_gen import QuizGenerationAPIView, QuizEvaluationAPIView, get_quiz_results
from pathways.views.module_views import mark_module_completed
from pathways.views.quiz_views import QuizDetailAPIView

from django.contrib import admin

router = DefaultRouter()

urlpatterns = [
    # ViewSet URLs
    path('admin/', admin.site.urls),
    path('', include(router.urls)),

    path('generate-pathway/', PathwayGenerationAPIView.as_view(), name='generate-pathway'),
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
    path('api/quizzes/<int:pk>/', QuizDetailAPIView.as_view(), name='quiz-detail'),

    # Function-based view URLs
    path('api/users/', user_list, name='user-list'),
    path('api/create-user/', create_user, name='create-user'),
    path('api/update-user/<int:pk>', update_user, name='update-user'),
    path("api/update-user-preferences/", update_user_preferences, name="update-user-preferences"),
    path('api/users/<int:pk>/', user_detail, name='user-detail'),
    path('api/users/<int:pk>/pathways/', user_pathways, name='user-pathways'),
    path('api/users/<int:pk>/classrooms/', user_classrooms, name='user-classrooms'),
    path('api/login-with-email/', login_with_email),
    path('api/get-all-students/', student_list, name='student-list'),


    # Pathway CRUD
    path('api/pathways', pathway_detail, name='pathway-list'),
    path('api/pathways/<int:pk>/', pathway_detail, name='pathway-detail'),
    path('api/pathways/<int:pk>/chapters/', pathway_chapters, name='pathway-chapters'),
    path('api/publish-pathway-to-classroom/', publish_pathway_to_classroom, name='publish-pathway-to-classroom'),


    # Subject CRUD
    path('api/subjects/', subject_detail, name='subject-list'),
    path('api/subjects/<int:subject_id>/', subject_detail, name='subject-detail'),

    # Chapter CRUD
    path('api/chapters/', chapter_detail, name='chapter-list'),
    path('api/chapters/<int:chapter_id>/', chapter_detail, name='chapter-detail'),

    # Classroom endpoints

    path('api/classrooms', classroom_detail, name='classroom-list'),
    path('api/classrooms/<int:pk>/', classroom_detail, name='classroom-detail'),

    path('api/classroom/join/student/', join_classroom_as_student, name='join-classroom-student'),
    path('api/classroom/join/teacher/', join_classroom_as_teacher, name='join-classroom-teacher'),
    
    path('api/classroom/<int:classroom_id>/analytics/', classroom_analytics, name='classroom-analytics'),
    path('api/student-classroom-analytics/', student_classroom_analytics, name='student-classroom-analytics'),

    path('api/classroom/<int:classroom_id>/students/', classroom_student_details, name='classroom-students'),
    path('api/mark-module-completed/', mark_module_completed, name='mark-module-as-complete'),



]
