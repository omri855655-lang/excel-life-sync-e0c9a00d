-- Create trigger to auto-fill user_id for collaborators when they are added
CREATE OR REPLACE TRIGGER trg_fill_collaborator_user_id
  BEFORE INSERT ON public.task_sheet_collaborators
  FOR EACH ROW
  EXECUTE FUNCTION public.fill_collaborator_user_id();