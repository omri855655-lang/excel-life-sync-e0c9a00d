import { useState, useEffect, useRef } from "react";
import { Play, X } from "lucide-react";
import { startSilentAudio } from "./deeply/iosSilentAudio";
import { unlockAudioContext, getSharedAudioContext } from "./deeply/iosAudioUnlock";

const STORAGE_KEY = "ios-music-banner-dismissed";

export default function IosMusicBanner() {
  const [visible, setVisible] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    if (!isIOS) return;
    if (localStorage.getItem(STORAGE_KEY) === "true") return;
    setVisible(true);
  }, []);

  const handlePlay = () => {
    // 1. Unlock/create AudioContext on user gesture — forces media channel (bypasses silent mode)
    unlockAudioContext();

    // 2. Play a silent <audio> element so iOS keeps the page alive in background
    if (!audioRef.current) {
      const audio = new Audio();
      audio.src = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=";
      audio.loop = true;
      audio.volume = 0.01;
      (audio as any).playsInline = true;
      (audio as any).webkitPlaysInline = true;
      audio.preload = "auto";
      audio.setAttribute("playsinline", "true");
      audio.setAttribute("webkit-playsinline", "true");
      audio.setAttribute("x-webkit-airplay", "allow");
      audioRef.current = audio;
    }
    audioRef.current.play().catch(() => {});

    // 3. Also start the shared silent audio helper
    startSilentAudio();

    localStorage.setItem(STORAGE_KEY, "true");
    setVisible(false);
  };

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, "true");
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
