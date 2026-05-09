-- Make date optional in both case_submissions and case_logs
ALTER TABLE public.case_submissions ALTER COLUMN date DROP NOT NULL;
ALTER TABLE public.case_logs ALTER COLUMN date DROP NOT NULL;
