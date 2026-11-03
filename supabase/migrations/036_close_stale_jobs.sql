begin;

-- Uppdrag som legat öppna i 60 dagar stängs automatiskt. Gamla uppdrag får
-- flödet att se övergivet ut, och frilansare lägger tid på offerter som ingen
-- läser. Kunden får ett mejl om att uppdraget stängts och kan publicera det
-- igen om behovet finns kvar.
--
-- Ett uppdrag som är lyft just nu stängs inte förrän lyftet gått ut, eftersom
-- kunden betalat för att det ska synas. Funktionen körs av cron-rutten.
create function public.close_stale_jobs() returns integer
language plpgsql security definer set search_path = public, pg_temp as $$
declare closed integer;
begin
  with stale as (
    update public.jobs set status = 'closed'
    where status = 'open' and archived_at is null
      and created_at < now() - interval '60 days'
      and (boosted_until is null or boosted_until <= now())
    returning id, customer_id, title
  ), queued as (
    insert into public.notification_outbox(recipient_id,kind,subject,body,path,dedupe_key)
    select customer_id, 'job_expired', 'Ditt uppdrag har stängts', title, '/jobs/' || id, 'job_expired:' || id
    from stale
    on conflict (dedupe_key) do nothing
  )
  select count(*)::integer into closed from stale;
  return closed;
end;
$$;
revoke all on function public.close_stale_jobs() from public, anon, authenticated;
grant execute on function public.close_stale_jobs() to service_role;

commit;
