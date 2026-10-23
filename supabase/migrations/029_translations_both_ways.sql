begin;

-- Annonser kan vara skrivna på vilket språk som helst och översätts nu till
-- sidans språk, svenska eller engelska. source_lang är originalets språk enligt
-- översättaren. Är det samma som lang visas texten orörd, utan översättningsnotis.
-- Befintliga rader är översatta från svenska.
alter table public.content_translations drop constraint content_translations_lang_check;
alter table public.content_translations add constraint content_translations_lang_check check (lang in ('sv', 'en'));
alter table public.content_translations add column source_lang text not null default 'sv';

commit;
