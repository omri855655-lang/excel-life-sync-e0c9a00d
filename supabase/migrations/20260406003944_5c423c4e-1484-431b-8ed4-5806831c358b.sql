
-- Create recycle bin table for soft deletes
CREATE TABLE public.recycle_bin (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  source_table text NOT NULL,
  source_id uuid NOT NULL,
  item_data jsonb NOT NULL,
  deleted_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days')
);

-- Enable RLS
ALTER TABLE public.recycle_bin ENABLE ROW LEVEL SECURITY;

-- Users can only access their own recycled items
CREATE POLICY "Users can view own recycled items"
ON public.recycle_bin FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own recycled items"
ON public.recycle_bin FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own recycled items"
ON public.recycle_bin FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Index for quick lookups
CREATE INDEX idx_recycle_bin_user_id ON public.recycle_bin(user_id);
CREATE INDEX idx_recycle_bin_expires_at ON public.recycle_bin(expires_at);

-- Create email_connections table
CREATE TABLE public.email_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  provider text NOT NULL DEFAULT 'gmail',
  access_token text,
  refresh_token text,
  email_address text NOT NULL,
  settings jsonb DEFAULT '{}'::jsonb,
  connected_at timestamptz NOT NULL DEFAULT now(),
  last_sync timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.email_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own email connections"
ON public.email_connections FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create email_analyses table
CREATE TABLE public.email_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  connection_id uuid REFERENCES public.email_connections(id) ON DELETE CASCADE NOT NULL,
  email_subject text,
  email_from text,
  email_date timestamptz,
  category text DEFAULT 'personal',
  suggested_action jsonb,
  analysis_depth text DEFAULT 'subject',
  is_processed boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.email_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own email analyses"
ON public.email_analyses FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_email_analyses_user ON public.email_analyses(user_id);
CREATE INDEX idx_email_analyses_connection ON public.email_analyses(connection_id);
