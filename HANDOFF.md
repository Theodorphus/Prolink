# Prolink handoff

Last updated: 2026-09-20 (offer lifecycle smoke test)

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

Revised 2026-09-20. Items 1, 4 and 5 of the previous list are resolved; see
"Verified state on 2026-09-20" at the end of this file.

1. **Fix outgoing email — the one open defect.** `RESEND_FROM_EMAIL` is unset
   and the fallback sender `noreply@prolink.se` is not a verified Resend domain,
   so every transactional mail fails with 403 and does so silently. Details in
   the email section below.
2. Enable Leaked Password Protection in Supabase Auth once the organization is
   on a paid plan. It is currently disabled and is the only actionable finding
   from the Supabase security advisors, but it **requires the Pro Plan or
   above**, and the organization `frtsmkaudnjxdxbcczig` is on the Free plan as
   of 2026-08-31. The advisor will keep reporting this until the plan is
   upgraded; that is expected and not a regression. No code change is needed,
   only the toggle at
   `Authentication -> Providers -> Email` in the dashboard.
3. Apply the password length and character requirements to the hosted project.
   The repository change governs local development only.

Resolved since the previous revision:

- The workspace **is** linked to Vercel and `.env.local` is populated (only
  `RESEND_FROM_EMAIL` is missing).
- Production **is** serving current `master`.
- The offer lifecycle **has** now been exercised against real data: 32/32 checks
  passed. CV and attachment access were not part of that run, since the CV
  upload feature was retired on 2026-08-31 and no attachments exist.

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
- The project reported `live: false` on 2026-08-31, but as of 2026-09-20
  `https://prolink-one.vercel.app/` returns 200 and serves current `master`, so
  the production alias is live.
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

## Smoke test of the offer lifecycle (2026-09-20)

The highest-value remaining check from the previous revision is **done**. The
full lifecycle was exercised against the hosted database with three real
authenticated accounts (customer, provider, second provider), driven through
PostgREST with user JWTs so that RLS and `auth.uid()` applied exactly as they do
in the app. The service-role key was used only to inject one race-condition row
and to clean up afterwards.

**32 of 32 checks passed.** All test data was removed afterwards; the database
is back to 16 users, 3 jobs, 3 services and 0 offers/reviews/messages.

Positive path, end to end:

- Customer publishes a request; provider submits an offer.
- Customer accepts. The request is automatically set to `closed`.
- Provider marks delivered; customer completes. Offer ends at `completed`.
- Customer leaves a review on the completed offer.
- Both parties exchange messages inside the offer; `mark_offer_read` works.

Authorization, all correctly refused:

- A customer cannot offer on their own request (403).
- A provider cannot accept their own offer.
- `pending -> completed` is rejected as an invalid transition.
- A customer cannot mark an offer delivered.
- A provider cannot complete an offer.
- A provider cannot offer on a request that is no longer open (403).
- A duplicate review on the same offer is rejected (409).
- A second offer cannot win a request that already has a winner, even when the
  pending row predates the accept. Exactly one winner remained.

Confidentiality, verified with a real outsider account and with `anon`:

- A non-participant reads zero messages from the conversation and is refused by
  `mark_offer_read`.
- `anon` reads zero offers and zero messages, and is refused
  `user_private_profiles` at the grant level (401).
- The public `users` projection exposes no phone, CV or email column.
- One user cannot read another user's private profile.

Two incidental findings, neither a product defect:

- A signup that omits `name`/`role` in the auth metadata fails on the
  `users_name_length` check constraint. `src/lib/actions/auth.ts` always sends
  both, so the real form is unaffected. Worth knowing before adding any other
  signup path (OAuth, invites, seed scripts).
- A provider may submit only one offer per request, enforced by a unique
  constraint on `(job_id, provider_id)`.

## Transactional email is broken in production (2026-09-20)

**This is a real defect and the only thing the smoke test found that affects
users.** No transactional email can be delivered:

