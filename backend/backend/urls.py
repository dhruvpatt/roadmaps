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
    get_announcements_view,
    create_announcement_view
)


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

    # API endpoints for Classroom Stream
    path('classrooms/<int:classroom_id>/announcements/', get_announcements_view, name='get_announcements'),
    path('classrooms/<int:classroom_id>/announcements/create/', create_announcement_view, name='create_announcement'),
]

