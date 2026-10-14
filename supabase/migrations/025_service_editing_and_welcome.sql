begin;

-- ---------------------------------------------------------------------------
-- REDIGERA TJÄNSTER
-- ---------------------------------------------------------------------------
-- En frilansare ska kunna ändra en publicerad tjänst i stället för att ta
-- bort den och lägga ut en ny. Tjänsten tidsstämplas när innehållet ändras, så
-- att sidan kan visa "Redigerad <datum>".
alter table public.services add column edited_at timestamptz;

-- Uppdateringsrätten gällde alla kolumner, och RLS begränsar bara vilka rader.
-- Ägaren kunde alltså sätta created_at (som styr ordningen i listorna) direkt.
-- Nu får bara innehållet ändras, på samma sätt som för uppdrag i 023.
revoke update on table public.services from anon, authenticated;
grant update (title, description, price, delivery_time, category, vat_included)
  on table public.services to authenticated;

create function public.track_service_edit() returns trigger
language plpgsql set search_path = public, pg_temp as $$
begin
  if (new.title, new.description, new.price, new.delivery_time, new.category, new.vat_included)
     is distinct from (old.title, old.description, old.price, old.delivery_time, old.category, old.vat_included) then
    new.edited_at := now();
  end if;
  return new;
end;
$$;
create trigger track_service_edit before update on public.services
for each row execute function public.track_service_edit();

-- ---------------------------------------------------------------------------
-- VÄLKOMSTMEJL
-- ---------------------------------------------------------------------------
-- Ett mejl per nytt konto. Innehållet väljs när det skickas, utifrån kontots
-- roll då: vid Google-inloggning sätts rollen först efter att raden skapats.
-- Därför är path bara en platshållare här.
create function public.queue_welcome_notification() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  insert into public.notification_outbox(recipient_id, kind, subject, body, path, dedupe_key)
  values (new.id, 'welcome', 'Välkommen till Prolink', 'Välkommen', '/', 'welcome:' || new.id)
  on conflict (dedupe_key) do nothing;
  return new;
end;
$$;
create trigger queue_welcome after insert on public.users
for each row execute function public.queue_welcome_notification();

commit;
