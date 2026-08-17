from fastapi import APIRouter, BackgroundTasks, Depends, status

from app.config import get_settings
from app.core.email import send_email
from app.deps import get_current_user
from app.models.user import User
from app.schemas.contact import ContactRequest

router = APIRouter(prefix="/api/contact", tags=["contact"])
settings = get_settings()


@router.post("", status_code=status.HTTP_201_CREATED)
def send_contact_message(
    payload: ContactRequest,
    background_tasks: BackgroundTasks,
    user: User = Depends(get_current_user),
):
    if payload.website:
        # Honeypot tripped — report success, send nothing.
        return {"detail": "Message sent"}

    background_tasks.add_task(
        send_email,
        settings.admin_notification_email,
        f"Contact form: {payload.subject or 'General inquiry'} — {user.name}",
        (
            f"New message from the TutorHub UAE contact page.\n\n"
            f"From: {user.name} ({user.email})\n"
            f"Phone: {payload.phone or 'not provided'}\n"
            f"Subject: {payload.subject or 'not specified'}\n\n"
            f"Message:\n{payload.message}"
        ),
        reply_to=user.email,
    )
    return {"detail": "Message sent"}
