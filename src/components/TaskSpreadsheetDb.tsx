import { useState, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Download, Check, Clock, AlertCircle, Loader2, Sparkles, ArrowUpDown, Flame, MoveRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTasks, Task } from "@/hooks/useTasks";
import { taskHeaders } from "@/data/initialTasks";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import YearSelector from "@/components/YearSelector";

interface TaskSpreadsheetDbProps {
  title: string;
  taskType: "personal" | "work";
  readOnly?: boolean;
  showYearSelector?: boolean;
}

const statusColors: Record<string, string> = {
  "בוצע": "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  "טרם החל": "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400",
  "בטיפול": "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
};

const statusIcons: Record<string, typeof Check> = {
  "בוצע": Check,
  "טרם החל": Clock,
  "בטיפול": AlertCircle,
};

const statusOrder: Record<string, number> = {
  "טרם החל": 0,
  "בטיפול": 1,
  "בוצע": 2,
};

type SortOption = "none" | "status" | "plannedEnd" | "overdue" | "createdAt" | "urgent";

const TaskSpreadsheetDb = ({ title, taskType, readOnly = false, showYearSelector = false }: TaskSpreadsheetDbProps) => {
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const { tasks, loading, addTask, updateTask, deleteTask, refetch } = useTasks(taskType, selectedYear);
  const [selectedRow, setSelectedRow] = useState<string | null>(null);
  const [editingCell, setEditingCell] = useState<{ row: string; field: keyof Task } | null>(null);
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<string>("");
  const [aiLoading, setAiLoading] = useState(false);
  const [selectedTaskForAi, setSelectedTaskForAi] = useState<Task | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>("none");
  const [descriptionInput, setDescriptionInput] = useState("");
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const [taskToMove, setTaskToMove] = useState<Task | null>(null);
  const [targetYear, setTargetYear] = useState<number>(new Date().getFullYear() + 1);

  // Similar task suggestions
  const getSimilarTasks = useMemo(() => {
    if (!descriptionInput.trim() || descriptionInput.length < 2) return [];
    const input = descriptionInput.toLowerCase();
    return tasks.filter(
      (task) => 
        task.id !== editingTaskId &&
        task.description.toLowerCase().includes(input)
    ).slice(0, 5);
  }, [descriptionInput, tasks, editingTaskId]);

  // Sorted tasks
  const sortedTasks = useMemo(() => {
    if (sortBy === "none") return tasks;
    
    return [...tasks].sort((a, b) => {
      switch (sortBy) {
        case "status":
          const orderA = statusOrder[a.status] ?? 1;
          const orderB = statusOrder[b.status] ?? 1;
          return orderA - orderB;
        case "plannedEnd":
          // Tasks without planned end go to the bottom
          if (!a.plannedEnd && !b.plannedEnd) return 0;
          if (!a.plannedEnd) return 1;
          if (!b.plannedEnd) return -1;
          return new Date(a.plannedEnd).getTime() - new Date(b.plannedEnd).getTime();
        case "overdue":
          // Overdue tasks first, then non-overdue
          const aOverdue = a.overdue && a.status !== "בוצע" ? 0 : 1;
          const bOverdue = b.overdue && b.status !== "בוצע" ? 0 : 1;
          return aOverdue - bOverdue;
        case "createdAt":
          // Newest first
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "urgent":
          // Urgent tasks first
          const aUrgent = a.urgent ? 0 : 1;
          const bUrgent = b.urgent ? 0 : 1;
          return aUrgent - bUrgent;
        default:
          return 0;
      }
    });
  }, [tasks, sortBy]);

  const handleCellChange = useCallback(
    (taskId: string, field: keyof Task, value: string) => {
      updateTask(taskId, { [field]: value });
    },
    [updateTask]
  );

  const handleStatusChange = useCallback(
    (taskId: string, status: Task["status"]) => {
      updateTask(taskId, { status });
    },
    [updateTask]
  );

  const handleAddTask = async () => {
    await addTask();
  };

  const handleDeleteTask = async () => {
    if (selectedRow) {
      await deleteTask(selectedRow);
      setSelectedRow(null);
    }
  };

  const handleMoveTask = async () => {
    if (!taskToMove) return;

    try {
      const { error } = await supabase
        .from("tasks")
        .update({ year: targetYear })
        .eq("id", taskToMove.id);

      if (error) throw error;

      toast.success(`המשימה הועברה לגליון ${targetYear}`);
      setMoveDialogOpen(false);
      setTaskToMove(null);
      refetch();
    } catch (error: any) {
      console.error("Error moving task:", error);
      toast.error("שגיאה בהעברת משימה");
    }
  };

  const handleAiHelp = async (task: Task) => {
    if (!task.description.trim()) {
      toast.error("נא להזין תיאור משימה לפני בקשת עזרה מ-AI");
      return;
    }
    
    setSelectedTaskForAi(task);
    setAiDialogOpen(true);
    setAiLoading(true);
    setAiSuggestion("");

    try {
      const { data, error } = await supabase.functions.invoke("task-ai-helper", {
        body: { taskDescription: task.description, taskCategory: task.category },
      });

      if (error) {
        throw error;
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      setAiSuggestion(data.suggestion || "לא התקבלה תגובה מה-AI");
    } catch (error: any) {
      console.error("AI error:", error);
      toast.error(error.message || "שגיאה בקבלת עזרה מ-AI");
      setAiDialogOpen(false);
    } finally {
      setAiLoading(false);
    }
  };

  const exportToCSV = () => {
    const headers = taskHeaders.join(",");
    const rows = tasks.map((task, index) =>
      [
        index + 1,
        `"${task.description}"`,
        `"${task.category}"`,
        `"${task.responsible}"`,
        `"${task.status}"`,
        `"${task.statusNotes}"`,
        `"${task.progress}"`,
        `"${task.plannedEnd}"`,
        task.overdue ? "כן" : "לא",
      ].join(",")
    );
    const csvContent = [headers, ...rows].join("\n");

    const blob = new Blob(["\ufeff" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${title}.csv`;
    link.click();
  };

  const completedCount = tasks.filter((t) => t.status === "בוצע").length;
  const pendingCount = tasks.filter((t) => t.status === "טרם החל").length;
  const inProgressCount = tasks.filter((t) => t.status === "בטיפול").length;
  const completionRate = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  // Editable cell with suggestions for description
  const EditableCellWithSuggestions = ({
    value,
    taskId,
    className,
    onSave,
    onCancel,
  }: {
    value: string;
    taskId: string;
    className: string;
    onSave: (value: string) => void;
    onCancel: () => void;
  }) => {
    const [editValue, setEditValue] = useState(value);
    const [showSuggestionsLocal, setShowSuggestionsLocal] = useState(false);

    const similarTasks = useMemo(() => {
      if (!editValue.trim() || editValue.length < 2) return [];
      const input = editValue.toLowerCase();
      return tasks.filter(
        (task) => 
          task.id !== taskId &&
          task.description.toLowerCase().includes(input)
      ).slice(0, 5);
    }, [editValue, taskId]);

    return (
      <div className="relative">
        <input
          type="text"
          value={editValue}
          onChange={(e) => {
            setEditValue(e.target.value);
            setShowSuggestionsLocal(true);
          }}
          onBlur={() => {
            setTimeout(() => {
              setShowSuggestionsLocal(false);
              onSave(editValue);
            }, 200);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              setShowSuggestionsLocal(false);
              onSave(editValue);
            } else if (e.key === "Escape") {
              setShowSuggestionsLocal(false);
              onCancel();
            }
          }}
          className={cn(
            "w-full bg-transparent outline-none ring-2 ring-primary rounded px-1",
            className
          )}
          autoFocus
          dir="rtl"
        />
        {showSuggestionsLocal && similarTasks.length > 0 && (
          <div className="absolute top-full right-0 left-0 mt-1 bg-popover border border-border rounded-md shadow-lg z-50 max-h-48 overflow-auto">
            <div className="p-2 text-xs text-muted-foreground border-b">משימות דומות:</div>
            {similarTasks.map((task) => (
              <div
                key={task.id}
                className="px-3 py-2 text-sm hover:bg-accent cursor-pointer"
                onMouseDown={(e) => {
                  e.preventDefault();
                  setEditValue(task.description);
                }}
              >
                <span className="font-medium">{task.description}</span>
                <span className={cn(
                  "mr-2 text-xs px-1.5 py-0.5 rounded",
                  statusColors[task.status]
                )}>
                  {task.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const EditableCellInput = ({
    value,
    field,
    className,
    onSave,
    onCancel,
  }: {
    value: string;
    field: keyof Task;
    className: string;
    onSave: (value: string) => void;
    onCancel: () => void;
  }) => {
    const [editValue, setEditValue] = useState(value);

    return (
      <input
        type={field === "plannedEnd" ? "date" : "text"}
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={() => onSave(editValue)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            onSave(editValue);
          } else if (e.key === "Escape") {
            onCancel();
          }
        }}
        className={cn(
          "w-full bg-transparent outline-none ring-2 ring-primary rounded px-1",
          className
        )}
        autoFocus
        dir="auto"
      />
    );
  };

  const renderEditableCell = (
    value: string,
    taskId: string,
    field: keyof Task,
    className: string = ""
  ) => {
    const isEditing = editingCell?.row === taskId && editingCell?.field === field;

    if (isEditing) {
      // Use special component with suggestions for description field
      if (field === "description") {
        return (
          <EditableCellWithSuggestions
            value={value}
            taskId={taskId}
            className={className}
            onSave={(newValue) => {
              handleCellChange(taskId, field, newValue);
              setEditingCell(null);
            }}
            onCancel={() => setEditingCell(null)}
          />
        );
      }

      return (
        <EditableCellInput
          value={value}
          field={field}
          className={className}
          onSave={(newValue) => {
            handleCellChange(taskId, field, newValue);
            setEditingCell(null);
          }}
          onCancel={() => setEditingCell(null)}
        />
      );
    }

    return (
      <span
        className={cn(readOnly ? "cursor-default" : "cursor-text", className)}
        onDoubleClick={() => {
          if (readOnly) return;
          setEditingCell({ row: taskId, field });
        }}
        dir="auto"
      >
        {value || "-"}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="mr-2 text-muted-foreground">טוען משימות...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background" dir="rtl">
      {/* Year Selector */}
      {showYearSelector && (
        <YearSelector 
          selectedYear={selectedYear} 
          onYearChange={setSelectedYear}
        />
      )}

      {/* Stats Bar */}
      <div className="flex items-center gap-6 px-4 py-3 bg-card border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span className="text-sm text-muted-foreground">בוצע: {completedCount}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-gray-400" />
          <span className="text-sm text-muted-foreground">טרם החל: {pendingCount}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-amber-500" />
          <span className="text-sm text-muted-foreground">בטיפול: {inProgressCount}</span>
        </div>
        <div className="mr-auto flex items-center gap-2">
          <span className="text-sm font-medium">אחוז ביצוע:</span>
          <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${completionRate}%` }}
            />
          </div>
          <span className="text-sm font-bold text-primary">{completionRate}%</span>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2 p-3 border-b border-border bg-muted/30">
        <h2 className="text-lg font-semibold text-foreground ml-4">{title}</h2>
        {!readOnly && (
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" onClick={handleAddTask}>
              <Plus className="h-4 w-4 ml-1" />
              משימה חדשה
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDeleteTask}
              disabled={selectedRow === null}
            >
              <Trash2 className="h-4 w-4 ml-1" />
              מחק משימה
            </Button>
          </div>
        )}
        <div className="mr-auto flex items-center gap-2">
          <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
            <SelectTrigger className="w-[160px] h-8">
              <ArrowUpDown className="h-4 w-4 ml-1" />
              <SelectValue placeholder="מיון" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">ללא מיון</SelectItem>
              <SelectItem value="status">לפי סטטוס</SelectItem>
              <SelectItem value="plannedEnd">לפי סיום מתוכנן</SelectItem>
              <SelectItem value="createdAt">לפי תאריך יצירה</SelectItem>
              <SelectItem value="overdue">לפי חריגה</SelectItem>
              <SelectItem value="urgent">לפי דחיפות</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="secondary" size="sm" onClick={exportToCSV}>
            <Download className="h-4 w-4 ml-1" />
            ייצוא
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        {tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <p className="text-lg">אין משימות עדיין</p>
            {!readOnly && (
              <Button variant="outline" className="mt-4" onClick={handleAddTask}>
                <Plus className="h-4 w-4 ml-1" />
                הוסף משימה ראשונה
              </Button>
            )}
          </div>
        ) : (
          <table className="w-full border-collapse min-w-[1200px]">
            <thead className="sticky top-0 z-10">
              <tr className="bg-muted">
                {taskHeaders.map((header, i) => (
                  <th
                    key={i}
                    className="px-3 py-2 text-right text-sm font-medium text-muted-foreground border-b border-border whitespace-nowrap"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedTasks.map((task, rowIndex) => {
                const StatusIcon = statusIcons[task.status] || Clock;
                return (
                  <tr
                    key={task.id}
                    className={cn(
                      "border-b border-border hover:bg-accent/30 transition-colors cursor-pointer",
                      selectedRow === task.id && "bg-primary/10",
                      task.urgent && "bg-red-50 dark:bg-red-900/20 border-l-4 border-l-red-500",
                      task.overdue && task.status !== "בוצע" && !task.urgent && "bg-destructive/5"
                    )}
                    onClick={() => setSelectedRow(task.id)}
                  >
                    <td className="px-3 py-2 text-sm text-muted-foreground w-12 flex items-center gap-1">
                      {task.urgent && <Flame className="h-4 w-4 text-red-500" />}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (readOnly) return;
                          updateTask(task.id, { urgent: !task.urgent });
                        }}
                        className={cn(
                          "w-6 h-6 rounded border flex items-center justify-center transition-colors",
                          task.urgent 
                            ? "bg-red-500 border-red-500 text-white" 
                            : "border-muted-foreground/30 hover:border-red-400 hover:bg-red-50 dark:hover:bg-red-900/20",
                          readOnly && "cursor-default opacity-50"
                        )}
                        title={task.urgent ? "בטל דחיפות" : "סמן כדחוף"}
                        disabled={readOnly}
                      >
                        <Flame className={cn("h-3 w-3", task.urgent ? "text-white" : "text-muted-foreground")} />
                      </button>
                      <span>{rowIndex + 1}</span>
                    </td>
                    <td className="px-3 py-2 text-sm max-w-[300px]">
                      {renderEditableCell(task.description, task.id, "description")}
                    </td>
                    <td className="px-3 py-2 text-sm">
                      {renderEditableCell(task.category, task.id, "category", "text-muted-foreground")}
                    </td>
                    <td className="px-3 py-2 text-sm">
                      {renderEditableCell(task.responsible, task.id, "responsible")}
                    </td>
                    <td className="px-3 py-2 text-sm">
                      <Select
                        value={task.status}
                        disabled={readOnly}
                        onValueChange={(value) => {
                          if (readOnly) return;
                          handleStatusChange(task.id, value as Task["status"]);
                        }}
                      >
                        <SelectTrigger
                          className={cn(
                            "w-[110px] h-7 text-xs border-0",
                            statusColors[task.status] || statusColors["טרם החל"]
                          )}
                        >
                          <StatusIcon className="h-3 w-3 ml-1" />
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="בוצע">
                            <span className="flex items-center gap-1">
                              <Check className="h-3 w-3" /> בוצע
                            </span>
                          </SelectItem>
                          <SelectItem value="טרם החל">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" /> טרם החל
                            </span>
                          </SelectItem>
                          <SelectItem value="בטיפול">
                            <span className="flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" /> בטיפול
                            </span>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-3 py-2 text-sm max-w-[200px]">
                      {renderEditableCell(task.statusNotes, task.id, "statusNotes", "text-muted-foreground text-xs")}
                    </td>
                    <td className="px-3 py-2 text-sm max-w-[200px]">
                      {renderEditableCell(task.progress, task.id, "progress", "text-muted-foreground text-xs")}
                    </td>
                    <td className="px-3 py-2 text-sm whitespace-nowrap">
                      {renderEditableCell(task.plannedEnd, task.id, "plannedEnd")}
                    </td>
                    <td className="px-3 py-2 text-sm text-center">
                      {task.overdue && task.status !== "בוצע" ? (
                        <span className="text-destructive font-medium">חריגה</span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-sm">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAiHelp(task);
                          }}
                          className="h-7 gap-1 text-primary hover:text-primary"
                          title="קבל עזרה מ-AI"
                        >
                          <Sparkles className="h-3.5 w-3.5" />
                          <span className="text-xs">AI</span>
                        </Button>
                        {showYearSelector && !readOnly && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setTaskToMove(task);
                              setMoveDialogOpen(true);
                            }}
                            className="h-7 gap-1 text-muted-foreground hover:text-foreground"
                            title="העבר לשנה אחרת"
                          >
                            <MoveRight className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* AI Dialog */}
      <Dialog open={aiDialogOpen} onOpenChange={setAiDialogOpen}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              עזרה מ-AI
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedTaskForAi && (
              <div className="bg-muted p-3 rounded-lg">
                <p className="text-sm font-medium">משימה:</p>
                <p className="text-sm text-muted-foreground">{selectedTaskForAi.description}</p>
              </div>
            )}
            {aiLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="mr-2 text-muted-foreground">מקבל הצעות...</span>
              </div>
            ) : (
              <div className="bg-primary/5 border border-primary/20 p-4 rounded-lg whitespace-pre-wrap text-sm">
                {aiSuggestion}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Move Task Dialog */}
      <Dialog open={moveDialogOpen} onOpenChange={setMoveDialogOpen}>
        <DialogContent className="max-w-sm" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MoveRight className="h-5 w-5 text-primary" />
              העבר משימה לגליון אחר
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {taskToMove && (
              <div className="bg-muted p-3 rounded-lg">
                <p className="text-sm font-medium">משימה:</p>
                <p className="text-sm text-muted-foreground">{taskToMove.description || "(ללא תיאור)"}</p>
              </div>
            )}
            <div>
              <label className="text-sm font-medium">העבר לשנת:</label>
              <Select
                value={String(targetYear)}
                onValueChange={(v) => setTargetYear(Number(v))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[2025, 2026, 2027].filter(y => y !== selectedYear).map((year) => (
                    <SelectItem key={year} value={String(year)}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMoveDialogOpen(false)}>
              ביטול
            </Button>
            <Button onClick={handleMoveTask}>העבר משימה</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TaskSpreadsheetDb;
