begin;

-- Maskinöversättningar av användarskapat innehåll (uppdrag och tjänster), så att
-- en besökare på engelska kan läsa svenska annonser. Raden gäller så länge
-- source_hash stämmer med den nuvarande texten; när annonsen redigeras ändras
-- hashen och översättningen görs om vid nästa visning.
--
-- Ingen RLS-policy ges medvetet: tabellen läses och skrivs bara av servern med
-- service role-nyckeln, aldrig direkt från webbläsaren.
create table public.content_translations (
  entity_type text not null check (entity_type in ('job', 'service')),
  entity_id uuid not null,
  lang text not null check (lang in ('en')),
  source_hash text not null,
  title text not null check (char_length(title) between 1 and 400),
  description text not null check (char_length(description) <= 20000),
  created_at timestamptz not null default now(),
  primary key (entity_type, entity_id, lang)
);
alter table public.content_translations enable row level security;
revoke all on public.content_translations from anon, authenticated;

-- Städar bort översättningen när annonsen tas bort.
create function public.delete_content_translations() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  delete from public.content_translations
  where entity_type = tg_argv[0] and entity_id = old.id;
  return old;
end;
$$;
create trigger jobs_delete_translations after delete on public.jobs
for each row execute function public.delete_content_translations('job');
create trigger services_delete_translations after delete on public.services
for each row execute function public.delete_content_translations('service');

-- Språket för mejl och notiser. Sätts när kontot skapas utifrån vilket språk
-- besökaren använde, och kan ändras i profilen.
alter table public.user_private_profiles
  add column locale text not null default 'sv' check (locale in ('sv', 'en'));

-- Mejlen skrivs på mottagarens språk. Kunder som bara har en adress (externa
-- referenser) har inget konto, så raden bär språket själv.
alter table public.notification_outbox
  add column locale text not null default 'sv' check (locale in ('sv', 'en'));

-- Nya konton får det språk som valdes vid registreringen (raw_user_meta_data.locale).
create or replace function public.handle_new_private_profile()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.user_private_profiles (user_id, locale)
  values (
    new.id,
    case when (select raw_user_meta_data->>'locale' from auth.users where id = new.id) = 'en' then 'en' else 'sv' end
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;

commit;
