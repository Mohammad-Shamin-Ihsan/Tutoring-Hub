import uuid
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.deps import get_db, require_role
from app.models.admin_log import AdminLog
from app.models.inquiry import Inquiry
from app.models.lookups import Language, Location, Subject, TeachingLevel
from app.models.tutor_profile import TutorProfile
from app.models.user import User
from app.routers.tutors import _to_me
from app.schemas.admin import (
    AdminInquiryOut,
    AdminLogOut,
    AdminTutorEdit,
    AdminTutorOut,
    AdminUserOut,
    StatsOut,
)
from app.schemas.lookups import (
    LanguageCreate,
    LanguageOut,
    LocationCreate,
    LocationOut,
    SubjectCreate,
    SubjectOut,
    TeachingLevelCreate,
    TeachingLevelOut,
)
from app.schemas.tutor import TutorMeOut

router = APIRouter(prefix="/api/admin", tags=["admin"], dependencies=[Depends(require_role("admin"))])


def _log(db: Session, admin: User, action: str, target_table: str, target_id: uuid.UUID | None) -> None:
    db.add(AdminLog(admin_id=admin.id, action=action, target_table=target_table, target_id=target_id))


def _to_admin_tutor_out(tutor: TutorProfile) -> AdminTutorOut:
    return AdminTutorOut(
        id=tutor.id,
        user_id=tutor.user_id,
        name=tutor.user.name,
        email=tutor.user.email,
        subjects=[s.name for s in tutor.subjects],
        approval_status=tutor.approval_status,
        account_status=tutor.user.status,
        hourly_rate=tutor.hourly_rate,
        created_at=tutor.created_at,
    )


# --------------------------------------------------------------------------
# Tutors: approvals + management
# --------------------------------------------------------------------------


@router.get("/tutors", response_model=list[AdminTutorOut])
def list_tutors(
    db: Session = Depends(get_db),
    approval_status: str | None = Query(default=None, pattern="^(pending|approved|rejected|suspended)$"),
    search: str | None = None,
):
    query = db.query(TutorProfile).join(User, TutorProfile.user_id == User.id)
    if approval_status:
        query = query.filter(TutorProfile.approval_status == approval_status)
    if search:
        like = f"%{search}%"
        query = query.filter((User.name.ilike(like)) | (User.email.ilike(like)))
    tutors = query.order_by(TutorProfile.created_at.desc()).all()
    return [_to_admin_tutor_out(t) for t in tutors]


@router.get("/tutors/{tutor_id}", response_model=TutorMeOut)
def get_tutor_detail(tutor_id: uuid.UUID, db: Session = Depends(get_db)):
    tutor = db.query(TutorProfile).filter(TutorProfile.id == tutor_id).first()
    if tutor is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tutor not found")
    return _to_me(tutor)


def _transition_tutor(
    tutor_id: uuid.UUID,
    new_status: str,
    action: str,
    admin: User,
    db: Session,
) -> AdminTutorOut:
    tutor = db.query(TutorProfile).filter(TutorProfile.id == tutor_id).first()
    if tutor is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tutor not found")
    tutor.approval_status = new_status
    _log(db, admin, action, "tutor_profiles", tutor.id)
    db.commit()
    db.refresh(tutor)
    return _to_admin_tutor_out(tutor)


@router.patch("/tutors/{tutor_id}/approve", response_model=AdminTutorOut)
def approve_tutor(tutor_id: uuid.UUID, admin: User = Depends(require_role("admin")), db: Session = Depends(get_db)):
    return _transition_tutor(tutor_id, "approved", "approve_tutor", admin, db)


@router.patch("/tutors/{tutor_id}/reject", response_model=AdminTutorOut)
def reject_tutor(tutor_id: uuid.UUID, admin: User = Depends(require_role("admin")), db: Session = Depends(get_db)):
    return _transition_tutor(tutor_id, "rejected", "reject_tutor", admin, db)


