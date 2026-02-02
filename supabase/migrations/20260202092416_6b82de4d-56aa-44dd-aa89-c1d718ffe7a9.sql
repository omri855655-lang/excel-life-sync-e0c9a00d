-- Persist empty task sheets (years) separately from tasks
CREATE TABLE IF NOT EXISTS public.task_sheets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  task_type TEXT NOT NULL,
  year INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT task_sheets_task_type_check CHECK (task_type IN ('personal','work')),
  CONSTRAINT task_sheets_year_check CHECK (year >= 2000 AND year <= 2100)
);

CREATE UNIQUE INDEX IF NOT EXISTS task_sheets_user_type_year_uq
  ON public.task_sheets (user_id, task_type, year);

CREATE INDEX IF NOT EXISTS task_sheets_type_year_idx
  ON public.task_sheets (task_type, year);

ALTER TABLE public.task_sheets ENABLE ROW LEVEL SECURITY;

-- Anyone can view work sheets
CREATE POLICY "Anyone can view work task sheets"
  ON public.task_sheets
  FOR SELECT
  USING (task_type = 'work');

-- Users can view/manage their own sheets (personal + their work sheets)
CREATE POLICY "Users can view their own task sheets"
  ON public.task_sheets
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own task sheets"
  ON public.task_sheets
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own task sheets"
  ON public.task_sheets
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own task sheets"
  ON public.task_sheets
  FOR DELETE
  USING (auth.uid() = user_id);

-- Keep updated_at in sync
DROP TRIGGER IF EXISTS update_task_sheets_updated_at ON public.task_sheets;
CREATE TRIGGER update_task_sheets_updated_at
  BEFORE UPDATE ON public.task_sheets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Backfill sheets from existing tasks
INSERT INTO public.task_sheets (user_id, task_type, year)
SELECT DISTINCT t.user_id, t.task_type, t.year
FROM public.tasks t
WHERE t.year IS NOT NULL
ON CONFLICT DO NOTHING;
