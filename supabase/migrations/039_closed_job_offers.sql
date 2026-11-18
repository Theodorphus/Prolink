begin;

-- Offerter som blir hängande när ett uppdrag stängs.
--
-- När kunden accepterar en offert avslås de andra och frilansarna får besked.
-- Men när kunden stänger eller arkiverar uppdraget utan att välja, eller när
-- det stängs automatiskt efter 60 dagar, låg de väntande offerterna kvar som
-- "Inväntar svar" utan att frilansaren fick veta något. I produktion gällde
-- det 22 offerter, några över tre veckor gamla.
--
-- Offerterna avslås inte automatiskt: ett stängt uppdrag som inte arkiverats
-- kan öppnas igen, och då ska offerterna fortfarande gälla. I stället får
-- frilansaren ett mejl, och appen visar läget som "Uppdraget stängt".

-- 1. Mejl till frilansare med väntande offert när uppdraget stängs.
-- Triggern körs efter att transition_offer avslagit de andra offerterna vid
-- en accept, så den som fått "gick inte vidare" får inget mejl till.
create function public.notify_job_closed() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  insert into public.notification_outbox(recipient_id,kind,subject,body,path,dedupe_key)
  select o.provider_id, 'job_closed', 'Uppdraget har stängts', new.title, '/offers/' || o.id, 'job_closed:' || o.id
  from public.offers o
  where o.job_id = new.id and o.status = 'pending'
  on conflict (dedupe_key) do nothing;
  return null;
end;
$$;
revoke all on function public.notify_job_closed() from public, anon, authenticated;

create trigger notify_job_closed after update of status on public.jobs
for each row when (old.status = 'open' and new.status = 'closed')
execute function public.notify_job_closed();

-- 2. En ny offert räknas bara som oläst för kunden medan uppdraget är öppet.
-- Annars fastnade räknaren i menyn på offerter till uppdrag som kunden redan
-- stängt eller arkiverat. Nya meddelanden räknas som tidigare.
create or replace function public.offer_unread(o public.offers, j public.jobs)
returns boolean language sql stable security invoker set search_path = public, pg_temp as $$
  select (j.customer_id = auth.uid() and o.customer_read_at is null
      and j.status = 'open' and j.archived_at is null)
    or (o.provider_id = auth.uid() and o.status in ('accepted', 'rejected')
      and o.status_changed_at > coalesce(o.provider_status_seen_at, '-infinity'::timestamptz))
    or exists(select 1 from public.messages m where m.offer_id = o.id and m.sender_id <> auth.uid()
      and m.created_at > coalesce(case when o.provider_id = auth.uid() then o.provider_read_at else o.customer_read_at end, '-infinity'::timestamptz));
$$;

-- 3. Konversationslistan får veta om uppdraget är öppet, så att en väntande
-- offert på ett stängt uppdrag kan visas som just det.
drop function public.conversation_list(integer);
create function public.conversation_list(p_page integer default 1)
returns table(id uuid, title text, other_name text, other_avatar text, last_content text,
  last_sender uuid, last_at timestamptz, unread boolean, total bigint,
  price numeric, price_type public.price_type, status public.offer_status, is_customer boolean,
  job_open boolean)
language sql stable security invoker set search_path = public, pg_temp as $$
  select o.id, j.title, u.name, u.avatar_url, latest.content, latest.sender_id,
    coalesce(latest.created_at, o.created_at),
    public.offer_unread(o, j),
    count(*) over(),
    o.price, o.price_type, o.status, j.customer_id = auth.uid(),
    j.status = 'open' and j.archived_at is null
  from public.offers o join public.jobs j on j.id=o.job_id
  join public.users u on u.id=case when o.provider_id=auth.uid() then j.customer_id else o.provider_id end
  left join lateral (select content,sender_id,created_at from public.messages where offer_id=o.id order by created_at desc,id desc limit 1) latest on true
  where auth.uid() in (o.provider_id,j.customer_id)
  order by coalesce(latest.created_at,o.created_at) desc,o.id
  limit 24 offset ((greatest(1,least(p_page,100000))-1)*24);
$$;
revoke all on function public.conversation_list(integer) from public,anon;
grant execute on function public.conversation_list(integer) to authenticated;

-- 4. Index för de främmande nycklar som konversationslistan, räknaren och
-- profilsidorna filtrerar på. Supabase-rådgivaren flaggade dem, och med fler
-- användare blir det sekventiella läsningar vid varje sidvisning.
create index if not exists offers_provider_id_idx on public.offers(provider_id);
create index if not exists jobs_customer_id_idx on public.jobs(customer_id);
create index if not exists services_provider_id_idx on public.services(provider_id);
create index if not exists reviews_reviewee_id_idx on public.reviews(reviewee_id);
create index if not exists messages_sender_id_idx on public.messages(sender_id);

commit;
