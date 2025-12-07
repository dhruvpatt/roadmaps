# views.py
from django.contrib.auth import authenticate, login, logout
from django.views.decorators.csrf import ensure_csrf_cookie
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework import status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.generics import ListAPIView
from pathways.serializers import ClassroomStudentSerializer
from pathways.serializers.user_serializer import UserSerializer
from pathways.models.user import ParentInvite
from django.middleware.csrf import get_token
from pathways.models.organization import Organization
from django.conf import settings
import secrets
from pathways.models.user import User, EmailConfirmationToken
from pathways.serializers.user_serializer import OrganizationSerializer
from rest_framework.throttling import AnonRateThrottle
from pathways.throttles import LoginThrottle, SignupThrottle
import uuid
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model
from pathways.utils.email import send_email_confirmation

User = get_user_model()


@api_view(["GET"])
@permission_classes([AllowAny])
@ensure_csrf_cookie
def get_csrf_token(request):
    return Response({"detail": "CSRF cookie set"})


@api_view(["POST"])
@permission_classes([AllowAny])
def accept_parent_invite(request, invite_token):
    invite = get_object_or_404(
        ParentInvite, invite_token=invite_token, accepted=False)
    data = request.data
    if data.get("email") != invite.parent_email:
        return Response({"detail": "Email mismatch."}, status=400)
    # Create parent user
    parent = User.objects.create_user(
        username=f"parent_{uuid.uuid4().hex[:8]}",
        email=data["email"],
        first_name=data["first_name"],
        last_name=data["last_name"],
        role="parent",
        password=data["password"],
        organization=invite.student.organization,
    )
    # Link student and parent
    student = invite.student
    student.parent = parent
    student.pending_parent_approval = False
    student.save()
    invite.accepted = True
    invite.save()
    return Response({"success": True, "parent_id": parent.id, "student_id": student.id})


@api_view(["GET"])
@permission_classes([AllowAny])
def confirm_email(request, token):
    try:
        confirmation = EmailConfirmationToken.objects.filter(token=token, is_used=False).first()

        if not confirmation or confirmation.is_expired():
            return Response({"detail": "Invalid or expired token."}, status=400)
        
        user = confirmation.user

        user.is_email_confirmed = True
        user.save()

        confirmation.is_used = True
        confirmation.save()

        response_data = {"detail": "Email confirmed successfully."}

        if user.role == "org_admin" and user.organization:
            org_code = user.organization.code
            response_data["organization_code"] = org_code

            # Send follow-up email to org admin with their org code
            subject = "Your organization code"
            text_content = f"Thanks for confirming your email.\nYour organization code is: {org_code}"
            html_content = f"""
                <p>Hi {user.first_name},</p>
                <p>Thanks for confirming your email.</p>
                <p>Your organization code is:</p>
                <div style="font-size: 18px; font-weight: bold; margin: 12px 0;">{org_code}</div>
                <p>You can now share this code with teachers and students to let them sign up.</p>
            """
            send_email_confirmation(
                first_name=user.first_name,
                email=user.email,
                token=confirmation.token,
                subject=subject,
                text_content=text_content,
                html_content=html_content
            )

        return Response(response_data, status=200)

    except:
        return Response({"detail": "Error."}, status=400)

@api_view(["POST"])
@permission_classes([AllowAny])
def request_password_reset(request):
    email = request.data.get("email")
    if not email:
        return Response({"detail": "Email is required."}, status=400)

    User = get_user_model()
    try:
        user = User.objects.get(email=email)
        if not user.is_email_confirmed:
            return Response({"detail": "Invalid operation."}, status=403)
    except User.DoesNotExist:
        return Response({"detail": "Invalid operation."}, status=403)

    existing = EmailConfirmationToken.objects.filter(user=user, is_used=False).first()
    if existing and not existing.is_expired():
        token = existing
    else:
        # Delete stale/used token if needed
        EmailConfirmationToken.objects.filter(user=user).delete()
    
    # Create a new one
        token = EmailConfirmationToken.objects.create(user=user)


    subject = "Reset your password"
    text_content = f"Reset it here: {settings.FRONTEND_URL}/reset-password/{token.token}/"
    html_content = f"""
        <p>Hi {user.first_name},</p>
        <p>To reset your password, click the link below:</p>
        <a href="{settings.FRONTEND_URL}/reset-password/{token.token}/">Reset your password</a>
    """
    send_email_confirmation(user.first_name, email, token.token, subject, text_content, html_content)

    return Response({"detail": "Reset email sent."})

@api_view(["POST"])
@permission_classes([AllowAny])
def reset_password(request, token):
    from django.contrib.auth.hashers import make_password

    password = request.data.get("password")
    if not password:
        return Response({"detail": "Password is required."}, status=400)

    try:
        print(token)
        confirmation = EmailConfirmationToken.objects.filter(token=token, is_used=False).first()

        if not confirmation or confirmation.is_expired():
            print(confirmation)
            return Response({"detail": "Invalid or expired token."}, status=400)
        
        user = confirmation.user

        user.password = make_password(password)
        user.save()

        confirmation.is_used = True
        confirmation.save()

        return Response({"detail": "Password updated."}, status=200)
    except:
        return Response({"detail": "Error."}, status=400)