```
POST https://api.resend.com/emails
403  The prolink.se domain is not verified.
```

- `RESEND_FROM_EMAIL` is not set in `.env.local`, so `src/lib/email.ts` falls
  back to `noreply@prolink.se`, and that domain is not verified in Resend.
- All three senders are affected: new offer, offer accepted, and the third
  template in `src/lib/email.ts`.
- The failure is **silent**. Both call sites wrap the send in `try/catch` and
  only `console.error`, deliberately, so that a mail outage cannot break the
  offer flow. The consequence is that in production a customer is never told an
  offer arrived, and nobody sees an error.
- The Resend API key is send-restricted, so the domain list could not be read
  over the API; verify in the Resend dashboard.

Fix: either verify `prolink.se` in Resend, or set `RESEND_FROM_EMAIL` to an
already verified sender, in both Vercel and `.env.local`. Then re-send one test
message to confirm a 200.

## Recommended next action

The offer lifecycle is now proven end to end, so the remaining items are
configuration and distribution rather than core logic.

1. **Fix outgoing email.** Verify the domain or point `RESEND_FROM_EMAIL` at a
   verified sender. Until this is done, the marketplace cannot notify anyone,
   which undermines the whole `offer -> chat -> delivery` loop.
2. Apply the password length and character requirements to the hosted project in
   the dashboard. The repository change only affects local development, so the
   hosted project still accepts 6-character passwords.
3. Decide whether the Pro Plan is worth it. Leaked password protection is the
   only blocked security item and the only thing that plan is needed for here.
4. One service row has `category: null`, so it is invisible to category
   filtering on the homepage. Either set a category or make the filter tolerate
   nulls.
5. Decide explicitly whether to drop the unused `applications` (4 rows) and
   `saved_jobs` (2 rows) tables.

### The real problem is distribution, not features

Worth stating plainly, because it should shape whatever comes next. The database
holds 16 users (10 customers, 6 providers), 3 requests and 3 services. The most
recent signup was 2026-07-25, roughly two months before this revision. There has
never been a single offer, message or review from a real user.

The code for the whole `assignment -> offer -> chat -> delivery -> review` loop
is complete and now verified. The list under "Recommended for a future database
phase" — structured deliverables, public offer counts, delivery counters — adds
detail to a funnel that nobody is currently entering. None of it explains why 16
users produced zero offers.

Before building more product surface, get a handful of real assignments through
the loop end to end, with working email. That will reveal what actually blocks a
transaction far better than another schema change will.

## Förbättringar genomförda 2026-09-20

Efter smoke-testet åtgärdades följande. Allt är verifierat med
`npm run build`, `npm run typecheck`, `npm run lint` (0 errors) och
`npm test` (9/9, två nya regressionstester).

### Mejl slutar misslyckas tyst

- `src/lib/email.ts` skickar allt genom ett `send()`-omslag som kontrollerar
  `result.error`. Resend **kastar inte** vid HTTP-fel, så ett nekat utskick
  returnerades tidigare som ett lyckat anrop och anroparnas `try/catch` fångade
  ingenting. Det är därför 403-felet aldrig syntes.
- `emailConfigurationProblem()` upptäcker saknad `RESEND_API_KEY` eller
  `RESEND_FROM_EMAIL` och loggar ett tydligt fel vid modulens uppstart.
- **Kvarstår för dig:** verifiera domänen i Resend eller sätt
  `RESEND_FROM_EMAIL` till en redan verifierad avsändare. Koden kan inte lösa
  det åt sig själv.

### Leverantörer notifieras om nya uppdrag

Den saknade notisen åt utbudssidan är byggd. `POST /api/jobs` anropar nu
`notifyProviders()`, som matchar uppdragets kategori mot leverantörernas
kompetenser och faller tillbaka på samtliga leverantörer när ingen matchar —
en tom marknadsplats vinner mer på räckvidd än på precision. Utskicket är best
effort och kan aldrig hindra att uppdraget publiceras.

### Prestanda

