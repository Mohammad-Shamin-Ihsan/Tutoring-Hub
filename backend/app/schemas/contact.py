from pydantic import BaseModel, EmailStr, Field


class ContactRequest(BaseModel):
    full_name: str = Field(min_length=2, max_length=150)
    email: EmailStr
    phone: str | None = Field(default=None, max_length=30)
    subject: str | None = Field(default=None, max_length=150)
    message: str = Field(min_length=5, max_length=2000)
    website: str | None = Field(default=None, max_length=200)  # honeypot
