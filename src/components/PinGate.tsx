import { useState, useEffect, useRef } from "react";
import { Lock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const CORRECT_PIN = "1398";
const STORAGE_KEY = "site_pin_verified";

export function usePinGate() {
  const [verified, setVerified] = useState(() => {
    return sessionStorage.getItem(STORAGE_KEY) === "true";
  });

  const verify = () => {
    sessionStorage.setItem(STORAGE_KEY, "true");
    setVerified(true);
  };

  return { verified, verify };
}

export default function PinGate({ onSuccess }: { onSuccess: () => void }) {
  const [pin, setPin] = useState(["", "", "", ""]);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const digit = value.slice(-1);
    const newPin = [...pin];
    newPin[index] = digit;
    setPin(newPin);

    if (digit && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 4 digits entered
    if (digit && index === 3) {
      const fullPin = newPin.join("");
      if (fullPin.length === 4) {
        if (fullPin === CORRECT_PIN) {
          toast.success("קוד נכון!");
          onSuccess();
        } else {
          toast.error("קוד שגוי");
          setPin(["", "", "", ""]);
          setTimeout(() => inputRefs.current[0]?.focus(), 100);
        }
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !pin[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fullPin = pin.join("");
    if (fullPin.length < 4) {
      toast.error("נא להזין 4 ספרות");
      return;
    }
    if (fullPin === CORRECT_PIN) {
      toast.success("קוד נכון!");
      onSuccess();
    } else {
      toast.error("קוד שגוי");
      setPin(["", "", "", ""]);
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4"
      dir="rtl"
    >
      <Card className="w-full max-w-sm shadow-2xl border-0 bg-card/95 backdrop-blur">
        <CardHeader className="text-center space-y-3">
          <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
            <Lock className="h-7 w-7 text-primary" />
          </div>
          <CardTitle className="text-xl font-bold">הזן קוד כניסה</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex justify-center gap-3" dir="ltr">
              {pin.map((digit, i) => (
                <Input
                  key={i}
                  ref={(el) => { inputRefs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  className="w-14 h-14 text-center text-2xl font-bold"
                  autoComplete="off"
                />
              ))}
            </div>
            <Button type="submit" className="w-full">
              כניסה
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
