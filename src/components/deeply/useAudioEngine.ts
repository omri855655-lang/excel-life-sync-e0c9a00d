import { useState, useCallback, useRef, useEffect } from "react";
import { AudioPreset } from "./audioPresets";
import { startSilentAudio, stopSilentAudio } from "./iosSilentAudio";
import { unlockAudioContext } from "./iosAudioUnlock";

// Generate a noise buffer (white noise source that we filter)
function createNoiseBuffer(ctx: AudioContext, durationSec = 4): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const length = sampleRate * durationSec;
  const buffer = ctx.createBuffer(2, length, sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const data = buffer.getChannelData(ch);
    for (let i = 0; i < length; i++) {
      data[i] = Math.random() * 2 - 1;
    }
  }
  return buffer;
}

// Generate brown noise buffer (integrated white noise → low-frequency rumble)
function createBrownNoiseBuffer(ctx: AudioContext, durationSec = 4): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const length = sampleRate * durationSec;
  const buffer = ctx.createBuffer(2, length, sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const data = buffer.getChannelData(ch);
    let lastOut = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      lastOut = (lastOut + 0.02 * white) / 1.02;
      data[i] = lastOut * 3.5; // amplify
    }
  }
  return buffer;
}

// Generate pink noise buffer (1/f spectrum)
function createPinkNoiseBuffer(ctx: AudioContext, durationSec = 4): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const length = sampleRate * durationSec;
  const buffer = ctx.createBuffer(2, length, sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const data = buffer.getChannelData(ch);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
    }
  }
  return buffer;
}

