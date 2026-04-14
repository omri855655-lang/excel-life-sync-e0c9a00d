import { useState, useEffect } from "react";
import { Play, X } from "lucide-react";
import { startSilentAudio } from "./zoneflow/zoneflowIosSilentAudio";
import { unlockAudioContext } from "./zoneflow/zoneflowIosAudioUnlock";

export default function IosMusicBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    if (!isIOS) return;
    setVisible(true);
  }, []);

  const handlePlay = () => {
    unlockAudioContext();
    startSilentAudio();
    setVisible(false);
  };

  const handleDismiss = () => {
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] animate-in slide-in-from-bottom-4 fade-in duration-500">
      <div className="flex items-center gap-3 rounded-full bg-primary text-primary-foreground shadow-lg px-5 py-3">
        <button
          onClick={handlePlay}
          className="flex items-center gap-2 text-sm font-medium"
        >
          <Play className="h-4 w-4" />
          <span>🎵 הקלק להפעלת מוזיקת רקע</span>
        </button>
        <button
          onClick={handleDismiss}
          className="opacity-70 hover:opacity-100 transition-opacity"
          aria-label="סגור"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
