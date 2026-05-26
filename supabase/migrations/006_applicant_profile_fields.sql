-- Migration: Lägg till telefon, fritext-CV och CV-dokument-URL på användarprofilen
-- Kör i Supabase SQL Editor

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS phone   text,
  ADD COLUMN IF NOT EXISTS cv_text text,
  ADD COLUMN IF NOT EXISTS cv_url  text;

-- CV-URL sparas även på ansökan (snapshot vid ansökningstillfället)
ALTER TABLE applications
  ADD COLUMN IF NOT EXISTS cv_url text;

-- Storage bucket för CV-dokument
-- OBS: Buckets skapas i Supabase Dashboard → Storage → New bucket
-- Namn: "cvs", Public: true (så att arbetsgivare kan öppna länken)
-- Eller kör detta om du använder supabase CLI:
-- supabase storage create cvs --public

-- Storage policy: inloggade användare får ladda upp sina egna CV:n
-- Kör i Supabase SQL Editor om du skapar bucketen manuellt:
INSERT INTO storage.buckets (id, name, public)
VALUES ('cvs', 'cvs', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload own CV"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'cvs'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update own CV"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'cvs'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Anyone can read CVs"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'cvs');