- Faviconen var **1,37 MB** (1024×1024). Nu `favicon-32.png` på **0,8 kB** plus
  `apple-touch-icon.png` på 7,5 kB.
- OG-bilden var **2,0 MB**, vilket överskrider gränsen hos många scrapers, så
  länkförhandsvisningar sannolikt inte fungerade. Nu `og-image.jpg`, 1200×630,
  **89 kB**.
- Fem gamla filer i `public/` (~6,6 MB) har inga referenser kvar i koden och kan
  raderas: `Favicon.png`, `Copilot_20260430_140059.png`, `cta-bg.png`,
  `Herovid2_opt.mp4` och `ChatGPT Image Apr 29…png`. Raderingen nekades av
  behörighetsskäl och behöver göras manuellt.

### En enda källa för sajtens adress

`src/lib/site.ts` (`SITE_URL`, `absoluteUrl`). Tidigare hade `layout.tsx`,
`email.ts` och `GoogleAuthButton.tsx` tre olika reservvärden för samma sak, och
OG-taggen pekade hårdkodat på `https://prolink.se` medan sajten ligger på
`prolink-one.vercel.app`.

### SEO och felhantering

- `src/app/robots.ts` och `src/app/sitemap.ts` — båda gav tidigare 404.
  Kartan byggs dynamiskt från öppna uppdrag, tjänster och leverantörsprofiler,
  och faller tillbaka på de statiska sidorna om databasen inte svarar.
- `src/app/not-found.tsx` och `src/app/error.tsx` ersätter Next.js generiska
  kraschsida.

### Tillgänglighet

Etiketter i `CreateJobForm`, `EditProfileForm` och `CreateServiceForm` låg som
syskon till fälten utan `htmlFor`, så skärmläsare läste upp dem som namnlösa.
Alla är nu kopplade med `htmlFor`/`id`. Knappgrupperna för pristyp och roll har
fått `role="radiogroup"` med `aria-checked`. De delade `Input`- och
`Textarea`-primitiverna visade sig redan vara korrekta.

### Designsystemet

`Button`, `Input`, `Textarea` och `Badge` använder nu accent-tokens i stället
för `blue-*`. De renderas på nästan varje sida, så det är den största effekten
per ändring. Resten av produkten har fortfarande ~175 `blue-*` och två
konkurrerande neutralskalor (`gray` och `slate`); en full migrering är ett eget
arbete som bör göras sida för sida med visuell kontroll.

Under arbetet upptäcktes att `ring-accent/25` **inte genererade någon CSS
alls** — opacitetsmodifierare fungerar inte på en naken `var()`. Ringen hade
blivit osynlig. En egen `accent-ring`-token pekar nu på det redan existerande
`--accent-ring`, verifierat i den byggda CSS:en.

### Kvarstår

- Verifiera avsändardomänen i Resend (enda kvarvarande funktionella felet).
- Radera de fem oanvända filerna i `public/`.
- Sätt kategori på tjänsten `bf1a15e7-07da-4784-861e-d0225c0b6081`
  ("Webbutveckling"), som har `category: null` och därför är osynlig i
  kategorifiltreringen. Uppdateringen nekades av behörighetsskäl.
- Lösenordspolicyn i den hostade dashboarden.

## Verified state on 2026-09-20

- Vercel: the workspace **is** linked (`.vercel/repo.json`, project
  `prj_CnAC151RpS9mKBPNilQYFOAQ8bcv`, team `webbdev`). Earlier revisions said it
  was not; that is no longer true.
- `.env.local` contains all required keys except `RESEND_FROM_EMAIL`.
- Production **is** serving: `https://prolink-one.vercel.app/` returns 200 and
  the markup contains the `reveal` entrance classes and the 4rem display heading
  from `13a08b1`, so the deployed build matches current `master`. The earlier
  `live: false` note is stale.
- `npm run typecheck`: passed. `npm test`: 7/7 passed.
- Migrations 001-012 present locally and applied to the hosted project.
