import { useEffect, useMemo, useState } from "react";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useRecurringTasks } from "@/hooks/useRecurringTasks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase, CalendarCheck, ListTodo } from "lucide-react";

type TaskRow = {
  status: string | null;
  overdue: boolean | null;
  urgent: boolean | null;
  archived: boolean;
};

function computeTaskStats(rows: TaskRow[]) {
  const active = rows.filter((r) => !r.archived);
  const total = active.length;
  const completed = active.filter((r) => r.status === "בוצע").length;
  const open = active.filter((r) => r.status !== "בוצע");
  const urgent = open.filter((r) => !!r.urgent).length;
  const overdue = open.filter((r) => !!r.overdue).length;

  return { total, completed, urgent, overdue };
}

function Stat({ label, value, valueClassName }: { label: string; value: number; valueClassName?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={valueClassName ?? "text-sm font-semibold text-foreground"}>{value}</span>
    </div>
  );
}

export default function TasksDashboards() {
  const { user } = useAuth();
  const { tasks: recurringTasks, loading: recurringLoading, isTaskDueToday, isTaskCompletedToday } = useRecurringTasks();

  const [loading, setLoading] = useState(true);
  const [personalRows, setPersonalRows] = useState<TaskRow[]>([]);
  const [workRows, setWorkRows] = useState<TaskRow[]>([]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setLoading(true);
      try {
        const [personalRes, workRes] = await Promise.all([
          user
            ? supabase
                .from("tasks")
                .select("status, overdue, urgent, archived")
                .eq("task_type", "personal")
                .eq("user_id", user.id)
            : Promise.resolve({ data: [], error: null } as any),
          supabase
            .from("tasks")
            .select("status, overdue, urgent, archived")
            .eq("task_type", "work"),
        ]);

        if (cancelled) return;

        if (personalRes.error) throw personalRes.error;
        if (workRes.error) throw workRes.error;

        setPersonalRows((personalRes.data as TaskRow[]) ?? []);
        setWorkRows((workRes.data as TaskRow[]) ?? []);
      } catch (e) {
        console.error("Failed to load task dashboards", e);
        setPersonalRows([]);
        setWorkRows([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const personalStats = useMemo(() => computeTaskStats(personalRows), [personalRows]);
  const workStats = useMemo(() => computeTaskStats(workRows), [workRows]);

  const routineStats = useMemo(() => {
    const dueToday = recurringTasks.filter(isTaskDueToday);
    const completedToday = dueToday.filter((t) => isTaskCompletedToday(t.id));
    return {
      total: recurringTasks.length,
      dueToday: dueToday.length,
      completedToday: completedToday.length,
      pendingToday: Math.max(0, dueToday.length - completedToday.length),
    };
  }, [recurringTasks, isTaskDueToday, isTaskCompletedToday]);

  const isAnyLoading = loading || recurringLoading;

  return (
    <div className="space-y-4" dir="rtl">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <ListTodo className="h-4 w-4 text-primary" />
              משימות אישיות
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {isAnyLoading ? (
              <div className="text-sm text-muted-foreground">טוען…</div>
            ) : !user ? (
              <div className="text-sm text-muted-foreground">יש להתחבר כדי לראות נתונים</div>
            ) : (
              <>
                <Stat label='סה"כ פעיל' value={personalStats.total} />
                <Stat label="בוצעו" value={personalStats.completed} valueClassName="text-sm font-semibold text-primary" />
                <Stat label="דחופות" value={personalStats.urgent} />
                <Stat label="באיחור" value={personalStats.overdue} valueClassName="text-sm font-semibold text-destructive" />
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarCheck className="h-4 w-4 text-primary" />
              לוז יומי (משימות קבועות)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {isAnyLoading ? (
              <div className="text-sm text-muted-foreground">טוען…</div>
            ) : !user ? (
              <div className="text-sm text-muted-foreground">יש להתחבר כדי לראות נתונים</div>
            ) : (
              <>
                <Stat label='סה"כ משימות' value={routineStats.total} />
                <Stat label="מגיעות היום" value={routineStats.dueToday} />
                <Stat label="הושלמו היום" value={routineStats.completedToday} valueClassName="text-sm font-semibold text-primary" />
                <Stat label="נותרו היום" value={routineStats.pendingToday} />
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-primary" />
              משימות עבודה
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {isAnyLoading ? (
              <div className="text-sm text-muted-foreground">טוען…</div>
            ) : (
              <>
                <Stat label='סה"כ פעיל' value={workStats.total} />
                <Stat label="בוצעו" value={workStats.completed} valueClassName="text-sm font-semibold text-primary" />
                <Stat label="דחופות" value={workStats.urgent} />
                <Stat label="באיחור" value={workStats.overdue} valueClassName="text-sm font-semibold text-destructive" />
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
