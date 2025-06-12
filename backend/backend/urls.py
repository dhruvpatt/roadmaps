# urls.py
from django.urls import path
from django.contrib import admin
from pathways.views.user_views import *

urlpatterns = [
    path('admin/', admin.site.urls),

    path("api/csrf/", get_csrf_token),
    path("api/login/", LoginView.as_view()),
    path("api/logout/", LogoutView.as_view()),
    path("api/signup/", UserSignupView.as_view()),
    path("api/user/", UserView.as_view(), name="user"),
]
