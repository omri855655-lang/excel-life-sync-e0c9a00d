export type DeeplyAudioKind = "music" | "freq" | "youtube";

export interface DeeplyAudioStateValue {
  playing: boolean;
  name: string;
  stop: () => void;
}

type DeeplyAudioWindowKey = "_deeplyMusicState" | "_deeplyFreqState" | "_deeplyYoutubeState";

export interface DeeplyYoutubePlayerState {
  videoId: string | null;
  title: string;
}

declare global {
  interface Window {
    _deeplyMusicState?: DeeplyAudioStateValue;
    _deeplyFreqState?: DeeplyAudioStateValue;
    _deeplyYoutubeState?: DeeplyAudioStateValue;
    _deeplyAudioStateListeners?: Set<() => void>;
    _deeplyYoutubePlayerState?: DeeplyYoutubePlayerState;
    _deeplyYoutubePlayerListeners?: Set<() => void>;
  }
}

const EMPTY_STATE: DeeplyAudioStateValue = {
  playing: false,
  name: "",
  stop: () => {},
};

const AUDIO_STATE_KEYS: Record<DeeplyAudioKind, DeeplyAudioWindowKey> = {
  music: "_deeplyMusicState",
  freq: "_deeplyFreqState",
  youtube: "_deeplyYoutubeState",
};

function canUseWindow() {
  return typeof window !== "undefined";
}

function getAudioStateKey(kind: DeeplyAudioKind) {
  return AUDIO_STATE_KEYS[kind];
}

function notifyDeeplyAudioListeners() {
  if (!canUseWindow()) return;
  window._deeplyAudioStateListeners?.forEach((listener) => listener());
}

function notifyDeeplyYoutubePlayerListeners() {
  if (!canUseWindow()) return;
  window._deeplyYoutubePlayerListeners?.forEach((listener) => listener());
}

export function setDeeplyAudioState(kind: DeeplyAudioKind, value: DeeplyAudioStateValue) {
  if (!canUseWindow()) return;
  window[getAudioStateKey(kind)] = value;
  notifyDeeplyAudioListeners();
}

export function resetDeeplyAudioState(kind: DeeplyAudioKind) {
  if (!canUseWindow()) return;
  window[getAudioStateKey(kind)] = { ...EMPTY_STATE };
  notifyDeeplyAudioListeners();
}

export function subscribeToDeeplyAudioState(listener: () => void) {
  if (!canUseWindow()) return () => {};

  if (!window._deeplyAudioStateListeners) {
    window._deeplyAudioStateListeners = new Set();
  }

  window._deeplyAudioStateListeners.add(listener);

  return () => {
    window._deeplyAudioStateListeners?.delete(listener);
  };
}

export function getActiveDeeplyAudio() {
  if (!canUseWindow()) return [] as Array<DeeplyAudioStateValue & { kind: DeeplyAudioKind }>;

  return (Object.keys(AUDIO_STATE_KEYS) as DeeplyAudioKind[])
    .map((kind) => ({
      kind,
      ...(window[getAudioStateKey(kind)] || EMPTY_STATE),
    }))
    .filter((state) => state.playing);
}

export function stopOtherDeeplyAudio(activeKind: DeeplyAudioKind) {
  if (!canUseWindow()) return;

  (Object.keys(AUDIO_STATE_KEYS) as DeeplyAudioKind[]).forEach((kind) => {
    if (kind === activeKind) return;
    const state = window[getAudioStateKey(kind)];
    if (state?.playing) {
      state.stop();
    }
  });
}

const EMPTY_YOUTUBE_PLAYER_STATE: DeeplyYoutubePlayerState = {
  videoId: null,
  title: "",
};

export function getDeeplyYoutubePlayerState(): DeeplyYoutubePlayerState {
  if (!canUseWindow()) return EMPTY_YOUTUBE_PLAYER_STATE;
  return window._deeplyYoutubePlayerState || EMPTY_YOUTUBE_PLAYER_STATE;
}

export function setDeeplyYoutubePlayerState(value: DeeplyYoutubePlayerState) {
  if (!canUseWindow()) return;
  window._deeplyYoutubePlayerState = value;
  notifyDeeplyYoutubePlayerListeners();
}

export function resetDeeplyYoutubePlayerState() {
  if (!canUseWindow()) return;
  window._deeplyYoutubePlayerState = { ...EMPTY_YOUTUBE_PLAYER_STATE };
  notifyDeeplyYoutubePlayerListeners();
}

export function subscribeToDeeplyYoutubePlayerState(listener: () => void) {
  if (!canUseWindow()) return () => {};

  if (!window._deeplyYoutubePlayerListeners) {
    window._deeplyYoutubePlayerListeners = new Set();
  }

  window._deeplyYoutubePlayerListeners.add(listener);

  return () => {
    window._deeplyYoutubePlayerListeners?.delete(listener);
  };
}
