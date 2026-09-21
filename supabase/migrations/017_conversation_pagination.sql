begin;
create index if not exists messages_offer_order on public.messages(offer_id, created_at desc, id desc);
create function public.conversation_list(p_page integer default 1)
returns table(id uuid, title text, other_name text, other_avatar text, last_content text,
  last_sender uuid, last_at timestamptz, unread boolean, total bigint)
language sql stable security invoker set search_path = public, pg_temp as $$
  select o.id, j.title, u.name, u.avatar_url, latest.content, latest.sender_id,
    coalesce(latest.created_at, o.created_at),
    exists(select 1 from public.messages m where m.offer_id=o.id and m.sender_id <> auth.uid()
      and m.created_at > coalesce(case when o.provider_id=auth.uid() then o.provider_read_at else o.customer_read_at end, '-infinity'::timestamptz)),
    count(*) over()
  from public.offers o join public.jobs j on j.id=o.job_id
  join public.users u on u.id=case when o.provider_id=auth.uid() then j.customer_id else o.provider_id end
  left join lateral (select content,sender_id,created_at from public.messages where offer_id=o.id order by created_at desc,id desc limit 1) latest on true
  where auth.uid() in (o.provider_id,j.customer_id)
  order by coalesce(latest.created_at,o.created_at) desc,o.id
  limit 24 offset ((greatest(1,least(p_page,100000))-1)*24);
$$;
revoke all on function public.conversation_list(integer) from public,anon;
grant execute on function public.conversation_list(integer) to authenticated;
commit;
