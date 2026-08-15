import uuid
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, EmailStr, Field


class AdminTutorOut(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    name: str
    email: EmailStr
    subjects: list[str]
    approval_status: str
    account_status: str
    hourly_rate: Decimal | None
    created_at: datetime


class AdminTutorEdit(BaseModel):
    biography: str | None = None
    qualification: str | None = None
    experience_years: int | None = Field(default=None, ge=0, le=80)
    hourly_rate: Decimal | None = Field(default=None, ge=0, le=100000)
    teaching_mode: str | None = None


class AdminUserOut(BaseModel):
    id: uuid.UUID
    name: str
    email: EmailStr
    role: str
    phone: str | None
    status: str
    created_at: datetime


class AdminInquiryOut(BaseModel):
    id: uuid.UUID
    tutor_id: uuid.UUID
    tutor_name: str
    student_name: str
    student_email: EmailStr
    subject: str | None
    status: str
    created_at: datetime


class StatsOut(BaseModel):
    total_tutors: int
    pending_approvals: int
    total_inquiries: int
    active_tutors: int
    monthly_signups: list[dict]


class AdminLogOut(BaseModel):
    id: uuid.UUID
    admin_id: uuid.UUID
    admin_name: str
    action: str
    target_table: str
    target_id: uuid.UUID | None
    created_at: datetime
