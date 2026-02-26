
-- Table to link Telegram chat IDs to user accounts
CREATE TABLE public.telegram_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  chat_id BIGINT NOT NULL UNIQUE,
  username TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.telegram_users ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own telegram link"
  ON public.telegram_users FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own telegram link"
  ON public.telegram_users FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own telegram link"
  ON public.telegram_users FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own telegram link"
  ON public.telegram_users FOR DELETE
  USING (auth.uid() = user_id);

-- Service role access for webhook (no auth context)
CREATE POLICY "Service role full access"
  ON public.telegram_users FOR ALL
  USING (auth.role() = 'service_role');

-- Trigger for updated_at
CREATE TRIGGER update_telegram_users_updated_at
  BEFORE UPDATE ON public.telegram_users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
