-- Create podcasts table
CREATE TABLE public.podcasts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  host TEXT,
  status TEXT DEFAULT 'להאזין',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.podcasts ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own podcasts" 
ON public.podcasts 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own podcasts" 
ON public.podcasts 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own podcasts" 
ON public.podcasts 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own podcasts" 
ON public.podcasts 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_podcasts_updated_at
BEFORE UPDATE ON public.podcasts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();