-- ============================================================
-- Migration: Update handle_new_user trigger to link roster_id
-- Run in Supabase SQL Editor after 001_student_roster.sql
-- ============================================================

create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
declare
  _roster_id uuid;
begin
  -- Extract roster_id passed from client metadata (may be null)
  _roster_id := (new.raw_user_meta_data->>'roster_id')::uuid;

  insert into profiles (id, full_name, email, roster_id)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.email,
    _roster_id
  );
  return new;
end;
$$;
