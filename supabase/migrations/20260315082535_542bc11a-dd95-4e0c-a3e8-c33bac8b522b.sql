
-- Allow sharing for ALL task types, not just 'work'
DROP POLICY IF EXISTS "Collaborators can view shared tasks" ON public.tasks;
CREATE POLICY "Collaborators can view shared tasks"
ON public.tasks
FOR SELECT
USING (
  sheet_name IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM public.task_sheets ts
    WHERE ts.sheet_name = tasks.sheet_name
      AND ts.task_type = tasks.task_type
      AND ts.user_id = tasks.user_id
      AND public.is_sheet_collaborator(auth.uid(), ts.id)
  )
);

DROP POLICY IF EXISTS "Collaborators can edit shared tasks" ON public.tasks;
CREATE POLICY "Collaborators can edit shared tasks"
ON public.tasks
FOR UPDATE
USING (
  sheet_name IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM public.task_sheets ts
    WHERE ts.sheet_name = tasks.sheet_name
      AND ts.task_type = tasks.task_type
      AND ts.user_id = tasks.user_id
      AND public.can_edit_sheet(auth.uid(), ts.id)
  )
)
WITH CHECK (
  sheet_name IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM public.task_sheets ts
    WHERE ts.sheet_name = tasks.sheet_name
      AND ts.task_type = tasks.task_type
      AND ts.user_id = tasks.user_id
      AND public.can_edit_sheet(auth.uid(), ts.id)
  )
);

DROP POLICY IF EXISTS "Collaborators can insert shared tasks" ON public.tasks;
CREATE POLICY "Collaborators can insert shared tasks"
ON public.tasks
FOR INSERT
WITH CHECK (
  sheet_name IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM public.task_sheets ts
    WHERE ts.sheet_name = tasks.sheet_name
      AND ts.task_type = tasks.task_type
      AND ts.user_id = tasks.user_id
      AND public.can_edit_sheet(auth.uid(), ts.id)
  )
);
