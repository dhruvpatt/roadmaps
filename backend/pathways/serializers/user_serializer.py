from rest_framework import serializers
from django.contrib.auth import get_user_model
from pathways.models.user import User, MissedDeliverable, Session, Attendance, ParentInvite
from pathways.models.organization import Organization
from django.conf import settings
from pathways.utils.email import send_email_confirmation


User = get_user_model()


class MinimalUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "first_name", "last_name"]


class OrganizationSerializer(serializers.ModelSerializer):
    teachers = serializers.SerializerMethodField()
    students = serializers.SerializerMethodField()
    admins = serializers.SerializerMethodField()
    owner = MinimalUserSerializer(read_only=True) 

    class Meta:
        model = Organization
        fields = ['id', 'name', 'code', 'created_at',
                  'teachers', 'students', 'admins', 'owner']

    def get_teachers(self, obj):
        teachers = obj.users.filter(role='teacher')
        return MinimalUserSerializer(teachers, many=True).data  # Use minimal

    def get_students(self, obj):
        students = obj.users.filter(role='student')
        return MinimalUserSerializer(students, many=True).data  # Use minimal

    def get_admins(self, obj):
        admins = obj.users.filter(role='org_admin')
        return MinimalUserSerializer(admins, many=True).data  # Use minimal


ALLOWED_ORG_ADMIN_EMAILS = getattr(settings, "ALLOWED_ORG_ADMIN_EMAILS", [])


class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    role = serializers.ChoiceField(choices=[("student", "student"), (
        "teacher", "teacher"), ("parent", "parent"), ("org_admin", "org_admin")])
    organization = OrganizationSerializer(read_only=True)
    organization_code = serializers.CharField(write_only=True, required=False)
    parent = MinimalUserSerializer(read_only=True)
    parent_email = serializers.EmailField(
        write_only=True, required=False, allow_null=True)
    pending_parent_approval = serializers.BooleanField(read_only=True)

    class Meta:
        model = User
        fields = [
            "id", "username", "email", "first_name", "last_name",
            "password", "grade", "age", "role",
            "organization", "organization_code",
            "parent", "parent_email",
            "pending_parent_approval"
        ]
        extra_kwargs = {
            'password': {'write_only': True}
        }

    def validate(self, data):
        role = data.get("role")
        age = data.get("age")
        parent_email = data.get("parent_email")
        # If student and under 14, parent email is required
        if role == "student" and (age is not None and age <= 13):
            if not parent_email:
                raise serializers.ValidationError(
                    {"parent_email": "Parent email is required for students age 13 or under."})
        if role == "org_admin":
            email = data.get("email")
            if email not in ALLOWED_ORG_ADMIN_EMAILS:
                raise serializers.ValidationError(
                    {"email": "You are not authorized to be an organization admin."})
        return data

    def create(self, validated_data):
        password = validated_data.pop("password")
        org_code = validated_data.pop("organization_code", None)
        parent_email = validated_data.pop("parent_email", None)
        role = validated_data.get("role")
        age = validated_data.get("age")
        email = validated_data.get("email")

        # Organization linking
        if org_code:
            try:
                organization = Organization.objects.get(code=org_code)
            except Organization.DoesNotExist:
                raise serializers.ValidationError(
                    {"organization_code": "Invalid organization code."})
            validated_data["organization"] = organization

        # Parent logic for students age 13 or under
        parent = None
        pending_parent_approval = False
        if role == "student" and (age is not None and age <= 13):
            if parent_email:
                try:
                    parent = User.objects.get(
                        email=parent_email, role="parent")
                    validated_data["parent"] = parent
                except User.DoesNotExist:
                    # Parent doesn't exist, create invite and set pending
                    pending_parent_approval = True

        if role == "org_admin":
            if email not in ALLOWED_ORG_ADMIN_EMAILS:
                raise serializers.ValidationError(
                    {"email": "You are not authorized to be an organization admin."})

        user = User(**validated_data)
        user.set_password(password)
        user.pending_parent_approval = pending_parent_approval
        user.save()

        # If under 14 and no parent exists yet, send invite
        if role == "student" and (age is not None and age <= 13) and not parent:
            # Make sure no duplicate invites
            invite, created = ParentInvite.objects.get_or_create(
                student=user,
                defaults={'parent_email': parent_email}
            )
            if not created:
                invite.parent_email = parent_email
                invite.save()
            invite_url = f"{settings.FRONTEND_URL}/parent-invite/{invite.invite_token}/"

            subject = "Parental Approval Needed"
            text_content = "A student account has been created. Please finish setup here: " + invite_url
            html_content = f"""
            <p>A student account has been created for your child on our platform.</p>
            <p>Please <a href="{invite_url}">click here</a> to finish setup.</p>
            """
            send_email_confirmation(
                "", parent_email, invite.invite_token, subject, text_content, html_content)

        return user


class MissedDeliverableSerializer(serializers.ModelSerializer):
    deliverable_repr = serializers.SerializerMethodField()

    class Meta:
        model = MissedDeliverable
        fields = ["id", "deliverable_repr", "content_type", "object_id"]

    def get_deliverable_repr(self, obj):
        return str(obj.deliverable)
# serializers/user_serializer.py


class SessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Session
        fields = ['id', 'date', 'topic', 'classroom']
        read_only_fields = ['id']

    def create(self, validated_data):
        # Handle classroom assignment if passed as ID
        return super().create(validated_data)


class AttendanceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Attendance
        fields = ('id', 'student', 'session', 'status')
