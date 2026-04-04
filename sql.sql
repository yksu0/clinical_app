-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.announcements (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  content text NOT NULL,
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT announcements_pkey PRIMARY KEY (id),
  CONSTRAINT announcements_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id)
);
CREATE TABLE public.assignments (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  student_id uuid NOT NULL,
  case_type_id uuid NOT NULL,
  location_id uuid NOT NULL,
  scheduled_date date NOT NULL,
  status USER-DEFINED NOT NULL DEFAULT 'assigned'::assignment_status,
  assigned_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT assignments_pkey PRIMARY KEY (id),
  CONSTRAINT assignments_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.profiles(id),
  CONSTRAINT assignments_case_type_id_fkey FOREIGN KEY (case_type_id) REFERENCES public.case_types(id),
  CONSTRAINT assignments_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.locations(id),
  CONSTRAINT assignments_assigned_by_fkey FOREIGN KEY (assigned_by) REFERENCES public.profiles(id)
);
CREATE TABLE public.audit_logs (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  action_type text NOT NULL,
  performed_by uuid NOT NULL,
  target_table text NOT NULL,
  target_id uuid NOT NULL,
  details jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT audit_logs_pkey PRIMARY KEY (id),
  CONSTRAINT audit_logs_performed_by_fkey FOREIGN KEY (performed_by) REFERENCES public.profiles(id)
);
CREATE TABLE public.case_logs (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  student_id uuid NOT NULL,
  case_type_id uuid NOT NULL,
  location_id uuid NOT NULL,
  upload_id uuid,
  date date NOT NULL,
  notes text,
  logged_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT case_logs_pkey PRIMARY KEY (id),
  CONSTRAINT case_logs_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.profiles(id),
  CONSTRAINT case_logs_case_type_id_fkey FOREIGN KEY (case_type_id) REFERENCES public.case_types(id),
  CONSTRAINT case_logs_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.locations(id),
  CONSTRAINT case_logs_upload_id_fkey FOREIGN KEY (upload_id) REFERENCES public.uploads(id),
  CONSTRAINT case_logs_logged_by_fkey FOREIGN KEY (logged_by) REFERENCES public.profiles(id)
);
CREATE TABLE public.case_types (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL UNIQUE,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT case_types_pkey PRIMARY KEY (id)
);
CREATE TABLE public.locations (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL UNIQUE,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT locations_pkey PRIMARY KEY (id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  full_name text NOT NULL,
  email text NOT NULL UNIQUE,
  role USER-DEFINED NOT NULL DEFAULT 'student'::user_role,
  section text,
  is_verified boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  roster_id uuid,
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id),
  CONSTRAINT profiles_roster_id_fkey FOREIGN KEY (roster_id) REFERENCES public.student_roster(id)
);
CREATE TABLE public.requirements (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  case_type_id uuid NOT NULL UNIQUE,
  required_count integer NOT NULL CHECK (required_count > 0),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT requirements_pkey PRIMARY KEY (id),
  CONSTRAINT requirements_case_type_id_fkey FOREIGN KEY (case_type_id) REFERENCES public.case_types(id)
);
CREATE TABLE public.student_roster (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  full_name text NOT NULL,
  email text,
  section text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT student_roster_pkey PRIMARY KEY (id)
);
CREATE TABLE public.uploads (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  student_id uuid NOT NULL,
  file_path text NOT NULL,
  file_name text NOT NULL,
  status USER-DEFINED NOT NULL DEFAULT 'pending'::upload_status,
  uploaded_at timestamp with time zone NOT NULL DEFAULT now(),
  processed_at timestamp with time zone,
  CONSTRAINT uploads_pkey PRIMARY KEY (id),
  CONSTRAINT uploads_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.profiles(id)
);