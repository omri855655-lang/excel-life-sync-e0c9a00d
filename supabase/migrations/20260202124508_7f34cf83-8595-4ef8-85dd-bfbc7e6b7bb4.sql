-- Create table for storing daily planner conversation history
CREATE TABLE public.planner_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  conversation_date DATE NOT NULL DEFAULT CURRENT_DATE,
  messages JSONB NOT NULL DEFAULT '[]',
  tasks_snapshot JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, conversation_date)
);

-- Enable Row Level Security
ALTER TABLE public.planner_conversations ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own conversations" 
ON public.planner_conversations 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own conversations" 
ON public.planner_conversations 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own conversations" 
ON public.planner_conversations 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own conversations" 
ON public.planner_conversations 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_planner_conversations_updated_at
BEFORE UPDATE ON public.planner_conversations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();