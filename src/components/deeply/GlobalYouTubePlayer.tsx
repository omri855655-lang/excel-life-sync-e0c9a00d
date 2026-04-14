import { useEffect, useMemo, useState } from "react";
import {
  getDeeplyYoutubePlayerState,
  resetDeeplyAudioState,
  resetDeeplyYoutubePlayerState,
  setDeeplyAudioState,
  subscribeToDeeplyYoutubePlayerState,
} from "./deeplyAudioState";

export function GlobalYouTubePlayer() {
  const [playerState, setPlayerState] = useState(getDeeplyYoutubePlayerState());

  useEffect(() => {
    setPlayerState(getDeeplyYoutubePlayerState());
    return subscribeToDeeplyYoutubePlayerState(() => {
      setPlayerState(getDeeplyYoutubePlayerState());
    });
  }, []);

  useEffect(() => {
    if (!playerState.videoId) {
      resetDeeplyAudioState("youtube");
      return;
    }

    setDeeplyAudioState("youtube", {
      playing: true,
      name: playerState.title || "YouTube",
      stop: () => {
        resetDeeplyYoutubePlayerState();
      },
    });

    return () => {
      resetDeeplyAudioState("youtube");
    };
  }, [playerState.videoId, playerState.title]);

  const iframeSrc = useMemo(() => {
    if (!playerState.videoId) return "";
    const params = new URLSearchParams({
      autoplay: "1",
      playsinline: "1",
      enablejsapi: "1",
      rel: "0",
    });
    return `https://www.youtube.com/embed/${playerState.videoId}?${params.toString()}`;
  }, [playerState.videoId]);

  if (!playerState.videoId) return null;

  return (
    <div
      aria-hidden="true"
      className="fixed bottom-0 right-0 z-[-1] h-px w-px overflow-hidden opacity-0 pointer-events-none"
    >
      <iframe
        key={playerState.videoId}
        width="1"
        height="1"
        src={iframeSrc}
        title={playerState.title || "YouTube Player"}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="border-0"
      />
    </div>
  );
}
