/**
 * iOS Safari Background Audio — MediaSession Integration
 * 
 * Uses a real (but near-silent) tone WAV so iOS registers it as actual media.
 * Sets MediaSession metadata so the OS shows playback controls and keeps audio alive.
 */

const SILENT_WAV = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=";

let silentAudio: HTMLAudioElement | null = null;

export function startSilentAudio() {
  if (silentAudio && !silentAudio.paused) return;

  if (!silentAudio) {
    silentAudio = new Audio(SILENT_WAV);
    silentAudio.loop = true;
    silentAudio.volume = 0.001;
    silentAudio.setAttribute("playsinline", "true");
    (silentAudio as any).playsInline = true;
  }

  silentAudio.play().catch(() => {});

  // Register MediaSession so iOS treats this as real media
  // This is what makes audio continue in background (like YouTube)
  if ("mediaSession" in navigator) {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: "Deeply — מוזיקת רקע",
      artist: "ExcelTime",
      artwork: [
        { src: "/pwa-192x192.png", sizes: "192x192", type: "image/png" },
        { src: "/pwa-512x512.png", sizes: "512x512", type: "image/png" },
      ],
    });

    navigator.mediaSession.setActionHandler("play", () => {
      silentAudio?.play().catch(() => {});
    });

    navigator.mediaSession.setActionHandler("pause", () => {
      // intentionally do nothing — keep playing
    });

    navigator.mediaSession.setActionHandler("stop", () => {
      silentAudio?.pause();
    });
  }
}

export function stopSilentAudio() {
  if (silentAudio) {
    silentAudio.pause();
    silentAudio = null;
  }
  if ("mediaSession" in navigator) {
    navigator.mediaSession.metadata = null;
  }
}

export function isSilentAudioActive(): boolean {
  return silentAudio !== null && !silentAudio.paused;
}
