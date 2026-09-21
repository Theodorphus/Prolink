begin;

create or replace function public.transition_offer(
  p_offer_id uuid,
  p_new_status public.offer_status
)
returns public.offers
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_actor uuid := auth.uid();
  v_offer public.offers%rowtype;
  v_job public.jobs%rowtype;
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  select * into v_offer
  from public.offers
  where id = p_offer_id;

  if not found then
    raise exception 'Offer not found' using errcode = 'P0002';
  end if;

  select * into v_job
  from public.jobs
  where id = v_offer.job_id
  for update;

  if not found then
    raise exception 'Request not found' using errcode = 'P0002';
  end if;

  select * into v_offer from public.offers where id = p_offer_id for update;

  if v_actor not in (v_offer.provider_id, v_job.customer_id) then
    raise exception 'Not an offer participant' using errcode = '42501';
  end if;

  -- Safe retry only after participant authorization.
  if v_offer.status = p_new_status then
    return v_offer;
  end if;

  if v_offer.status = 'pending' and p_new_status in ('accepted', 'rejected') then
    if v_actor <> v_job.customer_id then
      raise exception 'Only the request owner can accept or reject an offer'
        using errcode = '42501';
    end if;

    if p_new_status = 'accepted' then
      if v_job.status <> 'open' then
        raise exception 'Request is no longer open' using errcode = '23514';
      end if;

      if exists (
        select 1 from public.offers
        where job_id = v_offer.job_id
          and id <> v_offer.id
          and status in ('accepted', 'delivered', 'completed')
      ) then
        raise exception 'Request already has a winning offer' using errcode = '23505';
      end if;

      update public.offers
      set status = 'accepted'
      where id = v_offer.id;

      update public.offers
      set status = 'rejected'
      where job_id = v_offer.job_id
        and id <> v_offer.id
        and status = 'pending';

      -- Closing the request prevents new offers while delivery is in progress.
      update public.jobs set status = 'closed' where id = v_offer.job_id;
    else
      update public.offers set status = 'rejected' where id = v_offer.id;
    end if;

  elsif v_offer.status = 'accepted' and p_new_status = 'delivered' then
    if v_actor <> v_offer.provider_id then
      raise exception 'Only the provider can mark an offer delivered'
        using errcode = '42501';
    end if;
    update public.offers set status = 'delivered' where id = v_offer.id;

  elsif v_offer.status = 'delivered' and p_new_status = 'completed' then
    if v_actor <> v_job.customer_id then
      raise exception 'Only the request owner can complete an offer'
        using errcode = '42501';
    end if;
    update public.offers set status = 'completed' where id = v_offer.id;
    update public.jobs set status = 'closed' where id = v_offer.job_id;

  else
    raise exception 'Invalid offer transition: % -> %', v_offer.status, p_new_status
      using errcode = '23514';
  end if;

  select * into v_offer from public.offers where id = p_offer_id;
  return v_offer;
end;
$$;

revoke all on function public.transition_offer(uuid, public.offer_status) from public, anon;
grant execute on function public.transition_offer(uuid, public.offer_status) to authenticated;


alter table public.services add column vat_included boolean;

-- Keep transaction history. Only the owner can archive; no client can hard-delete.
alter table public.jobs add column archived_at timestamptz;
revoke delete on public.jobs from authenticated, anon;
create function public.archive_job(p_job_id uuid) returns void
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  perform 1 from public.jobs where id = p_job_id and customer_id = auth.uid() for update;
  if not found then raise exception 'Not authorized' using errcode = '42501'; end if;
  update public.jobs set archived_at = coalesce(archived_at, now()), status = 'closed' where id = p_job_id;
end;
$$;
revoke all on function public.archive_job(uuid) from public, anon;
grant execute on function public.archive_job(uuid) to authenticated;

