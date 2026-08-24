-- Phase 1 security baseline for the existing MVP marketplace.
-- Additive only: no legacy columns or data are removed.

-- ---------------------------------------------------------------------------
-- PRIVATE PROFILE DATA
-- Keep public identity/provider fields on users, and move applicant-only data
-- behind owner-only RLS. Legacy columns remain for compatibility but are no
-- longer selectable or writable by anon/authenticated roles.
-- ---------------------------------------------------------------------------
create table if not exists public.user_private_profiles (
  user_id    uuid primary key references public.users(id) on delete cascade,
  phone      text,
  cv_text    text,
  cv_path    text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_private_profiles enable row level security;

drop policy if exists "Users can read own private profile" on public.user_private_profiles;
create policy "Users can read own private profile"
  on public.user_private_profiles for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own private profile" on public.user_private_profiles;
create policy "Users can insert own private profile"
  on public.user_private_profiles for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own private profile" on public.user_private_profiles;
create policy "Users can update own private profile"
  on public.user_private_profiles for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own private profile" on public.user_private_profiles;
create policy "Users can delete own private profile"
  on public.user_private_profiles for delete
  using (auth.uid() = user_id);

grant select, insert, update, delete on public.user_private_profiles to authenticated;
revoke all on public.user_private_profiles from anon;

insert into public.user_private_profiles as private_profile (user_id, phone, cv_text, cv_path)
select
  id,
  phone,
  cv_text,
  case
    when cv_url like '%/storage/v1/object/public/cvs/%'
      then split_part(regexp_replace(cv_url, '^.*/storage/v1/object/public/cvs/', ''), '?', 1)
    when cv_url like '%/storage/v1/object/sign/cvs/%'
      then split_part(regexp_replace(cv_url, '^.*/storage/v1/object/sign/cvs/', ''), '?', 1)
    else null
  end
from public.users
on conflict (user_id) do update set
  phone = coalesce(private_profile.phone, excluded.phone),
  cv_text = coalesce(private_profile.cv_text, excluded.cv_text),
  cv_path = coalesce(private_profile.cv_path, excluded.cv_path),
  updated_at = now();

create or replace function public.handle_new_private_profile()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.user_private_profiles (user_id)
  values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_public_user_created_private_profile on public.users;
create trigger on_public_user_created_private_profile
  after insert on public.users
  for each row execute procedure public.handle_new_private_profile();

-- Column grants are required because RLS protects rows, not individual fields.
revoke select, insert, update on table public.users from anon, authenticated;

grant select (
  id, role, name, bio, skills, hourly_rate, avatar_url, linkedin_url, created_at
) on table public.users to anon, authenticated;

grant insert (
  id, role, name, bio, skills, hourly_rate, avatar_url, linkedin_url
) on table public.users to authenticated;

grant update (
  role, name, bio, skills, hourly_rate, avatar_url, linkedin_url
) on table public.users to authenticated;

-- ---------------------------------------------------------------------------
-- PRIVATE CV STORAGE
-- ---------------------------------------------------------------------------
update storage.buckets
set
  public = false,
  file_size_limit = 5242880,
  allowed_mime_types = array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]::text[]
where id = 'cvs';

drop policy if exists "Anyone can read CVs" on storage.objects;
drop policy if exists "Users can upload own CV" on storage.objects;
drop policy if exists "Users can update own CV" on storage.objects;
drop policy if exists "Users can delete own CV" on storage.objects;
drop policy if exists "Users can read own CV" on storage.objects;

