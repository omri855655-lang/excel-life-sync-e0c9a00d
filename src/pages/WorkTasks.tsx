import { useState } from "react";
import TaskSpreadsheetDb from "@/components/TaskSpreadsheetDb";
import { Download, FileSpreadsheet, Moon, Sun, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const WorkTasks = () => {
  const [isDark, setIsDark] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  const ALLOWED_EMAIL = "omri855655@gmail.com";
  const isAllowedUser = user?.email === ALLOWED_EMAIL;

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle("dark");
  };

  return (
    <div className="flex flex-col h-screen bg-background" dir="rtl">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card shadow-sm">
        <FileSpreadsheet className="h-6 w-6 text-primary" />
        <h1 className="text-xl font-bold text-foreground">לוז משימות עבודה</h1>
        <div className="mr-auto flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/install")}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">התקנת אפליקציה</span>
          </Button>
          {isAllowedUser && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/personal")}
              className="gap-2"
            >
              <Lock className="h-4 w-4" />
              אזור אישי
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={toggleTheme}>
            {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <TaskSpreadsheetDb 
          title="לוז משימות עבודה" 
          taskType="work" 
          readOnly={!isAllowedUser} 
          showYearSelector={isAllowedUser}
        />
      </div>
    </div>
  );
};

export default WorkTasks;
