-- ============================================================
-- Migration: Sync profile role to auth JWT app_metadata
-- Run in Supabase SQL Editor
-- ============================================================

-- Trigger function: syncs profiles.role → auth.users.raw_app_meta_data
create or replace function sync_role_to_app_metadata()
returns trigger language plpgsql security definer as $$
begin
  update auth.users
  set raw_app_meta_data = raw_app_meta_data || jsonb_build_object('role', new.role::text)
  where id = new.id;
  return new;
end;
$$;

create trigger on_profile_role_change
  after insert or update of role on profiles
  for each row execute procedure sync_role_to_app_metadata();
