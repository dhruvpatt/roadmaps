# urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from pathways import views

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
    path('api/', include(router.urls)),

    # Function-based view URLs
    path('api/users/', views.user_list, name='user-list'),
    path('api/users/<int:pk>/', views.user_detail, name='user-detail'),
    path('api/users/<int:pk>/roadmaps/', views.user_roadmaps, name='user-roadmaps'),
    path('api/users/<int:pk>/classrooms/', views.user_classrooms, name='user-classrooms'),

    path('api/roadmaps/', views.roadmap_list, name='roadmap-list'),
    path('api/roadmaps/<int:pk>/', views.roadmap_detail, name='roadmap-detail'),
    path('api/roadmaps/<int:pk>/chapters/', views.roadmap_chapters, name='roadmap-chapters'),

    path('api/chapters/', views.chapter_list, name='chapter-list'),
    path('api/chapters/<int:pk>/', views.chapter_detail, name='chapter-detail'),
    path('api/chapters/<int:pk>/modules/', views.chapter_modules, name='chapter-modules'),

    path('api/modules/', views.module_list, name='module-list'),
    path('api/modules/<int:pk>/', views.module_detail, name='module-detail'),
    path('api/modules/<int:pk>/contents/', views.module_contents, name='module-contents'),
    path('api/modules/<int:pk>/chat-history/', views.module_chat_history, name='module-chat-history'),
    path('api/modules/<int:pk>/add-message/', views.module_add_message, name='module-add-message'),

    path('api/classrooms/', views.classroom_list, name='classroom-list'),
    path('api/classrooms/<int:pk>/', views.classroom_detail, name='classroom-detail'),
    path('api/classrooms/join/', views.classroom_join, name='classroom-join'),
    path('api/classrooms/<int:pk>/subjects/', views.classroom_subjects, name='classroom-subjects'),

    path('api/subjects/', views.subject_list, name='subject-list'),
    path('api/subjects/<int:pk>/', views.subject_detail, name='subject-detail'),

    path('api/questions/', views.question_list, name='question-list'),
    path('api/questions/<int:pk>/', views.question_detail, name='question-detail'),

    path('api/quizzes/', views.quiz_list, name='quiz-list'),
    path('api/quizzes/<int:pk>/', views.quiz_detail, name='quiz-detail'),
    path('api/quizzes/<int:pk>/submit-answer/', views.quiz_submit_answer, name='quiz-submit-answer'),

    path('api/contents/', views.content_list, name='content-list'),
    path('api/contents/<int:pk>/', views.content_detail, name='content-detail'),

    path('api/messages/', views.message_list, name='message-list'),
    path('api/messages/<int:pk>/', views.message_detail, name='message-detail'),

    # API auth
    path('api-auth/', include('rest_framework.urls', namespace='rest_framework')),
]
