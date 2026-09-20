-- Kategori krävs på tjänster.
--
-- POST /api/services kräver redan en giltig kategori genom categoryValue(), men
-- databasen gör det inte. En tjänst som skapades innan den valideringen fanns
-- har category = null, och eftersom /services filtrerar med .eq('category', ...)
-- syns den inte under någon kategori alls. Den är i praktiken osynlig för alla
-- som bläddrar, vilket är det normala sättet att hitta tjänster.
--
-- Migrationen är avsiktligt uppdelad. Steg 1 måste köras innan steg 2, annars
-- misslyckas NOT NULL-villkoret på den befintliga raden.

-- Steg 0a: laga data som bryter mot ett villkor som aldrig validerades.
--
-- Migration 010 la till services_delivery_time_length (2-120 tecken) med
-- NOT VALID, vilket betyder att befintliga rader aldrig kontrollerades. En rad
-- har delivery_time = '3', alltså ett tecken. Så länge raden aldrig rörs märks
-- inget, men varje UPDATE på den tvingar Postgres att validera hela raden, och
-- då avvisas den. Steg 0 nedan gör just en sådan UPDATE, så det här måste
-- köras först.
--
-- Värdet tolkas som antal dagar, vilket är den enda rimliga läsningen av en
-- ensam siffra i ett leveranstidsfält.
update public.services
set delivery_time = delivery_time || ' dagar'
where char_length(btrim(delivery_time)) < 2
  and btrim(delivery_time) ~ '^[0-9]+$';

-- Kvarvarande korta värden som inte är rena siffror går inte att tolka.
update public.services
set delivery_time = 'Enligt överenskommelse'
where char_length(btrim(delivery_time)) < 2;

-- Nu när raderna uppfyller villkoret kan det valideras på riktigt, så att
-- problemet inte ligger kvar och väntar på nästa UPDATE.
alter table public.services
  validate constraint services_delivery_time_length;

-- Steg 0: rätta kategorivärden som inte finns i CATEGORIES.
--
-- Phase 2 döpte om etiketten för 'redovisning' till "Ekonomi & redovisning",
-- men en befintlig rad har värdet 'ekonomi', som aldrig varit ett giltigt
-- värde. Eftersom /services filtrerar med .eq('category', ...) är även den
-- raden osynlig i bläddringen. Tillsammans med null-raden gällde det två av
-- tre tjänster.
update public.services set category = 'redovisning' where category = 'ekonomi';
update public.services set category = 'marknadsforing' where category in ('marknadsföring', 'marknadsforing ');
update public.services set category = 'foto-video' where category in ('foto', 'video');

-- Steg 1: fyll i de rader som saknar kategori.
--
-- Gissningen görs bara när titeln eller beskrivningen tydligt pekar ut en
-- kategori. Raden i dag heter "Webbutveckling" och beskriver Next.js-sidor, så
-- den träffar det första villkoret. Övriga hamnar i 'annat', som är en giltig
-- kategori i CATEGORIES och inte en påhittad etikett.
update public.services
set category = case
  when title ilike '%webb%' or description ilike '%next.js%' or description ilike '%hemsid%'
    then 'webbutveckling'
  when title ilike '%design%' or title ilike '%logotyp%' then 'design'
  when title ilike '%bokför%' or title ilike '%redovisn%' or title ilike '%ekonomi%'
    then 'redovisning'
  when title ilike '%text%' or title ilike '%översätt%' then 'text'
  when title ilike '%foto%' or title ilike '%video%' then 'foto-video'
  else 'annat'
end
where category is null or btrim(category) = '';

-- Steg 2: hindra att det uppstår igen.
alter table public.services
  alter column category set not null;

-- Tomma strängar är inte null, men lika oanvändbara för filtreringen.
alter table public.services
  drop constraint if exists services_category_not_blank;

alter table public.services
  add constraint services_category_not_blank
  check (btrim(category) <> '');

-- Steg 3: lås värdemängden till de kategorier gränssnittet känner till.
--
-- Utan det här kan ett nytt felstavat värde göra en tjänst osynlig igen utan
-- att något fel syns. Listan speglar CATEGORIES i src/lib/categories.ts; ändras
-- den där måste villkoret uppdateras med en ny migration.
alter table public.services
  drop constraint if exists services_category_valid;

alter table public.services
  add constraint services_category_valid
  check (category in (
    'webbutveckling', 'design', 'marknadsforing', 'redovisning', 'juridik',
    'text', 'foto-video', 'it-support', 'affarsstod', 'annat'
  ));
