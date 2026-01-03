import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export interface DbTask {
  id: string;
  user_id: string;
  description: string;
  category: string | null;
  responsible: string | null;
  status: string;
  status_notes: string | null;
  progress: string | null;
  planned_end: string | null;
  overdue: boolean;
  task_type: "personal" | "work";
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  description: string;
  category: string;
  responsible: string;
  status: "בוצע" | "טרם החל" | "בטיפול";
  statusNotes: string;
  progress: string;
  plannedEnd: string;
  overdue: boolean;
}

const mapDbTaskToTask = (dbTask: DbTask): Task => ({
  id: dbTask.id,
  description: dbTask.description,
  category: dbTask.category || "",
  responsible: dbTask.responsible || "",
  status: (dbTask.status as Task["status"]) || "טרם החל",
  statusNotes: dbTask.status_notes || "",
  progress: dbTask.progress || "",
  plannedEnd: dbTask.planned_end || "",
  overdue: dbTask.overdue,
});

const mapTaskToDbInsert = (task: Partial<Task>, userId: string, taskType: "personal" | "work") => ({
  user_id: userId,
  description: task.description || "",
  category: task.category || null,
  responsible: task.responsible || null,
  status: task.status || "טרם החל",
  status_notes: task.statusNotes || null,
  progress: task.progress || null,
  planned_end: task.plannedEnd || null,
  overdue: task.overdue || false,
  task_type: taskType,
});

export function useTasks(taskType: "personal" | "work") {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = useCallback(async () => {
    if (!user) {
      setTasks([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("user_id", user.id)
        .eq("task_type", taskType)
        .order("created_at", { ascending: true });

      if (error) throw error;

      const mappedTasks = (data as DbTask[]).map(mapDbTaskToTask);
      setTasks(mappedTasks);
    } catch (error: any) {
      console.error("Error fetching tasks:", error);
      toast.error("שגיאה בטעינת משימות");
    } finally {
      setLoading(false);
    }
  }, [user, taskType]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const addTask = useCallback(async (): Promise<Task | null> => {
    if (!user) return null;

    const newDbTask = mapTaskToDbInsert(
      {
        description: "",
        category: "",
        responsible: "",
        status: "טרם החל",
        statusNotes: "",
        progress: "",
        plannedEnd: "",
        overdue: false,
      },
      user.id,
      taskType
    );

    try {
      const { data, error } = await supabase
        .from("tasks")
        .insert([newDbTask])
        .select()
        .single();

      if (error) throw error;

      const newTask = mapDbTaskToTask(data as DbTask);
      setTasks((prev) => [...prev, newTask]);
      return newTask;
    } catch (error: any) {
      console.error("Error adding task:", error);
      toast.error("שגיאה בהוספת משימה");
      return null;
    }
  }, [user, taskType]);

  const updateTask = useCallback(async (taskId: string, updates: Partial<Task>) => {
    if (!user) return;

    const dbUpdates: Record<string, any> = {};
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.category !== undefined) dbUpdates.category = updates.category || null;
    if (updates.responsible !== undefined) dbUpdates.responsible = updates.responsible || null;
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.statusNotes !== undefined) dbUpdates.status_notes = updates.statusNotes || null;
    if (updates.progress !== undefined) dbUpdates.progress = updates.progress || null;
    if (updates.plannedEnd !== undefined) dbUpdates.planned_end = updates.plannedEnd || null;
    if (updates.overdue !== undefined) dbUpdates.overdue = updates.overdue;

    try {
      const { error } = await supabase
        .from("tasks")
        .update(dbUpdates)
        .eq("id", taskId)
        .eq("user_id", user.id);

      if (error) throw error;

      setTasks((prev) =>
        prev.map((task) =>
          task.id === taskId ? { ...task, ...updates } : task
        )
      );
    } catch (error: any) {
      console.error("Error updating task:", error);
      toast.error("שגיאה בעדכון משימה");
    }
  }, [user]);

  const deleteTask = useCallback(async (taskId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("tasks")
        .delete()
        .eq("id", taskId)
        .eq("user_id", user.id);

      if (error) throw error;

      setTasks((prev) => prev.filter((task) => task.id !== taskId));
    } catch (error: any) {
      console.error("Error deleting task:", error);
      toast.error("שגיאה במחיקת משימה");
    }
  }, [user]);

  return {
    tasks,
    loading,
    addTask,
    updateTask,
    deleteTask,
    refetch: fetchTasks,
  };
}
