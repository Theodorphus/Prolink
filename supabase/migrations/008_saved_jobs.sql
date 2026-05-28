-- Migration: sparade jobb (för jobbswipe + /saved)

CREATE TABLE IF NOT EXISTS saved_jobs (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  job_id     uuid        NOT NULL REFERENCES jobs(id)  ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, job_id)
);

ALTER TABLE saved_jobs ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS saved_jobs_user_idx ON saved_jobs (user_id);

CREATE POLICY "Users can read their own saved jobs"
  ON saved_jobs FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can save jobs"
  ON saved_jobs FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their saved jobs"
  ON saved_jobs FOR DELETE USING (auth.uid() = user_id);