create policy "Users can read own CV"
  on storage.objects for select
  using (
    bucket_id = 'cvs'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can upload own CV"
  on storage.objects for insert
  with check (
    bucket_id = 'cvs'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can update own CV"
  on storage.objects for update
  using (
    bucket_id = 'cvs'
    and auth.uid()::text = (storage.foldername(name))[1]
  )
  with check (
    bucket_id = 'cvs'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can delete own CV"
  on storage.objects for delete
  using (
    bucket_id = 'cvs'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- ---------------------------------------------------------------------------
-- OFFER-SCOPED CHAT ATTACHMENTS
-- Store stable object paths in messages. Legacy signed URLs remain readable
-- for existing rows until they expire, but new writes use attachment_path.
-- ---------------------------------------------------------------------------
alter table public.messages
  add column if not exists attachment_path text;

drop policy if exists "Offer participants can send messages" on public.messages;
create policy "Offer participants can send messages"
  on public.messages for insert
  with check (
    auth.uid() = sender_id
    and (attachment_path is null or split_part(attachment_path, '/', 1) = offer_id::text)
    and (
      auth.uid() = (select provider_id from public.offers where id = offer_id)
      or auth.uid() = (
        select jobs.customer_id from public.offers
        join public.jobs on jobs.id = offers.job_id
        where offers.id = offer_id
      )
    )
  );

update public.messages
set attachment_path = case
  when attachment_url like '%/storage/v1/object/sign/attachments/%'
    then split_part(regexp_replace(attachment_url, '^.*/storage/v1/object/sign/attachments/', ''), '?', 1)
  when attachment_url like '%/storage/v1/object/public/attachments/%'
    then split_part(regexp_replace(attachment_url, '^.*/storage/v1/object/public/attachments/', ''), '?', 1)
  else attachment_path
end
where attachment_path is null and attachment_url is not null;

update storage.buckets
set
  public = false,
  file_size_limit = 10485760,
  allowed_mime_types = array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]::text[]
where id = 'attachments';

drop policy if exists "Offer participants can upload attachments" on storage.objects;
drop policy if exists "Offer participants can read attachments" on storage.objects;
drop policy if exists "Offer participants can update attachments" on storage.objects;
drop policy if exists "Offer participants can delete attachments" on storage.objects;

create policy "Offer participants can read attachments"
  on storage.objects for select
  using (
    bucket_id = 'attachments'
    and exists (
      select 1
      from public.offers o
      join public.jobs j on j.id = o.job_id
      where o.id::text = (storage.foldername(name))[1]
        and auth.uid() in (o.provider_id, j.customer_id)
    )
  );

create policy "Offer participants can upload attachments"
  on storage.objects for insert
  with check (
    bucket_id = 'attachments'
    and exists (
      select 1
      from public.offers o
      join public.jobs j on j.id = o.job_id
      where o.id::text = (storage.foldername(name))[1]
        and auth.uid() in (o.provider_id, j.customer_id)
    )
  );

create policy "Attachment owners can update attachments"
  on storage.objects for update
  using (
    bucket_id = 'attachments'
    and owner_id = auth.uid()::text
    and exists (
      select 1
      from public.offers o
      join public.jobs j on j.id = o.job_id
      where o.id::text = (storage.foldername(name))[1]
        and auth.uid() in (o.provider_id, j.customer_id)
    )
  )
  with check (
    bucket_id = 'attachments'
    and owner_id = auth.uid()::text
    and exists (
      select 1
      from public.offers o
      join public.jobs j on j.id = o.job_id
      where o.id::text = (storage.foldername(name))[1]
        and auth.uid() in (o.provider_id, j.customer_id)
    )
  );

create policy "Attachment owners can delete attachments"
  on storage.objects for delete
  using (
    bucket_id = 'attachments'
    and owner_id = auth.uid()::text
    and exists (
      select 1
      from public.offers o
      join public.jobs j on j.id = o.job_id
      where o.id::text = (storage.foldername(name))[1]
        and auth.uid() in (o.provider_id, j.customer_id)
    )
  );

-- ---------------------------------------------------------------------------
-- OFFER AUTHORIZATION AND TRANSACTIONAL LIFECYCLE
-- ---------------------------------------------------------------------------
drop policy if exists "Job owner and offer provider can read offer" on public.offers;
drop policy if exists "Providers can create offers" on public.offers;
drop policy if exists "Job owner can update offer status" on public.offers;

create policy "Offer participants can read offers"
  on public.offers for select
  using (
    auth.uid() = provider_id
    or exists (
      select 1 from public.jobs j
      where j.id = job_id and j.customer_id = auth.uid()
    )
  );

create policy "Providers can submit valid offers"
  on public.offers for insert
  with check (
    auth.uid() = provider_id
    and status = 'pending'
    and exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role = 'provider'
    )
    and exists (
      select 1 from public.jobs j
      where j.id = job_id
        and j.status = 'open'
        and j.customer_id <> auth.uid()
    )
  );

-- Clients may no longer update arbitrary offer fields/statuses directly.
revoke update, delete on table public.offers from anon, authenticated;
grant select, insert on table public.offers to authenticated;

-- This index is the final race-condition guard. Applying the migration will
-- stop with a clear uniqueness error if production already has duplicate
-- winners; no rows are automatically changed or deleted.
create unique index if not exists offers_one_winner_per_job_idx
  on public.offers (job_id)
  where status in ('accepted', 'delivered', 'completed');

create or replace function public.transition_offer(
  p_offer_id uuid,
  p_new_status public.offer_status
)
returns public.offers
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_actor uuid := auth.uid();
  v_offer public.offers%rowtype;
  v_job public.jobs%rowtype;
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  select * into v_offer
  from public.offers
  where id = p_offer_id
  for update;

  if not found then
    raise exception 'Offer not found' using errcode = 'P0002';
  end if;

  select * into v_job
  from public.jobs
  where id = v_offer.job_id
  for update;

  if not found then
    raise exception 'Request not found' using errcode = 'P0002';
  end if;

  -- Safe retry of an already-applied transition.
  if v_offer.status = p_new_status then
    return v_offer;
  end if;

  if v_offer.status = 'pending' and p_new_status in ('accepted', 'rejected') then
    if v_actor <> v_job.customer_id then
      raise exception 'Only the request owner can accept or reject an offer'
        using errcode = '42501';
    end if;

    if p_new_status = 'accepted' then
      if v_job.status <> 'open' then
        raise exception 'Request is no longer open' using errcode = '23514';
      end if;

      if exists (
        select 1 from public.offers
        where job_id = v_offer.job_id
          and id <> v_offer.id
          and status in ('accepted', 'delivered', 'completed')
      ) then
        raise exception 'Request already has a winning offer' using errcode = '23505';
      end if;

      update public.offers
      set status = 'accepted'
      where id = v_offer.id;

      update public.offers
      set status = 'rejected'
      where job_id = v_offer.job_id
        and id <> v_offer.id
        and status = 'pending';

      -- Closing the request prevents new offers while delivery is in progress.
      update public.jobs set status = 'closed' where id = v_offer.job_id;
    else
      update public.offers set status = 'rejected' where id = v_offer.id;
    end if;

  elsif v_offer.status = 'accepted' and p_new_status = 'delivered' then
    if v_actor <> v_offer.provider_id then
      raise exception 'Only the provider can mark an offer delivered'
        using errcode = '42501';
    end if;
    update public.offers set status = 'delivered' where id = v_offer.id;

  elsif v_offer.status = 'delivered' and p_new_status = 'completed' then
    if v_actor <> v_job.customer_id then
      raise exception 'Only the request owner can complete an offer'
        using errcode = '42501';
    end if;
    update public.offers set status = 'completed' where id = v_offer.id;
    update public.jobs set status = 'closed' where id = v_offer.job_id;

  else
    raise exception 'Invalid offer transition: % -> %', v_offer.status, p_new_status
      using errcode = '23514';
  end if;

  select * into v_offer from public.offers where id = p_offer_id;
  return v_offer;
end;
$$;

revoke all on function public.transition_offer(uuid, public.offer_status) from public, anon;
grant execute on function public.transition_offer(uuid, public.offer_status) to authenticated;

create or replace function public.mark_offer_read(p_offer_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_actor uuid := auth.uid();
  v_provider_id uuid;
  v_customer_id uuid;
begin
  select o.provider_id, j.customer_id
  into v_provider_id, v_customer_id
  from public.offers o
  join public.jobs j on j.id = o.job_id
  where o.id = p_offer_id;

  if not found or v_actor is null then
    raise exception 'Offer not found or authentication required' using errcode = '42501';
  end if;

  if v_actor = v_provider_id then
    update public.offers set provider_read_at = now() where id = p_offer_id;
  elsif v_actor = v_customer_id then
    update public.offers set customer_read_at = now() where id = p_offer_id;
  else
    raise exception 'Not an offer participant' using errcode = '42501';
  end if;
end;
$$;

revoke all on function public.mark_offer_read(uuid) from public, anon;
grant execute on function public.mark_offer_read(uuid) to authenticated;

-- Reviews must describe a completed transaction between the two participants.
drop policy if exists "Offer participants can write review" on public.reviews;
create policy "Completed offer participants can write review"
  on public.reviews for insert
  with check (
    auth.uid() = reviewer_id
    and exists (
      select 1
      from public.offers o
      join public.jobs j on j.id = o.job_id
      where o.id = offer_id
        and o.status = 'completed'
        and (
          (auth.uid() = j.customer_id and reviewee_id = o.provider_id)
          or (auth.uid() = o.provider_id and reviewee_id = j.customer_id)
        )
    )
  );

-- ---------------------------------------------------------------------------
-- LIGHTWEIGHT DATABASE VALIDATION
-- NOT VALID preserves existing rows while enforcing constraints on new writes.
-- ---------------------------------------------------------------------------
alter table public.users
  add constraint users_name_length check (char_length(name) between 1 and 100) not valid,
  add constraint users_bio_length check (bio is null or char_length(bio) <= 3000) not valid,
  add constraint users_avatar_http_url check (
    avatar_url is null or avatar_url ~* '^https?://[^[:space:]]+$'
  ) not valid,
  add constraint users_linkedin_http_url check (
    linkedin_url is null or linkedin_url ~* '^https?://[^[:space:]]+$'
  ) not valid;

alter table public.user_private_profiles
  add constraint private_phone_length check (phone is null or char_length(phone) <= 50) not valid,
  add constraint private_cv_text_length check (cv_text is null or char_length(cv_text) <= 10000) not valid,
  add constraint private_cv_path_length check (cv_path is null or char_length(cv_path) <= 1024) not valid,
  add constraint private_cv_path_owner check (
    cv_path is null or split_part(cv_path, '/', 1) = user_id::text
  ) not valid;

alter table public.jobs
  add constraint jobs_title_length check (char_length(title) between 3 and 120) not valid,
  add constraint jobs_description_length check (char_length(description) between 10 and 5000) not valid,
  add constraint jobs_budget_positive check (budget is null or budget > 0) not valid;

alter table public.services
  add constraint services_title_length check (char_length(title) between 3 and 120) not valid,
  add constraint services_description_length check (char_length(description) between 10 and 5000) not valid,
  add constraint services_price_positive check (price > 0) not valid,
  add constraint services_delivery_time_length check (char_length(delivery_time) between 2 and 120) not valid;

alter table public.offers
  add constraint offers_price_positive check (price > 0) not valid,
  add constraint offers_timeline_length check (char_length(timeline) between 2 and 120) not valid,
  add constraint offers_description_length check (char_length(description) between 10 and 5000) not valid;

alter table public.messages
  add constraint messages_content_length check (char_length(content) <= 5000) not valid,
  add constraint messages_content_or_attachment check (
    char_length(btrim(content)) > 0
    or attachment_path is not null
    or attachment_url is not null
  ) not valid,
  add constraint messages_attachment_path_length check (
    attachment_path is null or char_length(attachment_path) <= 1024
  ) not valid;

alter table public.reviews
  add constraint reviews_comment_length check (comment is null or char_length(comment) <= 2000) not valid;
