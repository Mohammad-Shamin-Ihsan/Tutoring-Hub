import logging
import smtplib
from email.message import EmailMessage

from app.config import get_settings

settings = get_settings()
logger = logging.getLogger("tutorhub.email")


def send_email(to: str, subject: str, body: str, reply_to: str | None = None) -> None:
    """Send a plain-text email via SMTP, or log it if SMTP isn't configured.

    Kept synchronous and best-effort: a broken mail server should never fail
    the API request that triggered the notification (inquiry/contact form).

    `reply_to`, when given, lets the recipient hit "Reply" and land in the
    real sender's inbox even though `From:` stays the platform's own SMTP
    account — most providers (Gmail included) won't relay mail claiming to
    be `From:` an arbitrary unverified address, so this is the deliverable
    way to route a reply back to e.g. the student who sent an inquiry.
    """
    if not settings.smtp_host:
        logger.info(
            "SMTP not configured — logging email instead.\nTo: %s\nReply-To: %s\nSubject: %s\n%s",
            to,
            reply_to or "(none)",
            subject,
            body,
        )
        return

    message = EmailMessage()
    message["From"] = settings.smtp_from
    message["To"] = to
    message["Subject"] = subject
    if reply_to:
        message["Reply-To"] = reply_to
    message.set_content(body)

    try:
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=10) as server:
            if settings.smtp_use_tls:
                server.starttls()
            if settings.smtp_user:
                server.login(settings.smtp_user, settings.smtp_password)
            server.send_message(message)
    except Exception:
        logger.exception("Failed to send email to %s", to)
