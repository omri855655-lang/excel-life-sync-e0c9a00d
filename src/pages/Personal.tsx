import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import TaskSpreadsheetDb from "@/components/TaskSpreadsheetDb";
import BooksManager from "@/components/BooksManager";
import ShowsManager from "@/components/ShowsManager";
import Dashboard from "@/components/Dashboard";
import { FileSpreadsheet, Moon, Sun, LogOut, BookOpen, Tv, LayoutDashboard, ListTodo, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

const Personal = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");

  const ALLOWED_EMAIL = "omri855655@gmail.com";

  useEffect(() => {
    if (loading) return;

    if (!user) {
      navigate("/auth");
      return;
    }

    if (user.email !== ALLOWED_EMAIL) {
      (async () => {
        await signOut();
        toast.error("אין הרשאה לאזור האישי");
        navigate("/auth");
      })();
    }
  }, [user, loading, navigate, signOut]);

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle("dark");
  };

  const handleSignOut = async () => {
    await signOut();
    toast.success("התנתקת בהצלחה");
    navigate("/");
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
        <h1 className="text-xl font-bold text-foreground">אזור אישי</h1>
        <div className="mr-auto flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/")}
            className="gap-2"
          >
            <Briefcase className="h-4 w-4" />
            משימות עבודה
          </Button>
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
              משימות אישיות
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
            <TaskSpreadsheetDb
              title="משימות אישיות"
              taskType="personal"
            />
          </div>
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

export default Personal;
