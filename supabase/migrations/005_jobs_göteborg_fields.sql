-- Migration: Lägg till fält för Göteborg-jobbmarknaden
-- Kör detta i Supabase SQL Editor

ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS salary         text,
  ADD COLUMN IF NOT EXISTS location       text,
  ADD COLUMN IF NOT EXISTS work_type      text,
  ADD COLUMN IF NOT EXISTS employer_name  text,
  ADD COLUMN IF NOT EXISTS employer_email text,
  ADD COLUMN IF NOT EXISTS contact_info   text;

-- Tabell för ansökningar
CREATE TABLE IF NOT EXISTS applications (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id           uuid NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  user_id          uuid REFERENCES users(id) ON DELETE SET NULL,  -- null om ej inloggad
  applicant_name   text NOT NULL,
  applicant_email  text NOT NULL,
  applicant_phone  text,
  message          text,
  created_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE (job_id, applicant_email)
);

-- RLS för applications
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- Vem som helst kan lämna en ansökan (anonym eller inloggad)
CREATE POLICY "Anyone can insert application"
  ON applications FOR INSERT
  WITH CHECK (true);

-- Jobbet ägare kan läsa ansökningar till sina jobb
CREATE POLICY "Job owner can read applications"
  ON applications FOR SELECT
  USING (
    job_id IN (
      SELECT id FROM jobs WHERE customer_id = auth.uid()
    )
  );

-- Index för snabba uppslag
CREATE INDEX IF NOT EXISTS applications_job_id_idx ON applications (job_id);
CREATE INDEX IF NOT EXISTS jobs_category_idx ON jobs (category);
CREATE INDEX IF NOT EXISTS jobs_location_idx ON jobs (location);
CREATE INDEX IF NOT EXISTS jobs_work_type_idx ON jobs (work_type);
