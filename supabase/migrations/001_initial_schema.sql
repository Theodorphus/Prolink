-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─────────────────────────────────────────
-- USERS
-- ─────────────────────────────────────────
create type user_role as enum ('customer', 'provider');

create table public.users (
  id          uuid primary key references auth.users(id) on delete cascade,
  role        user_role not null default 'customer',
  name        text not null default '',
  bio         text,
  skills      text[],
  hourly_rate numeric(10,2),
  avatar_url  text,
  created_at  timestamptz not null default now()
);

alter table public.users enable row level security;

create policy "Users can read all profiles"
  on public.users for select using (true);

create policy "Users can update own profile"
  on public.users for update using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.users for insert with check (auth.uid() = id);

-- ─────────────────────────────────────────
-- JOBS
-- ─────────────────────────────────────────
create type job_status as enum ('open', 'closed');

create table public.jobs (
  id          uuid primary key default uuid_generate_v4(),
  customer_id uuid not null references public.users(id) on delete cascade,
  title       text not null,
  description text not null,
  budget      numeric(10,2),
  status      job_status not null default 'open',
  created_at  timestamptz not null default now()
);

alter table public.jobs enable row level security;

create policy "Anyone can read open jobs"
  on public.jobs for select using (true);

create policy "Customers can create jobs"
  on public.jobs for insert with check (auth.uid() = customer_id);

create policy "Customers can update own jobs"
  on public.jobs for update using (auth.uid() = customer_id);

create policy "Customers can delete own jobs"
  on public.jobs for delete using (auth.uid() = customer_id);

-- ─────────────────────────────────────────
-- SERVICES
-- ─────────────────────────────────────────
create table public.services (
  id            uuid primary key default uuid_generate_v4(),
  provider_id   uuid not null references public.users(id) on delete cascade,
  title         text not null,
  description   text not null,
  price         numeric(10,2) not null,
  delivery_time text not null,
  created_at    timestamptz not null default now()
);

alter table public.services enable row level security;

create policy "Anyone can read services"
  on public.services for select using (true);

create policy "Providers can create services"
  on public.services for insert with check (auth.uid() = provider_id);

create policy "Providers can update own services"
  on public.services for update using (auth.uid() = provider_id);

create policy "Providers can delete own services"
  on public.services for delete using (auth.uid() = provider_id);

-- ─────────────────────────────────────────
-- OFFERS
-- ─────────────────────────────────────────
create type offer_status as enum ('pending', 'accepted', 'rejected');
create type price_type   as enum ('fixed', 'hourly');

create table public.offers (
  id          uuid primary key default uuid_generate_v4(),
  job_id      uuid not null references public.jobs(id) on delete cascade,
  provider_id uuid not null references public.users(id) on delete cascade,
  price       numeric(10,2) not null,
  price_type  price_type not null default 'fixed',
  timeline    text not null,
  description text not null,
  status      offer_status not null default 'pending',
  created_at  timestamptz not null default now(),
  unique(job_id, provider_id)
);

alter table public.offers enable row level security;

create policy "Job owner and offer provider can read offer"
  on public.offers for select using (
    auth.uid() = provider_id
    or auth.uid() = (select customer_id from public.jobs where id = job_id)
  );

create policy "Providers can create offers"
  on public.offers for insert with check (auth.uid() = provider_id);

create policy "Job owner can update offer status"
  on public.offers for update using (
    auth.uid() = (select customer_id from public.jobs where id = job_id)
    or auth.uid() = provider_id
  );

-- ─────────────────────────────────────────
-- MESSAGES
-- ─────────────────────────────────────────
create table public.messages (
  id             uuid primary key default uuid_generate_v4(),
  offer_id       uuid not null references public.offers(id) on delete cascade,
  sender_id      uuid not null references public.users(id) on delete cascade,
  content        text not null,
  attachment_url text,
  created_at     timestamptz not null default now()
);

alter table public.messages enable row level security;

create policy "Offer participants can read messages"
  on public.messages for select using (
    auth.uid() = sender_id
    or auth.uid() = (select provider_id from public.offers where id = offer_id)
    or auth.uid() = (
      select jobs.customer_id from public.offers
      join public.jobs on jobs.id = offers.job_id
      where offers.id = offer_id
    )
  );

create policy "Offer participants can send messages"
  on public.messages for insert with check (
    auth.uid() = sender_id
    and (
      auth.uid() = (select provider_id from public.offers where id = offer_id)
      or auth.uid() = (
        select jobs.customer_id from public.offers
        join public.jobs on jobs.id = offers.job_id
        where offers.id = offer_id
      )
    )
  );

-- ─────────────────────────────────────────
-- STORAGE BUCKETS
-- ─────────────────────────────────────────
insert into storage.buckets (id, name, public)
  values ('avatars', 'avatars', true)
  on conflict do nothing;

insert into storage.buckets (id, name, public)
  values ('attachments', 'attachments', false)
  on conflict do nothing;

create policy "Avatar images are publicly accessible"
  on storage.objects for select using (bucket_id = 'avatars');

create policy "Users can upload their own avatar"
  on storage.objects for insert with check (
    bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Offer participants can upload attachments"
  on storage.objects for insert with check (bucket_id = 'attachments' and auth.role() = 'authenticated');

create policy "Offer participants can read attachments"
  on storage.objects for select using (bucket_id = 'attachments' and auth.role() = 'authenticated');

-- ─────────────────────────────────────────
-- AUTO-CREATE USER PROFILE ON SIGNUP
-- ─────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.users (id, role, name)
  values (
    new.id,
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'customer'),
    coalesce(new.raw_user_meta_data->>'name', '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─────────────────────────────────────────
-- REALTIME
-- ─────────────────────────────────────────
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.offers;
