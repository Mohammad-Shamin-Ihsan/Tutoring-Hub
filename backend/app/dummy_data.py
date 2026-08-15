"""Populate realistic dummy data for manual testing: several tutors in
different approval states, spread signup dates (for the admin signups
chart), and a handful of inquiries in different statuses.

Run with:  python -m app.dummy_data
Safe to re-run — skips any tutor whose email already exists.
Requires `python -m app.seed` to have been run first (subjects/locations/
languages/teaching_levels must already exist).
"""

from datetime import datetime, timedelta, timezone

from app.core.security import hash_password
from app.database import SessionLocal
from app.models.admin_log import AdminLog
from app.models.inquiry import Inquiry
from app.models.lookups import Language, Location, Subject, TeachingLevel
from app.models.tutor_profile import TutorProfile
from app.models.user import User

DUMMY_PASSWORD = "Password123!"

TUTORS = [
    {
        "name": "Sarah Ahmed",
        "email": "sarah.ahmed@example.com",
        "phone": "+971501234567",
        "months_ago": 5,
        "biography": "Passionate mathematics educator with 8+ years teaching IB, A-Levels, and IGCSE curricula across Dubai's international schools. Specialized in preparing students for university entrance exams with a proven track record of improving grades and building lasting confidence in mathematics.",
        "qualification": "PhD Mathematics — Imperial College London",
        "experience_years": 8,
        "hourly_rate": 150,
        "teaching_mode": "both",
        "approval_status": "approved",
        "subjects": ["Mathematics", "Physics"],
        "languages": ["English", "Arabic"],
        "locations": [("Dubai", "Dubai Marina")],
        "levels": ["Kindergarten", "Primary", "IGCSE"],
    },
    {
        "name": "James Miller",
        "email": "james.miller@example.com",
        "phone": "+971502345678",
        "months_ago": 4,
        "biography": "English literature and history tutor focused on building strong writing and critical thinking skills for GCSE and A-Level students.",
        "qualification": "MA English Literature — University of Manchester",
        "experience_years": 5,
        "hourly_rate": 120,
        "teaching_mode": "online",
        "approval_status": "approved",
        "subjects": ["English", "History"],
        "languages": ["English"],
        "locations": [("Dubai", "Downtown Dubai")],
        "levels": ["GCSE", "A-Levels"],
    },
    {
        "name": "Fatima Al Zahra",
        "email": "fatima.alzahra@example.com",
        "phone": "+971503456789",
        "months_ago": 3,
        "biography": "Native Arabic speaker offering Arabic and French lessons for students of all levels, from beginners to fluent conversation practice.",
        "qualification": "BA Modern Languages — American University of Sharjah",
        "experience_years": 4,
        "hourly_rate": 100,
        "teaching_mode": "both",
        "approval_status": "approved",
        "subjects": ["Arabic", "French"],
        "languages": ["Arabic", "French", "English"],
        "locations": [("Dubai", "Business Bay")],
        "levels": ["Middle School", "IGCSE"],
    },
    {
        "name": "Raj Patel",
        "email": "raj.patel@example.com",
        "phone": "+971504567890",
        "months_ago": 2,
        "biography": "Computer science professional turned educator, teaching programming fundamentals and advanced mathematics to university-prep students.",
        "qualification": "MSc Computer Science — Khalifa University",
        "experience_years": 10,
        "hourly_rate": 180,
        "teaching_mode": "online",
        "approval_status": "approved",
        "subjects": ["Computer Science", "Mathematics"],
        "languages": ["English", "Hindi"],
        "locations": [("Abu Dhabi", "Al Reem Island")],
        "levels": ["University Prep", "University"],
    },
    {
        "name": "Elena Petrova",
        "email": "elena.petrova@example.com",
        "phone": "+971505678901",
        "months_ago": 0,
        "biography": "Chemistry and biology tutor with a focus on IB and A-Level sciences, helping students build strong lab and exam technique.",
        "qualification": "BSc Chemistry — Higher School of Economics",
        "experience_years": 6,
        "hourly_rate": 140,
        "teaching_mode": "in_person",
        "approval_status": "pending",
        "subjects": ["Chemistry", "Biology"],
        "languages": ["Russian", "English"],
        "locations": [("Sharjah", "Al Majaz")],
        "levels": ["IB", "A-Levels"],
    },
    {
        "name": "Omar Hassan",
        "email": "omar.hassan@example.com",
        "phone": "+971506789012",
        "months_ago": 1,
        "biography": "Creative arts tutor offering music theory and drawing lessons for young learners.",
        "qualification": "BA Fine Arts — Dubai Institute of Design",
        "experience_years": 3,
        "hourly_rate": 90,
        "teaching_mode": "both",
        "approval_status": "rejected",
        "subjects": ["Music", "Art"],
        "languages": ["Arabic", "English"],
        "locations": [("Dubai", "Jumeirah")],
        "levels": ["Kindergarten", "Primary"],
    },
]

