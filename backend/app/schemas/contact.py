from pydantic import BaseModel, Field


class ContactRequest(BaseModel):
    # full_name / email are intentionally NOT accepted from the client —
    # this endpoint requires a logged-in account, and those two fields are
    # always taken from it so they can't be spoofed (same pattern as
    # InquiryCreate).
    phone: str | None = Field(default=None, max_length=30)
    subject: str | None = Field(default=None, max_length=150)
    message: str = Field(min_length=5, max_length=2000)
    website: str | None = Field(default=None, max_length=200)  # honeypot
