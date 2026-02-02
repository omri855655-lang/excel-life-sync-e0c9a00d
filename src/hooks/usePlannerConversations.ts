import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ConversationRecord {
  id: string;
  conversation_date: string;
  messages: ChatMessage[];
  tasks_snapshot: any[];
}

export function usePlannerConversations() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ConversationRecord[]>([]);
  const [currentConversation, setCurrentConversation] = useState<ConversationRecord | null>(null);
  const [loading, setLoading] = useState(false);

  const today = format(new Date(), 'yyyy-MM-dd');

  // Fetch all conversations for history dropdown
  const fetchConversations = useCallback(async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('planner_conversations')
      .select('*')
      .eq('user_id', user.id)
      .order('conversation_date', { ascending: false })
      .limit(30);

    if (!error && data) {
      // Cast the data to handle JSONB fields
      const typedData = data.map(row => ({
        id: row.id,
        conversation_date: row.conversation_date,
        messages: (row.messages as unknown as ChatMessage[]) || [],
        tasks_snapshot: (row.tasks_snapshot as unknown as any[]) || []
      }));
      setConversations(typedData);
    }
  }, [user]);

  // Load today's conversation or create new
  const loadTodayConversation = useCallback(async () => {
    if (!user) return null;
    setLoading(true);

    const { data, error } = await supabase
      .from('planner_conversations')
      .select('*')
      .eq('user_id', user.id)
      .eq('conversation_date', today)
      .maybeSingle();

    setLoading(false);

    if (!error && data) {
      const typedData = {
        id: data.id,
        conversation_date: data.conversation_date,
        messages: (data.messages as unknown as ChatMessage[]) || [],
        tasks_snapshot: (data.tasks_snapshot as unknown as any[]) || []
      };
      setCurrentConversation(typedData);
      return typedData;
    }
    
    return null;
  }, [user, today]);

  // Load a specific conversation by date
  const loadConversation = useCallback(async (date: string) => {
    if (!user) return null;
    setLoading(true);

    const { data, error } = await supabase
      .from('planner_conversations')
      .select('*')
      .eq('user_id', user.id)
      .eq('conversation_date', date)
      .maybeSingle();

    setLoading(false);

    if (!error && data) {
      const typedData = {
        id: data.id,
        conversation_date: data.conversation_date,
        messages: (data.messages as unknown as ChatMessage[]) || [],
        tasks_snapshot: (data.tasks_snapshot as unknown as any[]) || []
      };
      setCurrentConversation(typedData);
      return typedData;
    }
    
    return null;
  }, [user]);

  // Save/update conversation
  const saveConversation = useCallback(async (
    messages: ChatMessage[], 
    tasksSnapshot: any[],
    date: string = today
  ) => {
    if (!user) return;

    const { data, error } = await supabase
      .from('planner_conversations')
      .upsert({
        user_id: user.id,
        conversation_date: date,
        messages: messages as unknown as any,
        tasks_snapshot: tasksSnapshot as unknown as any,
      }, {
        onConflict: 'user_id,conversation_date'
      })
      .select()
      .single();

    if (!error && data) {
      const typedData = {
        id: data.id,
        conversation_date: data.conversation_date,
        messages: (data.messages as unknown as ChatMessage[]) || [],
        tasks_snapshot: (data.tasks_snapshot as unknown as any[]) || []
      };
      setCurrentConversation(typedData);
      fetchConversations(); // Refresh list
    }
  }, [user, today, fetchConversations]);

  // Start a new conversation for today (clears current)
  const startNewConversation = useCallback(() => {
    setCurrentConversation(null);
  }, []);

  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user, fetchConversations]);

  return {
    conversations,
    currentConversation,
    loading,
    loadTodayConversation,
    loadConversation,
    saveConversation,
    startNewConversation,
    today
  };
}
