# Prolink handoff

Last updated: 2026-08-29

## Product direction

Prolink is being narrowed into a **free alternative to Offerta**: customers post a
request, and freelancers (web developers, economists, designers — the kind of
people who currently advertise in Facebook groups) are matched to it and send
offers. The core loop is the original marketplace flow:

`service request -> offer -> chat -> delivery -> review`

The Gothenburg employment-board flow is being retired. Jobbswipe and saved jobs
were removed on 2026-08-29. The remaining employment-board surface (`applications`
/ Easy Apply, and the `salary` / `work_type` / `employer_name` fields on `jobs`)
has **not** been removed yet — see "Next block" below.

## Database state — verified 2026-08-29

Migrations **010 and 011 are both applied** to the hosted project
`rklfxgefhtnkyibbdpzc`. Verified directly against the database and the live REST
API:

- `user_private_profiles` exists with RLS enabled (16 rows).
- `cvs` and `attachments` buckets are private, with 5 MB / 10 MB limits.
- `anon` cannot read `phone`, `cv_text` or `cv_url` from `users` (`42501`).
  Column grants expose only id, role, name, bio, skills, hourly_rate,
  avatar_url, linkedin_url, created_at.
- `offers_one_winner_per_job_idx` exists; 0 duplicate winners.
- `transition_offer` and `mark_offer_read` exist; `authenticated` has only
  SELECT/INSERT on `offers`.
- `messages.attachment_path` exists.
- `applications`, `saved_jobs` and `messages` return empty to `anon` (RLS holds).

The duplicate-winner check in `README.md` is moot: `offers`, `messages` and
`reviews` all have **0 rows**. The offer lifecycle has never been exercised
against real data.

### Migration drift — resolved

Migration 011 (`remove_demo_jobs`) had been applied to the database but was never
committed. It dropped `jobs.is_demo`, while three pages still ordered by that
column, so PostgREST returned `42703` and — because all three ignored `error` —
the homepage, `/jobs` and `/swipe` silently rendered **zero jobs**. Lint,
typecheck, tests and build all passed throughout.

Fixed on 2026-08-29: `011_remove_demo_jobs.sql` is now committed, the ordering is
removed, and the remaining list queries log their errors.

Note: `supabase/cleanup_demo_jobs.sql` and `supabase/seed_jobs_goteborg.sql` still
reference `is_demo` and will now fail if run. They are legacy employment-board
scripts and should be deleted with the rest of that flow.

## Verification on 2026-08-29

- `npm run typecheck`: passed (clean `.next` required after route deletions).
- `npm test`: 5/5 passed.
- `npm run build`: passed, no `metadataBase` warning.
- `npm run lint`: warnings only — remaining explicit `any`s and two `<img>`
  elements. The chat `useEffect` warning was reviewed and suppressed with an
  explanation: the Supabase client comes from a `useRef` and is stable.
- Production dependency vulnerabilities: **7 (4 high) → 2 (2 high)** via
  `npm audit fix` without `--force`.

## Required before deployment

1. **Next.js is the only dependency risk left.** `next@14.2.35` and its bundled
   `postcss` account for both remaining high-severity advisories. 14.2.35 *is*
   the latest 14.x, so there is no patch release to move to. The path is
   14.2.35 → **15.5.24** (the maintained `backport` tag), not the `16.3.3` that
   `npm audit fix --force` proposes. Next 15 makes `params` and `searchParams`
   async, which touches `/jobs` and every `[id]` / `[offerId]` route. Use
   `npx @next/codemod@canary upgrade` and re-check each advisory afterwards.
2. **Smoke-test the full loop with two accounts** (customer + provider): create
   request → send offer → accept → chat with attachment → deliver → complete →
   review. Nothing in this chain has run against real data. Confirm CVs and
   attachments are unreadable by a third account.
3. `jobs.employer_email` and `jobs.contact_info` are readable by `anon` at the
   database level. Public listings now select an explicit column list
   (`src/lib/jobs.ts`) that excludes them, but the grant itself should be
   revoked when the employment-board fields are removed.
4. Supabase advisors (all WARN): `handle_new_private_profile()` is callable as an
   RPC by `anon` — migration 010 did not revoke execute on it. Low risk, since a
   trigger function refuses a direct call, but worth tightening. Leaked-password
   protection is disabled in Auth settings.
5. Confirm `SUPABASE_SERVICE_ROLE_KEY` and `RESEND_API_KEY` stay server-only and
   that `RESEND_FROM_EMAIL` is a verified sender.

## Vercel

The project is at `https://vercel.com/webbdev/prolink`. The Vercel credentials
available to tooling in this workspace return 404 for it and only list
swedensweet, erotikm-ssan, webbdev and widkull under the `webbdev` team, so
deployment state could not be verified from here. `master` is level with
`origin/master`.

## Next block

1. Retire the rest of the employment-board flow: `applications` / Easy Apply, the
   `salary` / `work_type` / `employer_name` / `employer_email` / `contact_info`
   columns, the legacy seed and cleanup scripts, and the "Jobb i Göteborg"
   copy. This is the destructive cleanup that earlier phases deliberately
   deferred — it is now approved by the direction above.
2. Generate Supabase types from the real database rather than maintaining
   `src/types/database.ts` by hand. The `is_demo` outage was caused by exactly
   this drift, so treat it as a correctness fix, not hygiene:
   `npx supabase gen types typescript --project-id rklfxgefhtnkyibbdpzc --schema public`
3. Next.js upgrade (see above).
4. Redesign the homepage around the freelancer-matching pitch. It still sells
   "Göteborgs enklaste jobbsajt" and has never been redesigned.
