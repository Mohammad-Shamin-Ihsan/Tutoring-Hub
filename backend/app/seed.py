"""Populate lookup tables and the first admin login.

Run with:  python -m app.seed
Safe to re-run — every insert is guarded by an existence check.
"""

from app.config import get_settings
from app.core.security import hash_password
from app.database import SessionLocal
from app.models.lookups import Language, Location, Subject, TeachingLevel
from app.models.user import User

SUBJECTS = [
    "Mathematics", "English", "Physics", "Chemistry", "Biology", "Arabic",
    "French", "Computer Science", "Economics", "Accounting", "History",
    "Geography", "Business Studies", "Art", "Music",
]

LOCATIONS = [
    ("Dubai", "Downtown Dubai"), ("Dubai", "Dubai Marina"), ("Dubai", "Jumeirah"),
    ("Dubai", "Business Bay"), ("Dubai", "Al Barsha"), ("Dubai", "Deira"),
    ("Dubai", "Arabian Ranches"), ("Dubai", "Mirdif"),
    ("Abu Dhabi", "Al Reem Island"), ("Abu Dhabi", "Khalifa City"), ("Abu Dhabi", "Al Bateen"),
    ("Sharjah", "Al Majaz"), ("Sharjah", "Al Nahda"),
]

LANGUAGES = ["English", "Arabic", "Hindi", "Urdu", "French", "Tagalog", "Russian"]

TEACHING_LEVELS = [
    "Kindergarten", "Primary", "Middle School", "IGCSE", "GCSE",
    "A-Levels", "IB", "University Prep", "University", "Adult Learners",
]


def seed() -> None:
    settings = get_settings()
    db = SessionLocal()
    try:
        for name in SUBJECTS:
            if not db.query(Subject).filter(Subject.name == name).first():
                db.add(Subject(name=name))

        for city, area in LOCATIONS:
            if not db.query(Location).filter(Location.city == city, Location.area == area).first():
                db.add(Location(city=city, area=area))

        for name in LANGUAGES:
            if not db.query(Language).filter(Language.name == name).first():
                db.add(Language(name=name))

        for level_name in TEACHING_LEVELS:
            if not db.query(TeachingLevel).filter(TeachingLevel.level_name == level_name).first():
                db.add(TeachingLevel(level_name=level_name))

        if not db.query(User).filter(User.email == settings.seed_admin_email).first():
            db.add(
                User(
                    name=settings.seed_admin_name,
                    email=settings.seed_admin_email,
                    password=hash_password(settings.seed_admin_password),
                    role="admin",
                    status="active",
                )
            )
            print(f"Created admin login: {settings.seed_admin_email}")
        else:
            print(f"Admin login already exists: {settings.seed_admin_email}")

        db.commit()
        print("Seed complete.")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
