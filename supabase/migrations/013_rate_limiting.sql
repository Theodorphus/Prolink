-- Hastighetsbegränsning för skrivande endpoints.
--
-- Produkten hade ingen begränsning alls. Alla skrivande rutter kräver visserligen
-- inloggning, så exponeringen är begränsad till registrerade konton, men ett enda
-- konto kunde skapa obegränsat många uppdrag, offerter, meddelanden och omdömen
-- i en snabb slinga. För en marknadsplats är det både en spam- och en kostnadsrisk:
-- varje ny offert och varje nytt meddelande utlöser dessutom ett mejlutskick.
--
-- Räknaren ligger i databasen i stället för i processminnet. Applikationen kör
-- serverlöst, så en instans ser inte en annans minne och en minnesbaserad räknare
-- hade begränsat per instans i stället för per användare.

create table if not exists public.rate_limits (
  id bigint generated always as identity primary key,
  -- Vem som utför handlingen. Alltid en inloggad användare i dag, men kolumnen
  -- är medvetet fri text så att en framtida nyckel (t.ex. IP för utloggade
  -- flöden) ryms utan schemaändring.
  subject text not null,
  -- Vilken handling som räknas, t.ex. 'offers:create'.
  action text not null,
  created_at timestamptz not null default now()
);

-- Uppslaget är alltid "hur många gånger har subject gjort action sedan T".
create index if not exists rate_limits_subject_action_created_at_idx
  on public.rate_limits (subject, action, created_at desc);

alter table public.rate_limits enable row level security;

-- Ingen roll ges åtkomst. Tabellen läses och skrivs enbart av funktionen nedan,
-- som är security definer. Utan policies avvisar RLS all direktåtkomst, vilket
-- hindrar en klient från att rensa sin egen räknare.
revoke all on table public.rate_limits from anon, authenticated;

-- Registrerar ett försök och returnerar true om det ryms inom kvoten.
--
-- Funktionen är avsiktligt "fail open" i den meningen att den räknar först och
-- svarar sedan: ett anrop som nekas har ändå registrerats, så en klient kan inte
-- kringgå kvoten genom att spamma tills den lyckas.
create or replace function public.check_rate_limit(
  p_action text,
  p_limit integer,
  p_window_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_subject uuid := auth.uid();
  v_count integer;
begin
  if v_subject is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if p_limit is null or p_limit < 1 or p_window_seconds is null or p_window_seconds < 1 then
    raise exception 'Invalid rate limit parameters' using errcode = '22023';
  end if;

  -- Gammalt skräp städas opportunistiskt i stället för med ett schemalagt jobb,
  -- som hade krävt pg_cron. Städningen sker bara i ungefär ett anrop av hundra:
  -- en delete över hela tabellen vid varje anrop vore både bortkastat arbete och
  -- en källa till låskonflikter under last. Fönstret är generöst tilltaget så att
  -- raderingen aldrig rör rader som fortfarande räknas.
  if random() < 0.01 then
    delete from public.rate_limits
    where created_at < now() - interval '1 day';
  end if;

  insert into public.rate_limits (subject, action)
  values (v_subject::text, p_action);

  select count(*) into v_count
  from public.rate_limits
  where subject = v_subject::text
    and action = p_action
    and created_at > now() - make_interval(secs => p_window_seconds);

  return v_count <= p_limit;
end;
$$;

revoke all on function public.check_rate_limit(text, integer, integer) from public, anon;
grant execute on function public.check_rate_limit(text, integer, integer) to authenticated;
