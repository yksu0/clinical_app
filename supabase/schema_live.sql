-- ============================================================
-- Clinical Case Management System - Live Schema
-- Generated: 2026-05-05 23:39 from project taldeqngeqqfefybtneg
-- Run this in the Supabase SQL Editor of the NEW project
-- ============================================================

-- EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ================================================================
-- ENUMS
-- ================================================================
CREATE TYPE public.assignment_status AS ENUM ('scheduled', 'completed', 'missed', 'cancelled', 'cancel_requested');
CREATE TYPE public.upload_status AS ENUM ('pending', 'processed', 'rejected');
CREATE TYPE public.user_role AS ENUM ('admin', 'ci', 'student');

-- ================================================================
-- TABLES
-- ================================================================
CREATE TABLE IF NOT EXISTS public.announcement_comments (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  announcement_id uuid NOT NULL,
  user_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT announcement_comments_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.announcements (
  id uuid DEFAULT uuid_generate_v4() NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  created_by uuid NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  image_url text,
  CONSTRAINT announcements_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.areas_of_duty (
  id uuid DEFAULT uuid_generate_v4() NOT NULL,
  name text NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT areas_of_duty_pkey PRIMARY KEY (id),
  CONSTRAINT areas_of_duty_name_key UNIQUE (name)
);

CREATE TABLE IF NOT EXISTS public.assignments (
  id uuid DEFAULT uuid_generate_v4() NOT NULL,
  student_id uuid NOT NULL,
  area_of_duty_id uuid NOT NULL,
  scheduled_date date NOT NULL,
  status public.assignment_status DEFAULT 'scheduled'::assignment_status NOT NULL,
  assigned_by uuid NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  notes text,
  end_date date,
  cancellation_reason text,
  cancellation_requested_at timestamptz,
  shift_id uuid,
  rotation_id uuid,
  inclusive_days integer[] DEFAULT '{}'::integer[],
  CONSTRAINT assignments_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid DEFAULT uuid_generate_v4() NOT NULL,
  action_type text NOT NULL,
  performed_by uuid NOT NULL,
  target_table text NOT NULL,
  target_id uuid NOT NULL,
  details jsonb,
  created_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT audit_logs_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.case_logs (
  id uuid DEFAULT uuid_generate_v4() NOT NULL,
  student_id uuid NOT NULL,
  case_type_id uuid NOT NULL,
  area_of_duty_id uuid NOT NULL,
  upload_id uuid,
  date date NOT NULL,
  notes text,
  logged_by uuid NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  rotation_id uuid,
  CONSTRAINT case_logs_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.case_submissions (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  student_id uuid NOT NULL,
  assignment_id uuid,
  case_type_id uuid NOT NULL,
  area_of_duty_id uuid NOT NULL,
  rotation_id uuid,
  upload_id uuid,
  date date NOT NULL,
  notes text,
  status text DEFAULT 'pending'::text NOT NULL,
  admin_note text,
  submitted_at timestamptz DEFAULT now() NOT NULL,
  reviewed_at timestamptz,
  reviewed_by uuid,
  CONSTRAINT case_submissions_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.case_types (
  id uuid DEFAULT uuid_generate_v4() NOT NULL,
  name text NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT case_types_pkey PRIMARY KEY (id),
  CONSTRAINT case_types_name_key UNIQUE (name)
);

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid NOT NULL,
  full_name text NOT NULL,
  email text NOT NULL,
  role public.user_role DEFAULT 'student'::user_role NOT NULL,
  section text,
  is_verified boolean DEFAULT false NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  roster_id uuid,
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_email_key UNIQUE (email)
);

CREATE TABLE IF NOT EXISTS public.requirement_overrides (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  student_id uuid NOT NULL,
  case_type_id uuid NOT NULL,
  adjusted_count integer NOT NULL,
  reason text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT requirement_overrides_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.requirements (
  id uuid DEFAULT uuid_generate_v4() NOT NULL,
  case_type_id uuid NOT NULL,
  required_count integer NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT requirements_pkey PRIMARY KEY (id),
  CONSTRAINT requirements_case_type_id_key UNIQUE (case_type_id)
);

CREATE TABLE IF NOT EXISTS public.rotations (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  name text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  inclusive_days integer[] DEFAULT '{}'::integer[] NOT NULL,
  created_by uuid,
  created_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT rotations_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.semesters (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  name text NOT NULL,
  start_date date NOT NULL,
  end_date date,
  is_active boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT semesters_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.shifts (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  name text NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT shifts_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.student_roster (
  id uuid DEFAULT uuid_generate_v4() NOT NULL,
  full_name text NOT NULL,
  email text,
  section text,
  created_at timestamptz DEFAULT now() NOT NULL,
  last_name text,
  first_name text,
  middle_initial character,
  CONSTRAINT student_roster_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.system_settings (
  key text NOT NULL,
  value text NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT system_settings_pkey PRIMARY KEY (key)
);

CREATE TABLE IF NOT EXISTS public.uploads (
  id uuid DEFAULT uuid_generate_v4() NOT NULL,
  student_id uuid NOT NULL,
  file_path text NOT NULL,
  file_name text NOT NULL,
  status public.upload_status DEFAULT 'pending'::upload_status NOT NULL,
  uploaded_at timestamptz DEFAULT now() NOT NULL,
  processed_at timestamptz,
  size_bytes bigint,
  archived boolean DEFAULT false NOT NULL,
  archived_at timestamptz,
  CONSTRAINT uploads_pkey PRIMARY KEY (id)
);

-- ================================================================
-- FOREIGN KEYS
-- ================================================================
ALTER TABLE public.announcement_comments ADD CONSTRAINT fk_announcement_comments_user_id FOREIGN KEY (user_id) REFERENCES public.profiles (id) ON DELETE CASCADE;
ALTER TABLE public.announcement_comments ADD CONSTRAINT fk_announcement_comments_announcement_id FOREIGN KEY (announcement_id) REFERENCES public.announcements (id) ON DELETE CASCADE;
ALTER TABLE public.announcements ADD CONSTRAINT fk_announcements_created_by FOREIGN KEY (created_by) REFERENCES public.profiles (id);
ALTER TABLE public.assignments ADD CONSTRAINT fk_assignments_assigned_by FOREIGN KEY (assigned_by) REFERENCES public.profiles (id);
ALTER TABLE public.assignments ADD CONSTRAINT fk_assignments_shift_id FOREIGN KEY (shift_id) REFERENCES public.shifts (id) ON DELETE SET NULL;
ALTER TABLE public.assignments ADD CONSTRAINT fk_assignments_student_id FOREIGN KEY (student_id) REFERENCES public.profiles (id) ON DELETE CASCADE;
ALTER TABLE public.assignments ADD CONSTRAINT fk_assignments_area_of_duty_id FOREIGN KEY (area_of_duty_id) REFERENCES public.areas_of_duty (id);
ALTER TABLE public.assignments ADD CONSTRAINT fk_assignments_rotation_id FOREIGN KEY (rotation_id) REFERENCES public.rotations (id) ON DELETE SET NULL;
ALTER TABLE public.audit_logs ADD CONSTRAINT fk_audit_logs_performed_by FOREIGN KEY (performed_by) REFERENCES public.profiles (id);
ALTER TABLE public.case_logs ADD CONSTRAINT fk_case_logs_logged_by FOREIGN KEY (logged_by) REFERENCES public.profiles (id);
ALTER TABLE public.case_logs ADD CONSTRAINT fk_case_logs_case_type_id FOREIGN KEY (case_type_id) REFERENCES public.case_types (id);
ALTER TABLE public.case_logs ADD CONSTRAINT fk_case_logs_upload_id FOREIGN KEY (upload_id) REFERENCES public.uploads (id) ON DELETE SET NULL;
ALTER TABLE public.case_logs ADD CONSTRAINT fk_case_logs_rotation_id FOREIGN KEY (rotation_id) REFERENCES public.rotations (id) ON DELETE SET NULL;
ALTER TABLE public.case_logs ADD CONSTRAINT fk_case_logs_student_id FOREIGN KEY (student_id) REFERENCES public.profiles (id) ON DELETE CASCADE;
ALTER TABLE public.case_logs ADD CONSTRAINT fk_case_logs_area_of_duty_id FOREIGN KEY (area_of_duty_id) REFERENCES public.areas_of_duty (id);
ALTER TABLE public.case_submissions ADD CONSTRAINT fk_case_submissions_reviewed_by FOREIGN KEY (reviewed_by) REFERENCES public.profiles (id) ON DELETE SET NULL;
ALTER TABLE public.case_submissions ADD CONSTRAINT fk_case_submissions_student_id FOREIGN KEY (student_id) REFERENCES public.profiles (id) ON DELETE CASCADE;
ALTER TABLE public.case_submissions ADD CONSTRAINT fk_case_submissions_assignment_id FOREIGN KEY (assignment_id) REFERENCES public.assignments (id) ON DELETE SET NULL;
ALTER TABLE public.case_submissions ADD CONSTRAINT fk_case_submissions_case_type_id FOREIGN KEY (case_type_id) REFERENCES public.case_types (id);
ALTER TABLE public.case_submissions ADD CONSTRAINT fk_case_submissions_area_of_duty_id FOREIGN KEY (area_of_duty_id) REFERENCES public.areas_of_duty (id);
ALTER TABLE public.case_submissions ADD CONSTRAINT fk_case_submissions_rotation_id FOREIGN KEY (rotation_id) REFERENCES public.rotations (id) ON DELETE SET NULL;
ALTER TABLE public.case_submissions ADD CONSTRAINT fk_case_submissions_upload_id FOREIGN KEY (upload_id) REFERENCES public.uploads (id) ON DELETE SET NULL;
ALTER TABLE public.profiles ADD CONSTRAINT fk_profiles_roster_id FOREIGN KEY (roster_id) REFERENCES public.student_roster (id) ON DELETE SET NULL;
ALTER TABLE public.requirement_overrides ADD CONSTRAINT fk_requirement_overrides_case_type_id FOREIGN KEY (case_type_id) REFERENCES public.case_types (id) ON DELETE CASCADE;
ALTER TABLE public.requirement_overrides ADD CONSTRAINT fk_requirement_overrides_student_id FOREIGN KEY (student_id) REFERENCES public.profiles (id) ON DELETE CASCADE;
ALTER TABLE public.requirements ADD CONSTRAINT fk_requirements_case_type_id FOREIGN KEY (case_type_id) REFERENCES public.case_types (id) ON DELETE CASCADE;
ALTER TABLE public.rotations ADD CONSTRAINT fk_rotations_created_by FOREIGN KEY (created_by) REFERENCES public.profiles (id) ON DELETE SET NULL;
ALTER TABLE public.uploads ADD CONSTRAINT fk_uploads_student_id FOREIGN KEY (student_id) REFERENCES public.profiles (id) ON DELETE CASCADE;

-- ================================================================
-- INDEXES
-- ================================================================
CREATE INDEX idx_announcement_comments_announcement_id ON public.announcement_comments USING btree (announcement_id);
CREATE INDEX idx_assignments_rotation_id ON public.assignments USING btree (rotation_id);
CREATE INDEX idx_assignments_status ON public.assignments USING btree (status);
CREATE INDEX idx_assignments_student ON public.assignments USING btree (student_id);
CREATE INDEX idx_audit_logs_performed_by ON public.audit_logs USING btree (performed_by);
CREATE INDEX idx_audit_logs_target ON public.audit_logs USING btree (target_table, target_id);
CREATE UNIQUE INDEX case_logs_student_id_date_case_type_id_key ON public.case_logs USING btree (student_id, date, case_type_id);
CREATE INDEX idx_case_logs_case_type ON public.case_logs USING btree (case_type_id);
CREATE INDEX idx_case_logs_date ON public.case_logs USING btree (date);
CREATE INDEX idx_case_logs_rotation_id ON public.case_logs USING btree (rotation_id);
CREATE INDEX idx_case_logs_student ON public.case_logs USING btree (student_id);
CREATE INDEX idx_case_submissions_assignment_id ON public.case_submissions USING btree (assignment_id);
CREATE INDEX idx_case_submissions_status ON public.case_submissions USING btree (status);
CREATE INDEX idx_case_submissions_student_id ON public.case_submissions USING btree (student_id);
CREATE UNIQUE INDEX requirement_overrides_student_id_case_type_id_key ON public.requirement_overrides USING btree (student_id, case_type_id);
CREATE UNIQUE INDEX semesters_active_unique ON public.semesters USING btree (is_active) WHERE (is_active = true);
CREATE UNIQUE INDEX student_roster_full_name_unique ON public.student_roster USING btree (lower(full_name));
CREATE INDEX idx_uploads_status ON public.uploads USING btree (status);
CREATE INDEX idx_uploads_student ON public.uploads USING btree (student_id);

-- ================================================================
-- FUNCTIONS
-- ================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _roster_id uuid;
  _full_name  text;
  _email      text;
BEGIN
  _email      := coalesce(new.email, '');
  _full_name  := coalesce(new.raw_user_meta_data->>'full_name', '');
  _roster_id  := NULLIF(new.raw_user_meta_data->>'roster_id', '')::uuid;

  -- Remove any orphaned profile row with the same email but a different id.
  DELETE FROM public.profiles WHERE email = _email AND id <> new.id;

  INSERT INTO public.profiles (id, full_name, email, roster_id)
  VALUES (new.id, _full_name, _email, _roster_id)
  ON CONFLICT (id) DO UPDATE
    SET full_name  = excluded.full_name,
        email      = excluded.email,
        roster_id  = excluded.roster_id;

  RETURN new;
EXCEPTION
  WHEN others THEN
    RAISE WARNING 'handle_new_user failed for % (%): %', new.id, new.email, sqlerrm;
    RETURN new;
END;
$function$

;

CREATE OR REPLACE FUNCTION public.set_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  new.updated_at = now();
  return new;
end;
$function$

;

CREATE OR REPLACE FUNCTION public.get_my_role()
 RETURNS user_role
 LANGUAGE sql
 STABLE SECURITY DEFINER
AS $function$
  select role from profiles where id = auth.uid();
$function$

;

CREATE OR REPLACE FUNCTION public.sync_role_to_app_metadata()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
begin
  update auth.users
  set raw_app_meta_data = raw_app_meta_data || jsonb_build_object('role', new.role::text)
  where id = new.id;
  return new;
end;
$function$

;

CREATE OR REPLACE FUNCTION public.is_admin()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
AS $function$
  SELECT (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin';
$function$

;

-- ================================================================
-- TRIGGERS
-- ================================================================
CREATE TRIGGER assignments_updated_at
  BEFORE UPDATE ON public.assignments
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER on_profile_role_change
  AFTER INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION sync_role_to_app_metadata();

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ================================================================
-- ROW LEVEL SECURITY
-- ================================================================
ALTER TABLE public.announcement_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.areas_of_duty ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requirement_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.semesters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_roster ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.uploads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "comments_delete" ON public.announcement_comments
  AS PERMISSIVE FOR DELETE TO public USING (((auth.uid() = user_id) OR (((auth.jwt() -> 'app_metadata'::text) ->> 'role'::text) = 'admin'::text)));

CREATE POLICY "comments_insert" ON public.announcement_comments
  AS PERMISSIVE FOR INSERT TO public WITH CHECK ((auth.uid() = user_id));

CREATE POLICY "comments_select" ON public.announcement_comments
  AS PERMISSIVE FOR SELECT TO public USING ((auth.role() = 'authenticated'::text));

CREATE POLICY "announcements: admin write" ON public.announcements
  AS PERMISSIVE FOR ALL TO public USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "announcements: all read" ON public.announcements
  AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() IS NOT NULL));

CREATE POLICY "locations: admin write" ON public.areas_of_duty
  AS PERMISSIVE FOR ALL TO public USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "locations: all read" ON public.areas_of_duty
  AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() IS NOT NULL));

CREATE POLICY "assignments: admin write" ON public.assignments
  AS PERMISSIVE FOR ALL TO public USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "assignments: student read own" ON public.assignments
  AS PERMISSIVE FOR SELECT TO public USING (((student_id = auth.uid()) OR (get_my_role() = ANY (ARRAY['admin'::user_role, 'ci'::user_role]))));

CREATE POLICY "audit_logs: admin insert" ON public.audit_logs
  AS PERMISSIVE FOR INSERT TO public WITH CHECK (is_admin());

CREATE POLICY "audit_logs: admin read" ON public.audit_logs
  AS PERMISSIVE FOR SELECT TO public USING (is_admin());

CREATE POLICY "case_logs: admin write" ON public.case_logs
  AS PERMISSIVE FOR ALL TO public USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "case_logs: student read own" ON public.case_logs
  AS PERMISSIVE FOR SELECT TO public USING (((student_id = auth.uid()) OR (get_my_role() = ANY (ARRAY['admin'::user_role, 'ci'::user_role]))));

CREATE POLICY "admin_all_submissions" ON public.case_submissions
  AS PERMISSIVE FOR ALL TO public USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::user_role)))));

CREATE POLICY "students_insert_own_submissions" ON public.case_submissions
  AS PERMISSIVE FOR INSERT TO public WITH CHECK ((student_id = auth.uid()));

CREATE POLICY "students_select_own_submissions" ON public.case_submissions
  AS PERMISSIVE FOR SELECT TO public USING ((student_id = auth.uid()));

CREATE POLICY "students_update_own_pending_submissions" ON public.case_submissions
  AS PERMISSIVE FOR UPDATE TO public USING (((student_id = auth.uid()) AND (status = ANY (ARRAY['pending'::text, 'rejected'::text])))) WITH CHECK (((student_id = auth.uid()) AND (status = ANY (ARRAY['pending'::text, 'rejected'::text]))));

CREATE POLICY "case_types: admin write" ON public.case_types
  AS PERMISSIVE FOR ALL TO public USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "case_types: all read" ON public.case_types
  AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() IS NOT NULL));

