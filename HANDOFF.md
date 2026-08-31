# Prolink handoff

Last updated: 2026-08-31 (Phase 2)

## Current milestone

Phase 1 (security, schema safety, and technical baseline) is implemented in the
repository and applied to the hosted Supabase project. The framework has been
upgraded to Next.js 16, and the employment-board features have been retired.
Phase 2 (product, trust and conversion) is implemented; see the Phase 2
section below.
The product direction is now explicitly a Swedish freelance-service marketplace
for small businesses and independent specialists, built around:

`assignment -> offer -> chat -> delivery -> review`

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

## Deployment status

Verified against the hosted Supabase project `rklfxgefhtnkyibbdpzc` on
2026-08-31. Migrations 001-011 are all applied. Earlier revisions of this file
stated that no migration had been applied; that is no longer true.

Confirmed live in the hosted database:

- Migrations 001-011 present in the migration history.
- The duplicate-winner query from `README.md` returns zero rows, and the partial
  unique index that prevents multiple winning offers exists.
- `user_private_profiles` exists and `messages.attachment_path` exists.
- The `cvs` and `attachments` buckets are both private; neither is public.
- Row level security is enabled on every table in the `public` schema.
- `jobs.is_demo` is dropped and the Gothenburg demo rows are gone (migration
  011). Three real assignments remain.

The `applications` and `saved_jobs` tables still exist in the database. The
application code no longer reads or writes them, and the corresponding UI has
been removed. Dropping them is deliberately deferred to a later phase so that
existing rows (4 applications, 2 saved jobs) are not destroyed without an
explicit decision.

## Still required before deployment

1. Link the local workspace to the Vercel project and pull the development
   environment variables. There is no `.vercel/` directory in the workspace, so
   the project is not linked locally:

   ```bash
   vercel link --scope webbdev --project prolink
   vercel env pull .env.local --environment=development
   ```

   `.env.local` exists locally, remains gitignored, and must never be committed.
2. Confirm `SUPABASE_SERVICE_ROLE_KEY` and `RESEND_API_KEY` are server-only and
   configure the verified `RESEND_FROM_EMAIL` sender.
3. Enable Leaked Password Protection in Supabase Auth once the organization is
   on a paid plan. It is currently disabled and is the only actionable finding
   from the Supabase security advisors, but it **requires the Pro Plan or
   above**, and the organization `frtsmkaudnjxdxbcczig` is on the Free plan as
   of 2026-08-31. The advisor will keep reporting this until the plan is
   upgraded; that is expected and not a regression. No code change is needed,
   only the toggle at
   `Authentication -> Providers -> Email` in the dashboard.
4. Smoke-test CV access, attachment access, offer acceptance, delivery, and
   completion with separate customer and provider accounts. No offers exist in
   the database yet (0 rows), so the offer lifecycle has never been exercised
   against real data.
5. Verify that the production deployment picked up the current `master`. See
   the deployment section below.

### Password policy

Leaked password protection is gated behind the Pro Plan, so the settings that
are available on the Free plan were tightened instead on 2026-08-31:

- `supabase/config.toml` now sets `minimum_password_length = 8` and
  `password_requirements = "lower_upper_letters_digits"`. This file governs the
  local development stack only.
- **The hosted project must be changed separately in the dashboard.** The same
  two settings live at `Authentication -> Providers -> Email`. Until they are
  set there, the hosted project still accepts 6-character passwords.
- Registration in `src/lib/actions/auth.ts` now requires 8 characters, matching
  the intended server policy, and `RegisterForm` states the same minimum.
- Login deliberately still accepts 6 characters so existing accounts created
  under the old policy can still sign in. Raising it would lock those users out
  without a password reset flow.
- Supabase returns English error strings. `registerErrorMessage` translates the
  cases a user can actually hit, including the leaked-password rejection, so the
  message is already handled when the Pro toggle is switched on.

### Vercel

