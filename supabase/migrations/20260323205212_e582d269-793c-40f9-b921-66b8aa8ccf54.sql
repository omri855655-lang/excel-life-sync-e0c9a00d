-- Fix project member policies to avoid direct auth.users access in RLS and align behavior with worksheet sharing.

CREATE OR REPLACE FUNCTION public.is_project_owner(_project_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.projects p
    WHERE p.id = _project_id
      AND p.user_id = _user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.can_manage_project_members(_project_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_project_owner(_project_id, _user_id)
  OR EXISTS (
    SELECT 1
    FROM public.project_members pm
    WHERE pm.project_id = _project_id
      AND (
        pm.user_id = _user_id
        OR lower(pm.invited_email) = lower(COALESCE(auth.email(), ''))
      )
      AND pm.role = 'manager'
  );
$$;

DROP POLICY IF EXISTS "Members can view project members" ON public.project_members;
CREATE POLICY "Members can view project members"
ON public.project_members
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR lower(invited_email) = lower(COALESCE(auth.email(), ''))
  OR public.is_project_member(project_id, auth.uid())
);

DROP POLICY IF EXISTS "Project owners can manage members" ON public.project_members;
CREATE POLICY "Project owners can manage members"
ON public.project_members
FOR ALL
TO authenticated
USING (
  public.can_manage_project_members(project_id, auth.uid())
)
WITH CHECK (
  public.can_manage_project_members(project_id, auth.uid())
  AND (
    invited_by = auth.uid()
    OR public.is_project_owner(project_id, auth.uid())
  )
);