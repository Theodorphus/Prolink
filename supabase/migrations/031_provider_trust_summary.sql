begin;

-- Förtroendemärken för många frilansare i ett anrop, så att tjänstelistorna
-- kan visa verifierat företag och antal referenser utan en fråga per kort.
-- Lämnar bara ut samma uppgifter som company_badge och external_reference_list
-- redan gör publikt: inget organisationsnummer och ingen kundadress.
create function public.provider_trust_summary(p_user_ids uuid[])
returns table(user_id uuid, verified boolean, reference_count integer)
language sql stable security definer set search_path = public, pg_temp as $$
  select u.id,
    exists (select 1 from public.company_verifications v where v.user_id = u.id and v.status = 'verified'),
    (select count(*)::integer from public.external_references r where r.provider_id = u.id and r.submitted_at is not null)
  from unnest(p_user_ids) as u(id);
$$;
revoke all on function public.provider_trust_summary(uuid[]) from public;
grant execute on function public.provider_trust_summary(uuid[]) to anon, authenticated;

commit;
