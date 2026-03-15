-- Normalize existing sheet names and invited emails
UPDATE public.task_sheets
SET sheet_name = trim(sheet_name)
WHERE sheet_name IS NOT NULL AND sheet_name <> trim(sheet_name);

UPDATE public.task_sheet_collaborators
SET invited_email = lower(trim(invited_email))
WHERE invited_email IS NOT NULL AND invited_email <> lower(trim(invited_email));

-- Remove duplicate task_sheets rows before adding unique constraint
WITH ranked_sheets AS (
  SELECT id,
         row_number() OVER (
           PARTITION BY user_id, task_type, sheet_name
           ORDER BY created_at DESC, id DESC
         ) AS rn
  FROM public.task_sheets
)
DELETE FROM public.task_sheets ts
USING ranked_sheets rs
WHERE ts.id = rs.id
  AND rs.rn > 1;

-- Remove duplicate collaborators rows before adding unique constraint
WITH ranked_collabs AS (
  SELECT id,
         row_number() OVER (
           PARTITION BY sheet_id, invited_email
           ORDER BY created_at DESC, id DESC
         ) AS rn
  FROM public.task_sheet_collaborators
)
DELETE FROM public.task_sheet_collaborators c
USING ranked_collabs rc
WHERE c.id = rc.id
  AND rc.rn > 1;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'task_sheets_user_task_type_sheet_name_key'
  ) THEN
    ALTER TABLE public.task_sheets
      ADD CONSTRAINT task_sheets_user_task_type_sheet_name_key
      UNIQUE (user_id, task_type, sheet_name);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'task_sheet_collaborators_sheet_email_key'
  ) THEN
    ALTER TABLE public.task_sheet_collaborators
      ADD CONSTRAINT task_sheet_collaborators_sheet_email_key
      UNIQUE (sheet_id, invited_email);
  END IF;
END $$;