@router.patch("/tutors/{tutor_id}/suspend", response_model=AdminTutorOut)
def suspend_tutor(tutor_id: uuid.UUID, admin: User = Depends(require_role("admin")), db: Session = Depends(get_db)):
    return _transition_tutor(tutor_id, "suspended", "suspend_tutor", admin, db)


@router.put("/tutors/{tutor_id}", response_model=TutorMeOut)
def edit_tutor(
    tutor_id: uuid.UUID,
    payload: AdminTutorEdit,
    admin: User = Depends(require_role("admin")),
    db: Session = Depends(get_db),
):
    tutor = db.query(TutorProfile).filter(TutorProfile.id == tutor_id).first()
    if tutor is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tutor not found")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(tutor, field, value)

    _log(db, admin, "edit_tutor", "tutor_profiles", tutor.id)
    db.commit()
    db.refresh(tutor)
    return _to_me(tutor)


# --------------------------------------------------------------------------
# Users
# --------------------------------------------------------------------------


@router.get("/users", response_model=list[AdminUserOut])
def list_users(db: Session = Depends(get_db), role: str | None = None):
    query = db.query(User)
    if role:
        query = query.filter(User.role == role)
    return query.order_by(User.created_at.desc()).all()


@router.patch("/users/{user_id}/status", response_model=AdminUserOut)
def set_user_status(
    user_id: uuid.UUID,
    new_status: str = Query(pattern="^(active|suspended)$"),
    admin: User = Depends(require_role("admin")),
    db: Session = Depends(get_db),
):
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    user.status = new_status
    _log(db, admin, f"set_user_status:{new_status}", "users", user.id)
    db.commit()
    db.refresh(user)
    return user


# --------------------------------------------------------------------------
# Inquiries
# --------------------------------------------------------------------------


@router.get("/inquiries", response_model=list[AdminInquiryOut])
def list_all_inquiries(db: Session = Depends(get_db)):
    inquiries = db.query(Inquiry).join(TutorProfile, Inquiry.tutor_id == TutorProfile.id).order_by(Inquiry.created_at.desc()).all()
    return [
        AdminInquiryOut(
            id=i.id,
            tutor_id=i.tutor_id,
            tutor_name=i.tutor.user.name,
            student_name=i.student_name,
            student_email=i.student_email,
            subject=i.subject,
            status=i.status,
            created_at=i.created_at,
        )
        for i in inquiries
    ]


# --------------------------------------------------------------------------
# Lookup management (subjects / locations / languages / teaching levels)
# --------------------------------------------------------------------------


@router.post("/subjects", response_model=SubjectOut, status_code=status.HTTP_201_CREATED)
def create_subject(payload: SubjectCreate, admin: User = Depends(require_role("admin")), db: Session = Depends(get_db)):
    subject = Subject(name=payload.name)
    db.add(subject)
    _log(db, admin, "create_subject", "subjects", None)
    db.commit()
    db.refresh(subject)
    return subject


