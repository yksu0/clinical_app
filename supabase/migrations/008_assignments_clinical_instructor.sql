ALTER TABLE public.assignments
  ADD COLUMN IF NOT EXISTS clinical_instructor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL;
