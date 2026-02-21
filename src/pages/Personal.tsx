import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import TaskSpreadsheetDb from "@/components/TaskSpreadsheetDb";
import BooksManager from "@/components/BooksManager";
import ShowsManager from "@/components/ShowsManager";
import PodcastsManager from "@/components/PodcastsManager";
import ProjectsManager from "@/components/ProjectsManager";
import CoursesManager from "@/components/CoursesManager";
import Dashboard from "@/components/Dashboard";
import DailyRoutine from "@/components/DailyRoutine";
import AiDailyPlanner from "@/components/AiDailyPlanner";
import PersonalPlanner from "@/components/PersonalPlanner";
import PushNotificationToggle from "@/components/PushNotificationToggle";
import NotificationBell from "@/components/NotificationBell";
import { FileSpreadsheet, Moon, Sun, LogOut, BookOpen, Tv, LayoutDashboard, ListTodo, Briefcase, Download, Headphones, CalendarCheck, FolderKanban, GraduationCap, CalendarDays, Focus } from "lucide-react";
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
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/install")}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">התקנת אפליקציה</span>
          </Button>
          <span className="text-sm text-muted-foreground hidden sm:block">{user.email}</span>
          <NotificationBell />
          <PushNotificationToggle />
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
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
        <div className="border-b border-border bg-card px-4 flex-shrink-0 overflow-x-auto">
          <TabsList className="h-12 bg-transparent w-max min-w-full">
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
            <TabsTrigger value="podcasts" className="gap-2">
              <Headphones className="h-4 w-4" />
              פודקאסטים
            </TabsTrigger>
            <TabsTrigger value="routine" className="gap-2">
              <CalendarCheck className="h-4 w-4" />
              לוז יומי
            </TabsTrigger>
            <TabsTrigger value="projects" className="gap-2">
              <FolderKanban className="h-4 w-4" />
              פרויקטים
            </TabsTrigger>
            <TabsTrigger value="courses" className="gap-2">
              <GraduationCap className="h-4 w-4" />
              קורסים
            </TabsTrigger>
            <TabsTrigger value="planner" className="gap-2">
              <CalendarDays className="h-4 w-4" />
              מתכנן לוז
            </TabsTrigger>
            <TabsTrigger value="deeply" className="gap-2" onClick={() => navigate("/deeply")}>
              <Focus className="h-4 w-4" />
              Deeply
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="dashboard" className="flex-1 min-h-0 overflow-auto m-0 p-0">
          <Dashboard />
        </TabsContent>

        <TabsContent value="tasks" className="flex-1 min-h-0 overflow-hidden m-0 p-0">
          <TaskSpreadsheetDb
            title="משימות אישיות"
            taskType="personal"
            showYearSelector={true}
          />
        </TabsContent>

        <TabsContent value="books" className="flex-1 min-h-0 overflow-hidden m-0 p-0">
          <BooksManager />
        </TabsContent>

        <TabsContent value="shows" className="flex-1 min-h-0 overflow-hidden m-0 p-0">
          <ShowsManager />
        </TabsContent>

        <TabsContent value="podcasts" className="flex-1 min-h-0 overflow-hidden m-0 p-0">
          <PodcastsManager />
        </TabsContent>

        <TabsContent value="routine" className="flex-1 min-h-0 overflow-auto m-0 p-0">
          <DailyRoutine />
        </TabsContent>

        <TabsContent value="projects" className="flex-1 min-h-0 overflow-hidden m-0 p-0">
          <ProjectsManager />
        </TabsContent>

        <TabsContent value="planner" className="flex-1 min-h-0 overflow-hidden m-0 p-0">
          <PersonalPlanner />
        </TabsContent>

        <TabsContent value="courses" className="flex-1 min-h-0 overflow-hidden m-0 p-0">
          <CoursesManager />
        </TabsContent>
      </Tabs>

      {/* AI Daily Planner floating button */}
      <AiDailyPlanner />
    </div>
  );
};

export default Personal;
