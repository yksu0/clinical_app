-- ============================================================
-- Migration: Add student_roster whitelist table
-- Run in Supabase SQL Editor
-- ============================================================

create table student_roster (
  id          uuid        primary key default uuid_generate_v4(),
  full_name   text        not null,
  email       text,
  section     text,
  created_at  timestamptz not null default now()
);

-- Case-insensitive unique constraint on full_name
create unique index student_roster_full_name_unique on student_roster (lower(full_name));

alter table student_roster enable row level security;

-- Only admins can manage the roster
create policy "roster: admin all"
  on student_roster for all
  using (is_admin()) with check (is_admin());

-- Add FK from profiles back to roster (optional linkage for matched accounts)
alter table profiles
  add column if not exists roster_id uuid references student_roster(id) on delete set null;
