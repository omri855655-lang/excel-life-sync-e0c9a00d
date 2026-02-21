import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  FileSpreadsheet,
  Lock,
  LogIn,
  UserPlus,
  Briefcase,
  BookOpen,
  Tv,
  FolderKanban,
  CalendarDays,
  ArrowLeft,
} from "lucide-react";

const Landing = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/10" dir="rtl">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="h-6 w-6 text-primary" />
            <span className="text-lg font-bold text-foreground">מערכת ניהול אישית</span>
          </div>
          <div className="flex items-center gap-2">
            {loading ? null : user ? (
              <Button onClick={() => navigate("/personal")} className="gap-2">
                <Lock className="h-4 w-4" />
                אזור אישי
              </Button>
            ) : (
              <>
                <Button variant="ghost" onClick={() => navigate("/auth")} className="gap-2">
                  <LogIn className="h-4 w-4" />
                  התחברות
                </Button>
                <Button onClick={() => navigate("/auth?mode=signup")} className="gap-2">
                  <UserPlus className="h-4 w-4" />
                  הרשמה
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 pt-16 pb-12 text-center">
        <div className="space-y-6">
          <div className="mx-auto w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
            <FileSpreadsheet className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-foreground leading-tight">
            נהל את החיים שלך
            <br />
            <span className="text-primary">במקום אחד</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            משימות עבודה, ניהול מדיה, פרויקטים, קורסים ועוד — הכל בפלטפורמה אחת מסודרת.
            שתף את משימות העבודה עם הצוות או נהל את האזור האישי שלך.
          </p>
          <div className="flex flex-wrap justify-center gap-3 pt-4">
            {!loading && !user && (
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate("/auth?mode=signup")}
                className="gap-2 text-base"
              >
                <UserPlus className="h-5 w-5" />
                צור חשבון בחינם
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-4 pb-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              icon: BookOpen,
              title: "ספרים ומדיה",
              desc: "עקוב אחרי ספרים, סדרות ופודקאסטים",
            },
            {
              icon: FolderKanban,
              title: "פרויקטים",
              desc: "נהל פרויקטים עם משימות, קישורים ותאריכי יעד",
            },
            {
              icon: CalendarDays,
              title: "מתכנן יומי",
              desc: "תכנן את היום שלך עם AI ולוז חכם",
            },
          ].map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="rounded-xl border border-border bg-card p-6 space-y-3 hover:shadow-md transition-shadow"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground">{title}</h3>
              <p className="text-sm text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-6 text-center text-sm text-muted-foreground">
        מערכת ניהול אישית © {new Date().getFullYear()}
      </footer>
    </div>
  );
};

export default Landing;
