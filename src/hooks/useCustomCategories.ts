import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface CustomCategory {
  name: string;
  color: string;
}

const DEFAULT_CATEGORIES: CustomCategory[] = [
  { name: "משימה", color: "#3b82f6" },
  { name: "פגישה", color: "#ef4444" },
  { name: "הליכה", color: "#22c55e" },
  { name: "אישי", color: "#a855f7" },
  { name: "עבודה", color: "#f97316" },
  { name: "פרויקט", color: "#06b6d4" },
  { name: "לימודים", color: "#eab308" },
  { name: "אחר", color: "#6b7280" },
];

// Large color palette for users to pick from
export const COLOR_PALETTE = [
  "#ef4444", "#f97316", "#f59e0b", "#eab308", "#84cc16", "#22c55e",
  "#10b981", "#14b8a6", "#06b6d4", "#0ea5e9", "#3b82f6", "#6366f1",
  "#8b5cf6", "#a855f7", "#d946ef", "#ec4899", "#f43f5e", "#e11d48",
  "#be123c", "#9f1239", "#7c3aed", "#4f46e5", "#2563eb", "#0284c7",
  "#0891b2", "#059669", "#16a34a", "#65a30d", "#ca8a04", "#d97706",
  "#ea580c", "#dc2626", "#9333ea", "#7c3aed", "#4338ca", "#1d4ed8",
  "#0369a1", "#0e7490", "#047857", "#15803d", "#4d7c0f", "#a16207",
  "#b45309", "#c2410c", "#b91c1c", "#6b7280", "#475569", "#334155",
];

export function useCustomCategories() {
  const { user } = useAuth();
  const [categories, setCategories] = useState<CustomCategory[]>(DEFAULT_CATEGORIES);
  const [loading, setLoading] = useState(true);

  const fetchCategories = useCallback(async () => {
    if (!user) { setLoading(false); return; }

    const { data } = await supabase
      .from("user_preferences")
      .select("custom_categories")
      .eq("user_id", user.id)
      .single();

    if (data) {
      const custom = (data as any).custom_categories as CustomCategory[] | null;
      if (custom && Array.isArray(custom) && custom.length > 0) {
        setCategories(custom);
      }
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  const saveCategories = useCallback(async (newCategories: CustomCategory[]) => {
    if (!user) return;
    setCategories(newCategories);

    await supabase
      .from("user_preferences")
      .upsert({
        user_id: user.id,
        custom_categories: newCategories as any,
      } as any, { onConflict: "user_id" });
  }, [user]);

  const addCategory = useCallback(async (name: string, color: string) => {
    if (categories.find(c => c.name === name)) return;
    const newCats = [...categories, { name, color }];
    await saveCategories(newCats);
  }, [categories, saveCategories]);

  const updateCategory = useCallback(async (oldName: string, name: string, color: string) => {
    const newCats = categories.map(c => c.name === oldName ? { name, color } : c);
    await saveCategories(newCats);
  }, [categories, saveCategories]);

  const removeCategory = useCallback(async (name: string) => {
    const newCats = categories.filter(c => c.name !== name);
    await saveCategories(newCats);
  }, [categories, saveCategories]);

  const getCategoryColor = useCallback((categoryName: string): string => {
    const cat = categories.find(c => c.name === categoryName);
    return cat?.color || "#6b7280";
  }, [categories]);

  const categoryNames = categories.map(c => c.name);

  return {
    categories,
    categoryNames,
    loading,
    addCategory,
    updateCategory,
    removeCategory,
    getCategoryColor,
    saveCategories,
  };
}
