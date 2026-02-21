import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useCustomBoards } from "@/hooks/useCustomBoards";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, Shield, LayoutGrid, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";

const SettingsPanel = () => {
  const { user } = useAuth();
  const [pinEnabled, setPinEnabled] = useState(true);
  const [hasPin, setHasPin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [changingPin, setChangingPin] = useState(false);
  const [newPin, setNewPin] = useState(["", "", "", ""]);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Custom boards
  const { boards, addBoard, deleteBoard, updateBoard } = useCustomBoards();
  const [showAddBoard, setShowAddBoard] = useState(false);
  const [newBoardName, setNewBoardName] = useState("");
  const [newBoardStatuses, setNewBoardStatuses] = useState("לביצוע,בתהליך,הושלם");
  const [newBoardDashboard, setNewBoardDashboard] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("pin_code, pin_enabled")
        .eq("user_id", user.id)
        .single();
      if (data) {
        setPinEnabled(data.pin_enabled);
        setHasPin(!!data.pin_code);
      }
      setLoading(false);
    };
    fetch();
  }, [user]);

  const togglePin = async (enabled: boolean) => {
    if (!user) return;
    if (enabled && !hasPin) {
      setChangingPin(true);
      setPinEnabled(true);
      return;
    }
    const { error } = await supabase.from("profiles").update({ pin_enabled: enabled }).eq("user_id", user.id);
    if (error) { toast.error("שגיאה בעדכון ההגדרות"); return; }
    setPinEnabled(enabled);
    toast.success(enabled ? "קוד גישה הופעל" : "קוד גישה בוטל");
  };

  const handlePinChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const digit = value.slice(-1);
    const updated = [...newPin];
    updated[index] = digit;
    setNewPin(updated);
    if (digit && index < 3) inputRefs.current[index + 1]?.focus();
    if (digit && index === 3) {
      const fullPin = updated.join("");
      if (fullPin.length === 4) saveNewPin(fullPin);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !newPin[index] && index > 0) inputRefs.current[index - 1]?.focus();
  };

  const saveNewPin = async (pinCode: string) => {
    if (!user) return;
    const { error } = await supabase.from("profiles").update({ pin_code: pinCode, pin_enabled: true }).eq("user_id", user.id);
    if (error) { toast.error("שגיאה בשמירת הקוד"); return; }
    setHasPin(true);
    setPinEnabled(true);
    setChangingPin(false);
    setNewPin(["", "", "", ""]);
    toast.success("קוד הגישה עודכן בהצלחה!");
  };

  const handleAddBoard = async () => {
    if (!newBoardName.trim()) { toast.error("יש להזין שם"); return; }
    const statuses = newBoardStatuses.split(",").map(s => s.trim()).filter(Boolean);
    if (statuses.length === 0) { toast.error("יש להזין לפחות סטטוס אחד"); return; }
    try {
      await addBoard(newBoardName.trim(), statuses, newBoardDashboard);
      setShowAddBoard(false);
      setNewBoardName("");
      setNewBoardStatuses("לביצוע,בתהליך,הושלם");
      setNewBoardDashboard(false);
      toast.success("הדשבורד נוסף בהצלחה!");
    } catch {
      toast.error("שגיאה ביצירת דשבורד");
    }
  };

  const handleDeleteBoard = async (id: string, name: string) => {
    if (!confirm(`למחוק את "${name}"? כל הפריטים בו יימחקו.`)) return;
    try {
      await deleteBoard(id);
      toast.success("נמחק בהצלחה");
    } catch {
      toast.error("שגיאה במחיקה");
    }
  };

  if (loading) return <div className="p-6 text-center text-muted-foreground">טוען...</div>;

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6" dir="rtl">
      {/* Security Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5" />אבטחה</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">קוד גישה (PIN)</Label>
              <p className="text-sm text-muted-foreground">דרוש קוד 4 ספרות בכל כניסה לאתר</p>
            </div>
            <Switch checked={pinEnabled} onCheckedChange={togglePin} />
          </div>
          {pinEnabled && (
            <div className="space-y-3 pt-2 border-t">
              {!changingPin ? (
                <Button variant="outline" size="sm" onClick={() => { setChangingPin(true); setNewPin(["","","",""]); setTimeout(() => inputRefs.current[0]?.focus(), 100); }} className="gap-2">
                  <Lock className="h-4 w-4" />{hasPin ? "שנה קוד גישה" : "הגדר קוד גישה"}
                </Button>
              ) : (
                <div className="space-y-3">
                  <Label>הזן קוד חדש:</Label>
                  <div className="flex gap-3" dir="ltr">
                    {newPin.map((digit, i) => (
                      <Input key={i} ref={(el) => { inputRefs.current[i] = el; }} type="text" inputMode="numeric" maxLength={1} value={digit} onChange={(e) => handlePinChange(i, e.target.value)} onKeyDown={(e) => handleKeyDown(i, e)} className="w-12 h-12 text-center text-xl font-bold" autoComplete="off" />
                    ))}
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => { setChangingPin(false); setNewPin(["","","",""]); }}>ביטול</Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Custom Boards Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><LayoutGrid className="h-5 w-5" />דשבורדים מותאמים אישית</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">צור דשבורדים מותאמים לעקוב אחר כל דבר שתרצה (למידה, כושר, מתכונים ועוד). הם יופיעו כלשוניות בסרגל העליון.</p>

          {boards.length > 0 && (
            <div className="space-y-2">
              {boards.map((board) => (
                <div key={board.id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                  <div>
                    <span className="font-medium">{board.name}</span>
                    <span className="text-xs text-muted-foreground mr-2">({board.statuses.join(", ")})</span>
                    {board.show_in_dashboard && (
                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded mr-2">מוצג בדשבורד</span>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => updateBoard(board.id, { show_in_dashboard: !board.show_in_dashboard })}>
                      {board.show_in_dashboard ? "🔵" : "⚪"}
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleDeleteBoard(board.id, board.name)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {showAddBoard ? (
            <div className="space-y-3 p-4 rounded-lg border bg-card">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">דשבורד חדש</Label>
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setShowAddBoard(false)}><X className="h-4 w-4" /></Button>
              </div>
              <div className="space-y-2">
                <Label>שם הדשבורד</Label>
                <Input placeholder='לדוגמה: "לימודים", "כושר", "מתכונים"' value={newBoardName} onChange={(e) => setNewBoardName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>סטטוסים (מופרדים בפסיק)</Label>
                <Input placeholder="לביצוע,בתהליך,הושלם" value={newBoardStatuses} onChange={(e) => setNewBoardStatuses(e.target.value)} dir="rtl" />
                <p className="text-xs text-muted-foreground">הסטטוסים שיופיעו בתפריט הבחירה של כל פריט</p>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={newBoardDashboard} onCheckedChange={setNewBoardDashboard} />
                <Label>הצג סיכום בדשבורד הראשי</Label>
              </div>
              <Button onClick={handleAddBoard} className="w-full gap-2"><Plus className="h-4 w-4" />צור דשבורד</Button>
            </div>
          ) : (
            <Button variant="outline" onClick={() => setShowAddBoard(true)} className="w-full gap-2"><Plus className="h-4 w-4" />הוסף דשבורד חדש</Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsPanel;
