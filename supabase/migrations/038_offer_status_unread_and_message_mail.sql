begin;

-- 1. Besked om offerten syns i appen, inte bara i mejlet.
-- När kunden accepterar eller avslår en offert räknas konversationen som oläst
-- för frilansaren, tills frilansaren öppnar offerten eller konversationen.
-- status_changed_at sätts redan av track_offer_status. Befintliga offerter
-- markeras som sedda, så att gamla besked inte dyker upp som nya.
alter table public.offers add column provider_status_seen_at timestamptz;
update public.offers set provider_status_seen_at = now();

create or replace function public.mark_offer_read(p_offer_id uuid)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_actor uuid := auth.uid();
  v_provider_id uuid;
  v_customer_id uuid;
begin
  select o.provider_id, j.customer_id into v_provider_id, v_customer_id
  from public.offers o join public.jobs j on j.id = o.job_id
  where o.id = p_offer_id;

  if not found or v_actor is null then
    raise exception 'Offer not found or authentication required' using errcode = '42501';
  end if;

  if v_actor = v_provider_id then
    update public.offers set provider_read_at = coalesce(provider_read_at, created_at), provider_status_seen_at = now()
    where id = p_offer_id;
  elsif v_actor = v_customer_id then
    update public.offers set customer_read_at = coalesce(customer_read_at, created_at) where id = p_offer_id;
  else
    raise exception 'Not an offer participant' using errcode = '42501';
  end if;
end;
$$;
revoke all on function public.mark_offer_read(uuid) from public, anon;
grant execute on function public.mark_offer_read(uuid) to authenticated;

-- Oläst = kunden har inte öppnat offerten, frilansaren har inte sett att
-- offerten accepterats eller avslagits, eller motparten har skrivit efter ens
-- läsmarkör. Samma villkor i listan och i räknaren.
create or replace function public.offer_unread(o public.offers, j public.jobs)
returns boolean language sql stable security invoker set search_path = public, pg_temp as $$
  select (j.customer_id = auth.uid() and o.customer_read_at is null)
    or (o.provider_id = auth.uid() and o.status in ('accepted', 'rejected')
      and o.status_changed_at > coalesce(o.provider_status_seen_at, '-infinity'::timestamptz))
    or exists(select 1 from public.messages m where m.offer_id = o.id and m.sender_id <> auth.uid()
      and m.created_at > coalesce(case when o.provider_id = auth.uid() then o.provider_read_at else o.customer_read_at end, '-infinity'::timestamptz));
$$;
revoke all on function public.offer_unread(public.offers, public.jobs) from public, anon;
grant execute on function public.offer_unread(public.offers, public.jobs) to authenticated;

-- 2. Mejl bara om det första olästa meddelandet.
-- Tidigare kom ett mejl per konversation och kvart så länge det skrevs. Nu
-- mejlas mottagaren bara när meddelandet är det enda olästa i konversationen;
-- nästa mejl kommer först när mottagaren läst och ett nytt meddelande kommer.
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
    if coalesce((select email_messages from public.user_private_profiles where user_id = recipient), true)
      and not exists (
        select 1 from public.messages m
        where m.offer_id = new.offer_id and m.id <> new.id and m.sender_id <> recipient
          and m.created_at > coalesce(case when recipient = o.provider_id then o.provider_read_at else o.customer_read_at end, '-infinity'::timestamptz)
      ) then
      insert into public.notification_outbox(recipient_id,kind,subject,body,path,dedupe_key)
      values (recipient, 'message', 'Nya meddelanden på Prolink', j.title, '/messages/' || new.offer_id,
        'message:' || new.offer_id || ':' || recipient || ':' || floor(extract(epoch from now()) / 900)::text)
      on conflict (dedupe_key) do nothing;
    end if;
  end if;
  return new;
end;
$$;

commit;
