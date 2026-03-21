-- Fix project sharing RLS by calling helper functions with the correct argument order

DROP POLICY IF EXISTS "Members can view project members" ON public.project_members;
DROP POLICY IF EXISTS "Project owners can manage members" ON public.project_members;
DROP POLICY IF EXISTS "Members can view shared projects" ON public.projects;
DROP POLICY IF EXISTS "Manager members can update projects" ON public.projects;
DROP POLICY IF EXISTS "Members can view shared project tasks" ON public.project_tasks;
DROP POLICY IF EXISTS "Members can edit shared project tasks" ON public.project_tasks;
DROP POLICY IF EXISTS "Members can create shared project tasks" ON public.project_tasks;

CREATE POLICY "Members can view project members"
ON public.project_members
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR invited_email = (SELECT email FROM auth.users WHERE id = auth.uid())::text
  OR public.is_project_member(project_id, auth.uid())
);

CREATE POLICY "Project owners can manage members"
ON public.project_members
FOR ALL
TO authenticated
USING (
  invited_by = auth.uid()
  OR public.is_project_member(project_id, auth.uid())
)
WITH CHECK (invited_by = auth.uid());

CREATE POLICY "Members can view shared projects"
ON public.projects
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR public.is_project_member(id, auth.uid())
);

CREATE POLICY "Manager members can update projects"
ON public.projects
FOR UPDATE
TO authenticated
USING (
  user_id = auth.uid()
  OR (
    public.is_project_member(id, auth.uid())
    AND public.get_project_role(id, auth.uid()) = 'manager'
  )
);

CREATE POLICY "Members can view shared project tasks"
ON public.project_tasks
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR public.is_project_member(project_id, auth.uid())
);

CREATE POLICY "Members can edit shared project tasks"
ON public.project_tasks
FOR UPDATE
TO authenticated
USING (
  user_id = auth.uid()
  OR public.is_project_member(project_id, auth.uid())
);

CREATE POLICY "Members can create shared project tasks"
ON public.project_tasks
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  OR public.is_project_member(project_id, auth.uid())
);

-- Let invited project members resolve their own member record by normalized email as well
CREATE OR REPLACE FUNCTION public.get_project_role(_project_id uuid, _user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.project_members
  WHERE project_id = _project_id
    AND (
      user_id = _user_id
      OR lower(invited_email) = lower((SELECT email FROM auth.users WHERE id = _user_id))
    )
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_project_member(_project_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.project_members
    WHERE project_id = _project_id
      AND (
        user_id = _user_id
        OR lower(invited_email) = lower((SELECT email FROM auth.users WHERE id = _user_id))
      )
  );
$$;