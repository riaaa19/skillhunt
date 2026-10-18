create extension if not exists pgcrypto;

create table if not exists public.instructors (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  bio text,
  specialty text,
  image_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.workshops (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  description text,
  category text not null,
  instructor_id uuid not null references public.instructors(id) on update cascade on delete restrict,
  location text not null,
  price numeric(10,2) not null default 0 check (price >= 0),
  image_url text,
  is_featured boolean not null default false,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.workshop_sessions (
  id uuid primary key default gen_random_uuid(),
  workshop_id uuid not null references public.workshops(id) on update cascade on delete restrict,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  capacity integer not null check (capacity > 0),
  created_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

create table if not exists public.registrations (
  id uuid primary key default gen_random_uuid(),
  workshop_id uuid not null references public.workshops(id) on update cascade on delete restrict,
  session_id uuid not null references public.workshop_sessions(id) on update cascade on delete restrict,
  participant_name text not null,
  email text not null,
  email_normalized text generated always as (lower(trim(email))) stored,
  phone text,
  created_at timestamptz not null default now()
);

create unique index if not exists registrations_session_email_key on public.registrations(session_id, email_normalized);
create index if not exists workshops_published_category_idx on public.workshops(category) where is_published;
create index if not exists workshops_published_location_idx on public.workshops(location) where is_published;
create index if not exists workshops_instructor_idx on public.workshops(instructor_id);
create index if not exists sessions_workshop_start_idx on public.workshop_sessions(workshop_id, starts_at);
create index if not exists registrations_session_idx on public.registrations(session_id);

alter table public.instructors enable row level security;
alter table public.workshops enable row level security;
alter table public.workshop_sessions enable row level security;
alter table public.registrations enable row level security;

drop policy if exists public_read_instructors on public.instructors;
create policy public_read_instructors on public.instructors for select using (true);
drop policy if exists public_read_published_workshops on public.workshops;
create policy public_read_published_workshops on public.workshops for select using (is_published);
drop policy if exists public_read_sessions on public.workshop_sessions;
create policy public_read_sessions on public.workshop_sessions for select using (
  exists (select 1 from public.workshops w where w.id = workshop_id and w.is_published)
);

create or replace function public.create_registration(
  p_workshop_id uuid,
  p_session_id uuid,
  p_participant_name text,
  p_email text,
  p_phone text default null
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  session_row public.workshop_sessions%rowtype;
  workshop_exists boolean;
  registration_row public.registrations%rowtype;
begin
  select exists(
    select 1 from public.workshops where id = p_workshop_id and is_published
  ) into workshop_exists;
  if not workshop_exists then raise exception 'WORKSHOP_NOT_FOUND'; end if;

  select * into session_row from public.workshop_sessions where id = p_session_id for update;
  if not found then raise exception 'SESSION_NOT_FOUND'; end if;
  if session_row.workshop_id <> p_workshop_id then raise exception 'SESSION_WORKSHOP_MISMATCH'; end if;
  if session_row.ends_at <= now() then raise exception 'SESSION_EXPIRED'; end if;
  if (select count(*) from public.registrations where session_id = p_session_id) >= session_row.capacity then
    raise exception 'CAPACITY';
  end if;

  begin
    insert into public.registrations(workshop_id, session_id, participant_name, email, phone)
    values (p_workshop_id, p_session_id, trim(p_participant_name), lower(trim(p_email)), nullif(trim(p_phone), ''))
    returning * into registration_row;
  exception when unique_violation then
    raise exception 'DUPLICATE_REGISTRATION';
  end;

  return jsonb_build_object('id', registration_row.id, 'created_at', registration_row.created_at);
end;
$$;

revoke all on function public.create_registration(uuid, uuid, text, text, text) from public, anon, authenticated;
grant execute on function public.create_registration(uuid, uuid, text, text, text) to service_role;
