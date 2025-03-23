# urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from pathways import views
from pathways.roadmaps_views import RoadmapGenerationAPIView, get_all_roadmaps, get_roadmap_by_id, update_roadmap, \
    delete_roadmap, get_all_subjects, get_subject_by_id, create_subject, update_subject, delete_subject, \
    get_all_chapters, get_chapter_by_id, create_chapter, update_chapter, delete_chapter, get_user_roadmaps, publish_roadmap_to_classroom
from pathways.module_gen import ModuleContentGenerationAPIView, ModuleAssistantAPIView, get_module
from pathways.quiz_gen import QuizGenerationAPIView, QuizEvaluationAPIView, get_quiz_results
from pathways.classroom_views import classroom_analytics, classroom_student_details, join_classroom_as_student, \
    join_classroom_as_teacher, create_classroom, student_classroom_analytics

from django.contrib import admin

router = DefaultRouter()
router.register(r'users', views.UserViewSet)
router.register(r'roadmaps', views.RoadmapViewSet)
router.register(r'chapters', views.ChapterViewSet)
router.register(r'questions', views.QuestionViewSet)
router.register(r'quizzes', views.QuizViewSet)
router.register(r'modules', views.ModuleViewSet)
router.register(r'content', views.ContentViewSet)
router.register(r'messages', views.MessageViewSet)
router.register(r'classrooms', views.ClassroomViewSet)
router.register(r'subjects', views.SubjectViewSet)

urlpatterns = [
    # ViewSet URLs
    path('admin/', admin.site.urls),
    path('generate-roadmap/', RoadmapGenerationAPIView.as_view(), name='generate-roadmap'),
    path('generate-module/', ModuleContentGenerationAPIView.as_view(), name='generate-module'),
    path('module-assistant/', ModuleAssistantAPIView.as_view(), name='module-assistant'),
    path('api/get-module/', get_module),
    path('api/gen-quiz/', QuizGenerationAPIView.as_view(), name='generate-quiz'),
    path('api/evaluate-quiz/', QuizEvaluationAPIView.as_view(), name='evaluate-quiz'),
    path('api/get-quiz-results/<int:quiz_id>/', get_quiz_results),
    path('api/student-analytics/<int:user_id>/', views.StudentAnalyticsAPIView.as_view(), name='get-student-analytics'),
    path('api/teacher-analytics/<int:user_id>/', views.TeacherAnalyticsAPIView.as_view(), name='get-teacher-analytics'),

    # Function-based view URLs
    path('api/users/', views.user_list, name='user-list'),
    path('api/create-user/', views.create_user, name='create-user'),
    path('api/update-user/<int:pk>', views.update_user, name='update-user'),
    path('api/users/<int:pk>/', views.user_detail, name='user-detail'),
    path('api/users/<int:pk>/roadmaps/', views.user_roadmaps, name='user-roadmaps'),
    path('api/users/<int:pk>/classrooms/', views.user_classrooms, name='user-classrooms'),
    path('api/login-with-email/', views.login_with_email),
    path('api/get-all-students/', views.student_list, name='student-list'),


    path('api/roadmaps/', views.roadmap_list, name='roadmap-list'),
    path('api/roadmaps/<int:pk>/', views.roadmap_detail, name='roadmap-detail'),
    path('api/roadmaps/<int:pk>/chapters/', views.roadmap_chapters, name='roadmap-chapters'),
    path('get-user-roadmaps/', get_user_roadmaps),
    path("publish-roadmap-to-classroom/", publish_roadmap_to_classroom),
    path("publish-roadmap/",  views.assign_roadmap_to_user, name="publish-roadmap"),
    
    path("mark-module-completed/", views.mark_module_completed, name="mark-module-as-complete"),

    # path('roadmaps/', views.get_all_roadmaps),
    # path('roadmaps/<int:roadmap_id>/', views.get_roadmap_by_id),
    # path('roadmaps/<int:roadmap_id>/update/', views.update_roadmap),
    # path('roadmaps/<int:roadmap_id>/delete/', views.delete_roadmap),

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
    path("get-user-classrooms/", views.get_user_classrooms, name="get-user-classrooms"),
    path("get-classroom/", views.get_classroom, name="get-classroom"),

]
