import uuid
from datetime import datetime

from sqlalchemy import Enum, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.database import Base


class TutorProfile(Base):
    __tablename__ = "tutor_profiles"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, server_default=func.gen_random_uuid())
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False
    )
    profile_photo: Mapped[str | None] = mapped_column(String(500), nullable=True)
    biography: Mapped[str | None] = mapped_column(Text, nullable=True)
    qualification: Mapped[str | None] = mapped_column(String(255), nullable=True)
    experience_years: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    hourly_rate: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)
    teaching_mode: Mapped[str | None] = mapped_column(
        Enum("online", "in_person", "both", name="teaching_mode"), nullable=True
    )
    approval_status: Mapped[str] = mapped_column(
        Enum("pending", "approved", "rejected", "suspended", name="approval_status"),
        nullable=False,
        default="pending",
    )
    created_at: Mapped[datetime] = mapped_column(server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(server_default=func.now(), onupdate=func.now(), nullable=False)

    user: Mapped["User"] = relationship(back_populates="tutor_profile")

    subjects = relationship("Subject", secondary="tutor_subjects", backref="tutors")
    languages = relationship("Language", secondary="tutor_languages", backref="tutors")
    locations = relationship("Location", secondary="tutor_locations", backref="tutors")
    teaching_levels = relationship("TeachingLevel", secondary="tutor_teaching_levels", backref="tutors")

    inquiries = relationship("Inquiry", back_populates="tutor", cascade="all, delete-orphan")
