# urls.py
from django.urls import path
from django.contrib import admin
from django.views.decorators.csrf import csrf_exempt

from django.conf import settings
from django.conf.urls.static import static


from pathways.views.user_views import *
from django.urls import path
from pathways.views.classroom_views import (
    ClassroomListView,
    ClassroomCreateView,
    ClassroomDetailView,
    MaterialListView,
    MaterialCreateView,
    MaterialDetailView,
    AssignmentListView,
    AssignmentCreateView,
    AssignmentDetailView,
    submit_assignment,
    assignment_submissions,
    grade_submission,
    join_classroom_student,
    join_classroom_teacher,
    comment_view,
)
from pathways.views.curriculum_builder import create_curriculum, process_pdf_curriculum, upload_csv_curriculum, get_classroom_curriculum
from pathways.views.attendance_views import get_attendance_dashboard, sessions_view, update_attendance
from pathways.views.assistant_views import AssistantView


urlpatterns = [
    path('admin/', admin.site.urls),

    # API endpoints for User authentication and management
    path("api/csrf/", get_csrf_token),
    path("api/login/", LoginView.as_view()),
    path("api/logout/", LogoutView.as_view()),
    path("api/signup/", UserSignupView.as_view()),
    path("api/user/", UserView.as_view(), name="user"),

    path('api/ask-assistant/', AssistantView.as_view(), name='ask-assistant'),


    # API endpoints for Classroom management
    path("api/classroom/", ClassroomListView.as_view(), name="classroom-list"),
    path("api/classroom/create/", ClassroomCreateView.as_view(), name="classroom-create"),
    path("api/classroom/<int:id>/", ClassroomDetailView.as_view(), name="classroom-detail"),
    path("api/classroom/join/student/", join_classroom_student, name="classroom-join-student"),
    path("api/classroom/join/teacher/", join_classroom_teacher, name="classroom-join-teacher"),

    path("api/classroom/materials/", MaterialListView.as_view(), name="material-list"),
    path("api/classroom/materials/create/", MaterialCreateView.as_view(), name="material-create"),
    path("api/classroom/materials/<int:id>/", MaterialDetailView.as_view(), name="material-detail"),

    # Assignment endpoints
    path("api/classrooms/<int:classroom_id>/assignments/", AssignmentListView.as_view(), name="assignment-list"),
    path("api/classrooms/<int:classroom_id>/assignments/create/", AssignmentCreateView.as_view(), name="assignment-create"),
    path("api/assignments/<int:id>/", AssignmentDetailView.as_view(), name="assignment-detail"),
    path("api/assignments/<int:assignment_id>/submit/", submit_assignment, name="submit-assignment"),
    path("api/assignments/<int:assignment_id>/submissions/", assignment_submissions, name="assignment-submissions"),
    path("api/submissions/<int:submission_id>/grade/", grade_submission, name="grade-submission"),

    path('api/classroom/materials/<int:material_id>/comments/', comment_view, name='material-comments'),
    path('api/classroom/comments/<int:comment_id>/', comment_view, name='comment-detail'),


    # API endpoints for Curriculum Builder
    path('api/curriculum/process-pdf/', process_pdf_curriculum, name='process_pdf_curriculum'),
    path('api/curriculum/upload/', upload_csv_curriculum, name='upload_csv_curriculum'),
    path('api/curriculum/create/', create_curriculum, name='create_curriculum'),
    path('api/curriculum/<int:classroom_id>/', get_classroom_curriculum, name='get_classroom_curriculum'),

    # API endpoints for Attendance and Session management
    path("api/classrooms/<int:classroom_id>/attendance/", get_attendance_dashboard, name="attendance-dashboard"),
    path("api/classrooms/<int:classroom_id>/attendance/<int:session_id>/", update_attendance, name="update-attendance"),
    path("api/classrooms/<int:classroom_id>/sessions/", sessions_view, name="sessions"),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

