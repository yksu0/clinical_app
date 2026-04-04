-- ============================================================
-- Clinical Case Management System — Database Schema
-- Run this in Supabase SQL Editor (in order)
-- ============================================================


-- ----------------------------------------------------------------
-- 1. EXTENSIONS
-- ----------------------------------------------------------------
create extension if not exists "uuid-ossp";


-- ----------------------------------------------------------------
-- 2. ENUMS
-- ----------------------------------------------------------------
create type user_role as enum ('admin', 'ci', 'student');
create type assignment_status as enum ('assigned', 'completed', 'missed');
create type upload_status as enum ('pending', 'processed', 'rejected');


-- ----------------------------------------------------------------
-- 3. PROFILES
-- (extends Supabase auth.users — 1-to-1)
-- ----------------------------------------------------------------
create table profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  full_name     text        not null,
  email         text        not null unique,
  role          user_role   not null default 'student',
  section       text,
  is_verified   boolean     not null default false,
  is_active     boolean     not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Auto-populate profile on signup
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, full_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.email
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- updated_at trigger (reused below)
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on profiles
  for each row execute procedure set_updated_at();


-- ----------------------------------------------------------------
-- 4. CASE TYPES
-- ----------------------------------------------------------------
create table case_types (
  id          uuid        primary key default uuid_generate_v4(),
  name        text        not null unique,
  is_active   boolean     not null default true,
  created_at  timestamptz not null default now()
);


-- ----------------------------------------------------------------
-- 5. LOCATIONS
-- ----------------------------------------------------------------
create table locations (
  id          uuid        primary key default uuid_generate_v4(),
  name        text        not null unique,
  is_active   boolean     not null default true,
  created_at  timestamptz not null default now()
);


-- ----------------------------------------------------------------
-- 6. REQUIREMENTS
-- (required case count per case type — global for all students)
-- ----------------------------------------------------------------
create table requirements (
  id              uuid        primary key default uuid_generate_v4(),
  case_type_id    uuid        not null references case_types(id) on delete cascade,
  required_count  integer     not null check (required_count > 0),
  created_at      timestamptz not null default now(),
  unique (case_type_id)
);


-- ----------------------------------------------------------------
-- 7. ASSIGNMENTS
-- ----------------------------------------------------------------
create table assignments (
  id              uuid              primary key default uuid_generate_v4(),
  student_id      uuid              not null references profiles(id) on delete cascade,
  case_type_id    uuid              not null references case_types(id),
  location_id     uuid              not null references locations(id),
  scheduled_date  date              not null,
  status          assignment_status not null default 'assigned',
  assigned_by     uuid              not null references profiles(id),
  created_at      timestamptz       not null default now(),
  updated_at      timestamptz       not null default now()
);

create index idx_assignments_student on assignments(student_id);
create index idx_assignments_case_type on assignments(case_type_id);
create index idx_assignments_status on assignments(status);

create trigger assignments_updated_at
  before update on assignments
  for each row execute procedure set_updated_at();


-- ----------------------------------------------------------------
-- 8. UPLOADS
-- ----------------------------------------------------------------
create table uploads (
  id            uuid          primary key default uuid_generate_v4(),
  student_id    uuid          not null references profiles(id) on delete cascade,
  file_path     text          not null,
  file_name     text          not null,
  status        upload_status not null default 'pending',
  uploaded_at   timestamptz   not null default now(),
  processed_at  timestamptz
);

create index idx_uploads_student on uploads(student_id);
create index idx_uploads_status on uploads(status);


-- ----------------------------------------------------------------
-- 9. CASE LOGS
-- ----------------------------------------------------------------
create table case_logs (
  id            uuid        primary key default uuid_generate_v4(),
  student_id    uuid        not null references profiles(id) on delete cascade,
  case_type_id  uuid        not null references case_types(id),
  location_id   uuid        not null references locations(id),
  upload_id     uuid        references uploads(id) on delete set null,
  date          date        not null,
  notes         text,
  logged_by     uuid        not null references profiles(id),
  created_at    timestamptz not null default now(),
  -- Prevent duplicate logs for same student + date + case type
  unique (student_id, date, case_type_id)
);

create index idx_case_logs_student on case_logs(student_id);
create index idx_case_logs_case_type on case_logs(case_type_id);
create index idx_case_logs_date on case_logs(date);


