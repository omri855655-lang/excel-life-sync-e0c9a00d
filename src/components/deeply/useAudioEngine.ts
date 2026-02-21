import { useState, useCallback, useRef, useEffect } from "react";
import { AudioPreset } from "./audioPresets";

export function useAudioEngine() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const nodesRef = useRef<AudioNode[]>([]);
  const [activePresetId, setActivePresetId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const stopAudio = useCallback(() => {
    nodesRef.current.forEach(node => {
      try {
        if (node instanceof OscillatorNode) node.stop();
      } catch {}
    });
    nodesRef.current = [];
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  const playPreset = useCallback((preset: AudioPreset) => {
    stopAudio();

    const ctx = new AudioContext();
    audioContextRef.current = ctx;
    const nodes: AudioNode[] = [];

    const merger = ctx.createChannelMerger(2);
    const masterGain = ctx.createGain();
    masterGain.gain.value = preset.gainLevel;

    // Optional LFO for amplitude modulation
    let lfoGain: GainNode | undefined;
    if (preset.lfoRate && preset.lfoDepth) {
      const lfo = ctx.createOscillator();
      lfo.frequency.value = preset.lfoRate;
      lfo.type = "sine";
      lfoGain = ctx.createGain();
      lfoGain.gain.value = preset.lfoDepth * preset.gainLevel;
      lfo.connect(lfoGain);
      lfoGain.connect(masterGain.gain);
      lfo.start();
      nodes.push(lfo);
    }

    // Left channel - base frequency
    const left = ctx.createOscillator();
    left.frequency.value = preset.baseFreq;
    left.type = preset.waveform;
    const gainL = ctx.createGain();
    gainL.gain.value = 1;
    left.connect(gainL);
    gainL.connect(merger, 0, 0);
    left.start();
    nodes.push(left);

    // Right channel - base + binaural offset
    const right = ctx.createOscillator();
    right.frequency.value = preset.baseFreq + preset.binauralOffset;
    right.type = preset.waveform;
    const gainR = ctx.createGain();
    gainR.gain.value = 1;
    right.connect(gainR);
    gainR.connect(merger, 0, 1);
    right.start();
    nodes.push(right);

    // Harmonics (played in both channels for richness)
    if (preset.harmonics) {
      for (const h of preset.harmonics) {
        const hOsc = ctx.createOscillator();
        hOsc.frequency.value = h.freq;
        hOsc.type = h.wave;
        const hGain = ctx.createGain();
        hGain.gain.value = h.gain;
        hOsc.connect(hGain);
        // Split harmonics slightly between channels for width
        const hGainL = ctx.createGain();
        hGainL.gain.value = 0.7;
        const hGainR = ctx.createGain();
        hGainR.gain.value = 0.7;
        hGain.connect(hGainL);
        hGain.connect(hGainR);
        hGainL.connect(merger, 0, 0);
        hGainR.connect(merger, 0, 1);
        hOsc.start();
        nodes.push(hOsc);
      }
    }

    merger.connect(masterGain);
    masterGain.connect(ctx.destination);

    nodesRef.current = nodes;
    setActivePresetId(preset.id);
    setIsPlaying(true);
  }, [stopAudio]);

  const toggle = useCallback((preset: AudioPreset) => {
    if (activePresetId === preset.id && isPlaying) {
      stopAudio();
      setActivePresetId(null);
    } else {
      playPreset(preset);
    }
  }, [activePresetId, isPlaying, playPreset, stopAudio]);

  useEffect(() => {
    return () => { stopAudio(); };
  }, [stopAudio]);

  return { activePresetId, isPlaying, toggle, stopAudio };
}
