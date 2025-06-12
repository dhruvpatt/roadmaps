# urls.py
from django.urls import path
from django.contrib import admin
from django.views.decorators.csrf import csrf_exempt
from pathways.views.user_views import *
from pathways.views.classroom_views import ClassroomViewSet
from rest_framework.routers import DefaultRouter

list_classrooms = ClassroomViewSet.as_view({
    'get': 'list',
})
create_classroom = ClassroomViewSet.as_view({
    'post': 'create',
})
detail_classroom = ClassroomViewSet.as_view({
    'get': 'retrieve',
    'delete': 'destroy',
})
join_student = ClassroomViewSet.as_view({
    'post': 'join_student',
})
join_teacher = ClassroomViewSet.as_view({
    'post': 'join_teacher',
})

urlpatterns = [
    path('admin/', admin.site.urls),

    # API endpoints for User authentication and management
    path("api/csrf/", get_csrf_token),
    path("api/login/", LoginView.as_view()),
    path("api/logout/", LogoutView.as_view()),
    path("api/signup/", UserSignupView.as_view()),
    path("api/user/", UserView.as_view(), name="user"),

    # API endpoints for Classrooms
    path('api/classroom/',list_classrooms, name='classroom-list'),
    path('api/classroom/create/', create_classroom, name='classroom-create'),
    path('api/classroom/<int:id>/', detail_classroom, name='classroom-detail'),
    path('api/classroom/join/student/', join_student, name='classroom-join-student'),
    path('api/classroom/join/teacher/', join_teacher, name='classroom-join-teacher'),

]
