# TutorHub UAE

MVP tutoring marketplace for Dubai/UAE. PostgreSQL + FastAPI backend, vanilla JS/HTML + Tailwind CSS frontend.

## Project Structure

```
database/     schema.sql — full DDL for the Tutoring_Hub_db database
backend/      FastAPI app (Python)
frontend/     Static HTML/JS pages, styled with Tailwind CSS
```

## 1. Database Setup

1. Create an empty PostgreSQL database named `Tutoring_Hub_db`.
2. Run the schema script against it:

   ```bash
   psql -U postgres -d Tutoring_Hub_db -f database/schema.sql
   ```

   (Or open `database/schema.sql` in pgAdmin's query tool and execute it.)

This creates all tables, enums, foreign keys, and indexes. Safe to re-run.

## 2. Backend Setup

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate          # Windows
pip install -r requirements.txt
copy .env.example .env          # then edit DATABASE_URL with your real Postgres password
```

Edit `backend/.env`:
- `DATABASE_URL` — set the password for your `Tutoring_Hub_db` connection.
- `JWT_SECRET` — set to any long random string.
- `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` — the admin login the seed script creates.
- SMTP settings are optional in dev — if left blank, emails are printed to the console instead of sent.

Baseline the Alembic migration history (the schema was already created by `schema.sql`, so this just marks it as up to date for future migrations):

```bash
alembic stamp head
```

Seed lookup data (subjects, locations, languages, teaching levels) and the first admin login:

```bash
python -m app.seed
```

Run the API:

```bash
uvicorn app.main:app --reload --port 8000
```

API docs available at `http://localhost:8000/docs`.

## 3. Frontend Setup

```bash
cd frontend
npm install
npm run build      # compiles Tailwind -> css/styles.css (one-time)
npm run watch       # or: rebuild on every change while developing
```

Serve the `frontend/` folder as static files, e.g.:

```bash
python -m http.server 5500
```

Then open `http://localhost:5500/index.html`. Make sure the port you serve on (e.g. `5500`) is listed in `FRONTEND_ORIGINS` in `backend/.env` so CORS allows it.

## 4. First Run Walkthrough

1. Open the site, browse Search Tutors — empty until a tutor is approved.
2. Go to **Become a Tutor**, complete the 4-step wizard, submit for approval.
3. Log in as the seeded admin (`SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`) at `/login.html`.
4. In the admin dashboard, go to **Tutors**, approve the new tutor.
5. The tutor now appears in Search. Open their profile and send a test inquiry.
6. Log back in as the tutor to see the inquiry in their dashboard.

## Notes

- Profile photos are stored on local disk under `backend/static/uploads/` and served at `/uploads/...`.
- No payment, reviews/ratings, or messaging system — these are out of scope for the MVP per the project brief and can be added later.
- Legal page content (Privacy Policy, Terms & Conditions) is placeholder text — replace with real copy before launch.
- Arabic/RTL support is structurally prepared (footer language toggle, `lang`/`dir` ready) but not translated yet.
