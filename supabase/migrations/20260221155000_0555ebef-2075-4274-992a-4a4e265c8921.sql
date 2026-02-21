
-- Custom boards table
CREATE TABLE public.custom_boards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'LayoutGrid',
  statuses JSONB NOT NULL DEFAULT '["לביצוע","בתהליך","הושלם"]'::jsonb,
  show_in_dashboard BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.custom_boards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own boards" ON public.custom_boards FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own boards" ON public.custom_boards FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own boards" ON public.custom_boards FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own boards" ON public.custom_boards FOR DELETE USING (auth.uid() = user_id);

-- Custom board items table
CREATE TABLE public.custom_board_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  board_id UUID NOT NULL REFERENCES public.custom_boards(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  status TEXT DEFAULT 'לביצוע',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.custom_board_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own items" ON public.custom_board_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own items" ON public.custom_board_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own items" ON public.custom_board_items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own items" ON public.custom_board_items FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_custom_boards_updated_at BEFORE UPDATE ON public.custom_boards FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_custom_board_items_updated_at BEFORE UPDATE ON public.custom_board_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
