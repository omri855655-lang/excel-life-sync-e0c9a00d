import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Timer, StopCircle, Trophy, TrendingUp, Calendar, Flame } from "lucide-react";

interface SessionLog {
  id: string;
  type: string;
  duration: number;
  frequency: string;
  timestamp: Date | string;
}

const SessionHistory = () => {
  const sessions: SessionLog[] = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("zoneflow-sessions") || localStorage.getItem("deeply-sessions") || "[]");
    } catch {
      return [];
    }
  }, []);

  // Group sessions by date (last 30 days)
  const chartData = useMemo(() => {
    const days: Record<string, { pomodoro: number; stopwatch: number; date: string }> = {};
    const now = new Date();
    
    // Initialize last 14 days
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split("T")[0];
      const dayLabel = `${d.getDate()}/${d.getMonth() + 1}`;
      days[key] = { pomodoro: 0, stopwatch: 0, date: dayLabel };
    }

    sessions.forEach(s => {
      const d = new Date(s.timestamp).toISOString().split("T")[0];
      if (days[d]) {
        if (s.type === "stopwatch") {
          days[d].stopwatch += s.duration;
        } else {
          days[d].pomodoro += s.duration;
        }
      }
    });

    return Object.values(days);
  }, [sessions]);

  // Records
  const records = useMemo(() => {
    const pomodoroSessions = sessions.filter(s => s.type !== "stopwatch");
    const stopwatchSessions = sessions.filter(s => s.type === "stopwatch");

    // Longest stopwatch session
    const longestStopwatch = stopwatchSessions.length > 0
      ? stopwatchSessions.reduce((max, s) => s.duration > max.duration ? s : max, stopwatchSessions[0])
      : null;

    // Most pomodoro sessions in a day
    const pomByDay: Record<string, number> = {};
    pomodoroSessions.forEach(s => {
      const d = new Date(s.timestamp).toISOString().split("T")[0];
      pomByDay[d] = (pomByDay[d] || 0) + 1;
    });
    const bestPomDay = Object.entries(pomByDay).sort((a, b) => b[1] - a[1])[0];

    // Most total minutes in a day
    const minByDay: Record<string, number> = {};
    sessions.forEach(s => {
      const d = new Date(s.timestamp).toISOString().split("T")[0];
      minByDay[d] = (minByDay[d] || 0) + s.duration;
    });
    const bestMinDay = Object.entries(minByDay).sort((a, b) => b[1] - a[1])[0];

    // Total stats
    const totalPomodoro = pomodoroSessions.length;
    const totalStopwatch = stopwatchSessions.length;
    const totalMinutes = sessions.reduce((acc, s) => acc + s.duration, 0);

    return { longestStopwatch, bestPomDay, bestMinDay, totalPomodoro, totalStopwatch, totalMinutes };
  }, [sessions]);

  // Recent sessions (last 20)
  const recentSessions = useMemo(() => {
    return sessions.slice(0, 20);
  }, [sessions]);

  const formatDuration = (min: number) => {
    if (min >= 60) {
      const h = Math.floor(min / 60);
      const m = min % 60;
      return m > 0 ? `${h} שעות ו-${m} דקות` : `${h} שעות`;
    }
    return `${min} דקות`;
  };

  const formatDateHebrew = (ts: Date | string) => {
    const d = new Date(ts);
    const days = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];
    return `יום ${days[d.getDay()]}, ${d.getDate()}/${d.getMonth() + 1} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  };

  if (sessions.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          <Timer className="h-8 w-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm">אין עדיין סשנים ב-ZoneFlow</p>
          <p className="text-xs mt-1">התחל פומודורו או סטופר כדי לראות סטטיסטיקות</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="bg-gradient-to-br from-cyan-500/10 to-cyan-600/5 border-cyan-500/20">
          <CardContent className="p-3 text-center">
            <Timer className="h-5 w-5 text-cyan-400 mx-auto mb-1" />
            <p className="text-xl font-bold text-cyan-400">{records.totalPomodoro}</p>
            <p className="text-[10px] text-muted-foreground">סשני פומודורו</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-500/20">
          <CardContent className="p-3 text-center">
            <StopCircle className="h-5 w-5 text-emerald-400 mx-auto mb-1" />
            <p className="text-xl font-bold text-emerald-400">{records.totalStopwatch}</p>
            <p className="text-[10px] text-muted-foreground">סשני סטופר</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-violet-500/10 to-violet-600/5 border-violet-500/20">
          <CardContent className="p-3 text-center">
            <TrendingUp className="h-5 w-5 text-violet-400 mx-auto mb-1" />
            <p className="text-xl font-bold text-violet-400">{formatDuration(records.totalMinutes)}</p>
            <p className="text-[10px] text-muted-foreground">סה״כ זמן עבודה</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/20">
          <CardContent className="p-3 text-center">
            <Trophy className="h-5 w-5 text-amber-400 mx-auto mb-1" />
            <p className="text-xl font-bold text-amber-400">
              {records.longestStopwatch ? formatDuration(records.longestStopwatch.duration) : "—"}
            </p>
            <p className="text-[10px] text-muted-foreground">שיא סטופר</p>
          </CardContent>
        </Card>
      </div>

      {/* Records */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-500" />
            שיאים אישיים 🏆
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {records.longestStopwatch && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <span className="text-lg">⏱️</span>
              <div className="flex-1">
                <p className="text-sm font-medium">שיא סטופר חופשי</p>
                <p className="text-xs text-muted-foreground">
                  {formatDuration(records.longestStopwatch.duration)} — {formatDateHebrew(records.longestStopwatch.timestamp)}
                </p>
              </div>
              <span className="text-lg">🔥</span>
            </div>
          )}
          {records.bestPomDay && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
              <span className="text-lg">🍅</span>
              <div className="flex-1">
                <p className="text-sm font-medium">שיא פומודורו ביום אחד</p>
                <p className="text-xs text-muted-foreground">
                  {records.bestPomDay[1]} סשנים — {records.bestPomDay[0].split("-").reverse().join("/")}
                </p>
              </div>
              <span className="text-lg">💪</span>
            </div>
          )}
          {records.bestMinDay && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-violet-500/10 border border-violet-500/20">
              <span className="text-lg">⚡</span>
              <div className="flex-1">
                <p className="text-sm font-medium">שיא דקות עבודה ביום</p>
                <p className="text-xs text-muted-foreground">
                  {formatDuration(records.bestMinDay[1])} — {records.bestMinDay[0].split("-").reverse().join("/")}
                </p>
              </div>
              <span className="text-lg">🏅</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            גרף שימוש — 14 ימים אחרונים
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barGap={0}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} label={{ value: "דקות", angle: -90, position: "insideLeft", style: { fontSize: 10, fill: "hsl(var(--muted-foreground))" } }} />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                  formatter={(value: number, name: string) => [
                    `${value} דקות`,
                    name === "pomodoro" ? "🍅 פומודורו" : "⏱️ סטופר"
                  ]}
                />
                <Bar dataKey="pomodoro" fill="hsl(190, 95%, 50%)" radius={[4, 4, 0, 0]} name="pomodoro" />
                <Bar dataKey="stopwatch" fill="hsl(160, 80%, 45%)" radius={[4, 4, 0, 0]} name="stopwatch" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 mt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-cyan-500 inline-block" /> פומודורו</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-emerald-500 inline-block" /> סטופר חופשי</span>
          </div>
        </CardContent>
      </Card>

      {/* Session History List */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            היסטוריית סשנים
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1 max-h-[400px] overflow-auto">
            {recentSessions.map((session, idx) => {
              const isStopwatch = session.type === "stopwatch";
              return (
                <div key={session.id || idx} className={`flex items-center gap-3 p-3 rounded-xl ${isStopwatch ? "bg-emerald-500/5" : "bg-cyan-500/5"}`}>
                  <span className="text-lg">{isStopwatch ? "⏱️" : "🍅"}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">
                      {isStopwatch ? "סטופר חופשי" : session.type === "sprint" ? "ספרינט" : "פומודורו"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDateHebrew(session.timestamp)}
                    </p>
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold">{formatDuration(session.duration)}</p>
                  </div>
                </div>
              );
            })}
            {sessions.length > 20 && (
              <p className="text-xs text-center text-muted-foreground py-2">
                מציג 20 אחרונים מתוך {sessions.length} סשנים
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SessionHistory;
