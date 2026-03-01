/**
 * iOS Audio Unlock — forces audio through the MEDIA channel (not ringer).
 * Stores AudioContext on window to survive component remounts.
 * Resumes on visibilitychange, pageshow, and focus events.
 */

declare global {
  interface Window {
    _sharedAudioCtx?: AudioContext;
  }
}

const AudioContextClass =
  (window as any).AudioContext || (window as any).webkitAudioContext;

/** Create / resume the shared AudioContext. Call inside a user gesture. */
export function unlockAudioContext(): AudioContext {
  if (!window._sharedAudioCtx) {
    window._sharedAudioCtx = new AudioContextClass();
  }
  if (window._sharedAudioCtx.state === "suspended") {
    window._sharedAudioCtx.resume().catch(() => {});
  }
  return window._sharedAudioCtx;
}

/** Get the shared context (may be null if not yet unlocked). */
export function getSharedAudioContext(): AudioContext | null {
  return window._sharedAudioCtx || null;
}

/**
 * Auto-unlock on first touch/click anywhere on the page.
 */
function autoUnlockOnFirstInteraction() {
  const handler = () => {
    unlockAudioContext();
    document.removeEventListener("touchstart", handler, true);
    document.removeEventListener("click", handler, true);
  };
  document.addEventListener("touchstart", handler, { capture: true, once: false });
  document.addEventListener("click", handler, { capture: true, once: false });
}

/**
 * Resume AudioContext when returning from background / screen lock.
 */
function setupBackgroundResume() {
  const resume = () => {
    const ctx = window._sharedAudioCtx;
    if (ctx && ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }
  };

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) resume();
  });
  window.addEventListener("pageshow", resume);
  window.addEventListener("focus", resume);
}

autoUnlockOnFirstInteraction();
setupBackgroundResume();
