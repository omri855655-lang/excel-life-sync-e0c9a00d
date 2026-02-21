import { useState, useEffect, useCallback, useRef } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Play, Pause, RotateCcw, Headphones, Timer, Map, BarChart3, Plus, Trash2 } from "lucide-react";

// Frequency types
const FREQUENCIES = [
  { id: "deep", name: "Deep Focus", hz: 40, color: "from-violet-500 to-violet-700", desc: "גלי גמא — ריכוז עמוק" },
  { id: "creative", name: "Creative", hz: 10, color: "from-cyan-500 to-cyan-700", desc: "גלי אלפא — יצירתיות" },
  { id: "calm", name: "Calm", hz: 6, color: "from-emerald-500 to-emerald-700", desc: "גלי תטא — רוגע" },
];

// Timer presets
const TIMER_PRESETS = [
  { id: "pomodoro", name: "Pomodoro", work: 25, break: 5 },
  { id: "sprint", name: "Sprint", work: 50, break: 10 },
];

// Roadmap steps
const ROADMAP_STEPS = [
  { id: 1, title: "ניקוי רעשים", items: ["כבה התראות בטלפון", "סגור טאבים מיותרים", "הפעל 'נא לא להפריע'", "נקה שולחן עבודה"] },
  { id: 2, title: "סידור המוח", items: ["רשום את כל המשימות", "הפרד עבודה עמוקה מרדודה", "תעדף לפי חשיבות", "הגדר 3 משימות ליום", "בחר משימה להתחלה"] },
  { id: 3, title: "טריגר פוקוס", items: ["הפעל תדרים", "הגדר טיימר", "לחץ Start"] },
  { id: 4, title: "שימור אנרגיה", items: ["הפסקה בין סשנים", "עקוב אחרי סשנים", "לא יותר מ-4 רצופים", "סיכום יומי"] },
];

interface Task {
  id: string;
  text: string;
  done: boolean;
  priority: "high" | "medium" | "low";
}

interface SessionLog {
  id: string;
  type: string;
  duration: number;
  frequency: string;
  timestamp: Date;
}

