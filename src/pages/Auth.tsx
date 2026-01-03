import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { BookOpen, Tv, Lock } from "lucide-react";

const Auth = () => {
  const navigate = useNavigate();
  const { signIn, signOut, user, loading } = useAuth();

  const ALLOWED_EMAIL = "omri855655@gmail.com";

  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const schema = useMemo(
    () =>
      z.object({
        password: z
          .string()
          .trim()
          .min(1, "נא להזין סיסמה")
          .max(128, "סיסמה ארוכה מדי"),
      }),
    []
  );

  useEffect(() => {
    document.title = "התחברות | מערכת ניהול אישית";
  }, []);

  useEffect(() => {
    if (loading) return;

    // אם כבר מחובר – רק המשתמש המורשה יכול להמשיך.
    if (user) {
      if (user.email === ALLOWED_EMAIL) {
        navigate("/personal");
      } else {
        (async () => {
          await signOut();
          toast.error("אין הרשאה לחשבון הזה");
        })();
      }
    }
  }, [user, loading, navigate, signOut]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();

    const parsed = schema.safeParse({ password });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "שגיאה בטופס");
      return;
    }

    setIsLoading(true);
    const { error } = await signIn(ALLOWED_EMAIL, parsed.data.password);
    setIsLoading(false);

    if (error) {
      if (error.message.includes("Invalid login credentials")) {
        toast.error("סיסמה שגויה");
      } else {
        toast.error("שגיאה בהתחברות: " + error.message);
      }
      return;
    }

    toast.success("התחברת בהצלחה!");
    navigate("/personal");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">טוען...</div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4"
      dir="rtl"
    >
      <Card className="w-full max-w-md shadow-2xl border-0 bg-card/95 backdrop-blur">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto flex items-center justify-center gap-2 text-primary">
            <BookOpen className="h-8 w-8" />
            <Tv className="h-8 w-8" />
            <Lock className="h-8 w-8" />
          </div>
          <CardTitle className="text-2xl font-bold">מערכת ניהול אישית</CardTitle>
          <CardDescription>
            הכניסה מוגבלת למשתמש מורשה בלבד. דף משימות העבודה פתוח לצפייה לכולם.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignIn} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">אימייל</Label>
              <Input id="email" type="email" value={ALLOWED_EMAIL} disabled dir="ltr" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">סיסמה</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                dir="ltr"
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "מתחבר..." : "התחבר"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
