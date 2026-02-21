import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Play, Pause, RotateCcw, Timer, Map, BarChart3, Plus, Trash2, BookOpen, ChevronDown, ChevronUp } from "lucide-react";
import { AUDIO_PRESETS, CATEGORIES, GUIDES, type AudioPreset } from "./audioPresets";
import { useAudioEngine } from "./useAudioEngine";

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
}

interface SessionLog {
  id: string;
  type: string;
  duration: number;
  frequency: string;
  timestamp: Date;
}

const COLOR_MAP: Record<string, string> = {
  violet: "from-violet-500 to-violet-700",
  cyan: "from-cyan-500 to-cyan-700",
  emerald: "from-emerald-500 to-emerald-700",
  amber: "from-amber-500 to-amber-700",
  rose: "from-rose-500 to-rose-700",
};

const ACTIVE_COLOR_MAP: Record<string, string> = {
  violet: "bg-violet-500/20 border-violet-500/30",
  cyan: "bg-cyan-500/20 border-cyan-500/30",
  emerald: "bg-emerald-500/20 border-emerald-500/30",
  amber: "bg-amber-500/20 border-amber-500/30",
  rose: "bg-rose-500/20 border-rose-500/30",
};

const DeeplyDashboard = () => {
  const { activePresetId, isPlaying, toggle } = useAudioEngine();

  // Sound category
  const [activeCategory, setActiveCategory] = useState<string>("focus");

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

  // Roadmap
  const [roadmapChecks, setRoadmapChecks] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem("deeply-roadmap");
    return saved ? JSON.parse(saved) : {};
  });
  const [activeRoadmapStep, setActiveRoadmapStep] = useState<number | null>(null);

  // Guides
  const [expandedGuide, setExpandedGuide] = useState<string | null>(null);

  // Sessions
  const [sessions, setSessions] = useState<SessionLog[]>(() => {
    const saved = localStorage.getItem("deeply-sessions");
    return saved ? JSON.parse(saved) : [];
  });

  // Persist
  useEffect(() => { localStorage.setItem("deeply-deep-tasks", JSON.stringify(deepTasks)); }, [deepTasks]);
  useEffect(() => { localStorage.setItem("deeply-shallow-tasks", JSON.stringify(shallowTasks)); }, [shallowTasks]);
  useEffect(() => { localStorage.setItem("deeply-roadmap", JSON.stringify(roadmapChecks)); }, [roadmapChecks]);
  useEffect(() => { localStorage.setItem("deeply-sessions", JSON.stringify(sessions)); }, [sessions]);

  // Timer logic
  useEffect(() => {
    if (isTimerRunning && timeLeft > 0) {
      timerRef.current = setTimeout(() => setTimeLeft(t => t - 1), 1000);
    } else if (isTimerRunning && timeLeft === 0) {
      if (!isBreak) {
        const log: SessionLog = {
          id: Date.now().toString(),
          type: timerPreset.id,
          duration: timerPreset.work,
          frequency: activePresetId || "none",
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
  }, [isTimerRunning, timeLeft, isBreak, timerPreset, activePresetId]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  const currentTasks = workMode === "deep" ? deepTasks : shallowTasks;
  const setCurrentTasks = workMode === "deep" ? setDeepTasks : setShallowTasks;

  const addTask = () => {
    if (!newTask.trim()) return;
    setCurrentTasks(prev => [...prev, { id: Date.now().toString(), text: newTask.trim(), done: false }]);
    setNewTask("");
  };

  const today = new Date().toDateString();
  const todaySessions = sessions.filter(s => new Date(s.timestamp).toDateString() === today);
  const todayMinutes = todaySessions.reduce((acc, s) => acc + s.duration, 0);
  const todayCompleted = currentTasks.filter(t => t.done).length;

  const filteredPresets = AUDIO_PRESETS.filter(p => p.category === activeCategory);
  const activeCat = CATEGORIES.find(c => c.id === activeCategory);

  return (
    <div className="h-full bg-[#0a0a0f] text-[#e8e8ed] overflow-auto" dir="rtl">
      <div className="max-w-7xl mx-auto p-4 space-y-4">

        {/* Top row: Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="bg-white/5 border-white/5">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-violet-300">{todayMinutes}</p>
              <p className="text-xs text-[#e8e8ed]/40">דקות עבודה</p>
            </CardContent>
          </Card>
          <Card className="bg-white/5 border-white/5">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-cyan-300">{todaySessions.length}</p>
              <p className="text-xs text-[#e8e8ed]/40">סשנים</p>
            </CardContent>
          </Card>
          <Card className="bg-white/5 border-white/5">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-emerald-300">{todayCompleted}</p>
              <p className="text-xs text-[#e8e8ed]/40">משימות</p>
            </CardContent>
          </Card>
        </div>

        {/* Sound Player with categories */}
        <Card className="bg-white/5 border-white/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-[#e8e8ed]">
              🎧 נגן תדרים וצלילים
              {activePresetId && isPlaying && (
                <span className="text-xs text-violet-400 animate-pulse mr-auto">● מנגן</span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Category tabs */}
            <div className="flex gap-1.5 flex-wrap">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-full text-xs transition-all ${
                    activeCategory === cat.id
                      ? `${ACTIVE_COLOR_MAP[cat.color]} border`
                      : "bg-white/5 text-[#e8e8ed]/50 hover:bg-white/10"
                  }`}
                >
                  {cat.icon} {cat.name}
                </button>
              ))}
            </div>

            {/* Presets grid */}
            <div className="grid sm:grid-cols-2 gap-2">
              {filteredPresets.map(preset => {
                const isActive = activePresetId === preset.id && isPlaying;
                const catColor = activeCat?.color || "violet";
                return (
                  <button
                    key={preset.id}
                    onClick={() => toggle(preset)}
                    className={`flex items-center gap-3 p-3 rounded-xl transition-all text-right ${
                      isActive
                        ? `${ACTIVE_COLOR_MAP[catColor]} border`
                        : "bg-white/5 border border-transparent hover:bg-white/10"
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${COLOR_MAP[catColor]} flex items-center justify-center flex-shrink-0`}>
                      {isActive ? <Pause className="h-4 w-4 text-white" /> : <Play className="h-4 w-4 text-white" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[#e8e8ed] truncate">{preset.name}</p>
                      <p className="text-xs text-[#e8e8ed]/40 truncate">{preset.nameHe}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Active preset description */}
            {activePresetId && isPlaying && (
              <div className="text-xs text-[#e8e8ed]/50 bg-white/5 rounded-lg p-2 flex items-start gap-2">
                <span>ℹ️</span>
                <span>{AUDIO_PRESETS.find(p => p.id === activePresetId)?.desc}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Main grid: Timer + Tasks + Roadmap/Guides */}
        <div className="grid lg:grid-cols-3 gap-4">
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

          {/* Tasks */}
          <Card className="bg-white/5 border-white/5">
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
              <div className="space-y-1 max-h-[300px] overflow-y-auto">
                {currentTasks.length === 0 && (
                  <p className="text-center text-[#e8e8ed]/20 text-sm py-8">אין משימות עדיין</p>
                )}
                {currentTasks.map(task => (
                  <div key={task.id} className={`flex items-center gap-3 p-3 rounded-lg transition-all ${task.done ? "bg-emerald-500/5" : "bg-white/5"}`}>
                    <Checkbox
                      checked={task.done}
                      onCheckedChange={() => setCurrentTasks(prev => prev.map(t => t.id === task.id ? { ...t, done: !t.done } : t))}
                      className="border-white/20 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
                    />
                    <span className={`flex-1 text-sm ${task.done ? "line-through text-[#e8e8ed]/30" : "text-[#e8e8ed]/80"}`}>
                      {task.text}
                    </span>
                    <Button variant="ghost" size="icon" onClick={() => setCurrentTasks(prev => prev.filter(t => t.id !== task.id))} className="h-7 w-7 text-[#e8e8ed]/20 hover:text-red-400">
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Roadmap */}
          <Card className="bg-white/5 border-white/5">
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

        {/* Guides section */}
        <Card className="bg-white/5 border-white/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-[#e8e8ed]">
              <BookOpen className="h-4 w-4 text-rose-400" />
              מדריכים קצרים
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {GUIDES.map(guide => (
              <div key={guide.id}>
                <button
                  onClick={() => setExpandedGuide(expandedGuide === guide.id ? null : guide.id)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all text-right"
                >
                  <span className="text-lg">{guide.icon}</span>
                  <span className="text-sm font-medium text-[#e8e8ed] flex-1">{guide.title}</span>
                  {expandedGuide === guide.id ? <ChevronUp className="h-4 w-4 text-[#e8e8ed]/30" /> : <ChevronDown className="h-4 w-4 text-[#e8e8ed]/30" />}
                </button>
                {expandedGuide === guide.id && (
                  <div className="p-3 pr-12 text-sm text-[#e8e8ed]/60 leading-relaxed">
                    {guide.content}
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

      </div>
    </div>
  );
};

export default DeeplyDashboard;
