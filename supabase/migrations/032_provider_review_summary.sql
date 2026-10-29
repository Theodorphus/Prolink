begin;

-- Genomsnittligt betyg och antal omdömen för många frilansare i ett anrop,
-- för tjänstekorten. Samma uppgifter som review_summary, men för en lista.
create function public.provider_review_summary(p_user_ids uuid[])
returns table(user_id uuid, review_count integer, average_rating numeric)
language sql stable security definer set search_path = public, pg_temp as $$
  select u.id,
    (select count(*)::integer from public.reviews r where r.reviewee_id = u.id),
    (select round(avg(r.rating), 1) from public.reviews r where r.reviewee_id = u.id)
  from unnest(p_user_ids) as u(id);
$$;
revoke all on function public.provider_review_summary(uuid[]) from public;
grant execute on function public.provider_review_summary(uuid[]) to anon, authenticated;

commit;
