# Prolink handoff

Last updated: 2026-08-24

## Current milestone

Phase 1 (security, schema safety, and technical baseline) is implemented in the
repository. Phase 2 has not started, and the homepage has not been redesigned.
The product direction remains a Swedish service marketplace built around:

`service request -> offer -> chat -> delivery -> review`

The implementation intentionally keeps the existing customer/provider model for
the MVP. Do not add businesses/business members, payments, an admin dashboard,
moderation, normalized conversations, or destructive employment cleanup until a
later phase is explicitly approved.

## What Phase 1 contains

- Private profile data moved behind owner-only access in
  `user_private_profiles`; public profile column grants exclude phone and CV data.
- Private CV and chat-attachment buckets with owner/offer-participant policies.
- Stable attachment paths with signed URLs generated when read.
- Offer submission authorization and a transactional offer lifecycle:
  `pending -> accepted/rejected -> delivered -> completed`.
- A partial unique index prevents multiple winning offers for one request.
- A server-only Supabase service-role client for Auth Admin email lookups.
- HTML escaping for user-controlled transactional email content.
- Server-side validation for marketplace-critical API and profile inputs.
- Focused security-rule tests plus lint, typecheck, and test scripts.
- Migration-order correction in migration 005 and the additive security migration
  `supabase/migrations/010_phase1_security_baseline.sql`.

See `README.md` for local setup, environment variables, and migration commands.

## Required before deployment

1. Obtain the Development environment variables from the Vercel project
   `ths-projects-9e3c8e82/prolink`. The local Vercel CLI was authenticated as
   `webbdevstudio-7033`, which does not have access to that project, so the pull
   could not be completed. `.env.local` remains ignored and must never be
   committed. Re-authenticate with an account that can access the project, link
   it, and run `vercel env pull .env.local --environment=development`.
2. In production, run the duplicate-winner query documented in `README.md`.
   Resolve any returned rows manually before applying migration 010; the unique
   index deliberately refuses to choose or delete a winner.
3. Apply migration 010 to Supabase before deploying the application code.
4. Confirm the `cvs` and `attachments` buckets are private and test CV access,
   attachment access, offer acceptance, delivery, and completion with separate
   customer and provider accounts.
5. Confirm `SUPABASE_SERVICE_ROLE_KEY` and `RESEND_API_KEY` are server-only and
   configure the verified `RESEND_FROM_EMAIL` sender.

No database migration has been applied to the hosted Supabase project from this
workspace, and no Vercel deployment has been performed.

## Verification on 2026-08-24

- `npm run lint`: passed with warnings only (mostly existing explicit `any`
  warnings, one chat hook dependency warning, and two `<img>` warnings).
- `npm run typecheck`: passed.
- `npm test`: 5/5 passed.
- `npm run build`: passed. Existing `metadataBase` warnings remain.

## Recommended next action

Apply and smoke-test the Phase 1 database migration in a safe environment first.
After that baseline is live, define Phase 2 scope before changing product UI or
introducing the future business-account architecture.
