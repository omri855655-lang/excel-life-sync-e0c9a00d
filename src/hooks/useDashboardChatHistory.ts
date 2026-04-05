import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface ChatMessage {
  role: string;
  content: string;
}

/**
 * Persists AI chat history per dashboard type in Supabase.
 * Falls back to localStorage for unauthenticated users.
 */
export function useDashboardChatHistory(dashboardKey: string) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loaded, setLoaded] = useState(false);

  // Load from DB on mount
  useEffect(() => {
    if (!user) {
      // Fallback to localStorage
      try {
        const raw = localStorage.getItem(`dashboard-chat-${dashboardKey}`);
        if (raw) setMessages(JSON.parse(raw));
      } catch {}
      setLoaded(true);
      return;
    }

    const load = async () => {
      const { data } = await supabase
        .from("dashboard_chat_history")
        .select("messages")
        .eq("user_id", user.id)
        .eq("dashboard_key", dashboardKey)
        .maybeSingle();

      if (data?.messages) {
        setMessages(data.messages as unknown as ChatMessage[]);
      }
      setLoaded(true);
    };
    load();
  }, [user, dashboardKey]);

  // Save to DB whenever messages change (after initial load)
  useEffect(() => {
    if (!loaded || messages.length === 0) return;

    if (!user) {
      localStorage.setItem(`dashboard-chat-${dashboardKey}`, JSON.stringify(messages));
      return;
    }

    const save = async () => {
      await supabase
        .from("dashboard_chat_history")
        .upsert(
          {
            user_id: user.id,
            dashboard_key: dashboardKey,
            messages: messages as any,
          },
          { onConflict: "user_id,dashboard_key" }
        );
    };
    save();
  }, [messages, loaded, user, dashboardKey]);

  const addMessage = useCallback((msg: ChatMessage) => {
    setMessages(prev => [...prev, msg]);
  }, []);

  const clearHistory = useCallback(async () => {
    setMessages([]);
    if (user) {
      await supabase
        .from("dashboard_chat_history")
        .delete()
        .eq("user_id", user.id)
        .eq("dashboard_key", dashboardKey);
    } else {
      localStorage.removeItem(`dashboard-chat-${dashboardKey}`);
    }
  }, [user, dashboardKey]);

  return { messages, setMessages, addMessage, clearHistory };
}