export function useAudioEngine() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const nodesRef = useRef<AudioNode[]>([]);
  const sourceNodesRef = useRef<(AudioBufferSourceNode | OscillatorNode)[]>([]);
  const [activePresetId, setActivePresetId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const stopAudio = useCallback(() => {
    sourceNodesRef.current.forEach(node => {
      try { node.stop(); } catch {}
    });
    sourceNodesRef.current = [];
    nodesRef.current = [];
    // Do NOT close the shared AudioContext — just clear refs
    audioContextRef.current = null;
    stopSilentAudio();
    setIsPlaying(false);
  }, []);

  const playPreset = useCallback((preset: AudioPreset) => {
    stopAudio();

    // Reuse the shared unlocked AudioContext (media channel on iOS)
    const ctx = unlockAudioContext();
    audioContextRef.current = ctx;
    const allNodes: AudioNode[] = [];
    const sourceNodes: (AudioBufferSourceNode | OscillatorNode)[] = [];

    const merger = ctx.createChannelMerger(2);
    const masterGain = ctx.createGain();
    masterGain.gain.value = preset.gainLevel;

    // Optional LFO for amplitude modulation
    if (preset.lfoRate && preset.lfoDepth) {
      const lfo = ctx.createOscillator();
      lfo.frequency.value = preset.lfoRate;
      lfo.type = "sine";
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = preset.lfoDepth * preset.gainLevel;
      lfo.connect(lfoGain);
      lfoGain.connect(masterGain.gain);
      lfo.start();
      sourceNodes.push(lfo);
    }

    // === NOISE-BASED PRESETS ===
    if (preset.noiseType) {
      let noiseBuffer: AudioBuffer;
      switch (preset.noiseType) {
        case "brown":
          noiseBuffer = createBrownNoiseBuffer(ctx, 4);
          break;
        case "pink":
          noiseBuffer = createPinkNoiseBuffer(ctx, 4);
          break;
        default:
          noiseBuffer = createNoiseBuffer(ctx, 4);
          break;
      }

      // Create looping noise source
      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = noiseBuffer;
      noiseSource.loop = true;

      let lastNode: AudioNode = noiseSource;

      // Apply filter chain
      if (preset.filterType) {
        const filter = ctx.createBiquadFilter();
        filter.type = preset.filterType;
        filter.frequency.value = preset.filterFreq || 800;
        filter.Q.value = preset.filterQ || 1;
        lastNode.connect(filter);
        lastNode = filter;
        allNodes.push(filter);
      }

      // Second filter if specified
      if (preset.filter2Type) {
        const filter2 = ctx.createBiquadFilter();
        filter2.type = preset.filter2Type;
        filter2.frequency.value = preset.filter2Freq || 400;
        filter2.Q.value = preset.filter2Q || 1;
        lastNode.connect(filter2);
        lastNode = filter2;
        allNodes.push(filter2);
      }

      // Noise goes to both channels
      const noiseGainL = ctx.createGain();
      noiseGainL.gain.value = 1;
      const noiseGainR = ctx.createGain();
      noiseGainR.gain.value = 1;
      lastNode.connect(noiseGainL);
      lastNode.connect(noiseGainR);
      noiseGainL.connect(merger, 0, 0);
      noiseGainR.connect(merger, 0, 1);

      noiseSource.start();
      sourceNodes.push(noiseSource);

      // Add optional tonal layer on top of noise
      if (preset.baseFreq > 0 && preset.binauralOffset > 0) {
        const toneGain = ctx.createGain();
        toneGain.gain.value = preset.toneLevel || 0.3;

        const left = ctx.createOscillator();
        left.frequency.value = preset.baseFreq;
        left.type = preset.waveform;
        const gL = ctx.createGain();
        gL.gain.value = 1;
        left.connect(gL);
        gL.connect(toneGain);
        left.start();
        sourceNodes.push(left);

        const right = ctx.createOscillator();
        right.frequency.value = preset.baseFreq + preset.binauralOffset;
        right.type = preset.waveform;
        const gR = ctx.createGain();
        gR.gain.value = 1;
        right.connect(gR);
        gR.connect(toneGain);
        right.start();
        sourceNodes.push(right);

        const tGainL = ctx.createGain();
        tGainL.gain.value = 0.5;
        const tGainR = ctx.createGain();
        tGainR.gain.value = 0.5;
        toneGain.connect(tGainL);
        toneGain.connect(tGainR);
        tGainL.connect(merger, 0, 0);
        tGainR.connect(merger, 0, 1);
      }
    } else {
      // === OSCILLATOR-BASED PRESETS ===
      // Left channel - base frequency
      const left = ctx.createOscillator();
      left.frequency.value = preset.baseFreq;
      left.type = preset.waveform;
      if (preset.detune) left.detune.value = preset.detune;

      let leftChain: AudioNode = left;

      // Optional per-oscillator filter
      if (preset.filterType) {
        const filter = ctx.createBiquadFilter();
        filter.type = preset.filterType;
        filter.frequency.value = preset.filterFreq || 800;
        filter.Q.value = preset.filterQ || 1;
        left.connect(filter);
        leftChain = filter;
        allNodes.push(filter);
      }

      const gainL = ctx.createGain();
      gainL.gain.value = 1;
      leftChain.connect(gainL);
      gainL.connect(merger, 0, 0);
      left.start();
      sourceNodes.push(left);

      // Right channel - base + binaural offset
      const right = ctx.createOscillator();
      right.frequency.value = preset.baseFreq + preset.binauralOffset;
      right.type = preset.waveform;
      if (preset.detune) right.detune.value = -(preset.detune);

      let rightChain: AudioNode = right;

      if (preset.filterType) {
        const filter = ctx.createBiquadFilter();
        filter.type = preset.filterType;
        filter.frequency.value = preset.filterFreq || 800;
        filter.Q.value = preset.filterQ || 1;
        right.connect(filter);
        rightChain = filter;
        allNodes.push(filter);
      }

      const gainR = ctx.createGain();
      gainR.gain.value = 1;
      rightChain.connect(gainR);
      gainR.connect(merger, 0, 1);
      right.start();
      sourceNodes.push(right);
    }

    // Harmonics (played in both channels for richness)
    if (preset.harmonics) {
      for (const h of preset.harmonics) {
        const hOsc = ctx.createOscillator();
        hOsc.frequency.value = h.freq;
        hOsc.type = h.wave;
        if (h.detune) hOsc.detune.value = h.detune;

        let hChain: AudioNode = hOsc;

        // Per-harmonic filter
        if (h.filterFreq) {
          const hFilter = ctx.createBiquadFilter();
          hFilter.type = "lowpass";
          hFilter.frequency.value = h.filterFreq;
          hFilter.Q.value = 0.7;
          hOsc.connect(hFilter);
          hChain = hFilter;
          allNodes.push(hFilter);
        }

        const hGain = ctx.createGain();
        hGain.gain.value = h.gain;
        hChain.connect(hGain);

        // Pan harmonics for stereo width
        const panL = ctx.createGain();
        panL.gain.value = h.panL ?? 0.7;
        const panR = ctx.createGain();
        panR.gain.value = h.panR ?? 0.7;
        hGain.connect(panL);
        hGain.connect(panR);
        panL.connect(merger, 0, 0);
        panR.connect(merger, 0, 1);

        hOsc.start();
        sourceNodes.push(hOsc);
      }
    }

    merger.connect(masterGain);
    masterGain.connect(ctx.destination);

    nodesRef.current = allNodes;
    sourceNodesRef.current = sourceNodes;
    // Start silent audio trick for iOS Safari background playback
    startSilentAudio();
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

  // Resume audio context when returning from background
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && audioContextRef.current && audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      stopAudio();
    };
  }, [stopAudio]);

  return { activePresetId, isPlaying, toggle, stopAudio };
}
