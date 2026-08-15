import math
import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.config import get_settings
from app.deps import get_current_user, get_db, require_role
from app.models.lookups import Language, Location, Subject, TeachingLevel
from app.models.tutor_profile import TutorProfile
from app.models.user import User
from app.schemas.tutor import (
    PaginatedTutors,
    TutorCardOut,
    TutorDetailOut,
    TutorMeOut,
    TutorProfileUpdate,
)

router = APIRouter(prefix="/api/tutors", tags=["tutors"])
settings = get_settings()

REQUIRED_FOR_SUBMIT = ("biography", "qualification", "hourly_rate", "teaching_mode")


def _to_card(tutor: TutorProfile) -> TutorCardOut:
    return TutorCardOut(
        id=tutor.id,
        name=tutor.user.name,
        profile_photo=tutor.profile_photo,
        biography=tutor.biography,
        experience_years=tutor.experience_years,
        hourly_rate=tutor.hourly_rate,
        teaching_mode=tutor.teaching_mode,
        subjects=list(tutor.subjects),
        locations=list(tutor.locations),
    )


def _to_detail(tutor: TutorProfile) -> TutorDetailOut:
    card = _to_card(tutor)
    return TutorDetailOut(
        **card.model_dump(),
        qualification=tutor.qualification,
        languages=list(tutor.languages),
        teaching_levels=list(tutor.teaching_levels),
    )


def _to_me(tutor: TutorProfile) -> TutorMeOut:
    return TutorMeOut(
        id=tutor.id,
        profile_photo=tutor.profile_photo,
        biography=tutor.biography,
        qualification=tutor.qualification,
        experience_years=tutor.experience_years,
        hourly_rate=tutor.hourly_rate,
        teaching_mode=tutor.teaching_mode,
        approval_status=tutor.approval_status,
        created_at=tutor.created_at,
        updated_at=tutor.updated_at,
        subjects=list(tutor.subjects),
        languages=list(tutor.languages),
        locations=list(tutor.locations),
        teaching_levels=list(tutor.teaching_levels),
    )


def _get_own_profile(user: User, db: Session) -> TutorProfile:
    profile = db.query(TutorProfile).filter(TutorProfile.user_id == user.id).first()
    if profile is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tutor profile not found")
    return profile


@router.get("", response_model=PaginatedTutors)
def search_tutors(
    db: Session = Depends(get_db),
    subject_id: uuid.UUID | None = None,
    location_id: uuid.UUID | None = None,
    level_id: uuid.UUID | None = None,
    language_id: uuid.UUID | None = None,
    mode: str | None = Query(default=None, pattern="^(online|in_person|both)$"),
    price_min: float | None = None,
    price_max: float | None = None,
    sort: str = Query(default="newest", pattern="^(newest|price_asc|price_desc|experience)$"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=12, ge=1, le=48),
):
    query = (
        db.query(TutorProfile)
        .join(User, TutorProfile.user_id == User.id)
        .filter(TutorProfile.approval_status == "approved", User.status == "active")
    )

    if subject_id:
        query = query.filter(TutorProfile.subjects.any(Subject.id == subject_id))
    if location_id:
        query = query.filter(TutorProfile.locations.any(Location.id == location_id))
    if level_id:
        query = query.filter(TutorProfile.teaching_levels.any(TeachingLevel.id == level_id))
    if language_id:
        query = query.filter(TutorProfile.languages.any(Language.id == language_id))
    if mode:
        if mode == "both":
            query = query.filter(TutorProfile.teaching_mode == "both")
        else:
            query = query.filter(or_(TutorProfile.teaching_mode == mode, TutorProfile.teaching_mode == "both"))
    if price_min is not None:
        query = query.filter(TutorProfile.hourly_rate >= price_min)
    if price_max is not None:
        query = query.filter(TutorProfile.hourly_rate <= price_max)

    total = query.count()
    pages = max(1, math.ceil(total / page_size))

    if sort == "price_asc":
        query = query.order_by(TutorProfile.hourly_rate.asc().nulls_last())
    elif sort == "price_desc":
        query = query.order_by(TutorProfile.hourly_rate.desc().nulls_last())
    elif sort == "experience":
        query = query.order_by(TutorProfile.experience_years.desc())
    else:
        query = query.order_by(TutorProfile.created_at.desc())

    items = query.offset((page - 1) * page_size).limit(page_size).all()

    return PaginatedTutors(
        items=[_to_card(t) for t in items],
        total=total,
        page=page,
        page_size=page_size,
        pages=pages,
    )


