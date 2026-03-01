/**
 * Renders an AudioPreset to a WAV Blob using OfflineAudioContext.
 * This creates a real audio file that iOS Safari will keep playing in the background,
 * unlike Web Audio API oscillators which get suspended.
 */

import { AudioPreset } from "./audioPresets";

const RENDER_DURATION_SEC = 900; // 15 minutes

function createNoiseBuffer(sampleRate: number, length: number, type: "white" | "brown" | "pink"): Float32Array {
  const data = new Float32Array(length);

  if (type === "brown") {
    let lastOut = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      lastOut = (lastOut + 0.02 * white) / 1.02;
      data[i] = lastOut * 3.5;
    }
  } else if (type === "pink") {
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
  } else {
    for (let i = 0; i < length; i++) {
      data[i] = Math.random() * 2 - 1;
    }
  }
  return data;
}

function encodeWav(samples: Float32Array, sampleRate: number, numChannels: number): Blob {
  const bytesPerSample = 2;
  const blockAlign = numChannels * bytesPerSample;
  const buffer = new ArrayBuffer(44 + samples.length * bytesPerSample);
  const view = new DataView(buffer);

  function writeString(offset: number, str: string) {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  }

  writeString(0, "RIFF");
  view.setUint32(4, 36 + samples.length * bytesPerSample, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true);
  writeString(36, "data");
  view.setUint32(40, samples.length * bytesPerSample, true);

  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    offset += 2;
  }

  return new Blob([buffer], { type: "audio/wav" });
}

export async function renderPresetToBlob(preset: AudioPreset): Promise<string> {
  // Use lower sample rate for smaller file & faster render
  const sampleRate = 22050;
  const length = sampleRate * RENDER_DURATION_SEC;
  const offCtx = new OfflineAudioContext(2, length, sampleRate);

  const merger = offCtx.createChannelMerger(2);
  const masterGain = offCtx.createGain();
  masterGain.gain.value = preset.gainLevel;

  // LFO
  if (preset.lfoRate && preset.lfoDepth) {
    const lfo = offCtx.createOscillator();
    lfo.frequency.value = preset.lfoRate;
    lfo.type = "sine";
    const lfoGain = offCtx.createGain();
    lfoGain.gain.value = preset.lfoDepth * preset.gainLevel;
    lfo.connect(lfoGain);
    lfoGain.connect(masterGain.gain);
    lfo.start();
  }

  if (preset.noiseType) {
    // Noise-based: create a long noise buffer
    const noiseBuf = offCtx.createBuffer(2, length, sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const chData = noiseBuf.getChannelData(ch);
      const generated = createNoiseBuffer(sampleRate, length, preset.noiseType);
      chData.set(generated);
    }
    const noiseSource = offCtx.createBufferSource();
    noiseSource.buffer = noiseBuf;

    let lastNode: AudioNode = noiseSource;

    if (preset.filterType) {
      const filter = offCtx.createBiquadFilter();
      filter.type = preset.filterType;
      filter.frequency.value = preset.filterFreq || 800;
      filter.Q.value = preset.filterQ || 1;
      lastNode.connect(filter);
      lastNode = filter;
    }
    if (preset.filter2Type) {
      const filter2 = offCtx.createBiquadFilter();
      filter2.type = preset.filter2Type;
      filter2.frequency.value = preset.filter2Freq || 400;
      filter2.Q.value = preset.filter2Q || 1;
      lastNode.connect(filter2);
      lastNode = filter2;
    }

    const nGL = offCtx.createGain(); nGL.gain.value = 1;
    const nGR = offCtx.createGain(); nGR.gain.value = 1;
    lastNode.connect(nGL); lastNode.connect(nGR);
    nGL.connect(merger, 0, 0); nGR.connect(merger, 0, 1);
    noiseSource.start();

    // Optional tonal layer on noise
    if (preset.baseFreq > 0 && preset.binauralOffset > 0) {
      const toneGain = offCtx.createGain();
      toneGain.gain.value = preset.toneLevel || 0.3;
      const left = offCtx.createOscillator();
      left.frequency.value = preset.baseFreq; left.type = preset.waveform;
      left.connect(toneGain); left.start();
      const right = offCtx.createOscillator();
      right.frequency.value = preset.baseFreq + preset.binauralOffset; right.type = preset.waveform;
      right.connect(toneGain); right.start();
      const tGL = offCtx.createGain(); tGL.gain.value = 0.5;
      const tGR = offCtx.createGain(); tGR.gain.value = 0.5;
      toneGain.connect(tGL); toneGain.connect(tGR);
      tGL.connect(merger, 0, 0); tGR.connect(merger, 0, 1);
    }
  } else {
    // Oscillator-based
    const left = offCtx.createOscillator();
    left.frequency.value = preset.baseFreq;
    left.type = preset.waveform;
    if (preset.detune) left.detune.value = preset.detune;

    let leftChain: AudioNode = left;
    if (preset.filterType) {
      const f = offCtx.createBiquadFilter();
      f.type = preset.filterType; f.frequency.value = preset.filterFreq || 800; f.Q.value = preset.filterQ || 1;
      left.connect(f); leftChain = f;
    }
    const gL = offCtx.createGain(); gL.gain.value = 1;
    leftChain.connect(gL); gL.connect(merger, 0, 0);
    left.start();

    const right = offCtx.createOscillator();
    right.frequency.value = preset.baseFreq + preset.binauralOffset;
    right.type = preset.waveform;
    if (preset.detune) right.detune.value = -(preset.detune);

    let rightChain: AudioNode = right;
    if (preset.filterType) {
      const f = offCtx.createBiquadFilter();
      f.type = preset.filterType; f.frequency.value = preset.filterFreq || 800; f.Q.value = preset.filterQ || 1;
      right.connect(f); rightChain = f;
    }
    const gR = offCtx.createGain(); gR.gain.value = 1;
    rightChain.connect(gR); gR.connect(merger, 0, 1);
    right.start();
  }

  // Harmonics
  if (preset.harmonics) {
    for (const h of preset.harmonics) {
      const hOsc = offCtx.createOscillator();
      hOsc.frequency.value = h.freq; hOsc.type = h.wave;
      if (h.detune) hOsc.detune.value = h.detune;

      let hChain: AudioNode = hOsc;
      if (h.filterFreq) {
        const hf = offCtx.createBiquadFilter();
        hf.type = "lowpass"; hf.frequency.value = h.filterFreq; hf.Q.value = 0.7;
        hOsc.connect(hf); hChain = hf;
      }
      const hGain = offCtx.createGain(); hGain.gain.value = h.gain;
      hChain.connect(hGain);

      const panL = offCtx.createGain(); panL.gain.value = h.panL ?? 0.7;
      const panR = offCtx.createGain(); panR.gain.value = h.panR ?? 0.7;
      hGain.connect(panL); hGain.connect(panR);
      panL.connect(merger, 0, 0); panR.connect(merger, 0, 1);
      hOsc.start();
    }
  }

  merger.connect(masterGain);
  masterGain.connect(offCtx.destination);

  const rendered = await offCtx.startRendering();

  // Interleave channels for WAV encoding
  const ch0 = rendered.getChannelData(0);
  const ch1 = rendered.getChannelData(1);
  const interleaved = new Float32Array(ch0.length * 2);
  for (let i = 0; i < ch0.length; i++) {
    interleaved[i * 2] = ch0[i];
    interleaved[i * 2 + 1] = ch1[i];
  }

  const wavBlob = encodeWav(interleaved, sampleRate, 2);
  return URL.createObjectURL(wavBlob);
}
