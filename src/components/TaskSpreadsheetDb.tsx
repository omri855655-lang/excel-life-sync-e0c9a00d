import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Download, Check, Clock, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTasks, Task } from "@/hooks/useTasks";
import { taskHeaders } from "@/data/initialTasks";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TaskSpreadsheetDbProps {
  title: string;
  taskType: "personal" | "work";
  readOnly?: boolean;
}

const statusColors = {
  "בוצע": "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  "טרם החל": "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400",
  "בטיפול": "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
};

const statusIcons = {
  "בוצע": Check,
  "טרם החל": Clock,
  "בטיפול": AlertCircle,
};

const TaskSpreadsheetDb = ({ title, taskType, readOnly = false }: TaskSpreadsheetDbProps) => {
  const { tasks, loading, addTask, updateTask, deleteTask } = useTasks(taskType);
  const [selectedRow, setSelectedRow] = useState<string | null>(null);
  const [editingCell, setEditingCell] = useState<{ row: string; field: keyof Task } | null>(null);

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

  const EditableCell = ({
    value,
    taskId,
    field,
    className = "",
  }: {
    value: string;
    taskId: string;
    field: keyof Task;
    className?: string;
  }) => {
    const isEditing = editingCell?.row === taskId && editingCell?.field === field;
    const [editValue, setEditValue] = useState(value);

    if (isEditing) {
      return (
        <input
          type={field === "plannedEnd" ? "date" : "text"}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={() => {
            handleCellChange(taskId, field, editValue);
            setEditingCell(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleCellChange(taskId, field, editValue);
              setEditingCell(null);
            } else if (e.key === "Escape") {
              setEditingCell(null);
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
    }

    return (
      <span
        className={cn(readOnly ? "cursor-default" : "cursor-text", className)}
        onDoubleClick={() => {
          if (readOnly) return;
          setEditValue(value);
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
        <div className="mr-auto">
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
              {tasks.map((task, rowIndex) => {
                const StatusIcon = statusIcons[task.status] || Clock;
                return (
                  <tr
                    key={task.id}
                    className={cn(
                      "border-b border-border hover:bg-accent/30 transition-colors cursor-pointer",
                      selectedRow === task.id && "bg-primary/10",
                      task.overdue && task.status !== "בוצע" && "bg-destructive/5"
                    )}
                    onClick={() => setSelectedRow(task.id)}
                  >
                    <td className="px-3 py-2 text-sm text-muted-foreground w-12">
                      {rowIndex + 1}
                    </td>
                    <td className="px-3 py-2 text-sm max-w-[300px]">
                      <EditableCell
                        value={task.description}
                        taskId={task.id}
                        field="description"
                      />
                    </td>
                    <td className="px-3 py-2 text-sm">
                      <EditableCell
                        value={task.category}
                        taskId={task.id}
                        field="category"
                        className="text-muted-foreground"
                      />
                    </td>
                    <td className="px-3 py-2 text-sm">
                      <EditableCell
                        value={task.responsible}
                        taskId={task.id}
                        field="responsible"
                      />
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
                      <EditableCell
                        value={task.statusNotes}
                        taskId={task.id}
                        field="statusNotes"
                        className="text-muted-foreground text-xs"
                      />
                    </td>
                    <td className="px-3 py-2 text-sm max-w-[200px]">
                      <EditableCell
                        value={task.progress}
                        taskId={task.id}
                        field="progress"
                        className="text-muted-foreground text-xs"
                      />
                    </td>
                    <td className="px-3 py-2 text-sm whitespace-nowrap">
                      <EditableCell
                        value={task.plannedEnd}
                        taskId={task.id}
                        field="plannedEnd"
                      />
                    </td>
                    <td className="px-3 py-2 text-sm text-center">
                      {task.overdue && task.status !== "בוצע" ? (
                        <span className="text-destructive font-medium">חריגה</span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default TaskSpreadsheetDb;
