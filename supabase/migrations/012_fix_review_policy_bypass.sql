-- Migration 010 added a strict review policy but never dropped the permissive
-- one it was meant to replace. Postgres combines permissive policies with OR,
-- so "Inloggade kan skriva recensioner" (which only checks that the reviewer is
-- the logged-in user) allowed any authenticated user to review any other user
-- without a completed offer. That defeats the strict policy entirely and makes
-- fabricated reviews possible, which is the core trust signal of the
-- marketplace.
drop policy if exists "Inloggade kan skriva recensioner" on public.reviews;

-- The duplicate read policy is redundant rather than unsafe: reviews are meant
-- to be publicly readable. Dropping one keeps a single source of truth.
drop policy if exists "Alla kan läsa recensioner" on public.reviews;