@router.delete("/subjects/{subject_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_subject(subject_id: uuid.UUID, admin: User = Depends(require_role("admin")), db: Session = Depends(get_db)):
    subject = db.get(Subject, subject_id)
    if subject is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subject not found")
    db.delete(subject)
    _log(db, admin, "delete_subject", "subjects", subject_id)
    db.commit()


@router.post("/locations", response_model=LocationOut, status_code=status.HTTP_201_CREATED)
def create_location(payload: LocationCreate, admin: User = Depends(require_role("admin")), db: Session = Depends(get_db)):
    location = Location(city=payload.city, area=payload.area)
    db.add(location)
    _log(db, admin, "create_location", "locations", None)
    db.commit()
    db.refresh(location)
    return location


@router.delete("/locations/{location_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_location(location_id: uuid.UUID, admin: User = Depends(require_role("admin")), db: Session = Depends(get_db)):
    location = db.get(Location, location_id)
    if location is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Location not found")
    db.delete(location)
    _log(db, admin, "delete_location", "locations", location_id)
    db.commit()


@router.post("/languages", response_model=LanguageOut, status_code=status.HTTP_201_CREATED)
def create_language(payload: LanguageCreate, admin: User = Depends(require_role("admin")), db: Session = Depends(get_db)):
    language = Language(name=payload.name)
    db.add(language)
    _log(db, admin, "create_language", "languages", None)
    db.commit()
    db.refresh(language)
    return language


@router.delete("/languages/{language_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_language(language_id: uuid.UUID, admin: User = Depends(require_role("admin")), db: Session = Depends(get_db)):
    language = db.get(Language, language_id)
    if language is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Language not found")
    db.delete(language)
    _log(db, admin, "delete_language", "languages", language_id)
    db.commit()


@router.post("/teaching-levels", response_model=TeachingLevelOut, status_code=status.HTTP_201_CREATED)
def create_teaching_level(payload: TeachingLevelCreate, admin: User = Depends(require_role("admin")), db: Session = Depends(get_db)):
    level = TeachingLevel(level_name=payload.level_name)
    db.add(level)
    _log(db, admin, "create_teaching_level", "teaching_levels", None)
    db.commit()
    db.refresh(level)
    return level


@router.delete("/teaching-levels/{level_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_teaching_level(level_id: uuid.UUID, admin: User = Depends(require_role("admin")), db: Session = Depends(get_db)):
    level = db.get(TeachingLevel, level_id)
    if level is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Teaching level not found")
    db.delete(level)
    _log(db, admin, "delete_teaching_level", "teaching_levels", level_id)
    db.commit()


# --------------------------------------------------------------------------
# Stats + activity log
# --------------------------------------------------------------------------


@router.get("/stats", response_model=StatsOut)
def get_stats(db: Session = Depends(get_db)):
    total_tutors = db.query(func.count(TutorProfile.id)).scalar() or 0
    pending_approvals = db.query(func.count(TutorProfile.id)).filter(TutorProfile.approval_status == "pending").scalar() or 0
    total_inquiries = db.query(func.count(Inquiry.id)).scalar() or 0
    active_tutors = (
        db.query(func.count(TutorProfile.id))
        .join(User, TutorProfile.user_id == User.id)
        .filter(TutorProfile.approval_status == "approved", User.status == "active")
        .scalar()
        or 0
    )

    six_months_ago = datetime.now(timezone.utc) - timedelta(days=180)
    month_bucket = func.date_trunc("month", User.created_at)
    rows = (
        db.query(month_bucket.label("month"), func.count(User.id).label("count"))
        .filter(User.role == "tutor", User.created_at >= six_months_ago)
        .group_by(month_bucket)
        .order_by(month_bucket)
        .all()
    )
    monthly_signups = [{"month": r.month.strftime("%Y-%m"), "count": r.count} for r in rows]

    return StatsOut(
        total_tutors=total_tutors,
        pending_approvals=pending_approvals,
        total_inquiries=total_inquiries,
        active_tutors=active_tutors,
        monthly_signups=monthly_signups,
    )


@router.get("/logs", response_model=list[AdminLogOut])
def list_logs(db: Session = Depends(get_db), limit: int = Query(default=50, ge=1, le=200)):
    logs = db.query(AdminLog).order_by(AdminLog.created_at.desc()).limit(limit).all()
    admins = {u.id: u.name for u in db.query(User).filter(User.id.in_({log.admin_id for log in logs})).all()}
    return [
        AdminLogOut(
            id=log.id,
            admin_id=log.admin_id,
            admin_name=admins.get(log.admin_id, "Unknown"),
            action=log.action,
            target_table=log.target_table,
            target_id=log.target_id,
            created_at=log.created_at,
        )
        for log in logs
    ]
