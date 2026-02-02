-- Change year columns to TEXT to support custom sheet names
-- First, drop the constraint on task_sheets
ALTER TABLE public.task_sheets DROP CONSTRAINT IF EXISTS task_sheets_year_check;

-- Change year column type from INTEGER to TEXT in task_sheets
ALTER TABLE public.task_sheets 
  ALTER COLUMN year TYPE TEXT USING year::TEXT;

-- Rename year to sheet_name for clarity
ALTER TABLE public.task_sheets RENAME COLUMN year TO sheet_name;

-- Drop the old unique index and recreate with new column name
DROP INDEX IF EXISTS task_sheets_user_type_year_uq;
CREATE UNIQUE INDEX task_sheets_user_type_name_uq
  ON public.task_sheets (user_id, task_type, sheet_name);

DROP INDEX IF EXISTS task_sheets_type_year_idx;
CREATE INDEX task_sheets_type_name_idx
  ON public.task_sheets (task_type, sheet_name);

-- Change year column type from INTEGER to TEXT in tasks table
ALTER TABLE public.tasks 
  ALTER COLUMN year TYPE TEXT USING year::TEXT;

-- Rename year to sheet_name in tasks for consistency
ALTER TABLE public.tasks RENAME COLUMN year TO sheet_name;