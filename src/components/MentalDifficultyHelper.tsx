import { useState, useEffect, useCallback, useRef } from "react";
import { Brain, Loader2, Send, History, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import type { Task } from "@/hooks/useTasks";

interface MentalDifficultyHelperProps {
  task: Task;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface SessionRecord {
  id: string;
  task_description: string;
  difficulty_level: number;
  messages: Message[];
  updated_at: string;
}

const difficultyLabels: Record<number, { label: string; emoji: string; color: string }> = {
  1: { label: "קל לי", emoji: "😊", color: "text-green-600" },
  2: { label: "קצת מאתגר", emoji: "🙂", color: "text-lime-600" },
  3: { label: "מרגיש מתח", emoji: "😐", color: "text-amber-600" },
  4: { label: "קשה לי", emoji: "😰", color: "text-orange-600" },
  5: { label: "מאוד קשה לי", emoji: "😣", color: "text-red-600" },
};

const MentalDifficultyHelper = ({ task, open, onOpenChange }: MentalDifficultyHelperProps) => {
  const { user } = useAuth();
  const [difficulty, setDifficulty] = useState(3);
  const [userInput, setUserInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [pastSessions, setPastSessions] = useState<SessionRecord[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  const currentDifficulty = difficultyLabels[difficulty];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    if (open && user && task.id) {
      loadExistingSession();
      loadAllSessions();
    }
  }, [open, user, task.id]);

  const loadExistingSession = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("mental_coaching_sessions")
      .select("*")
      .eq("user_id", user.id)
      .eq("task_id", task.id)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data) {
      const savedMessages = (data.messages as unknown as Message[]) || [];
      if (savedMessages.length > 0) {
        setMessages(savedMessages);
        setDifficulty(data.difficulty_level);
        setSessionId(data.id);
        setStarted(true);
      }
    }
  };

  const loadAllSessions = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("mental_coaching_sessions")
      .select("id, task_description, difficulty_level, messages, updated_at")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(20);

    if (data) {
      setPastSessions(data.map(d => ({
        ...d,
        messages: (d.messages as unknown as Message[]) || [],
      })));
    }
  };

  const loadSession = (session: SessionRecord) => {
    setMessages(session.messages);
    setDifficulty(session.difficulty_level);
    setSessionId(session.id);
    setStarted(true);
  };

  const saveSession = useCallback(async (msgs: Message[], diffLevel: number) => {
    if (!user) return;
    
    if (sessionId) {
      await supabase
        .from("mental_coaching_sessions")
        .update({
          messages: msgs as unknown as any,
          difficulty_level: diffLevel,
          updated_at: new Date().toISOString(),
        })
        .eq("id", sessionId);
    } else {
      const { data } = await supabase
        .from("mental_coaching_sessions")
        .insert({
          user_id: user.id,
          task_id: task.id,
          task_description: task.description,
          difficulty_level: diffLevel,
          messages: msgs as unknown as any,
        })
        .select("id")
        .single();
      if (data) setSessionId(data.id);
    }
  }, [user, sessionId, task.id, task.description]);

  const handleStart = async () => {
    setStarted(true);
    setLoading(true);

    const initialMessage = `אני מרגיש קושי מנטלי ברמה ${difficulty} מתוך 5 (${currentDifficulty.label}) לגשת למשימה הזו: "${task.description}".
${userInput ? `הסיבה שזה קשה לי: ${userInput}` : "אני לא בטוח למה זה קשה לי."}`;

    const userMsg: Message = { role: "user", content: initialMessage };
    setMessages([userMsg]);

    try {
      const { data, error } = await supabase.functions.invoke("task-ai-helper", {
        body: {
          taskDescription: initialMessage,
          taskCategory: "mental_coaching",
        },
      });

      if (error) throw error;

      const assistantMsg: Message = { role: "assistant", content: data.suggestion || "אני כאן בשבילך. ספר לי עוד." };
      const allMsgs = [userMsg, assistantMsg];
      setMessages(allMsgs);
      saveSession(allMsgs, difficulty);
    } catch (error: any) {
      console.error("AI error:", error);
      toast.error("שגיאה בקבלת עזרה");
    } finally {
      setLoading(false);
    }
  };

  const handleSendFollowUp = async () => {
    if (!userInput.trim() || loading) return;

    const userMsg: Message = { role: "user", content: userInput };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setUserInput("");
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("task-ai-helper", {
        body: {
          taskDescription: userInput,
          taskCategory: "mental_coaching",
          conversationHistory: updatedMessages,
        },
      });

      if (error) throw error;

      const assistantMsg: Message = { role: "assistant", content: data.suggestion || "אני כאן בשבילך." };
      const allMsgs = [...updatedMessages, assistantMsg];
      setMessages(allMsgs);
      saveSession(allMsgs, difficulty);
    } catch (error: any) {
      console.error("AI error:", error);
      toast.error("שגיאה בקבלת עזרה");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      setDifficulty(3);
      setUserInput("");
      setMessages([]);
      setStarted(false);
      setLoading(false);
      setSessionId(null);
    }
    onOpenChange(isOpen);
  };

  const handleNewSession = () => {
    setSessionId(null);
    setMessages([]);
    setStarted(false);
    setUserInput("");
    setDifficulty(3);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[80vh] flex flex-col" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-500" />
            עזרה מנטלית למשימה
            <div className="mr-auto flex items-center gap-1">
              {started && (
                <Button variant="ghost" size="sm" onClick={handleNewSession} className="text-xs">
                  שיחה חדשה
                </Button>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-xs gap-1">
                    <History className="h-3.5 w-3.5" />
                    היסטוריה
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="max-h-[300px] overflow-auto w-[280px]">
                  {pastSessions.length === 0 ? (
                    <DropdownMenuItem disabled>אין שיחות קודמות</DropdownMenuItem>
                  ) : (
                    pastSessions.map((session) => (
                      <DropdownMenuItem
                        key={session.id}
                        onClick={() => loadSession(session)}
                        className="flex flex-col items-start gap-0.5 cursor-pointer"
                      >
                        <span className="text-xs font-medium line-clamp-1">{session.task_description}</span>
                        <span className="text-[10px] text-muted-foreground">
                          {format(new Date(session.updated_at), "dd/MM/yyyy HH:mm", { locale: he })} • רמה {session.difficulty_level}/5 • {session.messages.length} הודעות
                        </span>
                      </DropdownMenuItem>
                    ))
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="bg-muted p-3 rounded-lg flex-shrink-0">
          <p className="text-sm font-medium">משימה:</p>
          <p className="text-sm text-muted-foreground">{task.description || "(ללא תיאור)"}</p>
        </div>

        {!started ? (
          <div className="space-y-6">
            <div className="space-y-3">
              <Label className="text-sm font-medium">כמה קשה לך מנטלית לגשת למשימה הזו?</Label>
              <div className="px-2">
                <Slider
                  value={[difficulty]}
                  onValueChange={(v) => setDifficulty(v[0])}
                  min={1}
                  max={5}
                  step={1}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground px-1">
                <span>קל</span>
                <span>קשה מאוד</span>
              </div>
              <div className="text-center">
                <span className={cn("text-2xl")}>{currentDifficulty.emoji}</span>
                <p className={cn("text-sm font-medium mt-1", currentDifficulty.color)}>
                  {difficulty}/5 - {currentDifficulty.label}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">למה זה קשה לך? (אופציונלי)</Label>
              <Textarea
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="למשל: אני מפחד להתקשר לאנשים, מרגיש מוצף, לא יודע מאיפה להתחיל..."
                className="min-h-[80px] resize-none"
                dir="rtl"
              />
            </div>

            <Button onClick={handleStart} className="w-full gap-2">
              <Brain className="h-4 w-4" />
              קבל עזרה מנטלית
            </Button>
          </div>
        ) : (
          <div className="flex flex-col flex-1 min-h-0 gap-3">
            <div className="flex-1 overflow-y-auto h-[350px] border rounded-lg">
              <div className="space-y-3 p-3">
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={cn(
                      "p-3 rounded-lg text-sm whitespace-pre-wrap",
                      msg.role === "user"
                        ? "bg-primary/10 mr-8"
                        : "bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 ml-8"
                    )}
                  >
                    {msg.role === "assistant" && (
                      <div className="flex items-center gap-1 mb-2 text-purple-600 dark:text-purple-400 text-xs font-medium">
                        <Brain className="h-3 w-3" />
                        מאמן מנטלי
                      </div>
                    )}
                    {msg.content}
                  </div>
                ))}
                {loading && (
                  <div className="flex items-center gap-2 p-3 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">חושב...</span>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>
            </div>

            <div className="flex gap-2 flex-shrink-0">
              <Textarea
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="ספר לי עוד, או בקש דוגמא ממחקר/ספר נוסף..."
                className="min-h-[40px] max-h-[80px] resize-none flex-1"
                dir="rtl"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendFollowUp();
                  }
                }}
              />
              <Button
                size="icon"
                onClick={handleSendFollowUp}
                disabled={!userInput.trim() || loading}
                className="flex-shrink-0"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default MentalDifficultyHelper;