const DeeplyDashboard = () => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorsRef = useRef<OscillatorNode[]>([]);

  // Frequency player
  const [activeFrequency, setActiveFrequency] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Timer
  const [timerPreset, setTimerPreset] = useState(TIMER_PRESETS[0]);
  const [timeLeft, setTimeLeft] = useState(TIMER_PRESETS[0].work * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Tasks
  const [workMode, setWorkMode] = useState<"deep" | "shallow">("deep");
  const [deepTasks, setDeepTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem("deeply-deep-tasks");
    return saved ? JSON.parse(saved) : [];
  });
  const [shallowTasks, setShallowTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem("deeply-shallow-tasks");
    return saved ? JSON.parse(saved) : [];
  });
  const [newTask, setNewTask] = useState("");

  // Roadmap checklist
  const [roadmapChecks, setRoadmapChecks] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem("deeply-roadmap");
    return saved ? JSON.parse(saved) : {};
  });
  const [activeRoadmapStep, setActiveRoadmapStep] = useState<number | null>(null);

  // Session logs
  const [sessions, setSessions] = useState<SessionLog[]>(() => {
    const saved = localStorage.getItem("deeply-sessions");
    return saved ? JSON.parse(saved) : [];
  });

  // Persist data
  useEffect(() => { localStorage.setItem("deeply-deep-tasks", JSON.stringify(deepTasks)); }, [deepTasks]);
  useEffect(() => { localStorage.setItem("deeply-shallow-tasks", JSON.stringify(shallowTasks)); }, [shallowTasks]);
  useEffect(() => { localStorage.setItem("deeply-roadmap", JSON.stringify(roadmapChecks)); }, [roadmapChecks]);
  useEffect(() => { localStorage.setItem("deeply-sessions", JSON.stringify(sessions)); }, [sessions]);

  // Timer logic
  useEffect(() => {
    if (isTimerRunning && timeLeft > 0) {
      timerRef.current = setTimeout(() => setTimeLeft(t => t - 1), 1000);
    } else if (isTimerRunning && timeLeft === 0) {
      // Session complete
      if (!isBreak) {
        const log: SessionLog = {
          id: Date.now().toString(),
          type: timerPreset.id,
          duration: timerPreset.work,
          frequency: activeFrequency || "none",
          timestamp: new Date(),
        };
        setSessions(prev => [log, ...prev]);
        setIsBreak(true);
        setTimeLeft(timerPreset.break * 60);
      } else {
        setIsBreak(false);
        setTimeLeft(timerPreset.work * 60);
        setIsTimerRunning(false);
      }
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [isTimerRunning, timeLeft, isBreak, timerPreset, activeFrequency]);

  // Audio: binaural beat
  const startFrequency = useCallback((freqId: string) => {
    stopFrequency();
    const freq = FREQUENCIES.find(f => f.id === freqId);
    if (!freq) return;
    const ctx = new AudioContext();
    audioContextRef.current = ctx;
    const baseFreq = 200;
    const left = ctx.createOscillator();
    const right = ctx.createOscillator();
    left.frequency.value = baseFreq;
    right.frequency.value = baseFreq + freq.hz;
    left.type = "sine";
    right.type = "sine";
    const merger = ctx.createChannelMerger(2);
    const gainL = ctx.createGain();
    const gainR = ctx.createGain();
    gainL.gain.value = 0.15;
    gainR.gain.value = 0.15;
    left.connect(gainL);
    right.connect(gainR);
    gainL.connect(merger, 0, 0);
    gainR.connect(merger, 0, 1);
    merger.connect(ctx.destination);
    left.start();
    right.start();
    oscillatorsRef.current = [left, right];
    setActiveFrequency(freqId);
    setIsPlaying(true);
  }, []);

  const stopFrequency = useCallback(() => {
    oscillatorsRef.current.forEach(o => { try { o.stop(); } catch {} });
    oscillatorsRef.current = [];
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  useEffect(() => { return () => { stopFrequency(); }; }, [stopFrequency]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  const currentTasks = workMode === "deep" ? deepTasks : shallowTasks;
  const setCurrentTasks = workMode === "deep" ? setDeepTasks : setShallowTasks;

  const addTask = () => {
    if (!newTask.trim()) return;
    setCurrentTasks(prev => [...prev, { id: Date.now().toString(), text: newTask.trim(), done: false, priority: "medium" }]);
    setNewTask("");
  };

  const toggleTask = (id: string) => {
    setCurrentTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };

  const deleteTask = (id: string) => {
    setCurrentTasks(prev => prev.filter(t => t.id !== id));
  };

  // Stats
  const today = new Date().toDateString();
  const todaySessions = sessions.filter(s => new Date(s.timestamp).toDateString() === today);
  const todayMinutes = todaySessions.reduce((acc, s) => acc + s.duration, 0);
  const todayCompleted = currentTasks.filter(t => t.done).length;

  return (
    <div className="h-full bg-[#0a0a0f] text-[#e8e8ed] overflow-auto" dir="rtl">
      <div className="max-w-7xl mx-auto p-4 grid lg:grid-cols-3 gap-4">
        {/* Left column: Session area */}
        <div className="lg:col-span-1 space-y-4">
          {/* Frequency Player */}
          <Card className="bg-white/5 border-white/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2 text-[#e8e8ed]">
                <Headphones className="h-4 w-4 text-violet-400" />
                נגן תדרים
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {FREQUENCIES.map(f => (
                <button
                  key={f.id}
                  onClick={() => activeFrequency === f.id && isPlaying ? stopFrequency() : startFrequency(f.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                    activeFrequency === f.id && isPlaying
                      ? "bg-violet-500/20 border border-violet-500/30"
                      : "bg-white/5 border border-transparent hover:bg-white/10"
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${f.color} flex items-center justify-center`}>
                    {activeFrequency === f.id && isPlaying ? <Pause className="h-4 w-4 text-white" /> : <Play className="h-4 w-4 text-white" />}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-[#e8e8ed]">{f.name}</p>
                    <p className="text-xs text-[#e8e8ed]/40">{f.desc}</p>
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>

          {/* Timer */}
          <Card className="bg-white/5 border-white/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2 text-[#e8e8ed]">
                <Timer className="h-4 w-4 text-cyan-400" />
                טיימר
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-4">
                {TIMER_PRESETS.map(p => (
                  <button
                    key={p.id}
                    onClick={() => { setTimerPreset(p); setTimeLeft(p.work * 60); setIsTimerRunning(false); setIsBreak(false); }}
                    className={`flex-1 py-2 rounded-lg text-sm transition-all ${
                      timerPreset.id === p.id ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30" : "bg-white/5 text-[#e8e8ed]/60"
                    }`}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
              <div className="text-center">
                <div className="text-5xl font-mono font-bold mb-1 tabular-nums">
                  {formatTime(timeLeft)}
                </div>
                <p className="text-xs text-[#e8e8ed]/40 mb-4">
                  {isBreak ? "הפסקה" : timerPreset.id === "pomodoro" ? "סשן עבודה" : "ספרינט"}
                </p>
                <div className="flex gap-2 justify-center">
                  <Button
                    onClick={() => setIsTimerRunning(!isTimerRunning)}
                    className={`rounded-full px-6 ${isTimerRunning ? "bg-red-500/20 text-red-300 hover:bg-red-500/30" : "bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30"}`}
                    variant="ghost"
                  >
                    {isTimerRunning ? <><Pause className="h-4 w-4 ml-1" /> עצור</> : <><Play className="h-4 w-4 ml-1" /> התחל</>}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => { setIsTimerRunning(false); setIsBreak(false); setTimeLeft(timerPreset.work * 60); }}
                    className="text-[#e8e8ed]/40 hover:text-[#e8e8ed]"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats */}
          <Card className="bg-white/5 border-white/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2 text-[#e8e8ed]">
                <BarChart3 className="h-4 w-4 text-emerald-400" />
                מדדים להיום
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-white/5 rounded-xl p-3">
                  <p className="text-2xl font-bold text-violet-300">{todayMinutes}</p>
                  <p className="text-xs text-[#e8e8ed]/40">דקות עבודה</p>
                </div>
                <div className="bg-white/5 rounded-xl p-3">
                  <p className="text-2xl font-bold text-cyan-300">{todaySessions.length}</p>
                  <p className="text-xs text-[#e8e8ed]/40">סשנים</p>
                </div>
                <div className="bg-white/5 rounded-xl p-3">
                  <p className="text-2xl font-bold text-emerald-300">{todayCompleted}</p>
                  <p className="text-xs text-[#e8e8ed]/40">משימות</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Center: Tasks */}
        <div className="lg:col-span-1">
          <Card className="bg-white/5 border-white/5 h-full">
            <CardHeader className="pb-3">
              <Tabs value={workMode} onValueChange={(v) => setWorkMode(v as "deep" | "shallow")}>
                <TabsList className="bg-white/5 w-full">
                  <TabsTrigger value="deep" className="flex-1 data-[state=active]:bg-violet-500/20 data-[state=active]:text-violet-300">עבודה עמוקה</TabsTrigger>
                  <TabsTrigger value="shallow" className="flex-1 data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-300">עבודה רדודה</TabsTrigger>
                </TabsList>
              </Tabs>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <input
                  value={newTask}
                  onChange={e => setNewTask(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && addTask()}
                  placeholder="משימה חדשה..."
                  className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-[#e8e8ed] placeholder:text-[#e8e8ed]/30 focus:outline-none focus:ring-1 focus:ring-violet-500/50"
                />
                <Button size="icon" variant="ghost" onClick={addTask} className="text-violet-400 hover:text-violet-300">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-1 max-h-[400px] overflow-y-auto">
                {currentTasks.length === 0 && (
                  <p className="text-center text-[#e8e8ed]/20 text-sm py-8">אין משימות עדיין</p>
                )}
                {currentTasks.map(task => (
                  <div key={task.id} className={`flex items-center gap-3 p-3 rounded-lg transition-all ${task.done ? "bg-emerald-500/5" : "bg-white/5"}`}>
                    <Checkbox
                      checked={task.done}
                      onCheckedChange={() => toggleTask(task.id)}
                      className="border-white/20 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
                    />
                    <span className={`flex-1 text-sm ${task.done ? "line-through text-[#e8e8ed]/30" : "text-[#e8e8ed]/80"}`}>
                      {task.text}
                    </span>
                    <Button variant="ghost" size="icon" onClick={() => deleteTask(task.id)} className="h-7 w-7 text-[#e8e8ed]/20 hover:text-red-400">
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Roadmap */}
        <div className="lg:col-span-1">
          <Card className="bg-white/5 border-white/5 h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2 text-[#e8e8ed]">
                <Map className="h-4 w-4 text-amber-400" />
                Roadmap — 4 שלבים
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {ROADMAP_STEPS.map(step => (
                <div key={step.id}>
                  <button
                    onClick={() => setActiveRoadmapStep(activeRoadmapStep === step.id ? null : step.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-right ${
                      activeRoadmapStep === step.id ? "bg-amber-500/10 border border-amber-500/20" : "bg-white/5 hover:bg-white/10"
                    }`}
                  >
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {step.id}
                    </div>
                    <span className="text-sm font-medium text-[#e8e8ed]">{step.title}</span>
                    <span className="mr-auto text-xs text-[#e8e8ed]/30">
                      {step.items.filter((_, i) => roadmapChecks[`${step.id}-${i}`]).length}/{step.items.length}
                    </span>
                  </button>
                  {activeRoadmapStep === step.id && (
                    <div className="mt-2 pr-10 space-y-1 pb-2">
                      {step.items.map((item, i) => {
                        const key = `${step.id}-${i}`;
                        return (
                          <label key={key} className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/5 cursor-pointer">
                            <Checkbox
                              checked={!!roadmapChecks[key]}
                              onCheckedChange={() => setRoadmapChecks(prev => ({ ...prev, [key]: !prev[key] }))}
                              className="border-white/20 data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500"
                            />
                            <span className={`text-sm ${roadmapChecks[key] ? "line-through text-[#e8e8ed]/30" : "text-[#e8e8ed]/70"}`}>
                              {item}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DeeplyDashboard;