-- A targeted request remains visible to its customer and chosen provider only.
alter table public.jobs add column requested_provider_id uuid references public.users(id);
alter table public.jobs add column service_id uuid references public.services(id) on delete set null;
drop policy "Anyone can read open jobs" on public.jobs;
create policy "Visible jobs" on public.jobs for select using (
  requested_provider_id is null or auth.uid() in (customer_id, requested_provider_id)
);
create function public.validate_job_target() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if TG_OP = 'UPDATE' then
    if new.customer_id <> old.customer_id or new.requested_provider_id is distinct from old.requested_provider_id then
      raise exception 'Request participants are immutable' using errcode = '23514';
    end if;
    if new.status = 'open' and (new.archived_at is not null or exists (
      select 1 from public.offers where job_id = new.id and status in ('accepted','delivered','completed')
    )) then raise exception 'Request cannot reopen' using errcode = '23514'; end if;
  end if;
  if TG_OP = 'INSERT' and new.requested_provider_id is not null then
    if new.requested_provider_id = new.customer_id or not exists (
      select 1 from public.users where id = new.requested_provider_id and role = 'provider'
    ) then raise exception 'Invalid recipient' using errcode = '23514'; end if;
    if new.service_id is not null and not exists (
      select 1 from public.services where id = new.service_id and provider_id = new.requested_provider_id
    ) then raise exception 'Invalid service' using errcode = '23514'; end if;
  elsif TG_OP = 'INSERT' and new.service_id is not null then
    raise exception 'Service needs recipient' using errcode = '23514';
  end if;
  return new;
end;
$$;
create trigger validate_job_target before insert or update on public.jobs
for each row execute function public.validate_job_target();

create function public.validate_offer_target() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
declare j public.jobs;
begin
  select * into j from public.jobs where id = new.job_id for update;
  if j.status <> 'open' or j.archived_at is not null
     or (j.requested_provider_id is not null and j.requested_provider_id <> new.provider_id) then
    raise exception 'Request unavailable' using errcode = '42501';
  end if;
  return new;
end;
$$;
create trigger validate_offer_target before insert on public.offers
for each row execute function public.validate_offer_target();

-- One counter per subject/action, atomically incremented in the write transaction.
-- Rejected writes do not allocate rows. Fixed windows have an explicit upper bound.
create table public.write_quotas (
  subject uuid not null, action text not null, window_start timestamptz not null,
  used integer not null, primary key (subject, action)
);
alter table public.write_quotas enable row level security;
revoke all on public.write_quotas from anon, authenticated;
create function public.enforce_write_quota() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_limit integer; v_seconds integer; v_used integer; v_start timestamptz;
begin
  if auth.uid() is null then
    if auth.role() = 'service_role' then return new; end if;
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  case TG_TABLE_NAME
    when 'jobs' then v_limit := 10; v_seconds := 3600;
    when 'services' then v_limit := 10; v_seconds := 3600;
    when 'offers' then v_limit := 20; v_seconds := 3600;
    when 'messages' then v_limit := 60; v_seconds := 300;
    when 'reviews' then v_limit := 10; v_seconds := 3600;
    else raise exception 'Unknown quota';
  end case;
  v_start := to_timestamp(floor(extract(epoch from clock_timestamp()) / v_seconds) * v_seconds);
  insert into public.write_quotas as q values (auth.uid(), TG_TABLE_NAME, v_start, 1)
  on conflict (subject, action) do update set
    used = case when q.window_start = excluded.window_start then q.used + 1 else 1 end,
    window_start = excluded.window_start
  returning used into v_used;
  if v_used > v_limit then raise exception 'Write quota exceeded' using errcode = '54000'; end if;
  return new;
end;
$$;
create trigger write_quota before insert on public.jobs for each row execute function public.enforce_write_quota();
create trigger write_quota before insert on public.services for each row execute function public.enforce_write_quota();
create trigger write_quota before insert on public.offers for each row execute function public.enforce_write_quota();
create trigger write_quota before insert on public.messages for each row execute function public.enforce_write_quota();
create trigger write_quota before insert on public.reviews for each row execute function public.enforce_write_quota();
revoke execute on function public.check_rate_limit(text, integer, integer) from authenticated;

drop policy "Providers can create services" on public.services;
create policy "Providers can create services" on public.services for insert with check (
  auth.uid() = provider_id and exists (select 1 from public.users where id = auth.uid() and role = 'provider')
);

-- Public aggregate returns only the already-public ratings, independent of pagination.
create function public.review_summary(p_user_id uuid)
returns table (average numeric, total bigint)
language sql stable security invoker set search_path = public, pg_temp as $$
  select avg(rating), count(*) from public.reviews where reviewee_id = p_user_id;
$$;
grant execute on function public.review_summary(uuid) to anon, authenticated;
commit;
