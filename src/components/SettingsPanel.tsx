import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, Shield } from "lucide-react";
import { toast } from "sonner";

const SettingsPanel = () => {
  const { user } = useAuth();
  const [pinEnabled, setPinEnabled] = useState(true);
  const [hasPin, setHasPin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [changingPin, setChangingPin] = useState(false);
  const [newPin, setNewPin] = useState(["", "", "", ""]);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

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
      // Need to set PIN first
      setChangingPin(true);
      setPinEnabled(true);
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({ pin_enabled: enabled })
      .eq("user_id", user.id);

    if (error) {
      toast.error("שגיאה בעדכון ההגדרות");
      return;
    }

    setPinEnabled(enabled);
    toast.success(enabled ? "קוד גישה הופעל" : "קוד גישה בוטל");
  };

  const handlePinChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const digit = value.slice(-1);
    const updated = [...newPin];
    updated[index] = digit;
    setNewPin(updated);

    if (digit && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }

    if (digit && index === 3) {
      const fullPin = updated.join("");
      if (fullPin.length === 4) {
        saveNewPin(fullPin);
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !newPin[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const saveNewPin = async (pinCode: string) => {
    if (!user) return;
    const { error } = await supabase
      .from("profiles")
      .update({ pin_code: pinCode, pin_enabled: true })
      .eq("user_id", user.id);

    if (error) {
      toast.error("שגיאה בשמירת הקוד");
      return;
    }

    setHasPin(true);
    setPinEnabled(true);
    setChangingPin(false);
    setNewPin(["", "", "", ""]);
    toast.success("קוד הגישה עודכן בהצלחה!");
  };

  if (loading) {
    return <div className="p-6 text-center text-muted-foreground">טוען...</div>;
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            אבטחה
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* PIN Toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">קוד גישה (PIN)</Label>
              <p className="text-sm text-muted-foreground">
                דרוש קוד 4 ספרות בכל כניסה לאתר
              </p>
            </div>
            <Switch
              checked={pinEnabled}
              onCheckedChange={togglePin}
            />
          </div>

          {/* Change PIN */}
          {pinEnabled && (
            <div className="space-y-3 pt-2 border-t">
              {!changingPin ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setChangingPin(true);
                    setNewPin(["", "", "", ""]);
                    setTimeout(() => inputRefs.current[0]?.focus(), 100);
                  }}
                  className="gap-2"
                >
                  <Lock className="h-4 w-4" />
                  {hasPin ? "שנה קוד גישה" : "הגדר קוד גישה"}
                </Button>
              ) : (
                <div className="space-y-3">
                  <Label>הזן קוד חדש:</Label>
                  <div className="flex gap-3" dir="ltr">
                    {newPin.map((digit, i) => (
                      <Input
                        key={i}
                        ref={(el) => { inputRefs.current[i] = el; }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handlePinChange(i, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(i, e)}
                        className="w-12 h-12 text-center text-xl font-bold"
                        autoComplete="off"
                      />
                    ))}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setChangingPin(false);
                      setNewPin(["", "", "", ""]);
                    }}
                  >
                    ביטול
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsPanel;
