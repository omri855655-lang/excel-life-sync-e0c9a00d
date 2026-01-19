-- Add urgent column to tasks table
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS urgent boolean DEFAULT false;