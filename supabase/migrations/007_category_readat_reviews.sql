-- Migration: category på jobs/services, read_at på offers, reviews-tabell

-- category på jobs
ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS category text;

-- category på services
ALTER TABLE services
  ADD COLUMN IF NOT EXISTS category text;

-- Läsindikator på offers (för chatt-notiser)
ALTER TABLE offers
  ADD COLUMN IF NOT EXISTS provider_read_at timestamptz,
  ADD COLUMN IF NOT EXISTS customer_read_at timestamptz;

-- Index för snabba kategori-filter
CREATE INDEX IF NOT EXISTS jobs_category_idx     ON jobs     (category);
CREATE INDEX IF NOT EXISTS services_category_idx ON services (category);

-- Reviews-tabell
CREATE TABLE IF NOT EXISTS reviews (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id     uuid        NOT NULL REFERENCES offers(id) ON DELETE CASCADE,
  reviewer_id  uuid        NOT NULL REFERENCES users(id)  ON DELETE CASCADE,
  reviewee_id  uuid        NOT NULL REFERENCES users(id)  ON DELETE CASCADE,
  rating       smallint    NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment      text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (offer_id, reviewer_id)
);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read reviews"
  ON reviews FOR SELECT USING (true);

CREATE POLICY "Offer participants can write review"
  ON reviews FOR INSERT
  WITH CHECK (auth.uid() = reviewer_id);
