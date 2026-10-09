begin;

-- En ny offert syntes inte någonstans i appen. Konversationslistan märkte bara
-- olästa chattmeddelanden, navigeringen hade ingen räknare och mark_offer_read
-- anropades aldrig, så customer_read_at förblev null även när kunden öppnat
-- offerten.
--
-- customer_read_at och provider_read_at är också läsmarkörer för chatten
-- (meddelanden efter markören är olästa). Att öppna offerten får därför inte
-- markera senare meddelanden som lästa: markören sätts till offertens
-- skapandetid om den saknas och lämnas annars orörd.
create or replace function public.mark_offer_read(p_offer_id uuid)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_actor uuid := auth.uid();
  v_provider_id uuid;
  v_customer_id uuid;
begin
  select o.provider_id, j.customer_id into v_provider_id, v_customer_id
  from public.offers o join public.jobs j on j.id = o.job_id
  where o.id = p_offer_id;

  if not found or v_actor is null then
    raise exception 'Offer not found or authentication required' using errcode = '42501';
  end if;

  if v_actor = v_provider_id then
    update public.offers set provider_read_at = coalesce(provider_read_at, created_at) where id = p_offer_id;
  elsif v_actor = v_customer_id then
    update public.offers set customer_read_at = coalesce(customer_read_at, created_at) where id = p_offer_id;
  else
    raise exception 'Not an offer participant' using errcode = '42501';
  end if;
end;
$$;
revoke all on function public.mark_offer_read(uuid) from public, anon;
grant execute on function public.mark_offer_read(uuid) to authenticated;

-- Oläst = kunden har inte öppnat offerten, eller motparten har skrivit efter
-- ens läsmarkör. Samma villkor i listan och i räknaren.
create or replace function public.offer_unread(o public.offers, j public.jobs)
returns boolean language sql stable security invoker set search_path = public, pg_temp as $$
  select (j.customer_id = auth.uid() and o.customer_read_at is null)
    or exists(select 1 from public.messages m where m.offer_id = o.id and m.sender_id <> auth.uid()
      and m.created_at > coalesce(case when o.provider_id = auth.uid() then o.provider_read_at else o.customer_read_at end, '-infinity'::timestamptz));
$$;
revoke all on function public.offer_unread(public.offers, public.jobs) from public, anon;
grant execute on function public.offer_unread(public.offers, public.jobs) to authenticated;

-- Listan visar också offertens pris och status, så att en konversation utan
-- meddelanden inte bara säger "Öppna konversationen". Returtypen ändras och
-- funktionen måste därför tas bort och skapas om.
drop function public.conversation_list(integer);
create function public.conversation_list(p_page integer default 1)
returns table(id uuid, title text, other_name text, other_avatar text, last_content text,
  last_sender uuid, last_at timestamptz, unread boolean, total bigint,
  price numeric, price_type public.price_type, status public.offer_status, is_customer boolean)
language sql stable security invoker set search_path = public, pg_temp as $$
  select o.id, j.title, u.name, u.avatar_url, latest.content, latest.sender_id,
    coalesce(latest.created_at, o.created_at),
    public.offer_unread(o, j),
    count(*) over(),
    o.price, o.price_type, o.status, j.customer_id = auth.uid()
  from public.offers o join public.jobs j on j.id=o.job_id
  join public.users u on u.id=case when o.provider_id=auth.uid() then j.customer_id else o.provider_id end
  left join lateral (select content,sender_id,created_at from public.messages where offer_id=o.id order by created_at desc,id desc limit 1) latest on true
  where auth.uid() in (o.provider_id,j.customer_id)
  order by coalesce(latest.created_at,o.created_at) desc,o.id
  limit 24 offset ((greatest(1,least(p_page,100000))-1)*24);
$$;
revoke all on function public.conversation_list(integer) from public,anon;
grant execute on function public.conversation_list(integer) to authenticated;

-- Antal konversationer med något oläst, för räknaren i navigeringen.
create function public.unread_count()
returns integer language sql stable security invoker set search_path = public, pg_temp as $$
  select count(*)::integer
  from public.offers o join public.jobs j on j.id = o.job_id
  where auth.uid() in (o.provider_id, j.customer_id) and public.offer_unread(o, j);
$$;
revoke all on function public.unread_count() from public, anon;
grant execute on function public.unread_count() to authenticated;

commit;
