
-- Table to track sent notifications to avoid duplicates
CREATE TABLE public.sent_notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  event_id uuid,
  task_id uuid,
  notification_type text NOT NULL, -- 'event_5min', 'event_15min', 'event_1hour', 'task_complete_ask'
  channel text NOT NULL DEFAULT 'email', -- 'email', 'push'
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Index for fast lookup
CREATE INDEX idx_sent_notifications_lookup ON public.sent_notifications (user_id, event_id, notification_type);

-- Auto-cleanup old records (keep 7 days)
ALTER TABLE public.sent_notifications ENABLE ROW LEVEL SECURITY;

-- Only service role needs access (edge functions use service key)
CREATE POLICY "Service role only" ON public.sent_notifications FOR ALL USING (false);

-- Create a token table for email action links
CREATE TABLE public.action_tokens (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  task_id uuid NOT NULL,
  action text NOT NULL DEFAULT 'complete',
  used boolean NOT NULL DEFAULT false,
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '24 hours'),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.action_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role only" ON public.action_tokens FOR ALL USING (false);
