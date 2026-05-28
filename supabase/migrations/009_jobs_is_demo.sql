-- Migration: markera demo-/seed-jobb så riktiga annonser kan visas först

ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS is_demo boolean NOT NULL DEFAULT false;

-- Sorteringsindex: riktiga jobb (is_demo = false) först, sedan nyast
CREATE INDEX IF NOT EXISTS jobs_demo_created_idx ON jobs (is_demo, created_at DESC);
