begin;

-- Maskinöversättningar av chattmeddelanden, på begäran av mottagaren. Ett
-- meddelande ändras aldrig efter att det skickats, så ingen hash behövs. Raden
-- gäller tills meddelandet tas bort.
--
-- Ingen RLS-policy ges medvetet: tabellen läses och skrivs bara av servern med
-- service role-nyckeln, efter att den kontrollerat att anroparen deltar i
-- offerten. Aldrig direkt från webbläsaren.
create table public.message_translations (
  message_id uuid not null references public.messages(id) on delete cascade,
  lang text not null check (lang in ('sv', 'en')),
  source_lang text not null,
  content text not null check (char_length(content) <= 20000),
  created_at timestamptz not null default now(),
  primary key (message_id, lang)
);
alter table public.message_translations enable row level security;
revoke all on public.message_translations from anon, authenticated;

commit;
