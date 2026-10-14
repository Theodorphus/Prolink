begin;

-- Högst tio tjänster per frilansare. Flödena visar redan bara tre per person,
-- så taket är till för att stoppa massuppladdning av nästan likadana tjänster,
-- inte för att begränsa en seriös portfolio. Samma mönster som taket på sex
-- portfolioarbeten i 022.
create function public.limit_services() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  perform pg_advisory_xact_lock(hashtext('services:' || new.provider_id));
  if (select count(*) from public.services where provider_id = new.provider_id) >= 10 then
    raise exception 'Service limit reached' using errcode = '54000';
  end if;
  return new;
end;
$$;
create trigger limit_services before insert on public.services
for each row execute function public.limit_services();

commit;
