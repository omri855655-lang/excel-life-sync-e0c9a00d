-- Allow anyone (including logged-out visitors) to view ONLY work tasks
CREATE POLICY "Anyone can view work tasks"
ON public.tasks
FOR SELECT
USING (task_type = 'work');
