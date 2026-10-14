begin;

-- Affärer kunde stanna precis före slutförande och omdöme utan att någon
-- fick veta det. Nu får kunden en omdömesfråga dagen efter slutfört uppdrag,
-- och både leverans och omdöme får påminnelser om inget händer.

-- Offerten saknade tidsstämpel för statusbyten, så "hur länge har leveransen
-- väntat" gick inte att besvara. Befintliga rader får i stället now(), så att äldre affärer
-- inte översvämmar folk med påminnelser i samma stund som migrationen körs.
alter table public.offers add column status_changed_at timestamptz;
update public.offers set status_changed_at = now();
alter table public.offers
  alter column status_changed_at set not null,
  alter column status_changed_at set default now();

create function public.track_offer_status() returns trigger
language plpgsql set search_path = public, pg_temp as $$
begin
  if new.status is distinct from old.status then
    new.status_changed_at := now();
  end if;
  return new;
end;
$$;
create trigger track_offer_status before update on public.offers
for each row execute function public.track_offer_status();

-- Funktionen ersätts i sin helhet. Allt är oförändrat från 019 utom att
-- 'completed' också köar en omdömesfråga till kunden. Den skjuts upp ett
-- dygn: kunden har precis sett omdömesrutan när hen bekräftade, och cron
-- hoppar över mejlet om omdömet redan är lämnat.
create or replace function public.queue_marketplace_notification() returns trigger
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
    elsif new.status is distinct from old.status then
      if new.status = 'accepted' then
        insert into public.notification_outbox(recipient_id,kind,subject,body,path,dedupe_key)
        values (new.provider_id, 'accepted', 'Din offert accepterades', j.title, '/offers/' || new.id, 'accepted:' || new.id)
        on conflict (dedupe_key) do nothing;
      elsif new.status = 'rejected' then
        insert into public.notification_outbox(recipient_id,kind,subject,body,path,dedupe_key)
        values (new.provider_id, 'rejected', 'Din offert gick inte vidare', j.title, '/offers/' || new.id, 'rejected:' || new.id)
        on conflict (dedupe_key) do nothing;
      elsif new.status = 'delivered' then
        insert into public.notification_outbox(recipient_id,kind,subject,body,path,dedupe_key)
        values (j.customer_id, 'delivered', 'Leveransen är klar – bekräfta uppdraget', j.title, '/offers/' || new.id, 'delivered:' || new.id)
        on conflict (dedupe_key) do nothing;
      elsif new.status = 'completed' then
        insert into public.notification_outbox(recipient_id,kind,subject,body,path,dedupe_key)
        values (new.provider_id, 'completed', 'Uppdraget är slutfört – lämna ett omdöme', j.title, '/offers/' || new.id, 'completed:' || new.id)
        on conflict (dedupe_key) do nothing;
        insert into public.notification_outbox(recipient_id,kind,subject,body,path,dedupe_key,available_at)
        values (j.customer_id, 'review_request', 'Hur gick det? Lämna ett omdöme', j.title, '/offers/' || new.id, 'review_request:' || new.id, now() + interval '1 day')
        on conflict (dedupe_key) do nothing;
      end if;
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

-- Anropas av cron-rutten före varje utskicksomgång. Dedupe-nycklarna gör att
-- varje påminnelse köas högst en gång per offert och mottagare, hur ofta
-- funktionen än körs.
create function public.queue_offer_reminders() returns integer
language plpgsql security definer set search_path = public, pg_temp as $$
declare queued integer := 0; n integer;
begin
  -- Leverans som kunden inte bekräftat efter tre dagar.
  insert into public.notification_outbox(recipient_id,kind,subject,body,path,dedupe_key)
  select j.customer_id, 'reminder_confirm', 'Påminnelse: bekräfta leveransen', j.title, '/offers/' || o.id, 'reminder_confirm:' || o.id
  from public.offers o join public.jobs j on j.id = o.job_id
  where o.status = 'delivered' and o.status_changed_at < now() - interval '3 days'
  on conflict (dedupe_key) do nothing;
  get diagnostics n = row_count; queued := queued + n;

  -- Slutfört uppdrag där en av parterna inte lämnat omdöme efter en vecka.
  insert into public.notification_outbox(recipient_id,kind,subject,body,path,dedupe_key)
  select p.uid, 'reminder_review', 'Påminnelse: lämna ett omdöme', j.title, '/offers/' || o.id, 'reminder_review:' || o.id || ':' || p.uid
  from public.offers o join public.jobs j on j.id = o.job_id
  cross join lateral (values (j.customer_id), (o.provider_id)) as p(uid)
  where o.status = 'completed' and o.status_changed_at < now() - interval '7 days'
    and not exists (select 1 from public.reviews r where r.offer_id = o.id and r.reviewer_id = p.uid)
  on conflict (dedupe_key) do nothing;
  get diagnostics n = row_count; queued := queued + n;

  return queued;
end;
$$;
revoke all on function public.queue_offer_reminders() from public, anon, authenticated;
grant execute on function public.queue_offer_reminders() to service_role;

commit;
