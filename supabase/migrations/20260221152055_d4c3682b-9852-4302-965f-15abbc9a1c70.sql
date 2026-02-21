
-- =============================================
-- 1. Task Sheet Collaborators
-- =============================================
CREATE TABLE public.task_sheet_collaborators (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sheet_id UUID NOT NULL REFERENCES public.task_sheets(id) ON DELETE CASCADE,
  user_id UUID,
  invited_email TEXT NOT NULL,
  permission TEXT NOT NULL DEFAULT 'view' CHECK (permission IN ('view', 'edit')),
  invited_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.task_sheet_collaborators ENABLE ROW LEVEL SECURITY;

-- Helper function to check sheet collaboration
CREATE OR REPLACE FUNCTION public.is_sheet_collaborator(_user_id UUID, _sheet_id UUID)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.task_sheet_collaborators
    WHERE sheet_id = _sheet_id
      AND (user_id = _user_id OR invited_email = (SELECT email FROM auth.users WHERE id = _user_id))
  );
$$;

-- Helper function to check sheet edit permission
CREATE OR REPLACE FUNCTION public.can_edit_sheet(_user_id UUID, _sheet_id UUID)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.task_sheet_collaborators
    WHERE sheet_id = _sheet_id
      AND (user_id = _user_id OR invited_email = (SELECT email FROM auth.users WHERE id = _user_id))
      AND permission = 'edit'
  );
$$;

-- Collaborators policies
CREATE POLICY "Sheet owners can manage collaborators"
ON public.task_sheet_collaborators FOR ALL
USING (invited_by = auth.uid())
WITH CHECK (invited_by = auth.uid());

CREATE POLICY "Collaborators can view their own entries"
ON public.task_sheet_collaborators FOR SELECT
USING (user_id = auth.uid() OR invited_email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- =============================================
-- 2. Project Members
-- =============================================
CREATE TABLE public.project_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID,
  invited_email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('manager', 'member', 'viewer')),
  job_title TEXT,
  invited_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(project_id, invited_email)
);

ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;

-- Helper function to check project membership
CREATE OR REPLACE FUNCTION public.is_project_member(_user_id UUID, _project_id UUID)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.project_members
    WHERE project_id = _project_id
      AND (user_id = _user_id OR invited_email = (SELECT email FROM auth.users WHERE id = _user_id))
  );
$$;

-- Helper to get project role
CREATE OR REPLACE FUNCTION public.get_project_role(_user_id UUID, _project_id UUID)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.project_members
  WHERE project_id = _project_id
    AND (user_id = _user_id OR invited_email = (SELECT email FROM auth.users WHERE id = _user_id))
  LIMIT 1;
$$;

-- Project members policies
CREATE POLICY "Project owners can manage members"
ON public.project_members FOR ALL
USING (invited_by = auth.uid() OR public.is_project_member(auth.uid(), project_id))
WITH CHECK (invited_by = auth.uid());

CREATE POLICY "Members can view project members"
ON public.project_members FOR SELECT
USING (
  user_id = auth.uid()
  OR invited_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  OR public.is_project_member(auth.uid(), project_id)
);

-- =============================================
-- 3. Update tasks RLS - Remove public work task access
-- =============================================
DROP POLICY IF EXISTS "Anyone can view work tasks" ON public.tasks;

-- Add collaborator access to tasks
CREATE POLICY "Collaborators can view shared tasks"
ON public.tasks FOR SELECT
USING (
  task_type = 'work'
  AND sheet_name IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.task_sheets ts
    WHERE ts.sheet_name = tasks.sheet_name
      AND ts.task_type = 'work'
      AND public.is_sheet_collaborator(auth.uid(), ts.id)
  )
);

CREATE POLICY "Collaborators can edit shared tasks"
ON public.tasks FOR UPDATE
USING (
  task_type = 'work'
  AND sheet_name IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.task_sheets ts
    WHERE ts.sheet_name = tasks.sheet_name
      AND ts.task_type = 'work'
      AND public.can_edit_sheet(auth.uid(), ts.id)
  )
);

CREATE POLICY "Collaborators can insert shared tasks"
ON public.tasks FOR INSERT
WITH CHECK (
  task_type = 'work'
  AND sheet_name IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.task_sheets ts
    WHERE ts.sheet_name = tasks.sheet_name
      AND ts.task_type = 'work'
      AND public.can_edit_sheet(auth.uid(), ts.id)
  )
);

-- =============================================
-- 4. Update task_sheets RLS - Remove public access
-- =============================================
DROP POLICY IF EXISTS "Anyone can view work task sheets" ON public.task_sheets;

CREATE POLICY "Collaborators can view shared sheets"
ON public.task_sheets FOR SELECT
USING (public.is_sheet_collaborator(auth.uid(), id));

-- =============================================
-- 5. Update projects RLS for members
-- =============================================
CREATE POLICY "Members can view shared projects"
ON public.projects FOR SELECT
USING (public.is_project_member(auth.uid(), id));

CREATE POLICY "Manager members can update projects"
ON public.projects FOR UPDATE
USING (public.is_project_member(auth.uid(), id) AND public.get_project_role(auth.uid(), id) = 'manager');

-- =============================================
-- 6. Update project_tasks RLS for members
-- =============================================
CREATE POLICY "Members can view shared project tasks"
ON public.project_tasks FOR SELECT
USING (public.is_project_member(auth.uid(), project_id));

CREATE POLICY "Members can edit shared project tasks"
ON public.project_tasks FOR UPDATE
USING (public.is_project_member(auth.uid(), project_id) AND public.get_project_role(auth.uid(), project_id) IN ('manager', 'member'));

CREATE POLICY "Members can create shared project tasks"
ON public.project_tasks FOR INSERT
WITH CHECK (public.is_project_member(auth.uid(), project_id) AND public.get_project_role(auth.uid(), project_id) IN ('manager', 'member'));

-- =============================================
-- 7. Add assignment fields to project_tasks
-- =============================================
ALTER TABLE public.project_tasks ADD COLUMN IF NOT EXISTS assigned_to UUID;
ALTER TABLE public.project_tasks ADD COLUMN IF NOT EXISTS assigned_email TEXT;
ALTER TABLE public.project_tasks ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'לא התחיל';
ALTER TABLE public.project_tasks ADD COLUMN IF NOT EXISTS notes TEXT;

-- =============================================
-- 8. Auto-fill user_id on collaborator when user with that email exists
-- =============================================
CREATE OR REPLACE FUNCTION public.fill_collaborator_user_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.user_id IS NULL AND NEW.invited_email IS NOT NULL THEN
    SELECT id INTO NEW.user_id FROM auth.users WHERE email = NEW.invited_email;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER fill_sheet_collab_user_id
BEFORE INSERT ON public.task_sheet_collaborators
FOR EACH ROW EXECUTE FUNCTION public.fill_collaborator_user_id();

CREATE TRIGGER fill_project_member_user_id
BEFORE INSERT ON public.project_members
FOR EACH ROW EXECUTE FUNCTION public.fill_collaborator_user_id();
