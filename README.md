# Prolink

Prolink is a Swedish marketplace for freelance services, built with Next.js,
Supabase, and Resend. Small businesses and other buyers can publish assignments,
compare offers, chat with specialists, approve delivery, and leave reviews.
Freelancers can both respond to assignments and publish packaged services.

The product focuses on digital and professional services such as web
development, design, marketing, accounting, content, photo/video, IT support,
and business administration. Legacy employment-board fields remain in the
schema temporarily but are not the product direction.

## Local development

Requirements:

- Node.js 22 (also used by CI)
- A Supabase project
- A Resend account for transactional email

Copy `.env.example` to `.env.local` and configure:

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Public Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public browser/server anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only Auth Admin key; never expose to the browser |
| `RESEND_API_KEY` | Server-only Resend API key |
| `RESEND_FROM_EMAIL` | Verified sender address |
| `NEXT_PUBLIC_APP_URL` | Canonical application origin |
| `NEXT_PUBLIC_CONTACT_EMAIL` | Monitored public support address |
| `CRON_SECRET` | Server-only secret protecting notification delivery |

Install and run:

```bash
npm install
npm run dev
```

## Database migrations

Migrations live in `supabase/migrations`. Existing projects that already have
001–009 must apply only the new migrations in version order. Migration 005 now
contains an idempotent `category` prerequisite so a fresh replay no longer
attempts to index a column that has not been created.

Before applying `010_phase1_security_baseline.sql`, check for historical jobs
with more than one winning offer:

```sql
select job_id, count(*)
from public.offers
where status in ('accepted', 'delivered', 'completed')
group by job_id
having count(*) > 1;
```

If this returns rows, review them manually before applying 010. The migration
will not choose or delete a winner automatically.

Apply the migration through the Supabase SQL Editor, or through the Supabase CLI
if migration history is already configured:

```bash
supabase db push
```

Deploy the database migration before deploying application code. The code uses
the new `user_private_profiles` table, `messages.attachment_path`, and the
`transition_offer` / `mark_offer_read` database functions.

After migration:

1. Confirm the `cvs` and `attachments` buckets are private.
2. Confirm anon cannot select private profile or archived CV data.
3. Test offer acceptance, delivery, completion, CV access, and attachments with
   separate customer/provider accounts.
4. Keep `SUPABASE_SERVICE_ROLE_KEY` only in server-side deployment secrets.

## Database types

`src/types/database.ts` is manually aligned with the repository migrations for
now. Generating authoritative types requires access to the Supabase project.

From a linked/local project:

```bash
npx supabase gen types typescript --local --schema public > src/types/supabase.generated.ts
```

From a hosted project:

```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_ID --schema public > src/types/supabase.generated.ts
```

Review the generated diff before replacing the manual types.

## Verification

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

GitHub Actions runs lint, database tests, build, type checking and a production
dependency audit on pushes to `master` and pull requests. It uses dummy environment
values and does not need access to production secrets or the hosted database.

Before deployment, run `npm run check:deployment` with the intended deployment
environment. The command loads Next.js production environment files (including
`.env.local`) and reports missing values, local URLs and short cron secrets without
printing secret values. A localhost URL is expected during local development;
configure the real HTTPS origin in the hosting environment. Passing this command
does not verify remote configuration, credentials or email delivery.

### Launch and operations

- Configure the environment variables in the hosting dashboard, not only locally.
- Verify that the support mailbox receives mail and assign someone to handle
  account deletion, data export and abuse reports. Confirm the operator identity
  and privacy text against the actual hosting and email setup before public launch.
- Confirm database backups and a recovery procedure in the Supabase project.
- After deployment, test signup, email confirmation, password reset and Google login.
- With separate customer/provider accounts, test a public job and a private request,
  an offer, acceptance, chat with an attachment, delivery, completion and a review.
- Check application/hosting logs and notification queue failures regularly.
  An authorized operator can inspect queue health in the Supabase SQL editor:

```sql
select
  count(*) filter (where sent_at is null) as pending,
  count(*) filter (where sent_at is null and attempts >= 8) as exhausted,
  min(created_at) filter (where sent_at is null) as oldest_pending
from public.notification_outbox;
```

Investigate failed deliveries in the email provider and hosting logs before manually
retrying them. Do not expose this query through a public endpoint. If a deployment
fails, restore the last working application deployment; preserve database history
and investigate before reverting migrations or deleting data.


## Marketplace fixes: migrations 015–017

Apply the new migrations in order **before** deploying this application version:

1. `015_marketplace_integrity.sql`: authorized offer retries, archive instead of delete,
   private directed requests, atomic quotas on all database inserts, full rating aggregate,
   explicit VAT indication for services.
2. `016_notification_outbox.sql`: durable transactional notifications and owner-only
   notification preferences. No notification is delivered during migration.
3. `017_conversation_pagination.sql`: authorized, paginated conversation summaries.

The migration replay test runs the actual SQL in isolated PostgreSQL (PGlite), with
Supabase auth/storage infrastructure stubbed. It does not connect to the hosted project.
It checks RLS with customer, provider and outsider roles. PGlite uses a single connection;
these tests are not a multi-connection load test or a test of hosted Realtime/Storage.

### Notification delivery

Set `CRON_SECRET` in the deployment (a long random secret). The cron worker is
`GET /api/cron/notifications`, with `Authorization: Bearer <CRON_SECRET>`.
`vercel.json` schedules it every five minutes. This schedule requires a Vercel plan
that supports that frequency; on other plans use an external scheduler with the same
URL/header instead and remove the Vercel cron entry. No plan upgrade is performed by
this change. Keep existing Supabase service-role and Resend secrets server-only.

Notifications are inserted in the same transaction as jobs/offers/messages, including
writes made directly through Supabase. Each worker claims at most 10 rows, uses a lease,
retries failures with backoff and sends with a Resend idempotency key. Chat notification
emails are coalesced per recipient/conversation into 15-minute windows. Job recipients
choose categories and can disable job/chat emails in their profile. Directed requests,
offers and acceptance notices are transactional and remain enabled.

Monitor backlog and `attempts >= 8 AND sent_at IS NULL` in `notification_outbox` with
server-role access; those rows require investigation before rescheduling. Ensure worker
capacity exceeds incoming notifications; increase invocation frequency/worker capacity
when the queue grows. Existing pending rows are preserved on failed delivery.

### Authentication and publication checks

Set `NEXT_PUBLIC_APP_URL` to the canonical production origin. Allow that origin's
`/auth/callback` in Supabase Auth redirect URLs (and the corresponding localhost callback
for development). Email signup, confirmation resend and recovery use that callback.
Confirm OAuth and password-recovery flows with test accounts after deployment; no
verification or recovery emails are sent by the automated test suite.

Run `npm run lint`, `npm run typecheck`, `npm test`, `npm audit`, and `npm run build`.
Verify with separate accounts that directed requests reach only their intended provider,
that offers enable the conversation, and that archived jobs retain their history.
Public collection pages show 24 rows per page. Chat loads 50 messages per batch and
recovers missed messages with a forward cursor. `/sitemap.xml` is an index of paginated
public sitemap shards. Homepage queries use an anonymous client and a 60-second cache;
authentication is deduplicated only within each request, never cached across users.
