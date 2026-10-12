begin;

-- Uppdragsgivaren kan redigera titel, beskrivning, kategori, budget, plats
-- och arbetsform så länge uppdraget är öppet. Leverantörer som redan lämnat
-- offert ska kunna se att villkoren ändrats, så ändringen tidsstämplas.
alter table public.jobs add column edited_at timestamptz;

-- Tabellrättigheten lät authenticated ändra alla kolumner. RLS begränsar
-- bara vilka rader, så ägaren kunde sätta created_at (som styr ordningen i
-- "Senaste uppdragen"), archived_at och service_id direkt. Nu får bara
-- innehållet och status ändras; arkivering går via archive_job och
-- edited_at sätts av triggern nedan.
revoke update on table public.jobs from anon, authenticated;
grant update (title, description, category, budget, location, work_type, status)
  on table public.jobs to authenticated;

create function public.track_job_edit() returns trigger
language plpgsql set search_path = public, pg_temp as $$
begin
  if (new.title, new.description, new.category, new.budget, new.location, new.work_type)
     is distinct from (old.title, old.description, old.category, old.budget, old.location, old.work_type) then
    -- Ett stängt uppdrag kan ha en accepterad offert, och då är villkoren
    -- redan överenskomna.
    if old.status <> 'open' or old.archived_at is not null then
      raise exception 'Only open requests can be edited' using errcode = '23514';
    end if;
    new.edited_at := now();
  end if;
  return new;
end;
$$;

create trigger track_job_edit before update on public.jobs
for each row execute function public.track_job_edit();

commit;
