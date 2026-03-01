import { useState, useEffect } from "react";
import { Music, Pause, StopCircle } from "lucide-react";

/**
 * Tiny floating mini-player that appears when Deeply music is playing
 * and the user navigates away from the Deeply tab.
 * Reads from window._deeplyMusicState (set by DeeplyMusicPlayer).
 */

declare global {
  interface Window {
    _deeplyMusicState?: {
      playing: boolean;
      name: string;
      stop: () => void;
    };
  }
}

interface FloatingMusicMiniProps {
  visible: boolean;
  onGoToDeeply?: () => void;
}

export function FloatingMusicMini({ visible, onGoToDeeply }: FloatingMusicMiniProps) {
  const [musicState, setMusicState] = useState(window._deeplyMusicState);

  // Poll for state changes (lightweight — every 1s)
  useEffect(() => {
    const interval = setInterval(() => {
      setMusicState(window._deeplyMusicState ? { ...window._deeplyMusicState } : undefined);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!visible || !musicState?.playing) return null;

  return (
    <div className="fixed bottom-4 left-4 z-[100] animate-in slide-in-from-bottom-2 fade-in duration-300">
      <div
        className="w-14 h-14 rounded-xl bg-purple-600 shadow-lg shadow-purple-900/40 flex flex-col items-center justify-center cursor-pointer hover:scale-105 transition-transform relative group"
        onClick={onGoToDeeply}
        title={musicState.name || "מוזיקה מנגנת"}
      >
        <Music className="h-5 w-5 text-white animate-pulse" />
        <span className="text-[8px] text-white/70 mt-0.5 leading-none">מנגן</span>

        {/* Stop button on hover */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            musicState.stop();
          }}
          className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
          title="עצור מוזיקה"
        >
          <StopCircle className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
