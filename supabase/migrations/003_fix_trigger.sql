-- ============================================================
-- Migration: Make handle_new_user trigger resilient
-- Run in Supabase SQL Editor
-- ============================================================

create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
declare
  _roster_id uuid;
begin
  _roster_id := (new.raw_user_meta_data->>'roster_id')::uuid;

  insert into profiles (id, full_name, email, roster_id)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.email, ''),
    _roster_id
  )
  on conflict (id) do nothing;

  return new;
exception
  when others then
    -- Log error but don't block the auth user creation
    raise warning 'handle_new_user failed for %: %', new.id, sqlerrm;
    return new;
end;
$$;
