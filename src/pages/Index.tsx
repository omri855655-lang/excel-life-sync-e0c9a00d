import { useState } from "react";
import TaskSpreadsheet from "@/components/TaskSpreadsheet";
import SheetTabs from "@/components/SheetTabs";
import { FileSpreadsheet, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { personalTasks, workTasks } from "@/data/initialTasks";

interface Sheet {
  id: string;
  name: string;
  type: "personal" | "work";
}

const Index = () => {
  const [sheets, setSheets] = useState<Sheet[]>([
    { id: "1", name: "משימות אישיות", type: "personal" },
    { id: "2", name: "לוז משימות עבודה", type: "work" },
  ]);

  const [activeSheetId, setActiveSheetId] = useState("1");
  const [isDark, setIsDark] = useState(false);

  const activeSheet = sheets.find((s) => s.id === activeSheetId) || sheets[0];

  const handleAddSheet = () => {
    const newId = String(Date.now());
    const newSheet: Sheet = {
      id: newId,
      name: `גיליון ${sheets.length + 1}`,
      type: "personal",
    };
    setSheets((prev) => [...prev, newSheet]);
    setActiveSheetId(newId);
  };

  const handleDeleteSheet = (id: string) => {
    if (sheets.length > 1) {
      const newSheets = sheets.filter((s) => s.id !== id);
      setSheets(newSheets);
      if (activeSheetId === id) {
        setActiveSheetId(newSheets[0].id);
      }
    }
  };

  const handleRenameSheet = (id: string, name: string) => {
    setSheets((prev) =>
      prev.map((s) => (s.id === id ? { ...s, name } : s))
    );
  };

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle("dark");
  };

  const getTasksForSheet = () => {
    if (activeSheet.type === "work") return workTasks;
    return personalTasks;
  };

  return (
    <div className="flex flex-col h-screen bg-background" dir="rtl">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card shadow-sm">
        <FileSpreadsheet className="h-6 w-6 text-primary" />
        <h1 className="text-xl font-bold text-foreground">מערכת ניהול משימות</h1>
        <Button
          variant="ghost"
          size="icon"
          className="mr-auto"
          onClick={toggleTheme}
        >
          {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>
      </header>

      {/* Spreadsheet Area */}
      <div className="flex-1 overflow-hidden">
        <TaskSpreadsheet
          key={activeSheet.id}
          title={activeSheet.name}
          initialTasks={getTasksForSheet()}
        />
      </div>

      {/* Sheet Tabs */}
      <SheetTabs
        sheets={sheets.map((s) => ({ id: s.id, name: s.name }))}
        activeSheet={activeSheetId}
        onSelectSheet={setActiveSheetId}
        onAddSheet={handleAddSheet}
        onDeleteSheet={handleDeleteSheet}
        onRenameSheet={handleRenameSheet}
      />
    </div>
  );
};

export default Index;