-- ----------------------------------------------------------------
-- 10. ANNOUNCEMENTS
-- ----------------------------------------------------------------
create table announcements (
  id          uuid        primary key default uuid_generate_v4(),
  title       text        not null,
  content     text        not null,
  created_by  uuid        not null references profiles(id),
  created_at  timestamptz not null default now()
);


-- ----------------------------------------------------------------
-- 11. AUDIT LOGS
-- ----------------------------------------------------------------
create table audit_logs (
  id            uuid        primary key default uuid_generate_v4(),
  action_type   text        not null,
  performed_by  uuid        not null references profiles(id),
  target_table  text        not null,
  target_id     uuid        not null,
  details       jsonb,
  created_at    timestamptz not null default now()
);

create index idx_audit_logs_performed_by on audit_logs(performed_by);
create index idx_audit_logs_target on audit_logs(target_table, target_id);


-- ================================================================
-- ROW LEVEL SECURITY (RLS)
-- ================================================================

alter table profiles     enable row level security;
alter table case_types   enable row level security;
alter table locations    enable row level security;
alter table requirements enable row level security;
alter table assignments  enable row level security;
alter table uploads      enable row level security;
alter table case_logs    enable row level security;
alter table announcements enable row level security;
alter table audit_logs   enable row level security;

-- Helper: get current user's role
create or replace function get_my_role()
returns user_role language sql security definer stable as $$
  select role from profiles where id = auth.uid();
$$;

-- Helper: is current user an admin?
create or replace function is_admin()
returns boolean language sql security definer stable as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin');
$$;


-- ---- PROFILES ----
-- Users can read their own profile; admin/CI can read all
create policy "profiles: own read"
  on profiles for select
  using (id = auth.uid() or get_my_role() in ('admin', 'ci'));

-- Only admin can insert profiles directly (students self-register via auth trigger)
create policy "profiles: admin insert"
  on profiles for insert
  with check (is_admin());

-- Users can update their own profile; admin can update any
create policy "profiles: own update"
  on profiles for update
  using (id = auth.uid() or is_admin());


-- ---- CASE TYPES ----
create policy "case_types: all read"
  on case_types for select using (auth.uid() is not null);

create policy "case_types: admin write"
  on case_types for all
  using (is_admin()) with check (is_admin());


-- ---- LOCATIONS ----
create policy "locations: all read"
  on locations for select using (auth.uid() is not null);

create policy "locations: admin write"
  on locations for all
  using (is_admin()) with check (is_admin());


-- ---- REQUIREMENTS ----
create policy "requirements: all read"
  on requirements for select using (auth.uid() is not null);

create policy "requirements: admin write"
  on requirements for all
  using (is_admin()) with check (is_admin());


-- ---- ASSIGNMENTS ----
-- Students see only their own; admin/CI see all
create policy "assignments: student read own"
  on assignments for select
  using (student_id = auth.uid() or get_my_role() in ('admin', 'ci'));

create policy "assignments: admin write"
  on assignments for all
  using (is_admin()) with check (is_admin());


-- ---- UPLOADS ----
create policy "uploads: student read own"
  on uploads for select
  using (student_id = auth.uid() or get_my_role() in ('admin', 'ci'));

create policy "uploads: student insert own"
  on uploads for insert
  with check (student_id = auth.uid());

create policy "uploads: admin update"
  on uploads for update
  using (is_admin());


-- ---- CASE LOGS ----
create policy "case_logs: student read own"
  on case_logs for select
  using (student_id = auth.uid() or get_my_role() in ('admin', 'ci'));

create policy "case_logs: admin write"
  on case_logs for all
  using (is_admin()) with check (is_admin());


-- ---- ANNOUNCEMENTS ----
create policy "announcements: all read"
  on announcements for select using (auth.uid() is not null);

create policy "announcements: admin write"
  on announcements for all
  using (is_admin()) with check (is_admin());


-- ---- AUDIT LOGS ----
create policy "audit_logs: admin read"
  on audit_logs for select using (is_admin());

create policy "audit_logs: admin insert"
  on audit_logs for insert with check (is_admin());


-- ================================================================
-- STORAGE BUCKET
-- (Run this separately — Supabase dashboard or API)
-- ================================================================
-- INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
-- VALUES (
--   'case-uploads',
--   'case-uploads',
--   false,
--   10485760,  -- 10 MB
--   ARRAY['image/jpeg','image/png','application/pdf']
-- );
