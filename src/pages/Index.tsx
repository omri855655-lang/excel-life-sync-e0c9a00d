import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import TaskSpreadsheet from "@/components/TaskSpreadsheet";
import SheetTabs from "@/components/SheetTabs";
import BooksManager from "@/components/BooksManager";
import ShowsManager from "@/components/ShowsManager";
import Dashboard from "@/components/Dashboard";
import { FileSpreadsheet, Moon, Sun, LogOut, BookOpen, Tv, LayoutDashboard, ListTodo } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { personalTasks, workTasks } from "@/data/initialTasks";
import { toast } from "sonner";

interface Sheet {
  id: string;
  name: string;
  type: "personal" | "work";
}

const Index = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [sheets, setSheets] = useState<Sheet[]>([
    { id: "1", name: "משימות אישיות", type: "personal" },
    { id: "2", name: "לוז משימות עבודה", type: "work" },
  ]);

  const [activeSheetId, setActiveSheetId] = useState("1");
  const [isDark, setIsDark] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

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

  const handleSignOut = async () => {
    await signOut();
    toast.success("התנתקת בהצלחה");
    navigate("/auth");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">טוען...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex flex-col h-screen bg-background" dir="rtl">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card shadow-sm">
        <FileSpreadsheet className="h-6 w-6 text-primary" />
        <h1 className="text-xl font-bold text-foreground">מערכת ניהול אישית</h1>
        <div className="mr-auto flex items-center gap-2">
          <span className="text-sm text-muted-foreground hidden sm:block">{user.email}</span>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
          >
            {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSignOut}
            title="התנתק"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <div className="border-b border-border bg-card px-4">
          <TabsList className="h-12 bg-transparent">
            <TabsTrigger value="dashboard" className="gap-2">
              <LayoutDashboard className="h-4 w-4" />
              דשבורד
            </TabsTrigger>
            <TabsTrigger value="tasks" className="gap-2">
              <ListTodo className="h-4 w-4" />
              משימות
            </TabsTrigger>
            <TabsTrigger value="books" className="gap-2">
              <BookOpen className="h-4 w-4" />
              ספרים
            </TabsTrigger>
            <TabsTrigger value="shows" className="gap-2">
              <Tv className="h-4 w-4" />
              סדרות
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="dashboard" className="flex-1 overflow-auto m-0">
          <Dashboard />
        </TabsContent>

        <TabsContent value="tasks" className="flex-1 flex flex-col overflow-hidden m-0">
          <div className="flex-1 overflow-hidden">
            <TaskSpreadsheet
              key={activeSheet.id}
              title={activeSheet.name}
              initialTasks={getTasksForSheet()}
            />
          </div>
          <SheetTabs
            sheets={sheets.map((s) => ({ id: s.id, name: s.name }))}
            activeSheet={activeSheetId}
            onSelectSheet={setActiveSheetId}
            onAddSheet={handleAddSheet}
            onDeleteSheet={handleDeleteSheet}
            onRenameSheet={handleRenameSheet}
          />
        </TabsContent>

        <TabsContent value="books" className="flex-1 overflow-auto m-0">
          <BooksManager />
        </TabsContent>

        <TabsContent value="shows" className="flex-1 overflow-auto m-0">
          <ShowsManager />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Index;
