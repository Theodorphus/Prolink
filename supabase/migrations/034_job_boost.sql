begin;

-- Uppdragsgivaren kan betala för att lyfta ett uppdrag. Det lyfta uppdraget
-- visas överst i listorna tills lyftet gått ut eller någon annan lyfter sitt:
-- ordningen är senast lyft först. Kolumnerna sätts bara av servern. Tabell-
-- rättigheten på jobs ger authenticated bara innehållskolumnerna (023), så
-- ägaren kan inte lyfta sitt eget uppdrag utan att betala.
alter table public.jobs
  add column boosted_at timestamptz,
  add column boosted_until timestamptz;
create index jobs_boosted on public.jobs(boosted_at desc) where boosted_at is not null;

-- En rad per betalning. Stripe-sessionens id är nyckeln, så att samma betalning
-- aldrig lyfter uppdraget två gånger även om webhooken skickas flera gånger.
create table public.job_boosts (
  stripe_session_id text primary key,
  job_id uuid not null references public.jobs(id) on delete cascade,
  customer_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.job_boosts enable row level security;
revoke all on public.job_boosts from anon, authenticated;
grant all on public.job_boosts to service_role;

create function public.apply_job_boost(p_session_id text, p_job_id uuid, p_customer_id uuid, p_days integer default 7)
returns boolean
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  -- Bara uppdragets ägare, och bara om uppdraget är öppet. En betalning för
  -- något annat ger ingen rad och lämnas för manuell hantering i Stripe.
  if not exists (
    select 1 from public.jobs
    where id = p_job_id and customer_id = p_customer_id and status = 'open' and archived_at is null
  ) then
    return false;
  end if;
  insert into public.job_boosts(stripe_session_id, job_id, customer_id)
  values (p_session_id, p_job_id, p_customer_id)
  on conflict do nothing;
  if not found then return false; end if;
  update public.jobs
  set boosted_at = now(), boosted_until = now() + make_interval(days => p_days)
  where id = p_job_id;
  return true;
end;
$$;
revoke all on function public.apply_job_boost(text, uuid, uuid, integer) from public, anon, authenticated;
grant execute on function public.apply_job_boost(text, uuid, uuid, integer) to service_role;

-- Utgångna lyft nollställs av cron-rutten, så att listorna kan sortera på
-- boosted_at utan att jämföra med klockan i varje fråga.
create function public.expire_job_boosts() returns integer
language sql security definer set search_path = public, pg_temp as $$
  with expired as (
    update public.jobs set boosted_at = null, boosted_until = null
    where boosted_until is not null and boosted_until <= now()
    returning 1
  ) select count(*)::integer from expired;
$$;
revoke all on function public.expire_job_boosts() from public, anon, authenticated;
grant execute on function public.expire_job_boosts() to service_role;

commit;
