import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useTasks, Task } from "@/hooks/useTasks";
import { useCalendarEvents, CalendarEvent, getCategoryColor, CATEGORIES } from "@/hooks/useCalendarEvents";
import { supabase } from "@/integrations/supabase/client";
import { format, addDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfDay, endOfDay, addHours, isSameDay, addMonths, subMonths, addWeeks, subWeeks, isWithinInterval, differenceInMinutes, setHours, setMinutes } from "date-fns";
import { he } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ChevronRight, ChevronLeft, Plus, GripVertical, Clock, Trash2, Download, Flame, AlertTriangle, Calendar as CalendarIcon } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface AggregatedTask {
  id: string;
  title: string;
  source: "work" | "personal" | "project";
  overdue: boolean;
  urgent: boolean;
  status: string;
  plannedEnd: string;
  createdAt: string;
  category: string;
}

type ViewMode = "day" | "week" | "month";

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const HOUR_HEIGHT = 60; // px per hour

const PersonalPlanner = () => {
  const { user } = useAuth();
  const { tasks: personalTasks } = useTasks("personal");
  const { tasks: workTasks } = useTasks("work");
  const { events, addEvent, updateEvent, deleteEvent } = useCalendarEvents();

  const [projectTasks, setProjectTasks] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [draggedTask, setDraggedTask] = useState<AggregatedTask | null>(null);
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [newEventData, setNewEventData] = useState({
    title: "",
    description: "",
    category: "משימה",
    startTime: "",
    endTime: "",
    sourceType: "custom" as string,
    sourceId: null as string | null,
  });

  // Fetch project tasks
  useEffect(() => {
    if (!user) return;
    const fetchProjects = async () => {
      const { data } = await supabase
        .from("project_tasks")
        .select("*, projects(title)")
        .eq("user_id", user.id)
        .eq("completed", false);
      if (data) setProjectTasks(data);
    };
    fetchProjects();
  }, [user]);

  // Aggregate all tasks
  const allTasks = useMemo((): AggregatedTask[] => {
    const tasks: AggregatedTask[] = [];

    personalTasks
      .filter((t) => t.status !== "בוצע" && !t.archived)
      .forEach((t) =>
        tasks.push({
          id: t.id,
          title: t.description,
          source: "personal",
          overdue: t.overdue,
          urgent: t.urgent,
          status: t.status,
          plannedEnd: t.plannedEnd,
          createdAt: t.createdAt,
          category: t.category || "אישי",
        })
      );

    workTasks
      .filter((t) => t.status !== "בוצע" && !t.archived)
      .forEach((t) =>
        tasks.push({
          id: t.id,
          title: t.description,
          source: "work",
          overdue: t.overdue,
          urgent: t.urgent,
          status: t.status,
          plannedEnd: t.plannedEnd,
          createdAt: t.createdAt,
          category: t.category || "עבודה",
        })
      );

    projectTasks.forEach((pt: any) =>
      tasks.push({
        id: pt.id,
        title: `${pt.projects?.title || "פרויקט"}: ${pt.title}`,
        source: "project",
        overdue: false,
        urgent: false,
        status: "בטיפול",
        plannedEnd: "",
        createdAt: pt.created_at,
        category: "פרויקט",
      })
    );

    // Sort: overdue first, then urgent, then by creation date
    return tasks.sort((a, b) => {
      if (a.overdue !== b.overdue) return a.overdue ? -1 : 1;
      if (a.urgent !== b.urgent) return a.urgent ? -1 : 1;
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
  }, [personalTasks, workTasks, projectTasks]);

  // Calendar date ranges
  const dateRange = useMemo(() => {
    if (viewMode === "day") {
      return { start: startOfDay(currentDate), end: endOfDay(currentDate), days: [currentDate] };
    }
    if (viewMode === "week") {
      const start = startOfWeek(currentDate, { weekStartsOn: 0 });
      const end = endOfWeek(currentDate, { weekStartsOn: 0 });
      const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
      return { start, end, days };
    }
    // month
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    const monthStart = startOfWeek(start, { weekStartsOn: 0 });
    const days: Date[] = [];
    let d = monthStart;
    while (d <= end || days.length % 7 !== 0) {
      days.push(d);
      d = addDays(d, 1);
    }
    return { start, end, days };
  }, [currentDate, viewMode]);

  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      const eventStart = new Date(e.startTime);
      const eventEnd = new Date(e.endTime);
      return (
        isWithinInterval(eventStart, { start: dateRange.start, end: dateRange.end }) ||
        isWithinInterval(eventEnd, { start: dateRange.start, end: dateRange.end })
      );
    });
  }, [events, dateRange]);

  const navigate = (dir: number) => {
    if (viewMode === "day") setCurrentDate((d) => addDays(d, dir));
    else if (viewMode === "week") setCurrentDate((d) => addWeeks(d, dir));
    else setCurrentDate((d) => addMonths(d, dir));
  };

  const handleDragStart = (task: AggregatedTask) => {
    setDraggedTask(task);
  };

  const handleDrop = (day: Date, hour?: number) => {
    if (!draggedTask) return;

    const start = hour !== undefined
      ? setMinutes(setHours(day, hour), 0)
      : setMinutes(setHours(day, 9), 0);
    const end = addHours(start, 1);

    const sourceType = draggedTask.source === "work"
      ? "work_task"
      : draggedTask.source === "personal"
        ? "personal_task"
        : "project_task";

    setNewEventData({
      title: draggedTask.title,
      description: "",
      category: draggedTask.source === "work" ? "עבודה" : draggedTask.source === "project" ? "פרויקט" : "אישי",
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      sourceType,
      sourceId: draggedTask.id,
    });
    setEditingEvent(null);
    setShowEventDialog(true);
    setDraggedTask(null);
  };

  const handleSaveEvent = async () => {
    if (!newEventData.title.trim()) {
      toast.error("יש להזין כותרת");
      return;
    }

    if (editingEvent) {
      await updateEvent(editingEvent.id, {
        title: newEventData.title,
        description: newEventData.description,
        category: newEventData.category,
        startTime: newEventData.startTime,
        endTime: newEventData.endTime,
        color: getCategoryColor(newEventData.category),
      });
    } else {
      await addEvent({
        title: newEventData.title,
        description: newEventData.description,
        category: newEventData.category,
        startTime: newEventData.startTime,
        endTime: newEventData.endTime,
        color: getCategoryColor(newEventData.category),
        sourceType: newEventData.sourceType,
        sourceId: newEventData.sourceId,
      });
    }

    setShowEventDialog(false);
    setEditingEvent(null);
  };

  const handleClickEvent = (event: CalendarEvent) => {
    setEditingEvent(event);
    setNewEventData({
      title: event.title,
      description: event.description,
      category: event.category,
      startTime: event.startTime,
      endTime: event.endTime,
      sourceType: event.sourceType || "custom",
      sourceId: event.sourceId,
    });
    setShowEventDialog(true);
  };

  const handleAddCustomEvent = () => {
    const start = setMinutes(setHours(new Date(), 9), 0);
    const end = addHours(start, 1);
    setEditingEvent(null);
    setNewEventData({
      title: "",
      description: "",
      category: "אחר",
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      sourceType: "custom",
      sourceId: null,
    });
    setShowEventDialog(true);
  };

  const handleDeleteEvent = async () => {
    if (!editingEvent) return;
    await deleteEvent(editingEvent.id);
    setShowEventDialog(false);
    setEditingEvent(null);
  };

  // Export to Word
  const exportToWord = () => {
    const title = viewMode === "day"
      ? format(currentDate, "dd/MM/yyyy")
      : viewMode === "week"
        ? `${format(dateRange.start, "dd/MM")} - ${format(dateRange.end, "dd/MM/yyyy")}`
        : format(currentDate, "MMMM yyyy", { locale: he });

    const eventsInRange = filteredEvents.sort(
      (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );

    let html = `<html dir="rtl"><head><meta charset="utf-8"><style>
      body { font-family: Arial; direction: rtl; }
      table { border-collapse: collapse; width: 100%; margin-top: 10px; }
      th, td { border: 1px solid #ccc; padding: 8px; text-align: right; }
      th { background: #f0f0f0; }
      h1 { color: #333; }
    </style></head><body>
    <h1>לוח זמנים - ${title}</h1>
    <table>
      <tr><th>שעה</th><th>כותרת</th><th>קטגוריה</th><th>הערות</th></tr>`;

    eventsInRange.forEach((e) => {
      const start = format(new Date(e.startTime), "HH:mm");
      const end = format(new Date(e.endTime), "HH:mm");
      html += `<tr><td>${start}-${end}</td><td>${e.title}</td><td>${e.category}</td><td>${e.description}</td></tr>`;
    });

    html += "</table></body></html>";

    const blob = new Blob([html], { type: "application/msword" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `לוח-זמנים-${title}.doc`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("הקובץ הורד בהצלחה");
  };

  const getSourceLabel = (source: string) => {
    switch (source) {
      case "work": return "עבודה";
      case "personal": return "אישי";
      case "project": return "פרויקט";
      default: return source;
    }
  };

  const getSourceBg = (source: string) => {
    switch (source) {
      case "work": return "bg-orange-100 dark:bg-orange-900/30 border-orange-300";
      case "personal": return "bg-purple-100 dark:bg-purple-900/30 border-purple-300";
      case "project": return "bg-cyan-100 dark:bg-cyan-900/30 border-cyan-300";
      default: return "bg-muted border-border";
    }
  };

  // Render time grid for day/week view
  const renderTimeGrid = () => {
    const days = viewMode === "day" ? [currentDate] : dateRange.days;

    return (
      <div className="flex flex-1 min-h-0 overflow-auto">
        {/* Time column */}
        <div className="w-16 flex-shrink-0 border-l border-border">
          <div className="h-10 border-b border-border" /> {/* header spacer */}
          {HOURS.map((h) => (
            <div
              key={h}
              className="border-b border-border text-xs text-muted-foreground flex items-start justify-center pt-1"
              style={{ height: HOUR_HEIGHT }}
            >
              {String(h).padStart(2, "0")}:00
            </div>
          ))}
        </div>

        {/* Day columns */}
        <div className="flex flex-1">
          {days.map((day) => (
            <div key={day.toISOString()} className="flex-1 border-l border-border min-w-[100px]">
              {/* Day header */}
              <div className={`h-10 border-b border-border flex flex-col items-center justify-center text-sm sticky top-0 bg-card z-10 ${isSameDay(day, new Date()) ? "bg-primary/10 font-bold" : ""}`}>
                <span>{format(day, "EEEE", { locale: he })}</span>
                <span className="text-xs text-muted-foreground">{format(day, "dd/MM")}</span>
              </div>

              {/* Hour slots */}
              {HOURS.map((h) => {
                const slotEvents = filteredEvents.filter((e) => {
                  const eStart = new Date(e.startTime);
                  return isSameDay(eStart, day) && eStart.getHours() === h;
                });

                return (
                  <div
                    key={h}
                    className="border-b border-border/50 relative group hover:bg-muted/30 transition-colors"
                    style={{ height: HOUR_HEIGHT }}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => handleDrop(day, h)}
                  >
                    {slotEvents.map((event) => {
                      const startMin = new Date(event.startTime).getMinutes();
                      const duration = differenceInMinutes(
                        new Date(event.endTime),
                        new Date(event.startTime)
                      );
                      const height = (duration / 60) * HOUR_HEIGHT;
                      const top = (startMin / 60) * HOUR_HEIGHT;

                      return (
                        <div
                          key={event.id}
                          className="absolute inset-x-1 rounded-md px-2 py-1 text-xs cursor-pointer overflow-hidden z-20 shadow-sm hover:shadow-md transition-shadow border"
                          style={{
                            top,
                            height: Math.max(height, 24),
                            backgroundColor: event.color + "22",
                            borderColor: event.color,
                            borderRightWidth: 3,
                          }}
                          onClick={() => handleClickEvent(event)}
                        >
                          <div className="font-medium truncate" style={{ color: event.color }}>
                            {event.title}
                          </div>
                          <div className="text-muted-foreground truncate">
                            {format(new Date(event.startTime), "HH:mm")}-{format(new Date(event.endTime), "HH:mm")}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Render month grid
  const renderMonthGrid = () => {
    const weeks: Date[][] = [];
    for (let i = 0; i < dateRange.days.length; i += 7) {
      weeks.push(dateRange.days.slice(i, i + 7));
    }

    return (
      <div className="flex-1 overflow-auto">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-b border-border sticky top-0 bg-card z-10">
          {["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"].map((d) => (
            <div key={d} className="p-2 text-center text-sm font-medium text-muted-foreground border-l border-border">
              {d}
            </div>
          ))}
        </div>

        {/* Weeks */}
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 min-h-[100px]">
            {week.map((day) => {
              const dayEvents = filteredEvents.filter((e) =>
                isSameDay(new Date(e.startTime), day)
              );
              const isCurrentMonth = day.getMonth() === currentDate.getMonth();

              return (
                <div
                  key={day.toISOString()}
                  className={`border-l border-b border-border p-1 ${!isCurrentMonth ? "bg-muted/30" : ""} ${isSameDay(day, new Date()) ? "bg-primary/10" : ""}`}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => handleDrop(day)}
                >
                  <div className="text-xs font-medium mb-1">{format(day, "d")}</div>
                  {dayEvents.slice(0, 3).map((event) => (
                    <div
                      key={event.id}
                      className="text-xs truncate rounded px-1 mb-0.5 cursor-pointer hover:opacity-80"
                      style={{ backgroundColor: event.color + "33", color: event.color }}
                      onClick={() => handleClickEvent(event)}
                    >
                      {format(new Date(event.startTime), "HH:mm")} {event.title}
                    </div>
                  ))}
                  {dayEvents.length > 3 && (
                    <div className="text-xs text-muted-foreground">+{dayEvents.length - 3} נוספים</div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="flex h-full" dir="rtl">
      {/* Right sidebar - Task list */}
      <div className="w-72 border-l border-border flex flex-col bg-card flex-shrink-0">
        <div className="p-3 border-b border-border">
          <h3 className="font-bold text-sm mb-2">משימות פתוחות ({allTasks.length})</h3>
          <p className="text-xs text-muted-foreground">גרור משימה ללוח השנה</p>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1.5">
            {allTasks.map((task) => (
              <div
                key={`${task.source}-${task.id}`}
                draggable
                onDragStart={() => handleDragStart(task)}
                className={`p-2 rounded-lg border cursor-grab active:cursor-grabbing text-sm transition-colors hover:shadow-sm ${getSourceBg(task.source)} ${task.overdue ? "ring-1 ring-red-400" : ""}`}
              >
                <div className="flex items-center gap-1 mb-1">
                  <GripVertical className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                  <span className={`text-[10px] px-1.5 rounded-full font-medium ${task.source === "work" ? "bg-orange-200 text-orange-800" : task.source === "personal" ? "bg-purple-200 text-purple-800" : "bg-cyan-200 text-cyan-800"}`}>
                    {getSourceLabel(task.source)}
                  </span>
                  {task.urgent && <Flame className="h-3 w-3 text-red-500" />}
                  {task.overdue && <AlertTriangle className="h-3 w-3 text-amber-500" />}
                </div>
                <div className="text-xs font-medium line-clamp-2 pr-4">{task.title || "(ללא כותרת)"}</div>
                {task.plannedEnd && (
                  <div className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                    <Clock className="h-2.5 w-2.5" />
                    {format(new Date(task.plannedEnd), "dd/MM/yyyy")}
                  </div>
                )}
              </div>
            ))}
            {allTasks.length === 0 && (
              <div className="text-center text-muted-foreground text-sm py-8">
                אין משימות פתוחות
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Left side - Calendar */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Calendar header */}
        <div className="flex items-center gap-2 p-3 border-b border-border bg-card flex-shrink-0 flex-wrap">
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => navigate(-1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" className="h-8" onClick={() => setCurrentDate(new Date())}>
              היום
            </Button>
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => navigate(1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>

          <h2 className="font-bold text-lg min-w-[150px]">
            {viewMode === "day" && format(currentDate, "EEEE, dd MMMM yyyy", { locale: he })}
            {viewMode === "week" && `${format(dateRange.start, "dd/MM")} - ${format(dateRange.end, "dd/MM/yyyy")}`}
            {viewMode === "month" && format(currentDate, "MMMM yyyy", { locale: he })}
          </h2>

          <div className="mr-auto flex items-center gap-2">
            <div className="flex border border-border rounded-md overflow-hidden">
              {(["day", "week", "month"] as ViewMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`px-3 py-1.5 text-xs font-medium transition-colors ${viewMode === mode ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
                >
                  {mode === "day" ? "יומי" : mode === "week" ? "שבועי" : "חודשי"}
                </button>
              ))}
            </div>

            <Button variant="outline" size="sm" className="gap-1 h-8" onClick={handleAddCustomEvent}>
              <Plus className="h-3.5 w-3.5" />
              אירוע
            </Button>

            <Button variant="outline" size="sm" className="gap-1 h-8" onClick={exportToWord}>
              <Download className="h-3.5 w-3.5" />
              Word
            </Button>
          </div>
        </div>

        {/* Calendar grid */}
        {viewMode === "month" ? renderMonthGrid() : renderTimeGrid()}
      </div>

      {/* Event Dialog */}
      <Dialog open={showEventDialog} onOpenChange={setShowEventDialog}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>{editingEvent ? "עריכת אירוע" : "אירוע חדש"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">כותרת</label>
              <Input
                value={newEventData.title}
                onChange={(e) => setNewEventData((p) => ({ ...p, title: e.target.value }))}
                placeholder="כותרת האירוע"
              />
            </div>

            <div>
              <label className="text-sm font-medium">קטגוריה</label>
              <Select value={newEventData.category} onValueChange={(v) => setNewEventData((p) => ({ ...p, category: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getCategoryColor(c) }} />
                        {c}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">שעת התחלה</label>
                <Input
                  type="datetime-local"
                  value={newEventData.startTime ? format(new Date(newEventData.startTime), "yyyy-MM-dd'T'HH:mm") : ""}
                  onChange={(e) => setNewEventData((p) => ({ ...p, startTime: new Date(e.target.value).toISOString() }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium">שעת סיום</label>
                <Input
                  type="datetime-local"
                  value={newEventData.endTime ? format(new Date(newEventData.endTime), "yyyy-MM-dd'T'HH:mm") : ""}
                  onChange={(e) => setNewEventData((p) => ({ ...p, endTime: new Date(e.target.value).toISOString() }))}
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">הערות</label>
              <Textarea
                value={newEventData.description}
                onChange={(e) => setNewEventData((p) => ({ ...p, description: e.target.value }))}
                placeholder="הערות נוספות..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            {editingEvent && (
              <Button variant="destructive" size="sm" onClick={handleDeleteEvent} className="gap-1">
                <Trash2 className="h-3.5 w-3.5" />
                מחק
              </Button>
            )}
            <Button onClick={handleSaveEvent}>{editingEvent ? "עדכן" : "הוסף"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PersonalPlanner;
