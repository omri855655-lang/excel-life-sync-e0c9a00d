/**
 * iOS Safari Background Audio — uses a real hosted MP3 file
 * attached to the DOM so iOS AVFoundation registers the audio session.
 */

const SILENT_MP3_URL = "/silence.mp3";

let silentAudio: HTMLAudioElement | null = null;

export function startSilentAudio() {
  if (silentAudio && !silentAudio.paused) return;

  if (!silentAudio) {
    silentAudio = new Audio(SILENT_MP3_URL);
    silentAudio.loop = true;
    silentAudio.volume = 0.001;
    silentAudio.setAttribute("playsinline", "true");
    (silentAudio as any).playsInline = true;

    // Attach to DOM so iOS treats it as a real media element
    silentAudio.style.display = "none";
    document.body.appendChild(silentAudio);
  }

  silentAudio.play().catch(() => {});

  // Register MediaSession so iOS treats this as real media
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
    if (silentAudio.parentNode) {
      silentAudio.parentNode.removeChild(silentAudio);
    }
    silentAudio = null;
  }
  if ("mediaSession" in navigator) {
    navigator.mediaSession.metadata = null;
  }
}

export function isSilentAudioActive(): boolean {
  return silentAudio !== null && !silentAudio.paused;
}
