import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.email import send_email
from app.core.ratelimit import is_rate_limited
from app.deps import get_db, require_role
from app.models.inquiry import Inquiry
from app.models.tutor_profile import TutorProfile
from app.models.user import User
from app.schemas.inquiry import InquiryCreate, InquiryOut, InquiryStatusUpdate

router = APIRouter(prefix="/api/inquiries", tags=["inquiries"])


@router.post("", response_model=InquiryOut, status_code=status.HTTP_201_CREATED)
def create_inquiry(
    payload: InquiryCreate,
    background_tasks: BackgroundTasks,
    user: User = Depends(require_role("student")),
    db: Session = Depends(get_db),
):
    if payload.website:
        # Honeypot tripped — report fabricated success so the bot doesn't learn anything,
        # but nothing is persisted or emailed.
        return InquiryOut(
            id=uuid.uuid4(),
            tutor_id=payload.tutor_id,
            student_name=user.name,
            student_email=user.email,
            student_phone=payload.student_phone,
            subject=payload.subject,
            message=payload.message,
            status="new",
            created_at=datetime.now(timezone.utc),
        )

    tutor = db.query(TutorProfile).filter(TutorProfile.id == payload.tutor_id, TutorProfile.approval_status == "approved").first()
    if tutor is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tutor not found")

    if is_rate_limited(db, user.email):
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail="Too many inquiries sent recently. Please try again later.")

    inquiry = Inquiry(
        tutor_id=payload.tutor_id,
        student_name=user.name,
        student_email=user.email,
        student_phone=payload.student_phone,
        subject=payload.subject,
        message=payload.message,
        status="new",
    )
    db.add(inquiry)
    db.commit()
    db.refresh(inquiry)

    tutor_user = db.get(User, tutor.user_id)
    if tutor_user:
        background_tasks.add_task(
            send_email,
            tutor_user.email,
            f"New inquiry from {user.name} — TutorHub UAE",
            (
                f"You have a new inquiry via TutorHub UAE.\n\n"
                f"From: {user.name} ({user.email})\n"
                f"Phone: {payload.student_phone or 'not provided'}\n"
                f"Subject: {payload.subject or 'not specified'}\n\n"
                f"Message:\n{payload.message}\n\n"
                f"Reply directly to this email to reach {user.name}, or log in to your TutorHub dashboard to respond."
            ),
            reply_to=user.email,
        )

    return inquiry


@router.get("/me", response_model=list[InquiryOut])
def my_inquiries(user: User = Depends(require_role("tutor")), db: Session = Depends(get_db)):
    profile = db.query(TutorProfile).filter(TutorProfile.user_id == user.id).first()
    if profile is None:
        return []
    return (
        db.query(Inquiry)
        .filter(Inquiry.tutor_id == profile.id)
        .order_by(Inquiry.created_at.desc())
        .all()
    )


@router.patch("/{inquiry_id}", response_model=InquiryOut)
def update_inquiry_status(
    inquiry_id: uuid.UUID,
    payload: InquiryStatusUpdate,
    user: User = Depends(require_role("tutor")),
    db: Session = Depends(get_db),
):
    profile = db.query(TutorProfile).filter(TutorProfile.user_id == user.id).first()
    inquiry = db.query(Inquiry).filter(Inquiry.id == inquiry_id).first()
    if inquiry is None or profile is None or inquiry.tutor_id != profile.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Inquiry not found")

    inquiry.status = payload.status
    db.commit()
    db.refresh(inquiry)
    return inquiry