CREATE POLICY "profiles: admin insert" ON public.profiles
  AS PERMISSIVE FOR INSERT TO public WITH CHECK (is_admin());

CREATE POLICY "profiles: own read" ON public.profiles
  AS PERMISSIVE FOR SELECT TO public USING (((auth.uid() = id) OR (((auth.jwt() -> 'app_metadata'::text) ->> 'role'::text) = ANY (ARRAY['admin'::text, 'ci'::text]))));

CREATE POLICY "profiles: own update" ON public.profiles
  AS PERMISSIVE FOR UPDATE TO public USING (((id = auth.uid()) OR is_admin()));

CREATE POLICY "profiles: read active students" ON public.profiles
  AS PERMISSIVE FOR SELECT TO authenticated USING (((role = 'student'::user_role) AND (is_active = true) AND (is_verified = true)));

CREATE POLICY "Admins manage overrides" ON public.requirement_overrides
  AS PERMISSIVE FOR ALL TO authenticated USING ((( SELECT profiles.role
   FROM profiles
  WHERE (profiles.id = auth.uid())) = 'admin'::user_role)) WITH CHECK ((( SELECT profiles.role
   FROM profiles
  WHERE (profiles.id = auth.uid())) = 'admin'::user_role));

CREATE POLICY "CIs read overrides" ON public.requirement_overrides
  AS PERMISSIVE FOR SELECT TO authenticated USING ((( SELECT profiles.role
   FROM profiles
  WHERE (profiles.id = auth.uid())) = 'ci'::user_role));

