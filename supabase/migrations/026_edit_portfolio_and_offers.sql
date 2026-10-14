begin;

-- ---------------------------------------------------------------------------
-- REDIGERA PORTFOLIOARBETEN
-- ---------------------------------------------------------------------------
-- Ett arbete kunde bara tas bort och läggas till igen. Nu får ägaren ändra
-- innehållet. user_id och created_at ligger utanför uppdateringsrätten, så att
-- ett arbete varken kan flyttas till en annan profil eller byta plats i listan.
grant update (title, description, url, image_url) on table public.portfolio_items to authenticated;
create policy "Owners edit portfolio items" on public.portfolio_items for update
  using (auth.uid() = user_id)
  -- Samma regel som vid skapande: bilden ska ligga i ägarens egen mapp.
  with check (
    auth.uid() = user_id
    and (image_url is null or image_url like '%/storage/v1/object/public/avatars/' || auth.uid() || '/portfolio/%')
  );

-- ---------------------------------------------------------------------------
-- REDIGERA OFFERT
-- ---------------------------------------------------------------------------
-- Leverantören ska kunna justera pris, tid eller beskrivning efter att ha
-- pratat med kunden, i stället för att dra tillbaka och börja om. Det gäller
-- bara så länge offerten väntar på svar och uppdraget är öppet: en accepterad
-- offert är ett avtal och ändras inte.
alter table public.offers add column edited_at timestamptz;

-- offers saknar uppdateringsrätt för klienten (010), så ändringen går genom en
-- funktion som själv kontrollerar vem som anropar och i vilket läge offerten är.
create function public.edit_offer(
  p_offer_id uuid, p_price numeric, p_price_type public.price_type, p_timeline text, p_description text
) returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare o public.offers; j public.jobs;
begin
  if auth.uid() is null then raise exception 'Authentication required' using errcode = '42501'; end if;
  -- Raden låses så att en samtidig accept inte kan passera mitt i ändringen.
  select * into o from public.offers where id = p_offer_id for update;
  if not found or o.provider_id <> auth.uid() then
    raise exception 'Only the provider can edit an offer' using errcode = '42501';
  end if;
  select * into j from public.jobs where id = o.job_id;
  if o.status <> 'pending' or j.status <> 'open' or j.archived_at is not null then
    raise exception 'Only pending offers on open requests can be edited' using errcode = '23514';
  end if;
  if (o.price, o.price_type, o.timeline, o.description)
     is not distinct from (p_price, p_price_type, btrim(p_timeline), btrim(p_description)) then
    return;
  end if;

  -- customer_read_at nollas så att offerten åter märks som oläst för kunden.
  update public.offers
  set price = p_price, price_type = p_price_type, timeline = btrim(p_timeline),
      description = btrim(p_description), edited_at = now(), customer_read_at = null
  where id = o.id;

  -- Kunden ska få veta att det hen bedömde har ändrats. Tidsfönstret på
  -- 15 minuter hindrar att flera snabba rättelser blir flera mejl.
  insert into public.notification_outbox(recipient_id,kind,subject,body,path,dedupe_key)
  values (j.customer_id, 'offer_edited', 'Offerten har uppdaterats', j.title, '/offers/' || o.id,
    'offer_edited:' || o.id || ':' || floor(extract(epoch from now()) / 900)::text)
  on conflict (dedupe_key) do nothing;
end;
$$;
revoke all on function public.edit_offer(uuid, numeric, public.price_type, text, text) from public, anon;
grant execute on function public.edit_offer(uuid, numeric, public.price_type, text, text) to authenticated;

commit;
