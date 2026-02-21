import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export interface CustomBoard {
  id: string;
  name: string;
  icon: string;
  statuses: string[];
  show_in_dashboard: boolean;
  sort_order: number;
}

export function useCustomBoards() {
  const { user } = useAuth();
  const [boards, setBoards] = useState<CustomBoard[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBoards = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    const { data, error } = await supabase
      .from("custom_boards")
      .select("*")
      .eq("user_id", user.id)
      .order("sort_order");
    if (!error && data) {
      setBoards(data.map((b: any) => ({
        ...b,
        statuses: Array.isArray(b.statuses) ? b.statuses : JSON.parse(b.statuses || "[]"),
      })));
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchBoards(); }, [fetchBoards]);

  const addBoard = async (name: string, statuses: string[], showInDashboard: boolean) => {
    if (!user) return;
    const { error } = await supabase.from("custom_boards").insert({
      user_id: user.id,
      name,
      statuses: JSON.stringify(statuses),
      show_in_dashboard: showInDashboard,
      sort_order: boards.length,
    });
    if (error) throw error;
    await fetchBoards();
  };

  const deleteBoard = async (id: string) => {
    const { error } = await supabase.from("custom_boards").delete().eq("id", id);
    if (error) throw error;
    await fetchBoards();
  };

  const updateBoard = async (id: string, updates: Partial<CustomBoard>) => {
    const toUpdate: any = { ...updates };
    if (updates.statuses) toUpdate.statuses = JSON.stringify(updates.statuses);
    const { error } = await supabase.from("custom_boards").update(toUpdate).eq("id", id);
    if (error) throw error;
    await fetchBoards();
  };

  return { boards, loading, addBoard, deleteBoard, updateBoard, refetch: fetchBoards };
}