Verified 2026-08-31. The project is `prolink` (`prj_CnAC151RpS9mKBPNilQYFOAQ8bcv`)
on team `webbdev` (`team_TXS7AWULHA2AsKOTTzvgy0mW`), owned by the same
`webbdevstudio` account as the Supabase project. Earlier revisions of this file
named `ths-projects-9e3c8e82/prolink` and stated that no deployment had been
performed; both were wrong. There is no account ownership mismatch.

- Framework preset: Next.js. Node version: 24.x, which satisfies the
  `>=20.9 <25` range in `package.json`.
- Pushes to `master` deploy automatically. The commits from 2026-08-31,
  including the `employer_email` / `contact_info` fix, deployed to production
  and reported `READY`.
- Domains: `prolink-one.vercel.app`, `prolink-webbdev.vercel.app`,
  `prolink-git-master-webbdev.vercel.app`.
- The project reports `live: false`, so confirm in the dashboard whether the
  production alias is intentionally not serving yet.
- Listing deployments over the API returned 403 with the current credentials, so
  deployment history must be checked in the dashboard.

### Supabase advisor findings that are not defects

The security advisors flag four `SECURITY DEFINER` functions as callable through
the REST API. These were reviewed on 2026-08-31 and are expected:

- `handle_new_user` and `handle_new_private_profile` are trigger functions. Each
  is bound to exactly one trigger, takes no arguments, and returns `trigger`, so
  it cannot be invoked meaningfully over PostgREST.
- `transition_offer` and `mark_offer_read` are intentionally `SECURITY DEFINER`
  and perform their own authorization checks internally. That is the mechanism
  by which the offer lifecycle is enforced in the database.

## Framework upgrade (2026-08-31)

- Next.js 16.3.2 with Turbopack and React 19.2.
- `src/middleware.ts` became `src/proxy.ts` for the Next 16 Proxy API. The build
  output reports it as `Proxy (Middleware)`, which confirms it is wired up.
- Flat ESLint configuration in `eslint.config.mjs` with `eslint-config-next` 16.
- `.nvmrc` and the `engines` field pin Node to `>=20.9 <25`.

## Retired features (2026-08-31)

Jobbswipe, saved jobs, the application flow, and CV upload were removed, along
with the Gothenburg demo seed. This narrows the product to
`assignment -> offer -> chat -> delivery -> review`.

## Verification on 2026-08-31

- `npm run typecheck`: passed.
- `npm test`: 5/5 passed.
- `npm run build`: passed, 18 routes generated.
- `npm run lint`: 0 errors, 23 warnings. The warning rules are deliberately
  downgraded in `eslint.config.mjs`.

## Phase 2 (2026-08-31)

Product, trust and conversion work. No destructive database change, no payments,
escrow, AI matching, company accounts or admin panel. The core flow is unchanged:
`assignment -> offer -> chat -> delivery -> completion -> review`.

### Public provider profiles

`/profile/[id]` is no longer behind the proxy. The provider profile is the most
important trust surface and had to be readable before signup.

Verified as `anon` against the hosted database on 2026-08-31: a signed-out
visitor can read profiles, services, reviews and jobs, gets **zero** offers, and
is denied `user_private_profiles` at the grant level before RLS is even reached.
The `users` grants expose only `id, role, name, bio, skills, hourly_rate,
avatar_url, linkedin_url, created_at` to `anon` — phone and CV are not grantable.
Editing still renders only for the signed-in owner, and contacting, offering and
chatting still require login.

### Migration 012

Applied to the hosted project and verified, recorded there as
`20260831050847_fix_review_policy_bypass`. The `reviews` table now has exactly
one insert policy and one read policy.

### What changed

- Homepage repositioned around remote-delivered specialist services, with the
  two paths (post an assignment vs. browse packaged services) explained near the
  top instead of repeating one process twice.
