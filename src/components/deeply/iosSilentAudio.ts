/**
 * iOS Safari Background Audio Trick
 * 
 * iOS Safari suspends Web Audio API and JavaScript when the page goes to background
 * or the screen locks. By playing a silent HTML <audio> element alongside the Web Audio,
 * we tell iOS that media is actively playing, which prevents suspension.
 * 
 * This uses a tiny silent WAV file encoded as a data URI.
 */

// 1-second silent WAV file as base64 data URI
const SILENT_WAV = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=";

let silentAudio: HTMLAudioElement | null = null;

export function startSilentAudio() {
  if (silentAudio) return; // already running

  try {
    silentAudio = new Audio(SILENT_WAV);
    silentAudio.loop = true;
    silentAudio.volume = 0.01; // near-silent but not 0 (iOS ignores volume=0)
    
    // Required for iOS
    silentAudio.setAttribute("playsinline", "true");
    (silentAudio as any).playsInline = true;
    
    const playPromise = silentAudio.play();
    if (playPromise) {
      playPromise.catch(() => {
        // Autoplay blocked — will retry on next user interaction
        silentAudio = null;
      });
    }
  } catch {
    silentAudio = null;
  }
}

export function stopSilentAudio() {
  if (silentAudio) {
    silentAudio.pause();
    silentAudio.src = "";
    silentAudio = null;
  }
}

export function isSilentAudioActive(): boolean {
  return silentAudio !== null && !silentAudio.paused;
}
