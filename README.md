# Prolink

Prolink is a Next.js 14 application backed by Supabase. The current repository
contains both the original Swedish service-marketplace flow and a later
employment-board flow. Phase 1 stabilizes the existing marketplace core without
redesigning the product or destructively removing legacy data.

## Local development

Requirements:

- Node.js 20 or newer
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
2. Confirm anon cannot select `phone`, `cv_text`, or `cv_url` from `users`.
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
