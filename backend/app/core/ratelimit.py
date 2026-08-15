from datetime import datetime, timedelta, timezone

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.inquiry import Inquiry

# Simple, dependency-free spam guard for the public inquiry/contact forms:
# a honeypot field (checked by the caller) plus a rolling-window cap per
# sender email, backed by the inquiries table itself — no Redis/queue needed
# for an MVP's traffic volume.
MAX_INQUIRIES_PER_WINDOW = 5
WINDOW_MINUTES = 60


def is_rate_limited(db: Session, email: str) -> bool:
    window_start = datetime.now(timezone.utc) - timedelta(minutes=WINDOW_MINUTES)
    count = db.scalar(
        select(func.count())
        .select_from(Inquiry)
        .where(Inquiry.student_email == email, Inquiry.created_at >= window_start)
    )
    return (count or 0) >= MAX_INQUIRIES_PER_WINDOW
