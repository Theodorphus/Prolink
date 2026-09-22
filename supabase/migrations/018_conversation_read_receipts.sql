begin;

-- Acknowledge only messages fetched by the browser, never messages arriving
-- between a fetch and its acknowledgement. Preserve monotonic read markers.
create function public.mark_conversation_read(p_offer_id uuid, p_message_id uuid)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_actor uuid := auth.uid();
  v_provider uuid;
  v_customer uuid;
  v_time timestamptz;
begin
  select o.provider_id, j.customer_id into v_provider, v_customer
  from public.offers o join public.jobs j on j.id = o.job_id
  where o.id = p_offer_id;
  if v_actor is null or v_actor not in (v_provider, v_customer) or v_provider is null then
    raise exception 'Not an offer participant' using errcode = '42501';
  end if;
  select created_at into v_time from public.messages
  where id = p_message_id and offer_id = p_offer_id;
  if not found then raise exception 'Message not found' using errcode = 'P0002'; end if;
  if v_actor = v_provider then
    update public.offers set provider_read_at = greatest(provider_read_at, v_time) where id = p_offer_id;
  else
    update public.offers set customer_read_at = greatest(customer_read_at, v_time) where id = p_offer_id;
  end if;
end;
$$;
revoke all on function public.mark_conversation_read(uuid, uuid) from public, anon;
grant execute on function public.mark_conversation_read(uuid, uuid) to authenticated;
commit;
