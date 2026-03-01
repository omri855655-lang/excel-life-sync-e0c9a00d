/**
 * iOS Safari Background Audio — MediaSession Integration
 * 
 * Uses a real (but near-silent) tone WAV so iOS registers it as actual media.
 * Sets MediaSession metadata so the OS shows playback controls and keeps audio alive.
 */

// Generate a real WAV with a barely-audible 200Hz tone (not empty silence)
function generateToneWavBlob(): Blob {
  const sampleRate = 44100;
  const duration = 2; // 2 seconds, looped
  const numSamples = sampleRate * duration;
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const dataSize = numSamples * blockAlign;
  const headerSize = 44;
  const buffer = new ArrayBuffer(headerSize + dataSize);
  const view = new DataView(buffer);

  // WAV header
  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  };
  writeString(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeString(36, "data");
  view.setUint32(40, dataSize, true);

  // Write a very quiet 200Hz sine tone
  const amplitude = 100; // out of 32767 — barely audible
  for (let i = 0; i < numSamples; i++) {
    const sample = Math.sin((2 * Math.PI * 200 * i) / sampleRate) * amplitude;
    view.setInt16(headerSize + i * 2, sample, true);
  }

  return new Blob([buffer], { type: "audio/wav" });
}

let silentAudio: HTMLAudioElement | null = null;
let blobUrl: string | null = null;

function setupMediaSession(audio: HTMLAudioElement) {
  if (!("mediaSession" in navigator)) return;

  navigator.mediaSession.metadata = new MediaMetadata({
    title: "ExcelTime - מוזיקת רקע",
    artist: "ExcelTime",
    album: "",
    artwork: [
      { src: "/pwa-192x192.png", sizes: "192x192", type: "image/png" },
      { src: "/pwa-512x512.png", sizes: "512x512", type: "image/png" },
    ],
  });

  navigator.mediaSession.setActionHandler("play", () => {
    audio.play();
  });
  navigator.mediaSession.setActionHandler("pause", () => {
    audio.pause();
  });
}

export function startSilentAudio() {
  if (silentAudio) return;

  try {
    const blob = generateToneWavBlob();
    blobUrl = URL.createObjectURL(blob);

    silentAudio = new Audio(blobUrl);
    silentAudio.loop = true;
    silentAudio.volume = 0.01;

    // iOS compatibility attributes
    silentAudio.setAttribute("playsinline", "true");
    (silentAudio as any).playsInline = true;
    silentAudio.setAttribute("webkit-playsinline", "true");
    silentAudio.setAttribute("x-webkit-airplay", "allow");
    silentAudio.preload = "auto";

    const playPromise = silentAudio.play();
    if (playPromise) {
      playPromise
        .then(() => {
          setupMediaSession(silentAudio!);
        })
        .catch(() => {
          silentAudio = null;
          if (blobUrl) { URL.revokeObjectURL(blobUrl); blobUrl = null; }
        });
    }
  } catch {
    silentAudio = null;
    if (blobUrl) { URL.revokeObjectURL(blobUrl); blobUrl = null; }
  }
}

export function stopSilentAudio() {
  if (silentAudio) {
    silentAudio.pause();
    silentAudio.src = "";
    silentAudio = null;
  }
  if (blobUrl) {
    URL.revokeObjectURL(blobUrl);
    blobUrl = null;
  }
}

export function isSilentAudioActive(): boolean {
  return silentAudio !== null && !silentAudio.paused;
}
