import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { CalendarClock, Loader2, Sparkles, AlertTriangle, Clock, CheckCircle2, Send, Copy, FileText } from 'lucide-react';
import { toast } from 'sonner';
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

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const AiDailyPlanner = () => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [allTasks, setAllTasks] = useState<PlannerTask[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

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

  const buildTaskSummary = (tasks: PlannerTask[]) => {
    return tasks.map(t => {
      let info = `- ${t.title} (${t.source})`;
      if (t.urgent) info += ' [דחוף!]';
      if (t.overdue) info += ' [באיחור!]';
      if (t.scheduled_date) info += ` [תאריך יעד: ${t.scheduled_date}]`;
      if (t.duration_minutes) info += ` [${t.duration_minutes} דק']`;
      return info;
    }).join('\n');
  };

  const generateDailyPlan = async () => {
    setLoading(true);
    setMessages([]);

    try {
      const tasks = await fetchAllOpenTasks();
      setAllTasks(tasks);

      if (tasks.length === 0) {
        setMessages([{ role: 'assistant', content: '🎉 אין משימות פתוחות! אתה מעודכן לגמרי.' }]);
        return;
      }

      const taskSummary = buildTaskSummary(tasks);
      const now = new Date();
      const currentHour = now.getHours().toString().padStart(2, '0');
      const currentMinute = now.getMinutes().toString().padStart(2, '0');

      const { data, error } = await supabase.functions.invoke('task-ai-helper', {
        body: {
          taskDescription: `צור לו"ז יומי מסודר בפורמט טבלה.

השעה הנוכחית: ${currentHour}:${currentMinute}

רשימת המשימות הפתוחות שלי:
${taskSummary}

צור טבלה מסודרת עם העמודות: שעה | משימה | משך | הערות
התחל מהשעה הנוכחית או מעט אחריה.
סדר לפי שיקול דעתך המקצועי - משימות דחופות קודם, הפסקות, ארוחות.
השתמש בפורמט markdown table שאפשר להעתיק לוורד.`,
          taskCategory: 'daily_planning'
        }
      });

      if (error) throw error;

      setMessages([{ role: 'assistant', content: data.suggestion }]);
    } catch (error) {
      console.error(error);
      toast.error('שגיאה ביצירת הלו"ז');
    } finally {
      setLoading(false);
    }
  };

  const sendFeedback = async () => {
    if (!userInput.trim() || loading) return;

    const userMessage = userInput.trim();
    setUserInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const taskSummary = buildTaskSummary(allTasks);
      const conversationHistory = messages.map(m => 
        m.role === 'user' ? `המשתמש: ${m.content}` : `המתכנן: ${m.content}`
      ).join('\n\n');

      const { data, error } = await supabase.functions.invoke('task-ai-helper', {
        body: {
          taskDescription: `המשתמש ביקש תיקונים ללו"ז.

רשימת המשימות הפתוחות:
${taskSummary}

השיחה עד כה:
${conversationHistory}

בקשת המשתמש: ${userMessage}

חשוב מאוד:
- אם המשתמש אומר "19 בערב" או "19:00" - זו השעה 19:00 בדיוק!
- עדכן את הלו"ז בפורמט טבלה מסודרת (markdown table)
- אם מבקש להוסיף פעילות - הוסף אותה בזמן מתאים
- אם נותן שעה נוכחית - התחל מאותה שעה
- אם מבקש להסיר משימות מסוג מסוים - הסר אותן

תן לו"ז מעודכן מלא בטבלה.`,
          taskCategory: 'daily_planning_feedback'
        }
      });

      if (error) throw error;

      setMessages(prev => [...prev, { role: 'assistant', content: data.suggestion }]);
    } catch (error) {
      console.error(error);
      toast.error('שגיאה בעדכון הלו"ז');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendFeedback();
    }
  };

  const urgentCount = allTasks.filter(t => t.urgent).length;
  const overdueCount = allTasks.filter(t => t.overdue).length;

  const copyToClipboard = () => {
    const lastAssistantMessage = messages.filter(m => m.role === 'assistant').pop();
    if (lastAssistantMessage) {
      navigator.clipboard.writeText(lastAssistantMessage.content);
      toast.success('הלו"ז הועתק! אפשר להדביק בוורד');
    }
  };

  const exportToWord = () => {
    const lastAssistantMessage = messages.filter(m => m.role === 'assistant').pop();
    if (!lastAssistantMessage) return;

    // Convert markdown table to HTML table for better Word compatibility
    let content = lastAssistantMessage.content;
    
    // Create HTML document with RTL support
    const html = `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; direction: rtl; }
    table { border-collapse: collapse; width: 100%; margin: 20px 0; }
    th, td { border: 1px solid #333; padding: 8px 12px; text-align: right; }
    th { background-color: #f0f0f0; font-weight: bold; }
    h1 { text-align: center; }
  </style>
</head>
<body>
  <h1>לו"ז יומי - ${new Date().toLocaleDateString('he-IL')}</h1>
  <pre style="white-space: pre-wrap; font-family: Arial;">${content}</pre>
</body>
</html>`;

    const blob = new Blob([html], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `לוז-יומי-${new Date().toLocaleDateString('he-IL')}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('הקובץ הורד! אפשר לפתוח בוורד');
  };

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
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            תכנון יומי חכם
          </DialogTitle>
        </DialogHeader>

        {/* Stats */}
        {allTasks.length > 0 && (
          <div className="flex gap-4 flex-wrap">
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

        {/* Chat Messages */}
        <ScrollArea className="flex-1 max-h-[50vh] pr-2" ref={scrollRef}>
          <div className="space-y-4">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-lg ${
                  msg.role === 'user'
                    ? 'bg-primary/10 mr-8'
                    : 'bg-muted/50 ml-0'
                }`}
              >
                <div className="whitespace-pre-wrap text-sm leading-relaxed">
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex items-center justify-center py-4 gap-2">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground">מעבד...</span>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input Area */}
        {messages.length > 0 && (
          <div className="flex gap-2 pt-2 border-t">
            <Input
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="בקש תיקונים... (למשל: הוסף נקיון הבית, עכשיו 14:00 בלי משימות עבודה)"
              disabled={loading}
              className="flex-1"
            />
            <Button onClick={sendFeedback} disabled={loading || !userInput.trim()} size="icon">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex justify-center gap-2 pt-2 flex-wrap">
          <Button variant="outline" onClick={generateDailyPlan} disabled={loading} size="sm">
            <Sparkles className="h-4 w-4 ml-1" />
            צור לו"ז חדש
          </Button>
          {messages.some(m => m.role === 'assistant') && (
            <>
              <Button variant="outline" onClick={copyToClipboard} size="sm">
                <Copy className="h-4 w-4 ml-1" />
                העתק
              </Button>
              <Button variant="outline" onClick={exportToWord} size="sm">
                <FileText className="h-4 w-4 ml-1" />
                הורד לוורד
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AiDailyPlanner;