class UserView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

    def patch(self, request):
        serializer = UserSerializer(
            request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request):
        request.user.delete()
        return Response({"detail": "User deleted"}, status=status.HTTP_204_NO_CONTENT)


class CreateOrganizationView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        data = request.data.copy()

        required_fields = ["name", "email", "username",
                           "password", "first_name", "last_name"]
        missing = [field for field in required_fields if field not in data]
        if missing:
            return Response({"detail": f"Missing fields: {', '.join(missing)}"}, status=400)

        email = data["email"]
        if email not in settings.ALLOWED_ORG_ADMIN_EMAILS:
            return Response({"detail": "This email is not authorized to create an organization."}, status=403)

        # Check if username/email already taken
        if User.objects.filter(username=data["username"]).exists():
            return Response({"detail": "This username is already taken."}, status=400)
        if User.objects.filter(email=email).exists():
            return Response({"detail": "An account with this email already exists."}, status=400)

        if data.get("is_email_confirmed", False):
            return Response({"detail": "Email confirmation must be done."}, status=400)

        # Create organization
        org_code = secrets.token_urlsafe(6)
        organization = Organization.objects.create(
            name=data["name"], code=org_code)

        data["role"] = "org_admin"
        data["organization_code"] = organization.code

        serializer = UserSerializer(data=data)
        if serializer.is_valid():
            user = serializer.save()
            existing = EmailConfirmationToken.objects.filter(user=user, is_used=False).first()
            if existing and not existing.is_expired():
                confirmation = existing
            else:
                # Delete stale/used token if needed
                EmailConfirmationToken.objects.filter(user=user).delete()
                confirmation = EmailConfirmationToken.objects.create(user=user)

            confirm_url = f"{settings.FRONTEND_URL}/confirm-email/{confirmation.token}/"

            subject = "Confirm your email to activate your organization admin account"
            text_content = f"Please confirm your email: {confirm_url}"
            html_content = f"""
            <p>Hi {user.first_name},</p>
            <p>Thanks for creating an organization. Please confirm your email:</p>
            <p><a href="{confirm_url}">Click here to confirm your email</a></p>
            """

            send_email_confirmation(
                user.first_name, user.email, confirmation.token, subject, text_content, html_content)
            organization.owner = user
            organization.save()
            return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)

        # If invalid
        print("Serializer errors:", serializer.errors)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserSignupView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [SignupThrottle]

    def post(self, request):
        data = request.data.copy()
        allowed_roles = ["student", "teacher"]
        role = data.get("role")

        if data.get("role") not in allowed_roles:
            return Response({"detail": "Invalid role."}, status=status.HTTP_400_BAD_REQUEST)

        # Block direct "parent" signup except via invite
        if role == "parent":
            return Response({"detail": "Parents can only join via invitation email."}, status=status.HTTP_400_BAD_REQUEST)

        # Require organization_code for teacher/student
        org_code = data.get("organization_code")
        if not org_code:
            return Response({"organization_code": "Organization code is required."}, status=status.HTTP_400_BAD_REQUEST)

        serializer = UserSerializer(data=data)

        if serializer.is_valid():
            user = serializer.save()
            existing = EmailConfirmationToken.objects.filter(user=user, is_used=False).first()
            if existing and not existing.is_expired():
                confirmation = existing
            else:
                # Delete stale/used token if needed
                EmailConfirmationToken.objects.filter(user=user).delete()
                confirmation = EmailConfirmationToken.objects.create(user=user)            
                
            send_email_confirmation(user, confirmation.token)
            return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)

        errors = serializer.errors
        custom_errors = {}
        if 'username' in errors:
            custom_errors['username'] = "This username is already taken."
        if 'email' in errors:
            custom_errors['email'] = "An account with this email already exists."
        if not custom_errors:
            custom_errors = errors
        return Response(custom_errors, status=status.HTTP_400_BAD_REQUEST)


class LoginView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [LoginThrottle]

    def post(self, request):
        username = request.data.get("username")
        password = request.data.get("password")
        org_code = request.data.get("organization_code")

        if not (username and password and org_code):
            logout(request)
            return Response({"detail": "All fields are required."}, status=400)
        try:
            organization = Organization.objects.get(code=org_code)
        except Organization.DoesNotExist:
            logout(request)
            return Response({"detail": "Invalid organization code."}, status=400)

        try:
            user = User.objects.get(
                username=username, organization=organization)
        except User.DoesNotExist:
            logout(request)
            return Response({"detail": "Invalid username or organization code."}, status=400)

        # Standard auth check
        user = authenticate(request, username=username, password=password)
        print(user)
        if user is not None and user.organization == organization:
            if not user.is_email_confirmed:
                return Response({"detail": "Please confirm your email before logging in."}, status=403)
            if user.pending_parent_approval:
                return Response({"detail": "Please have your parent/guardian confrim their email before logging in."}, status=403)

            login(request, user)
            request.session.save()
            return Response({"detail": "Logged in", "user": UserSerializer(user).data}, status=status.HTTP_200_OK)
        
        logout(request)
        return Response({"detail": "Invalid credentials"}, status=400)


class LogoutView(APIView):
    def post(self, request):
        logout(request)
        return Response({"detail": "Logged out"}, status=status.HTTP_200_OK)