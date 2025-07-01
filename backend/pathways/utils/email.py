# utils/email.py
from django.conf import settings
from django.core.mail import EmailMultiAlternatives


def send_email_confirmation(first_name, email, token, subject = None, text_content = None, html_content = None):
    """
    Sends an email confirmation link to the given user using the provided token.
    """
    confirm_url = f"{settings.FRONTEND_URL}/confirm-email/{token}/"

    if not subject: subject = "Confirm your email"
    if not text_content: text_content = f"Please confirm your email by visiting: {confirm_url}"
    if not html_content: html_content = f"""
            <p>Hi {first_name},</p>
            <p>Thanks for signing up. Please confirm your email:</p>
            <p><a href="{confirm_url}">Click here to confirm your email</a></p>
        """

    msg = EmailMultiAlternatives(
        subject,
        text_content,
        settings.DEFAULT_FROM_EMAIL,
        [email]
    )
    msg.attach_alternative(html_content, "text/html")
    msg.send()
