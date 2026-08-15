import uuid
from datetime import datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.lookups import LanguageOut, LocationOut, SubjectOut, TeachingLevelOut


class TutorCardOut(BaseModel):
    """Summary shown in search results / featured tutor cards. No contact info."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    profile_photo: str | None
    biography: str | None
    experience_years: int
    hourly_rate: Decimal | None
    teaching_mode: str | None
    subjects: list[SubjectOut]
    locations: list[LocationOut]


class TutorDetailOut(TutorCardOut):
    """Full public profile. Still no email/phone — contact goes through the inquiry form."""

    qualification: str | None
    languages: list[LanguageOut]
    teaching_levels: list[TeachingLevelOut]


class PaginatedTutors(BaseModel):
    items: list[TutorCardOut]
    total: int
    page: int
    page_size: int
    pages: int


class TutorProfileUpdate(BaseModel):
    biography: str | None = Field(default=None, max_length=4000)
    qualification: str | None = Field(default=None, max_length=255)
    experience_years: int | None = Field(default=None, ge=0, le=80)
    hourly_rate: Decimal | None = Field(default=None, ge=0, le=100000)
    teaching_mode: Literal["online", "in_person", "both"] | None = None
    subject_ids: list[uuid.UUID] | None = None
    language_ids: list[uuid.UUID] | None = None
    location_ids: list[uuid.UUID] | None = None
    teaching_level_ids: list[uuid.UUID] | None = None


class TutorMeOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    profile_photo: str | None
    biography: str | None
    qualification: str | None
    experience_years: int
    hourly_rate: Decimal | None
    teaching_mode: str | None
    approval_status: str
    created_at: datetime
    updated_at: datetime
    subjects: list[SubjectOut]
    languages: list[LanguageOut]
    locations: list[LocationOut]
    teaching_levels: list[TeachingLevelOut]
