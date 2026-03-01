/**
 * iOS Audio Unlock — forces audio through the MEDIA channel (not ringer).
 *
 * On iOS, Web Audio API output goes through the media channel which is NOT
 * affected by the hardware silent switch. But the AudioContext must be created
 * or resumed during a user gesture. This module provides a shared AudioContext
 * that is unlocked once on first interaction and reused everywhere.
 */

const AudioContextClass =
  (window as any).AudioContext || (window as any).webkitAudioContext;

let sharedCtx: AudioContext | null = null;

/** Create / resume the shared AudioContext. Call inside a user gesture. */
export function unlockAudioContext(): AudioContext {
  if (!sharedCtx) {
    sharedCtx = new AudioContextClass();
  }
  if (sharedCtx.state === "suspended") {
    sharedCtx.resume().catch(() => {});
  }
  return sharedCtx;
}

/** Get the shared context (may be null if not yet unlocked). */
export function getSharedAudioContext(): AudioContext | null {
  return sharedCtx;
}

/**
 * Auto-unlock on first touch/click anywhere on the page.
 * This ensures that even if the user skips the banner, the first
 * tap in the app will unlock audio through the media channel.
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

autoUnlockOnFirstInteraction();
