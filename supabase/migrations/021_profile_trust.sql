begin;

-- Förtroende för nya frilansare: hemsida, referenser från tidigare kunder och
-- verifierat företag. Frilansare utan affärer på Prolink saknade allt som
-- kunde visa att de är seriösa.

-- ---------------------------------------------------------------------------
-- HEMSIDA
-- ---------------------------------------------------------------------------
alter table public.users add column website_url text;
alter table public.users add constraint users_website_url_length check (website_url is null or char_length(website_url) <= 2048);
grant select (website_url) on table public.users to anon, authenticated;
grant insert (website_url) on table public.users to authenticated;
grant update (website_url) on table public.users to authenticated;

-- ---------------------------------------------------------------------------
-- MEJLKÖ TILL EXTERNA MOTTAGARE
-- ---------------------------------------------------------------------------
-- En referensförfrågan går till en tidigare kund som inte har något konto.
alter table public.notification_outbox
  alter column recipient_id drop not null,
  add column recipient_email text,
  add constraint notification_outbox_recipient check (recipient_id is not null or recipient_email is not null);

-- ---------------------------------------------------------------------------
-- REFERENSER FRÅN TIDIGARE KUNDER
-- ---------------------------------------------------------------------------
-- Frilansaren bjuder in en tidigare kund via e-post. Länken bär en slumpad
-- token; bara dess SHA-256 sparas här. Omdömet visas märkt som extern
-- referens, skilt från omdömen efter affärer på Prolink. Prolink kontrollerar
-- att det kom från mejladressen, inte att uppdraget faktiskt genomfördes.
--
-- Tabellen är stängd för anon och authenticated. Skrivningar sker i
-- API-rutter med service-rollen; läsningar via funktionerna nedan, som aldrig
-- lämnar ut kundens e-postadress publikt.
create table public.external_references (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.users(id) on delete cascade,
  client_email text not null check (client_email = lower(client_email) and char_length(client_email) <= 254),
  token_hash text not null unique,
  client_name text check (client_name is null or char_length(client_name) between 1 and 100),
  client_company text check (client_company is null or char_length(client_company) <= 120),
  rating smallint check (rating between 1 and 5),
  comment text check (comment is null or char_length(comment) <= 2000),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '30 days',
  submitted_at timestamptz,
  unique (provider_id, client_email),
  check (submitted_at is null or (client_name is not null and rating is not null))
);
alter table public.external_references enable row level security;
revoke all on public.external_references from anon, authenticated;
grant all on public.external_references to service_role;
create index external_references_provider on public.external_references(provider_id, submitted_at desc);

create function public.external_reference_list(p_user_id uuid)
returns table(id uuid, client_name text, client_company text, rating smallint, comment text, submitted_at timestamptz)
language sql stable security definer set search_path = public, pg_temp as $$
  select id, client_name, client_company, rating, comment, submitted_at
  from public.external_references
  where provider_id = p_user_id and submitted_at is not null
  order by submitted_at desc, id
  limit 50;
$$;
revoke all on function public.external_reference_list(uuid) from public;
grant execute on function public.external_reference_list(uuid) to anon, authenticated;

-- Frilansarens egna inbjudningar, med adress och status.
create function public.my_reference_requests()
returns table(id uuid, client_email text, created_at timestamptz, submitted_at timestamptz, expired boolean)
language sql stable security definer set search_path = public, pg_temp as $$
  select id, client_email, created_at, submitted_at, submitted_at is null and expires_at < now()
  from public.external_references
  where provider_id = auth.uid()
  order by created_at desc, id;
$$;
revoke all on function public.my_reference_requests() from public, anon;
grant execute on function public.my_reference_requests() to authenticated;

-- ---------------------------------------------------------------------------
-- VERIFIERAT FÖRETAG
-- ---------------------------------------------------------------------------
-- Organisationsnumret för en enskild firma är innehavarens personnummer, så
-- det visas aldrig publikt. Profilen visar bara företagsnamnet och märket när
-- en admin har kontrollerat uppgifterna mot Bolagsverket och Skatteverket.
create table public.company_verifications (
  user_id uuid primary key references public.users(id) on delete cascade,
  org_number text not null check (org_number ~ '^[0-9]{10}$'),
  company_name text not null check (char_length(company_name) between 2 and 120),
  f_skatt boolean not null default false,
  status text not null default 'pending' check (status in ('pending', 'verified', 'rejected')),
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  review_note text check (review_note is null or char_length(review_note) <= 500)
);
alter table public.company_verifications enable row level security;
revoke all on public.company_verifications from anon, authenticated;
grant all on public.company_verifications to service_role;

-- Ny eller ändrad ansökan går alltid tillbaka till granskning, så ett
-- verifierat märke kan inte behållas med ett utbytt organisationsnummer.
create function public.submit_company_verification(p_org_number text, p_company_name text, p_f_skatt boolean)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if auth.uid() is null then raise exception 'Authentication required' using errcode = '42501'; end if;
  if not exists (select 1 from public.users where id = auth.uid() and role = 'provider') then
    raise exception 'Only providers can verify a company' using errcode = '42501';
  end if;
  insert into public.company_verifications(user_id, org_number, company_name, f_skatt)
  values (auth.uid(), p_org_number, btrim(p_company_name), coalesce(p_f_skatt, false))
  on conflict (user_id) do update set
    org_number = excluded.org_number, company_name = excluded.company_name, f_skatt = excluded.f_skatt,
    status = 'pending', submitted_at = now(), reviewed_at = null, review_note = null;
end;
$$;
revoke all on function public.submit_company_verification(text, text, boolean) from public, anon;
grant execute on function public.submit_company_verification(text, text, boolean) to authenticated;

create function public.my_company_verification()
returns table(org_number text, company_name text, f_skatt boolean, status text, submitted_at timestamptz, review_note text)
language sql stable security definer set search_path = public, pg_temp as $$
  select org_number, company_name, f_skatt, status, submitted_at, review_note
  from public.company_verifications where user_id = auth.uid();
$$;
revoke all on function public.my_company_verification() from public, anon;
grant execute on function public.my_company_verification() to authenticated;

-- Publikt: bara verifierade företag, utan organisationsnummer.
create function public.company_badge(p_user_id uuid)
returns table(company_name text, f_skatt boolean, verified_at timestamptz)
language sql stable security definer set search_path = public, pg_temp as $$
  select company_name, f_skatt, reviewed_at
  from public.company_verifications
  where user_id = p_user_id and status = 'verified';
$$;
revoke all on function public.company_badge(uuid) from public;
grant execute on function public.company_badge(uuid) to anon, authenticated;

commit;
