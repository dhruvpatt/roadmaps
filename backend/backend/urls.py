# urls.py
from django.urls import path
from django.contrib import admin
from django.views.decorators.csrf import csrf_exempt
from pathways.views.user_views import *
from rest_framework.routers import DefaultRouter

from django.urls import path
from pathways.views.classroom_views import (
    ClassroomListView,
    ClassroomCreateView,
    ClassroomDetailView,
    join_classroom_student,
    join_classroom_teacher,
    comment_view,
)
from pathways.views.curriculum_builder import create_curriculum, process_pdf_curriculum, upload_csv_curriculum, get_classroom_curriculum

urlpatterns = [
    path('admin/', admin.site.urls),

    # API endpoints for User authentication and management
    path("api/csrf/", get_csrf_token),
    path("api/login/", LoginView.as_view()),
    path("api/logout/", LogoutView.as_view()),
    path("api/signup/", UserSignupView.as_view()),
    path("api/user/", UserView.as_view(), name="user"),

    # API endpoints for Classroom management
    path("api/classroom/", ClassroomListView.as_view(), name="classroom-list"),
    path("api/classroom/create/", ClassroomCreateView.as_view(), name="classroom-create"),
    path("api/classroom/<int:id>/", ClassroomDetailView.as_view(), name="classroom-detail"),
    path("api/classroom/join/student/", join_classroom_student, name="classroom-join-student"),
    path("api/classroom/join/teacher/", join_classroom_teacher, name="classroom-join-teacher"),
    path('api/classrooms/materials/<int:material_id>/comments/', comment_view, name='material-comments'),
    path('api/classrooms/comments/<int:comment_id>/', comment_view, name='comment-detail'),


    # API endpoints for Curriculum Builder
    path('api/curriculum/process-pdf/', process_pdf_curriculum, name='process_pdf_curriculum'),
    path('api/curriculum/upload/', upload_csv_curriculum, name='upload_csv_curriculum'),
    path('api/curriculum/create/', create_curriculum, name='create_curriculum'),
    path('api/curriculum/<int:classroom_id>/', get_classroom_curriculum, name='get_classroom_curriculum'),
]

