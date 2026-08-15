import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class InquiryCreate(BaseModel):
    tutor_id: uuid.UUID
    student_name: str = Field(min_length=2, max_length=150)
    student_email: EmailStr
    student_phone: str | None = Field(default=None, max_length=30)
    subject: str | None = Field(default=None, max_length=100)
    message: str = Field(min_length=5, max_length=2000)
    # Honeypot: real users never fill this hidden field. Bots that
    # auto-fill every input will, and the submission is silently dropped.
    website: str | None = Field(default=None, max_length=200)


class InquiryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    tutor_id: uuid.UUID
    student_name: str
    student_email: EmailStr
    student_phone: str | None
    subject: str | None
    message: str
    status: str
    created_at: datetime


class InquiryStatusUpdate(BaseModel):
    status: str = Field(pattern="^(new|replied|archived)$")