CREATE POLICY "Students read own overrides" ON public.requirement_overrides
  AS PERMISSIVE FOR SELECT TO authenticated USING ((student_id = auth.uid()));

CREATE POLICY "requirements: admin write" ON public.requirements
  AS PERMISSIVE FOR ALL TO public USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "requirements: all read" ON public.requirements
  AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() IS NOT NULL));

CREATE POLICY "rotations: admin write" ON public.rotations
  AS PERMISSIVE FOR ALL TO public USING (is_admin());

CREATE POLICY "rotations: all read" ON public.rotations
  AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() IS NOT NULL));

CREATE POLICY "Admins manage semesters" ON public.semesters
  AS PERMISSIVE FOR ALL TO public USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::user_role) AND (profiles.is_active = true))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::user_role) AND (profiles.is_active = true)))));

CREATE POLICY "Authenticated users can read semesters" ON public.semesters
  AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() IS NOT NULL));

CREATE POLICY "shifts: admin write" ON public.shifts
  AS PERMISSIVE FOR ALL TO public USING (is_admin());

CREATE POLICY "shifts: all read" ON public.shifts
  AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() IS NOT NULL));

CREATE POLICY "roster: admin all" ON public.student_roster
  AS PERMISSIVE FOR ALL TO public USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "roster: anyone can read" ON public.student_roster
  AS PERMISSIVE FOR SELECT TO public USING (true);

CREATE POLICY "admin_manage_system_settings" ON public.system_settings
  AS PERMISSIVE FOR ALL TO public USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::user_role)))));

CREATE POLICY "uploads: admin update" ON public.uploads
  AS PERMISSIVE FOR UPDATE TO public USING (is_admin());

CREATE POLICY "uploads: student insert own" ON public.uploads
  AS PERMISSIVE FOR INSERT TO public WITH CHECK ((student_id = auth.uid()));

CREATE POLICY "uploads: student read own" ON public.uploads
  AS PERMISSIVE FOR SELECT TO public USING (((student_id = auth.uid()) OR (get_my_role() = ANY (ARRAY['admin'::user_role, 'ci'::user_role]))));

