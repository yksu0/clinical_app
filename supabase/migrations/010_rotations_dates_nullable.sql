-- Dates removed from rotations config; assignment rows carry their own date range instead.
ALTER TABLE public.rotations
  ALTER COLUMN start_date DROP NOT NULL,
  ALTER COLUMN end_date DROP NOT NULL;
