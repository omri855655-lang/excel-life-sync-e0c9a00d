import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Save, Sparkles, Eye, UserCheck, Loader2, Send } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ProjectTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: {
    id: string;
    project_id: string;
    title: string;
    description?: string | null;
    instructions?: string | null;
    status?: string | null;
    urgent?: boolean;
    due_date?: string | null;
    notes?: string | null;
    completed?: boolean;
    viewed_by?: any;
    started_by_name?: string | null;
  } | null;
  members: { id: string; invited_email: string; invited_display_name: string | null }[];
  onUpdate: (taskId: string, updates: Record<string, any>) => void;
}

const TASK_STATUSES = ['לא התחיל', 'בטיפול', 'בהמתנה', 'בוצע'] as const;

const ProjectTaskDialog = ({ open, onOpenChange, task, members, onUpdate }: ProjectTaskDialogProps) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('details');
  const [description, setDescription] = useState('');
  const [instructions, setInstructions] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState('לא התחיל');
  const [urgent, setUrgent] = useState(false);
  const [dueDate, setDueDate] = useState('');
  const [saving, setSaving] = useState(false);

  // AI chat
  const [aiMessages, setAiMessages] = useState<{ role: string; content: string }[]>([]);
  const [aiInput, setAiInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiHistoryLoaded, setAiHistoryLoaded] = useState(false);

  useEffect(() => {
    if (task && open) {
      setDescription(task.description || '');
      setInstructions(task.instructions || '');
      setNotes(task.notes || '');
      setStatus(task.status || 'לא התחיל');
      setUrgent(task.urgent || false);
      setDueDate(task.due_date || '');
      setAiHistoryLoaded(false);
      setAiMessages([]);

      // Mark as viewed
      markViewed();
      // Load AI history
      loadAiHistory();
    }
  }, [task?.id, open]);

  const markViewed = async () => {
    if (!task || !user) return;
    const currentViewed = Array.isArray(task.viewed_by) ? task.viewed_by : [];
    const userName = user.email?.split('@')[0] || 'משתמש';
    const entry = { email: user.email, name: userName, at: new Date().toISOString() };
    const filtered = currentViewed.filter((v: any) => v.email !== user.email);
    const newViewed = [...filtered, entry];
    await supabase.from('project_tasks').update({ viewed_by: newViewed } as any).eq('id', task.id);
    onUpdate(task.id, { viewed_by: newViewed });
  };

  const loadAiHistory = async () => {
    if (!task || !user) return;
    const { data } = await supabase
      .from('project_task_ai_history')
      .select('messages')
      .eq('project_task_id', task.id)
      .eq('user_id', user.id)
      .maybeSingle();
    if (data?.messages) {
      setAiMessages(data.messages as any[]);
    }
    setAiHistoryLoaded(true);
  };

  const saveAiHistory = async (msgs: any[]) => {
    if (!task || !user) return;
    await supabase.from('project_task_ai_history').upsert({
      project_task_id: task.id,
      user_id: user.id,
      messages: msgs,
    }, { onConflict: 'project_task_id,user_id' } as any);
  };

  const saveDetails = async () => {
    if (!task) return;
    setSaving(true);
    const updates: Record<string, any> = {
      description: description || null,
      instructions: instructions || null,
      notes: notes || null,
      status,
      urgent,
      due_date: dueDate || null,
      completed: status === 'בוצע',
    };
    const { error } = await supabase.from('project_tasks').update(updates).eq('id', task.id);
    if (error) { toast.error('שגיאה בשמירה'); }
    else {
      toast.success('המשימה עודכנה');
      onUpdate(task.id, updates);
    }
    setSaving(false);
  };

  const markStarted = async () => {
    if (!task || !user) return;
    const name = user.email?.split('@')[0] || 'משתמש';
    const updates = { started_by_name: name, status: 'בטיפול', completed: false };
    await supabase.from('project_tasks').update(updates).eq('id', task.id);
    setStatus('בטיפול');
    onUpdate(task.id, updates);
    toast.success(`${name} התחיל לטפל במשימה`);
  };

  const sendAiMessage = async () => {
    if (!aiInput.trim() || !task) return;
    const userMsg = { role: 'user', content: aiInput };
    const next = [...aiMessages, userMsg];
    setAiMessages(next);
    setAiInput('');
    setAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('task-ai-helper', {
        body: {
          taskDescription: aiInput,
          conversationHistory: next.slice(-20),
          customPrompt: `אתה יועץ ניהול פרויקטים. המשימה: "${task.title}". ${task.description ? `תיאור: ${task.description}` : ''} ${task.instructions ? `הנחיות: ${task.instructions}` : ''} סטטוס: ${task.status || 'לא התחיל'}. עזור למשתמש עם: איך לגשת למשימה, מה עדיף לעשות קודם, מה הסיכונים, איך לחלק לצעדים. דבר בעברית.`,
        },
      });
      if (error) throw error;
      const assistantMsg = { role: 'assistant', content: data?.suggestion || 'אין תשובה' };
      const updated = [...next, assistantMsg];
      setAiMessages(updated);
      saveAiHistory(updated);
    } catch {
      const errMsg = { role: 'assistant', content: 'שגיאה בתקשורת' };
      setAiMessages(prev => [...prev, errMsg]);
    }
    setAiLoading(false);
  };

  const viewedList = Array.isArray(task?.viewed_by) ? task.viewed_by : [];

  const quickAiPrompts = [
    'איך לגשת למשימה הזאת?',
    'מה עדיף לעשות קודם?',
    'מה הסיכונים?',
    'איך לחלק לצעדים?',
  ];

  if (!task) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-lg">{task.title}</DialogTitle>
          <div className="flex items-center gap-2 flex-wrap mt-1">
            <Badge variant={status === 'בוצע' ? 'default' : 'outline'} className="text-xs">{status}</Badge>
            {urgent && <Badge variant="destructive" className="text-xs">דחוף</Badge>}
            {task.started_by_name && (
              <Badge variant="secondary" className="text-xs gap-1">
                <UserCheck className="h-3 w-3" />
                התחיל: {task.started_by_name}
              </Badge>
            )}
            {viewedList.length > 0 && (
              <Badge variant="outline" className="text-xs gap-1">
                <Eye className="h-3 w-3" />
                נצפה ע״י {viewedList.length}
              </Badge>
            )}
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 min-h-0 flex flex-col">
          <TabsList className="w-full shrink-0">
            <TabsTrigger value="details" className="flex-1">פרטים</TabsTrigger>
            <TabsTrigger value="ai" className="flex-1 gap-1"><Sparkles className="h-3 w-3" />AI למשימה</TabsTrigger>
            <TabsTrigger value="activity" className="flex-1">פעילות</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="flex-1 min-h-0 overflow-auto space-y-3 p-1">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">סטטוס</label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TASK_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">תאריך יעד</label>
                <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="h-8 text-xs" />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Switch checked={urgent} onCheckedChange={setUrgent} />
              <label className="text-xs">דחוף</label>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground">תיאור מלא</label>
              <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="תיאור מפורט של המשימה..." className="min-h-[80px] text-sm" />
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground">הנחיות ביצוע</label>
              <Textarea value={instructions} onChange={e => setInstructions(e.target.value)} placeholder="מה צריך לעשות, צעד אחר צעד..." className="min-h-[80px] text-sm" />
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground">הערות</label>
              <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="הערות..." className="min-h-[60px] text-sm" />
            </div>

            <div className="flex gap-2 pt-2">
              <Button onClick={saveDetails} disabled={saving} className="gap-1">
                {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                שמור
              </Button>
              {!task.started_by_name && (
                <Button variant="outline" onClick={markStarted} className="gap-1">
                  <UserCheck className="h-3 w-3" />
                  סמן שהתחלתי
                </Button>
              )}
            </div>
          </TabsContent>

          <TabsContent value="ai" className="flex-1 min-h-0 flex flex-col p-1">
            <ScrollArea className="flex-1 min-h-0 border rounded-lg p-3 mb-2">
              {aiMessages.length === 0 ? (
                <div className="text-center py-8 space-y-3">
                  <Sparkles className="h-8 w-8 text-primary mx-auto opacity-50" />
                  <p className="text-sm text-muted-foreground">שאל את ה-AI איך לגשת למשימה</p>
                  <div className="flex flex-wrap gap-1.5 justify-center">
                    {quickAiPrompts.map(p => (
                      <Button key={p} variant="outline" size="sm" className="text-xs h-7" onClick={() => { setAiInput(p); }}>
                        {p}
                      </Button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {aiMessages.map((msg, i) => (
                    <div key={i} className={cn('text-sm rounded-lg p-3', msg.role === 'user' ? 'bg-primary/10 mr-8' : 'bg-muted ml-8')}>
                      <p className="text-[10px] font-medium text-muted-foreground mb-1">{msg.role === 'user' ? 'אתה' : 'AI'}</p>
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  ))}
                  {aiLoading && <div className="text-center"><Loader2 className="h-4 w-4 animate-spin mx-auto text-primary" /></div>}
                </div>
              )}
            </ScrollArea>
            <div className="flex gap-2 shrink-0">
              <Input value={aiInput} onChange={e => setAiInput(e.target.value)} placeholder="שאל על המשימה..." className="flex-1 text-sm" onKeyDown={e => e.key === 'Enter' && sendAiMessage()} />
              <Button size="icon" onClick={sendAiMessage} disabled={aiLoading || !aiInput.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="activity" className="flex-1 min-h-0 overflow-auto p-1 space-y-3">
            <h4 className="text-sm font-semibold">מי ראה את המשימה</h4>
            {viewedList.length === 0 ? (
              <p className="text-sm text-muted-foreground">אף אחד עדיין לא צפה במשימה</p>
            ) : (
              <div className="space-y-1.5">
                {viewedList.map((v: any, i: number) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{v.name || v.email}</span>
                    <span className="text-[10px] text-muted-foreground">{v.at ? new Date(v.at).toLocaleString('he-IL') : ''}</span>
                  </div>
                ))}
              </div>
            )}

            {task.started_by_name && (
              <div className="mt-4">
                <h4 className="text-sm font-semibold">התחיל טיפול</h4>
                <div className="flex items-center gap-2 text-sm mt-1">
                  <UserCheck className="h-3.5 w-3.5 text-primary" />
                  <span>{task.started_by_name}</span>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectTaskDialog;
