-- Add year column to tasks table for yearly worksheets
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS year integer DEFAULT EXTRACT(YEAR FROM CURRENT_DATE);

-- Update existing tasks to have the current year if year is null
UPDATE public.tasks SET year = EXTRACT(YEAR FROM created_at) WHERE year IS NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_tasks_year ON public.tasks(year);

-- Create recurring_tasks table for daily/weekly/monthly tasks
CREATE TABLE public.recurring_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  frequency TEXT NOT NULL DEFAULT 'daily', -- 'daily', 'weekly', 'monthly'
  day_of_week INTEGER, -- 0-6 for weekly tasks (0=Sunday)
  day_of_month INTEGER, -- 1-31 for monthly tasks
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.recurring_tasks ENABLE ROW LEVEL SECURITY;

-- RLS policies for recurring_tasks
CREATE POLICY "Users can view their own recurring tasks" 
ON public.recurring_tasks 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own recurring tasks" 
ON public.recurring_tasks 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own recurring tasks" 
ON public.recurring_tasks 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own recurring tasks" 
ON public.recurring_tasks 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create recurring_task_completions table to track daily completions
CREATE TABLE public.recurring_task_completions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  recurring_task_id UUID NOT NULL REFERENCES public.recurring_tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  completed_date DATE NOT NULL DEFAULT CURRENT_DATE,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(recurring_task_id, completed_date)
);

-- Enable RLS
ALTER TABLE public.recurring_task_completions ENABLE ROW LEVEL SECURITY;

-- RLS policies for recurring_task_completions
CREATE POLICY "Users can view their own completions" 
ON public.recurring_task_completions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own completions" 
ON public.recurring_task_completions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own completions" 
ON public.recurring_task_completions 
FOR DELETE 
USING (auth.uid() = user_id);

-- Trigger for updating updated_at on recurring_tasks
CREATE TRIGGER update_recurring_tasks_updated_at
BEFORE UPDATE ON public.recurring_tasks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();