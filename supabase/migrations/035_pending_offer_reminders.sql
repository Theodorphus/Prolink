begin;

-- Kunder som får många offerter men inte svarar. Frilansarna har lagt tid på
-- offerterna och får inget besked, så kunden får en sammanfattande påminnelse
-- per uppdrag: en efter tre dagar och, om offerterna fortfarande ligger
-- obesvarade, en till efter en vecka. Aldrig fler.
--
-- Funktionen ersätts i sin helhet. De två påminnelserna om leverans och omdöme
-- är oförändrade från 024.
--
-- Äldsta obesvarade offerten får vara högst 21 dagar gammal. Ett uppdrag som
-- legat öppet längre än så är sannolikt övergivet, och en påminnelse om det
-- hjälper ingen. Det gör också att äldre rader inte översvämmar kunder i samma
-- stund som migrationen körs.
create or replace function public.queue_offer_reminders() returns integer
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

  -- Öppet uppdrag med offerter som väntat på svar i tre dagar. Antalet räknas
  -- först när mejlet skickas, så texten stämmer med läget då.
  insert into public.notification_outbox(recipient_id,kind,subject,body,path,dedupe_key)
  select j.customer_id, 'reminder_offers', 'Påminnelse: offerter väntar på svar', j.title, '/jobs/' || j.id, 'reminder_offers:' || j.id || ':1'
  from public.jobs j
  where j.status = 'open' and j.archived_at is null
    and (select min(o.created_at) from public.offers o where o.job_id = j.id and o.status = 'pending')
        between now() - interval '21 days' and now() - interval '3 days'
  on conflict (dedupe_key) do nothing;
  get diagnostics n = row_count; queued := queued + n;

  -- Den andra, och sista, påminnelsen en vecka efter offerten kom, och bara om
  -- den första köades för minst fyra dagar sedan.
  insert into public.notification_outbox(recipient_id,kind,subject,body,path,dedupe_key)
  select j.customer_id, 'reminder_offers', 'Påminnelse: offerter väntar på svar', j.title, '/jobs/' || j.id, 'reminder_offers:' || j.id || ':2'
  from public.jobs j
  where j.status = 'open' and j.archived_at is null
    and (select min(o.created_at) from public.offers o where o.job_id = j.id and o.status = 'pending')
        between now() - interval '21 days' and now() - interval '7 days'
    and exists (
      select 1 from public.notification_outbox first_reminder
      where first_reminder.dedupe_key = 'reminder_offers:' || j.id || ':1'
        and first_reminder.created_at < now() - interval '4 days'
    )
  on conflict (dedupe_key) do nothing;
  get diagnostics n = row_count; queued := queued + n;

  return queued;
end;
$$;
revoke all on function public.queue_offer_reminders() from public, anon, authenticated;
grant execute on function public.queue_offer_reminders() to service_role;

commit;
