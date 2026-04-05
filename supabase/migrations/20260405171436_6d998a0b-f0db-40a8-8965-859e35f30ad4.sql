CREATE TABLE public.dashboard_chat_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  dashboard_key TEXT NOT NULL,
  messages JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, dashboard_key)
);

ALTER TABLE public.dashboard_chat_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own chat history"
ON public.dashboard_chat_history FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own chat history"
ON public.dashboard_chat_history FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own chat history"
ON public.dashboard_chat_history FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own chat history"
ON public.dashboard_chat_history FOR DELETE
USING (auth.uid() = user_id);

CREATE TRIGGER update_dashboard_chat_history_updated_at
BEFORE UPDATE ON public.dashboard_chat_history
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();