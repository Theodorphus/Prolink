-- Remove the legacy Gothenburg employment demo content.
-- Related saved jobs, applications, offers, messages, and reviews are removed
-- through their foreign-key cascades.
--
-- This migration was applied directly to the hosted project before it was
-- committed here. It is recorded so a replay of supabase/migrations reproduces
-- the production schema.
delete from public.jobs where is_demo = true;

drop index if exists public.jobs_demo_created_idx;

alter table public.jobs drop column if exists is_demo;