INQUIRIES = [
    {"tutor_email": "sarah.ahmed@example.com", "student_name": "Layla Nasser", "student_email": "layla.n@example.com", "student_phone": "+971509876543", "subject": "Mathematics", "message": "Hi, my daughter is in Year 10 IGCSE and struggling with algebra. Do you have availability for twice-weekly sessions?", "status": "new"},
    {"tutor_email": "sarah.ahmed@example.com", "student_name": "Ahmed Saeed", "student_email": "ahmed.saeed@example.com", "student_phone": None, "subject": "Physics", "message": "Looking for A-Level physics tutoring, online preferred. What's your availability like on weekends?", "status": "replied"},
    {"tutor_email": "sarah.ahmed@example.com", "student_name": "Mona Khalil", "student_email": "mona.k@example.com", "student_phone": "+971501112222", "subject": "Mathematics", "message": "Need help preparing for university entrance exams over the summer.", "status": "new"},
    {"tutor_email": "james.miller@example.com", "student_name": "Sophie Turner", "student_email": "sophie.t@example.com", "student_phone": "+971503334444", "subject": "English", "message": "My son needs help with his GCSE English coursework and essay writing.", "status": "new"},
    {"tutor_email": "james.miller@example.com", "student_name": "David Cohen", "student_email": "david.c@example.com", "student_phone": None, "subject": "History", "message": "Interested in A-Level history tutoring, modern European history focus.", "status": "archived"},
    {"tutor_email": "raj.patel@example.com", "student_name": "Priya Sharma", "student_email": "priya.s@example.com", "student_phone": "+971505556666", "subject": "Computer Science", "message": "Looking for help with a university-level programming course, Python and data structures.", "status": "new"},
]


def months_ago(n: int) -> datetime:
    return datetime.now(timezone.utc) - timedelta(days=30 * n)


def get_lookup_map(db, model, key_attr):
    return {getattr(row, key_attr): row for row in db.query(model).all()}


def run() -> None:
    db = SessionLocal()
    try:
        subjects_by_name = get_lookup_map(db, Subject, "name")
        languages_by_name = get_lookup_map(db, Language, "name")
        levels_by_name = get_lookup_map(db, TeachingLevel, "level_name")
        locations_by_key = {(loc.city, loc.area): loc for loc in db.query(Location).all()}

        if not subjects_by_name or not locations_by_key:
            print("No lookup data found — run `python -m app.seed` first.")
            return

        admin = db.query(User).filter(User.role == "admin").first()

        created_tutors = {}
        for t in TUTORS:
            existing = db.query(User).filter(User.email == t["email"]).first()
            if existing:
                print(f"Skipping {t['email']} (already exists)")
                created_tutors[t["email"]] = db.query(TutorProfile).filter(TutorProfile.user_id == existing.id).first()
                continue

            user = User(
                name=t["name"],
                email=t["email"],
                password=hash_password(DUMMY_PASSWORD),
                phone=t["phone"],
                role="tutor",
                status="active",
                created_at=months_ago(t["months_ago"]),
            )
            db.add(user)
            db.flush()

            profile = TutorProfile(
                user_id=user.id,
                biography=t["biography"],
                qualification=t["qualification"],
                experience_years=t["experience_years"],
                hourly_rate=t["hourly_rate"],
                teaching_mode=t["teaching_mode"],
                approval_status=t["approval_status"],
                created_at=months_ago(t["months_ago"]),
            )
            profile.subjects = [subjects_by_name[name] for name in t["subjects"] if name in subjects_by_name]
            profile.languages = [languages_by_name[name] for name in t["languages"] if name in languages_by_name]
            profile.teaching_levels = [levels_by_name[name] for name in t["levels"] if name in levels_by_name]
            profile.locations = [locations_by_key[key] for key in t["locations"] if key in locations_by_key]
            db.add(profile)
            db.flush()
            created_tutors[t["email"]] = profile

            log_action = {"approved": "approve_tutor", "rejected": "reject_tutor"}.get(t["approval_status"])
            if admin and log_action:
                db.add(
                    AdminLog(
                        admin_id=admin.id,
                        action=log_action,
                        target_table="tutor_profiles",
                        target_id=profile.id,
                        created_at=months_ago(max(0, t["months_ago"] - 1)),
                    )
                )

            print(f"Created tutor: {t['email']} ({t['approval_status']})")

        for inq in INQUIRIES:
            profile = created_tutors.get(inq["tutor_email"])
            if profile is None:
                continue
            exists = (
                db.query(Inquiry)
                .filter(Inquiry.tutor_id == profile.id, Inquiry.student_email == inq["student_email"])
                .first()
            )
            if exists:
                continue
            db.add(
                Inquiry(
                    tutor_id=profile.id,
                    student_name=inq["student_name"],
                    student_email=inq["student_email"],
                    student_phone=inq["student_phone"],
                    subject=inq["subject"],
                    message=inq["message"],
                    status=inq["status"],
                )
            )
            print(f"Created inquiry: {inq['student_name']} -> {inq['tutor_email']}")

        db.commit()
        print("\nDummy data complete.")
        print(f"All dummy tutor accounts use the password: {DUMMY_PASSWORD}")
    finally:
        db.close()


if __name__ == "__main__":
    run()
