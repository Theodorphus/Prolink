begin;
alter table public.user_private_profiles
  add column email_jobs boolean not null default true,
  add column email_messages boolean not null default true,
  add column notification_categories text[] not null default '{}';

create table public.notification_outbox (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.users(id) on delete cascade,
  kind text not null,
  subject text not null,
  body text not null,
  path text not null,
  dedupe_key text not null unique,
  attempts integer not null default 0,
  available_at timestamptz not null default now(),
  lease_token uuid,
  sent_at timestamptz,
  last_error text,
  created_at timestamptz not null default now()
);
alter table public.notification_outbox enable row level security;
revoke all on public.notification_outbox from anon, authenticated;
grant all on public.notification_outbox to service_role;
create index notification_pending on public.notification_outbox(available_at) where sent_at is null and attempts < 8;

create function public.queue_marketplace_notification() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
declare j public.jobs; o public.offers; recipient uuid; sender_name text;
begin
  if TG_TABLE_NAME = 'jobs' then
    insert into public.notification_outbox(recipient_id,kind,subject,body,path,dedupe_key)
    select u.id, case when new.requested_provider_id is null then 'job' else 'inquiry' end, case when new.requested_provider_id is null then 'Nytt uppdrag' else 'Ny förfrågan till dig' end,
      new.title, '/jobs/' || new.id, 'job:' || new.id || ':' || u.id
    from public.users u left join public.user_private_profiles p on p.user_id = u.id
    where u.role = 'provider' and u.id <> new.customer_id
      and (new.requested_provider_id = u.id or (new.requested_provider_id is null
        and coalesce(p.email_jobs, true)
        and (coalesce(cardinality(p.notification_categories), 0) = 0 or new.category = any(p.notification_categories))))
    on conflict (dedupe_key) do nothing;
  elsif TG_TABLE_NAME = 'offers' then
    select * into j from public.jobs where id = new.job_id;
    if TG_OP = 'INSERT' then
      recipient := j.customer_id;
      insert into public.notification_outbox(recipient_id,kind,subject,body,path,dedupe_key)
      values (recipient, 'offer', 'Ny offert', j.title, '/offers/' || new.id, 'offer:' || new.id);
    elsif new.status = 'accepted' and old.status <> 'accepted' then
      insert into public.notification_outbox(recipient_id,kind,subject,body,path,dedupe_key)
      values (new.provider_id, 'accepted', 'Din offert accepterades', j.title, '/offers/' || new.id, 'accepted:' || new.id)
      on conflict (dedupe_key) do nothing;
    end if;
  elsif TG_TABLE_NAME = 'messages' then
    select * into o from public.offers where id = new.offer_id;
    select * into j from public.jobs where id = o.job_id;
    recipient := case when new.sender_id = o.provider_id then j.customer_id else o.provider_id end;
    if coalesce((select email_messages from public.user_private_profiles where user_id = recipient), true) then
      insert into public.notification_outbox(recipient_id,kind,subject,body,path,dedupe_key)
      values (recipient, 'message', 'Nya meddelanden på Prolink', j.title, '/messages/' || new.offer_id,
        'message:' || new.offer_id || ':' || recipient || ':' || floor(extract(epoch from now()) / 900)::text)
      on conflict (dedupe_key) do nothing;
    end if;
  end if;
  return new;
end;
$$;
create trigger queue_job after insert on public.jobs for each row execute function public.queue_marketplace_notification();
create trigger queue_offer after insert or update on public.offers for each row execute function public.queue_marketplace_notification();
create trigger queue_message after insert on public.messages for each row execute function public.queue_marketplace_notification();

create function public.claim_notifications() returns setof public.notification_outbox
language sql security definer set search_path = public, pg_temp as $$
  update public.notification_outbox n set attempts = attempts + 1,
    available_at = now() + interval '5 minutes', lease_token = gen_random_uuid()
  where id in (
    select id from public.notification_outbox where sent_at is null and available_at <= now() and attempts < 8
    order by available_at, id for update skip locked limit 10
  ) returning n.*;
$$;
revoke all on function public.claim_notifications() from public, anon, authenticated;
grant execute on function public.claim_notifications() to service_role;
commit;
