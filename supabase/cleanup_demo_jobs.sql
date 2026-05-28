-- ─────────────────────────────────────────
-- CLEANUP: ta bort alla demo-/seed-jobb
-- Kör i Supabase SQL Editor när du har tillräckligt med riktiga annonser.
-- ─────────────────────────────────────────

-- 1. Ta bort demo-jobben (saved_jobs/offers städas via ON DELETE CASCADE).
delete from public.jobs where is_demo = true;

-- 2. Ta bort de seedade arbetsgivarkontona.
--    Tar bort auth.users -> public.users städas via ON DELETE CASCADE.
delete from auth.users where email in (
  'jobb@anglamark-cafe.se',
  'jobb@stadbolagetgbg.se',
  'jobb@nordlager.se',
  'jobb@butiksgruppen.se'
);
