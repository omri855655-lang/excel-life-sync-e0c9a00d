import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CalendarClock, Loader2, Sparkles, AlertTriangle, Clock, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface PlannerTask {
  type: 'task' | 'project_task' | 'course_lesson';
  id: string;
  title: string;
  source: string;
  urgent?: boolean;
  overdue?: boolean;
  scheduled_date?: string;
  duration_minutes?: number;
}

const AiDailyPlanner = () => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<string | null>(null);
  const [allTasks, setAllTasks] = useState<PlannerTask[]>([]);

  const fetchAllOpenTasks = async () => {
    if (!user) return [];

    const tasks: PlannerTask[] = [];

    // Fetch regular tasks (both work and personal)
    const { data: regularTasks } = await supabase
      .from('tasks')
      .select('*')
      .neq('status', 'בוצע')
      .eq('archived', false);

    (regularTasks || []).forEach(task => {
      tasks.push({
        type: 'task',
        id: task.id,
        title: task.description,
        source: task.task_type === 'work' ? 'משימות עבודה' : 'משימות אישיות',
        urgent: task.urgent,
        overdue: task.overdue,
        scheduled_date: task.planned_end,
      });
    });

    // Fetch project tasks
    const { data: projectTasks } = await supabase
      .from('project_tasks')
      .select('*, projects(title)')
      .eq('completed', false)
      .eq('user_id', user.id);

    (projectTasks || []).forEach(task => {
      tasks.push({
        type: 'project_task',
        id: task.id,
        title: task.title,
        source: `פרויקט: ${(task as any).projects?.title || 'לא ידוע'}`,
      });
    });

    // Fetch course lessons
    const { data: courseLessons } = await supabase
      .from('course_lessons')
      .select('*, courses(title)')
      .eq('completed', false)
      .eq('user_id', user.id);

    (courseLessons || []).forEach(lesson => {
      tasks.push({
        type: 'course_lesson',
        id: lesson.id,
        title: lesson.title,
        source: `קורס: ${(lesson as any).courses?.title || 'לא ידוע'}`,
        scheduled_date: lesson.scheduled_date,
        duration_minutes: lesson.duration_minutes,
      });
    });

    return tasks;
  };

  const generateDailyPlan = async () => {
    setLoading(true);
    setPlan(null);

    try {
      const tasks = await fetchAllOpenTasks();
      setAllTasks(tasks);

      if (tasks.length === 0) {
        setPlan('🎉 אין משימות פתוחות! אתה מעודכן לגמרי.');
        return;
      }

      // Prepare task summary for AI
      const taskSummary = tasks.map(t => {
        let info = `- ${t.title} (${t.source})`;
        if (t.urgent) info += ' [דחוף!]';
        if (t.overdue) info += ' [באיחור!]';
        if (t.scheduled_date) info += ` [תאריך יעד: ${t.scheduled_date}]`;
        if (t.duration_minutes) info += ` [${t.duration_minutes} דק']`;
        return info;
      }).join('\n');

      const { data, error } = await supabase.functions.invoke('task-ai-helper', {
        body: {
          taskDescription: `אתה מתכנן יום אישי. בהתבסס על רשימת המשימות הפתוחות הבאה, צור לו"ז יומי מומלץ להיום.

קחה בחשבון:
1. משימות דחופות ובאיחור קודמות
2. חלק את היום לבלוקים של זמן (בוקר, צהריים, אחה"צ, ערב)
3. תן הערכת זמן לכל משימה
4. השאר הפסקות
5. אל תכלול יותר ממה שאפשר לעשות ביום אחד
6. תן טיפים לפרודוקטיביות

רשימת משימות:
${taskSummary}

צור לו"ז יומי מפורט בעברית.`,
          taskCategory: 'daily_planning'
        }
      });

      if (error) throw error;

      setPlan(data.suggestion);
    } catch (error) {
      console.error(error);
      toast.error('שגיאה ביצירת הלו"ז');
    } finally {
      setLoading(false);
    }
  };

  const urgentCount = allTasks.filter(t => t.urgent).length;
  const overdueCount = allTasks.filter(t => t.overdue).length;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          className="fixed bottom-6 left-6 h-14 w-14 rounded-full shadow-lg z-50"
          size="icon"
          onClick={() => {
            if (!open) {
              generateDailyPlan();
            }
          }}
        >
          <CalendarClock className="h-6 w-6" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh]" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            תכנון יומי חכם
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-muted-foreground">מנתח את המשימות ובונה לו"ז...</p>
          </div>
        ) : (
          <ScrollArea className="max-h-[60vh]">
            {/* Stats */}
            {allTasks.length > 0 && (
              <div className="flex gap-4 mb-4 flex-wrap">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                  <span>{allTasks.length} משימות פתוחות</span>
                </div>
                {urgentCount > 0 && (
                  <div className="flex items-center gap-2 text-sm text-orange-600">
                    <AlertTriangle className="h-4 w-4" />
                    <span>{urgentCount} דחופות</span>
                  </div>
                )}
                {overdueCount > 0 && (
                  <div className="flex items-center gap-2 text-sm text-red-600">
                    <Clock className="h-4 w-4" />
                    <span>{overdueCount} באיחור</span>
                  </div>
                )}
              </div>
            )}

            {/* Plan */}
            {plan && (
              <div className="whitespace-pre-wrap text-sm leading-relaxed bg-muted/50 rounded-lg p-4">
                {plan}
              </div>
            )}

            {/* Refresh button */}
            <div className="mt-4 flex justify-center">
              <Button variant="outline" onClick={generateDailyPlan} disabled={loading}>
                <Sparkles className="h-4 w-4 ml-1" />
                צור לו"ז חדש
              </Button>
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AiDailyPlanner;
