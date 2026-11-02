begin;

-- Premium för frilansare. Raden skrivs bara av Stripe-webhooken med
-- service-rollen; användaren får läsa sin egen rad för att kunna visa status.
create table public.premium_subscriptions (
  user_id uuid primary key references public.users(id) on delete cascade,
  stripe_customer_id text not null unique,
  stripe_subscription_id text unique,
  status text not null default 'none',
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  updated_at timestamptz not null default now()
);
alter table public.premium_subscriptions enable row level security;
revoke all on public.premium_subscriptions from anon, authenticated;
grant select on public.premium_subscriptions to authenticated;
grant all on public.premium_subscriptions to service_role;
create policy "Users can read their own premium subscription"
  on public.premium_subscriptions for select to authenticated
  using (user_id = (select auth.uid()));

-- Premium gäller så länge Stripe säger att prenumerationen är aktiv och
-- perioden inte gått ut. Vid uteblivd betalning (past_due) släcks förmånerna.
create function public.premium_user_ids(p_user_ids uuid[])
returns setof uuid
language sql stable security definer set search_path = public, pg_temp as $$
  select s.user_id from public.premium_subscriptions s
  where s.user_id = any(p_user_ids)
    and s.status in ('active', 'trialing')
    and s.current_period_end > now();
$$;
revoke all on function public.premium_user_ids(uuid[]) from public;
-- Bara om någon är premium är publikt: det styr placering och antal synliga
-- tjänster, och inget om betalningen lämnas ut.
grant execute on function public.premium_user_ids(uuid[]) to anon, authenticated, service_role;

-- Uppdragsmejlet går till premiumfrilansare direkt och till övriga ett dygn
-- senare. Fördröjningen sätts här, på raden, så att kön och cron-rutten inte
-- behöver veta något om premium. Bara utskicket till alla (kind = 'job') berörs:
-- en direktförfrågan till en viss frilansare ('inquiry') går alltid fram direkt.
create function public.delay_job_notification_for_free() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if new.kind = 'job' and not exists (select 1 from public.premium_user_ids(array[new.recipient_id])) then
    new.available_at := greatest(new.available_at, now() + interval '24 hours');
  end if;
  return new;
end;
$$;
create trigger delay_job_notification before insert on public.notification_outbox
for each row execute function public.delay_job_notification_for_free();

commit;
