begin;

-- Starkare frilansprofiler: portfolio, ort och arbetssätt samt svarstid.

-- ---------------------------------------------------------------------------
-- ORT OCH ARBETSSÄTT
-- ---------------------------------------------------------------------------
alter table public.users
  add column location text check (location is null or char_length(location) <= 80),
  add column work_mode text check (work_mode is null or work_mode in ('remote', 'onsite', 'hybrid'));
grant select (location, work_mode) on table public.users to anon, authenticated;
grant insert (location, work_mode) on table public.users to authenticated;
grant update (location, work_mode) on table public.users to authenticated;

-- ---------------------------------------------------------------------------
-- PORTFOLIO
-- ---------------------------------------------------------------------------
-- Bilderna ligger i avatars-bucketen under <user_id>/portfolio/, där
-- befintliga policyer redan begränsar uppladdning och radering till ägaren.
create table public.portfolio_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  title text not null check (char_length(title) between 2 and 100),
  description text check (description is null or char_length(description) <= 500),
  url text check (url is null or (char_length(url) <= 2048 and url ~ '^https?://')),
  image_url text check (image_url is null or char_length(image_url) <= 2048),
  created_at timestamptz not null default now()
);
create index portfolio_items_user on public.portfolio_items(user_id, created_at);
alter table public.portfolio_items enable row level security;
revoke all on public.portfolio_items from anon, authenticated;
grant select on public.portfolio_items to anon, authenticated;
grant insert (user_id, title, description, url, image_url), delete on public.portfolio_items to authenticated;
create policy "Anyone can read portfolios" on public.portfolio_items for select using (true);
create policy "Owners add portfolio items" on public.portfolio_items for insert with check (
  auth.uid() = user_id
  -- Bilden måste ligga i ägarens egen mapp, så att ingen kan visa någon annans.
  and (image_url is null or image_url like '%/storage/v1/object/public/avatars/' || auth.uid() || '/portfolio/%')
);
create policy "Owners delete portfolio items" on public.portfolio_items for delete using (auth.uid() = user_id);

-- Högst sex arbeten per profil.
create function public.limit_portfolio_items() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  perform pg_advisory_xact_lock(hashtext('portfolio:' || new.user_id));
  if (select count(*) from public.portfolio_items where user_id = new.user_id) >= 6 then
    raise exception 'Portfolio limit reached' using errcode = '54000';
  end if;
  return new;
end;
$$;
create trigger limit_portfolio_items before insert on public.portfolio_items for each row execute function public.limit_portfolio_items();

-- ---------------------------------------------------------------------------
-- SVARSTID
-- ---------------------------------------------------------------------------
-- Median för hur snabbt frilansaren svarar de senaste 90 dagarna: från en
-- förfrågan till frilansarens offert, och från kundens meddelande till
-- frilansarens nästa meddelande i samma konversation. Bara aggregatet lämnas
-- ut, aldrig enskilda meddelanden.
create function public.provider_response_time(p_user_id uuid)
returns table(median_hours numeric, samples integer)
language sql stable security definer set search_path = public, pg_temp as $$
  with inquiry as (
    select extract(epoch from (min(o.created_at) - j.created_at)) / 3600 as hours
    from public.jobs j join public.offers o on o.job_id = j.id and o.provider_id = p_user_id
    where j.requested_provider_id = p_user_id and j.created_at > now() - interval '90 days'
    group by j.id, j.created_at
  ), chat as (
    select extract(epoch from (
      (select min(r.created_at) from public.messages r where r.offer_id = m.offer_id and r.sender_id = p_user_id and r.created_at > m.created_at)
      - m.created_at)) / 3600 as hours
    from public.messages m join public.offers o on o.id = m.offer_id
    where o.provider_id = p_user_id and m.sender_id <> p_user_id and m.created_at > now() - interval '90 days'
      -- Bara det första meddelandet i en följd från kunden räknas.
      and not exists (select 1 from public.messages p where p.offer_id = m.offer_id and p.created_at < m.created_at
        and p.created_at > coalesce((select max(x.created_at) from public.messages x where x.offer_id = m.offer_id and x.sender_id = p_user_id and x.created_at < m.created_at), '-infinity'::timestamptz)
        and p.sender_id <> p_user_id)
  ), answered as (
    select hours from inquiry union all select hours from chat where hours is not null
  )
  select round((percentile_cont(0.5) within group (order by hours))::numeric, 1), count(*)::integer from answered;
$$;
revoke all on function public.provider_response_time(uuid) from public;
grant execute on function public.provider_response_time(uuid) to anon, authenticated;

commit;
