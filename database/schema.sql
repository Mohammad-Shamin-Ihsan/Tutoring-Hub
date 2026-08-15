-- TutorHub UAE — full schema for the "Tutoring_Hub_db" PostgreSQL database.
-- Run once against an empty database, e.g.:
--   psql -U <user> -d Tutoring_Hub_db -f database/schema.sql
--
-- Safe to re-run: every statement is guarded with IF NOT EXISTS / DROP ... IF EXISTS
-- where PostgreSQL supports it.

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto; -- gen_random_uuid()

-- ---------------------------------------------------------------------------
-- Enum types
-- ---------------------------------------------------------------------------

DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('tutor', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE user_status AS ENUM ('active', 'suspended');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE teaching_mode AS ENUM ('online', 'in_person', 'both');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE approval_status AS ENUM ('pending', 'approved', 'rejected', 'suspended');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE inquiry_status AS ENUM ('new', 'replied', 'archived');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------------------------------------------------------------------------
-- updated_at trigger helper
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------------------------------------------------
-- users
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS users (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name          VARCHAR(150) NOT NULL,
    email         VARCHAR(255) NOT NULL UNIQUE,
    password      VARCHAR(255) NOT NULL,
    role          user_role NOT NULL DEFAULT 'tutor',
    phone         VARCHAR(30),
    status        user_status NOT NULL DEFAULT 'active',
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------------
-- tutor_profiles
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS tutor_profiles (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id           UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    profile_photo     VARCHAR(500),
    biography         TEXT,
    qualification     VARCHAR(255),
    experience_years  INTEGER NOT NULL DEFAULT 0,
    hourly_rate       NUMERIC(10, 2),
    teaching_mode     teaching_mode,
    approval_status   approval_status NOT NULL DEFAULT 'pending',
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tutor_profiles_approval_status ON tutor_profiles(approval_status);
CREATE INDEX IF NOT EXISTS idx_tutor_profiles_hourly_rate ON tutor_profiles(hourly_rate);

DROP TRIGGER IF EXISTS trg_tutor_profiles_updated_at ON tutor_profiles;
CREATE TRIGGER trg_tutor_profiles_updated_at
    BEFORE UPDATE ON tutor_profiles
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------------
-- Lookup tables
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS subjects (
    id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name  VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS locations (
    id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    city  VARCHAR(100) NOT NULL,
    area  VARCHAR(100) NOT NULL,
    UNIQUE (city, area)
);

CREATE TABLE IF NOT EXISTS languages (
    id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name  VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS teaching_levels (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    level_name  VARCHAR(100) NOT NULL UNIQUE
);

-- ---------------------------------------------------------------------------
-- Tutor <-> lookup join tables
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS tutor_subjects (
    tutor_id    UUID NOT NULL REFERENCES tutor_profiles(id) ON DELETE CASCADE,
    subject_id  UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    PRIMARY KEY (tutor_id, subject_id)
);
CREATE INDEX IF NOT EXISTS idx_tutor_subjects_subject_id ON tutor_subjects(subject_id);

CREATE TABLE IF NOT EXISTS tutor_languages (
    tutor_id     UUID NOT NULL REFERENCES tutor_profiles(id) ON DELETE CASCADE,
    language_id  UUID NOT NULL REFERENCES languages(id) ON DELETE CASCADE,
    PRIMARY KEY (tutor_id, language_id)
);
CREATE INDEX IF NOT EXISTS idx_tutor_languages_language_id ON tutor_languages(language_id);

CREATE TABLE IF NOT EXISTS tutor_locations (
    tutor_id     UUID NOT NULL REFERENCES tutor_profiles(id) ON DELETE CASCADE,
    location_id  UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
    PRIMARY KEY (tutor_id, location_id)
);
CREATE INDEX IF NOT EXISTS idx_tutor_locations_location_id ON tutor_locations(location_id);

CREATE TABLE IF NOT EXISTS tutor_teaching_levels (
    tutor_id  UUID NOT NULL REFERENCES tutor_profiles(id) ON DELETE CASCADE,
    level_id  UUID NOT NULL REFERENCES teaching_levels(id) ON DELETE CASCADE,
    PRIMARY KEY (tutor_id, level_id)
);
CREATE INDEX IF NOT EXISTS idx_tutor_teaching_levels_level_id ON tutor_teaching_levels(level_id);

-- ---------------------------------------------------------------------------
-- inquiries
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS inquiries (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tutor_id       UUID NOT NULL REFERENCES tutor_profiles(id) ON DELETE CASCADE,
    student_name   VARCHAR(150) NOT NULL,
    student_email  VARCHAR(255) NOT NULL,
    student_phone  VARCHAR(30),
    subject        VARCHAR(100),
    message        TEXT NOT NULL,
    status         inquiry_status NOT NULL DEFAULT 'new',
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inquiries_tutor_id ON inquiries(tutor_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_status ON inquiries(status);
CREATE INDEX IF NOT EXISTS idx_inquiries_student_email ON inquiries(student_email);
CREATE INDEX IF NOT EXISTS idx_inquiries_created_at ON inquiries(created_at);

-- ---------------------------------------------------------------------------
-- admin_logs
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS admin_logs (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action        VARCHAR(255) NOT NULL,
    target_table  VARCHAR(100) NOT NULL,
    target_id     UUID,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_logs_admin_id ON admin_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created_at ON admin_logs(created_at);

COMMIT;