@router.get("/me", response_model=TutorMeOut)
def get_my_profile(user: User = Depends(require_role("tutor")), db: Session = Depends(get_db)):
    return _to_me(_get_own_profile(user, db))


@router.put("/me", response_model=TutorMeOut)
def update_my_profile(
    payload: TutorProfileUpdate,
    user: User = Depends(require_role("tutor")),
    db: Session = Depends(get_db),
):
    profile = _get_own_profile(user, db)

    for field in ("biography", "qualification", "experience_years", "hourly_rate", "teaching_mode"):
        value = getattr(payload, field)
        if value is not None:
            setattr(profile, field, value)

    if payload.subject_ids is not None:
        profile.subjects = db.query(Subject).filter(Subject.id.in_(payload.subject_ids)).all()
    if payload.language_ids is not None:
        profile.languages = db.query(Language).filter(Language.id.in_(payload.language_ids)).all()
    if payload.location_ids is not None:
        profile.locations = db.query(Location).filter(Location.id.in_(payload.location_ids)).all()
    if payload.teaching_level_ids is not None:
        profile.teaching_levels = db.query(TeachingLevel).filter(TeachingLevel.id.in_(payload.teaching_level_ids)).all()

    db.commit()
    db.refresh(profile)
    return _to_me(profile)


@router.post("/me/photo", response_model=TutorMeOut)
def upload_my_photo(
    file: UploadFile,
    user: User = Depends(require_role("tutor")),
    db: Session = Depends(get_db),
):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="File must be an image")

    contents = file.file.read()
    max_bytes = settings.max_upload_mb * 1024 * 1024
    if len(contents) > max_bytes:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Image must be under {settings.max_upload_mb}MB")

    profile = _get_own_profile(user, db)

    upload_dir = Path(settings.upload_dir)
    upload_dir.mkdir(parents=True, exist_ok=True)

    ext = Path(file.filename or "").suffix.lower()
    if ext not in (".jpg", ".jpeg", ".png", ".webp"):
        ext = ".jpg"
    filename = f"{profile.id}{ext}"
    (upload_dir / filename).write_bytes(contents)

    profile.profile_photo = f"/uploads/{filename}"
    db.commit()
    db.refresh(profile)
    return _to_me(profile)


@router.post("/me/submit", response_model=TutorMeOut)
def submit_for_approval(
    user: User = Depends(require_role("tutor")),
    db: Session = Depends(get_db),
):
    profile = _get_own_profile(user, db)

    if profile.approval_status not in ("pending", "rejected"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Profile is already approved or suspended")

    missing = [f for f in REQUIRED_FOR_SUBMIT if getattr(profile, f) in (None, "")]
    if not profile.subjects:
        missing.append("subjects")
    if missing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Complete these fields before submitting: {', '.join(missing)}",
        )

    profile.approval_status = "pending"
    db.commit()
    db.refresh(profile)
    return _to_me(profile)


@router.get("/{tutor_id}", response_model=TutorDetailOut)
def get_tutor(tutor_id: uuid.UUID, db: Session = Depends(get_db)):
    profile = (
        db.query(TutorProfile)
        .join(User, TutorProfile.user_id == User.id)
        .filter(TutorProfile.id == tutor_id, TutorProfile.approval_status == "approved", User.status == "active")
        .first()
    )
    if profile is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tutor not found")
    return _to_detail(profile)
