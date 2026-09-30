begin;

-- Offertens senare steg gav inga notiser. Kunden fick inget mejl när
-- leverantören markerade leverans, så affären kunde stanna precis före
-- slutförande och omdöme. Leverantörer fick heller inte veta att en offert
-- gått till någon annan, eller att uppdraget var slutfört och kunde betygsättas.
--
-- Funktionen ersätts i sin helhet. Grenarna för uppdrag och meddelanden är
-- oförändrade från 016; bara statusbytena på offers är utökade. Villkoret
-- "is distinct from" gör att uppdateringar som inte byter status, till
-- exempel läsmarkeringar, fortsatt inte köar något.
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
        -- Gäller även offerter som avslås automatiskt när kunden accepterar en annan.
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

commit;