- Category cards said "Hitta specialist" but linked to the job list. They now
  link to filtered services. Added `juridik` (Juridik & avtal); renamed
  `foto-video` to "Foto, video & redigering" and `redovisning` to "Ekonomi &
  redovisning". Category is free text in the database with no check constraint,
  so this needed no migration.
- Profile page rebuilt: services, skills, hourly rate, LinkedIn, member since,
  average rating and review count, with explicit empty states.
- Job detail: key facts as a scannable grid, description promoted to the main
  content with its own heading, publisher card, and a panel explaining what
  happens after an offer.
- Service detail: full description, provider block with rating and skills, link
  to the public profile, and contact CTA.
- Shared `JobCard` and `ServiceCard` replace duplicated markup. Removed the
  unused `TaskCard`, `ServiceCard`, `CategoryCard` and `StepCard` at
  `src/components/`, plus an empty leftover `src/components/swipe/`. Verified
  unused before deletion.
- Mobile: hero heading scaled down, four priority categories with a "Visa alla
  kategorier" disclosure, two recent jobs, and an "Alla uppdrag" link that is
  visible on mobile where the header link is hidden.
- Login now explains why an account is needed, keyed off the `redirect` the
  proxy already sets, and states that publishing is free.
- `useFormState` migrated to React 19 `useActionState`.
- `.claude/settings.json` and `.claude/settings.local.json` pointed at a
  `projects\Prolink` path missing the `Övrigt` folder, and at a non-existent
  `Theod` user. Both corrected.

### Deliberate limits

- **Offer counts are not shown publicly.** RLS restricts `offers` to its
  participants, so a public visitor would always be served `0` — a misleading
  number rather than a safe one. The count is shown only to the job owner.
- **Service prices are labelled "frånpris", not "fast pris."** The `services`
  table has a single price column and no way to express scope, so calling it a
  fixed price promises more than the data model carries.
- **No purchase language.** Services cannot be ordered in Prolink, so the CTAs
  say "Diskutera tjänsten" and "Kontakta leverantören", and both detail pages
  state that payment is settled directly between the parties.
- **No invented numbers.** Completed assignments cannot be counted from public
  data without leaking offers, so no such figure is shown. Nothing about
  verification, response time or activity is fabricated.

### Recommended for a future database phase

These need a migration and were deliberately not faked:

- `services`: structured `deliverables`, `revisions`, `scope` and an optional
  `price_type` so a service can state what is included and whether the price is
  fixed or a starting point.
- `offers`: a public, aggregated count per job (a view or counter column) so the
  job page can show interest without exposing offers.
- `users`: a counter or view for completed deliveries, to show experience
  without reading the offer table.
- Foreign-key relationships in the generated types, so embedded relations stop
  being inferred as arrays and the manual `Array.isArray` normalisation can go.
- Decide whether to drop the unused `applications` and `saved_jobs` tables.

### Verification 2026-08-31 (Phase 2)

- `npm run lint`: 0 errors, 23 warnings (rules deliberately downgraded).
- `npm run typecheck`: passed.
- `npm test`: 7/7 passed.
- `npm run build`: passed, 18 routes. No dev indicators in the production output.

## Recommended next action

The Phase 1 database baseline is live and verified, so the remaining blockers
are environment configuration rather than schema work:

1. Smoke-test the full offer lifecycle with separate customer and provider
   accounts, since no offers exist yet. This is the highest-value remaining
   check: the transactional offer logic is the core of the product and has so
   far only been exercised by unit tests.
2. Apply the password length and character requirements to the hosted project in
   the dashboard. The repository change only affects local development.
3. Confirm whether the production alias should be serving, given `live: false`.
4. Link the workspace to Vercel and pull the development environment variables.
5. Decide whether the Pro Plan is worth it. Leaked password protection is the
   only blocked security item, and it is the only thing that plan is needed for
   here.

After that, define Phase 2 scope before changing product UI or introducing the
future business-account architecture. Decide explicitly whether to drop the now
unused `applications` and `saved_jobs` tables.
