// Web Audio API Synth & Sample Engine for HUMASON Sonic Archivist

let audioCtx: AudioContext | null = null;
let currentOscillators: (OscillatorNode | AudioBufferSourceNode | BiquadFilterNode)[] = [];
let gainNode: GainNode | null = null;
let analyserNode: AnalyserNode | null = null;
let currentAudioElement: HTMLAudioElement | null = null;
let currentMediaSourceNode: MediaElementAudioSourceNode | null = null;

let isPlaying = false;
let playStartTime = 0;
let playbackDuration = 262; // in seconds
let activeSoundType: string = 'medina';

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function startSynthAudio(type: string = 'medina', volume: number = 0.8, audioUrl?: string) {
  stopSynthAudio();
  const ctx = getAudioContext();

  gainNode = ctx.createGain();
  gainNode.gain.setValueAtTime(volume, ctx.currentTime);

  analyserNode = ctx.createAnalyser();
  analyserNode.fftSize = 128;
  analyserNode.smoothingTimeConstant = 0.82;

  gainNode.connect(analyserNode);
  analyserNode.connect(ctx.destination);

  activeSoundType = type;
  isPlaying = true;
  playStartTime = ctx.currentTime;

  // If a real audio file / Blob URL / Stream URL was provided (e.g. from user deposit or live master)
  if (audioUrl && audioUrl.trim().length > 0) {
    try {
      const audio = new Audio();
      audio.crossOrigin = 'anonymous';
      audio.src = audioUrl;
      audio.volume = volume;
      
      const source = ctx.createMediaElementSource(audio);
      source.connect(gainNode);
      currentMediaSourceNode = source;
      currentAudioElement = audio;

      audio.addEventListener('loadedmetadata', () => {
        if (audio.duration && !isNaN(audio.duration)) {
          playbackDuration = Math.floor(audio.duration);
        }
      });

      audio.addEventListener('ended', () => {
        stopSynthAudio();
      });

      audio.play().catch((err) => {
        console.warn('HTML Audio playback fallback to synthesis:', err);
        // Fallback to generative acoustic synthesis if blob/URL cannot play
        dispatchProceduralSynthesis(type, ctx, gainNode!);
      });
      return;
    } catch (e) {
      console.warn('Error loading audio URL, falling back to procedural synth', e);
    }
  }

  // Generative Procedural Synthesis based on Sound Type / Acoustic Genre
  dispatchProceduralSynthesis(type, ctx, gainNode);
}

function dispatchProceduralSynthesis(type: string, ctx: AudioContext, destination: GainNode) {
  const normType = (type || 'medina').toLowerCase();

  if (normType.includes('oud') || normType.includes('m7ayer') || normType.includes('luth')) {
    createOudMelody(ctx, destination);
  } else if (normType.includes('nay') || normType.includes('flute') || normType.includes('soufi')) {
    createNayFluteMelody(ctx, destination);
  } else if (normType.includes('mezwed') || normType.includes('cornemuse') || normType.includes('bagpipe')) {
    createMezwedDroneAndMelody(ctx, destination);
  } else if (normType.includes('darbuka') || normType.includes('derbouka') || normType.includes('percussion')) {
    createDarbukaRhythm(ctx, destination);
  } else if (normType.includes('bendir') || normType.includes('trance')) {
    createBendirRhythm(ctx, destination);
  } else if (normType.includes('malouf') || normType.includes('andalous')) {
    createMaloufOrchestra(ctx, destination);
  } else if (normType.includes('gnawa') || normType.includes('guembri') || normType.includes('stambali')) {
    createGnawaGuembriAndQraqeb(ctx, destination);
  } else if (normType.includes('desert') || normType.includes('sahara') || normType.includes('dunes') || normType.includes('vent')) {
    createAmbientWind(ctx, destination);
  } else if (normType.includes('coastal') || normType.includes('mer') || normType.includes('vague') || normType.includes('ocean')) {
    createOceanWaves(ctx, destination);
  } else if (normType.includes('oasis') || normType.includes('eau') || normType.includes('water') || normType.includes('source')) {
    createOasisSpring(ctx, destination);
  } else if (normType.includes('biophony') || normType.includes('oiseau') || normType.includes('bird') || normType.includes('ichkeul')) {
    createBirdBiophony(ctx, destination);
  } else {
    // Medina & ambient heritage default
    createMedinaAtmosphere(ctx, destination);
  }
}

export function stopSynthAudio() {
  if (currentAudioElement) {
    try {
      currentAudioElement.pause();
      currentAudioElement.currentTime = 0;
    } catch {
      // Ignore audio element errors
    }
    currentAudioElement = null;
  }

  currentOscillators.forEach(node => {
    try {
      if ('stop' in node && typeof node.stop === 'function') {
        node.stop();
      }
      node.disconnect();
    } catch {
      // Ignore cleanup errors
    }
  });
  currentOscillators = [];
  isPlaying = false;
}

export function togglePlayState(type: string = 'medina', volume: number = 0.8, audioUrl?: string): boolean {
  if (isPlaying) {
    stopSynthAudio();
    return false;
  } else {
    startSynthAudio(type, volume, audioUrl);
    return true;
  }
}

export function setSynthVolume(vol: number) {
  const safeVol = Math.max(0, Math.min(1, vol));
  if (gainNode && audioCtx) {
    gainNode.gain.setValueAtTime(safeVol, audioCtx.currentTime);
  }
  if (currentAudioElement) {
    currentAudioElement.volume = safeVol;
  }
}

export function getAudioFrequencyData(): number[] {
  if (!analyserNode || !isPlaying) {
    return Array.from({ length: 24 }, () => Math.floor(Math.random() * 8) + 2);
  }
  const dataArray = new Uint8Array(analyserNode.frequencyBinCount);
  analyserNode.getByteFrequencyData(dataArray);
  const result: number[] = [];
  const step = Math.max(1, Math.floor(dataArray.length / 24));
  for (let i = 0; i < 24; i++) {
    const val = dataArray[i * step] || 0;
    result.push(Math.max(3, Math.floor((val / 255) * 32)));
  }
  return result;
}

export function getRealtimeWaveformData(samplesCount: number = 40): number[] {
  if (!analyserNode || !isPlaying) {
    return [];
  }
  const timeData = new Uint8Array(analyserNode.fftSize);
  analyserNode.getByteTimeDomainData(timeData);
  
  const freqData = new Uint8Array(analyserNode.frequencyBinCount);
  analyserNode.getByteFrequencyData(freqData);

  const amplitudes: number[] = [];
  const step = Math.max(1, Math.floor(timeData.length / samplesCount));

  for (let i = 0; i < samplesCount; i++) {
    const rawVal = timeData[i * step] || 128;
    const deviation = Math.abs(rawVal - 128) / 128;
    const freqVal = (freqData[i % freqData.length] || 0) / 255;
    const combined = Math.min(1, deviation * 0.7 + freqVal * 0.6);
    amplitudes.push(combined);
  }
  return amplitudes;
}

export function getIsPlayingState(): boolean {
  return isPlaying;
}

export function getPlaybackProgress(): { elapsed: number; total: number; progressRatio: number } {
  if (!isPlaying) {
    return { elapsed: 0, total: playbackDuration, progressRatio: 0 };
  }

  if (currentAudioElement && !isNaN(currentAudioElement.duration) && currentAudioElement.duration > 0) {
    const cur = currentAudioElement.currentTime || 0;
    const dur = currentAudioElement.duration || playbackDuration;
    return { elapsed: Math.floor(cur), total: Math.floor(dur), progressRatio: Math.min(1, cur / dur) };
  }

  if (!audioCtx) {
    return { elapsed: 0, total: playbackDuration, progressRatio: 0 };
  }

  const elapsed = Math.floor(audioCtx.currentTime - playStartTime) % playbackDuration;
  return { elapsed, total: playbackDuration, progressRatio: elapsed / playbackDuration };
}

export function seekPlayback(ratio: number) {
  const targetRatio = Math.max(0, Math.min(1, ratio));

  if (currentAudioElement && !isNaN(currentAudioElement.duration)) {
    try {
      currentAudioElement.currentTime = targetRatio * currentAudioElement.duration;
    } catch {
      // Seek error
    }
  }

  if (audioCtx) {
    const targetSeconds = targetRatio * playbackDuration;
    playStartTime = audioCtx.currentTime - targetSeconds;
  }
}

// ----------------------------------------------------
// PROCEDURAL ETHNIC & ACOUSTIC SOUND GENERATORS
// ----------------------------------------------------

// 1. Oud (Arab Lute) microtonal pluck
function createOudMelody(ctx: AudioContext, destination: GainNode) {
  const notes = [220, 246.94, 277.18, 293.66, 329.63, 349.23, 392, 440]; // Bayati / Rast mode
  let noteIndex = 0;

  const playPluck = () => {
    if (!isPlaying) return;
    const osc = ctx.createOscillator();
    const pluckGain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(notes[noteIndex % notes.length], ctx.currentTime);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1200, ctx.currentTime);
    filter.Q.setValueAtTime(3, ctx.currentTime);

    pluckGain.gain.setValueAtTime(0.45, ctx.currentTime);
    pluckGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);

    osc.connect(filter);
    filter.connect(pluckGain);
    pluckGain.connect(destination);

    osc.start();
    osc.stop(ctx.currentTime + 1.3);

    currentOscillators.push(osc);
    noteIndex = (noteIndex + 1) % notes.length;

    if (isPlaying) {
      setTimeout(playPluck, 450 + Math.random() * 350);
    }
  };

  playPluck();
}

// 2. Nay (Sufi Bamboo Flute) breathy tone
function createNayFluteMelody(ctx: AudioContext, destination: GainNode) {
  const nayNotes = [293.66, 329.63, 349.23, 370.0, 392.0, 440.0, 493.88, 523.25, 587.33]; // Saba / Hijaz
  let noteIndex = 0;

  // Add breath white noise
  const bufferSize = ctx.sampleRate * 2;
  const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const output = noiseBuffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    output[i] = Math.random() * 2 - 1;
  }
  const breathNoise = ctx.createBufferSource();
  breathNoise.buffer = noiseBuffer;
  breathNoise.loop = true;

  const breathFilter = ctx.createBiquadFilter();
  breathFilter.type = 'bandpass';
  breathFilter.frequency.setValueAtTime(1800, ctx.currentTime);
  breathFilter.Q.setValueAtTime(4.0, ctx.currentTime);

  const breathGain = ctx.createGain();
  breathGain.gain.setValueAtTime(0.06, ctx.currentTime);

  breathNoise.connect(breathFilter);
  breathFilter.connect(breathGain);
  breathGain.connect(destination);
  breathNoise.start();
  currentOscillators.push(breathNoise, breathFilter as unknown as OscillatorNode);

  const playFluteTone = () => {
    if (!isPlaying) return;
    const osc = ctx.createOscillator();
    const toneGain = ctx.createGain();

    osc.type = 'sine';
    const targetFreq = nayNotes[noteIndex % nayNotes.length];
    osc.frequency.setValueAtTime(targetFreq * 0.98, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(targetFreq, ctx.currentTime + 0.15); // gentle portamento/breath attack

    toneGain.gain.setValueAtTime(0.001, ctx.currentTime);
    toneGain.gain.linearRampToValueAtTime(0.35, ctx.currentTime + 0.2);
    toneGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.8);

    osc.connect(toneGain);
    toneGain.connect(destination);

    osc.start();
    osc.stop(ctx.currentTime + 1.9);
    currentOscillators.push(osc);

    noteIndex = (noteIndex + 1) % nayNotes.length;
    if (isPlaying) {
      setTimeout(playFluteTone, 1100 + Math.random() * 500);
    }
  };

  playFluteTone();
}

// 3. Mezwed (Tunisian Bagpipe & Double Reed Drone)
function createMezwedDroneAndMelody(ctx: AudioContext, destination: GainNode) {
  // Continuous bagpipe drone
  const droneOsc = ctx.createOscillator();
  const droneGain = ctx.createGain();
  const droneFilter = ctx.createBiquadFilter();

  droneOsc.type = 'sawtooth';
  droneOsc.frequency.setValueAtTime(220, ctx.currentTime); // A3 drone
  droneFilter.type = 'bandpass';
  droneFilter.frequency.setValueAtTime(650, ctx.currentTime);
  droneFilter.Q.setValueAtTime(2.5, ctx.currentTime);

  droneGain.gain.setValueAtTime(0.18, ctx.currentTime);

  droneOsc.connect(droneFilter);
  droneFilter.connect(droneGain);
  droneGain.connect(destination);
  droneOsc.start();
  currentOscillators.push(droneOsc, droneFilter as unknown as OscillatorNode);

  // Fast vibrant reed chanter phrases
  const chanterNotes = [440, 466.16, 523.25, 587.33, 622.25, 659.25, 739.99]; // Mezwed fast ornamentations
  let step = 0;

  const playReedNote = () => {
    if (!isPlaying) return;
    const reedOsc = ctx.createOscillator();
    const reedGain = ctx.createGain();

    reedOsc.type = 'square';
    reedOsc.frequency.setValueAtTime(chanterNotes[step % chanterNotes.length], ctx.currentTime);

    reedGain.gain.setValueAtTime(0.14, ctx.currentTime);
    reedGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

    reedOsc.connect(reedGain);
    reedGain.connect(destination);

    reedOsc.start();
    reedOsc.stop(ctx.currentTime + 0.38);
    currentOscillators.push(reedOsc);

    step++;
    if (isPlaying) {
      setTimeout(playReedNote, 220 + (step % 3 === 0 ? 120 : 0));
    }
  };

  playReedNote();
}

// 4. Darbuka (Goblet Drum Doum & Tak Polyphony)
function createDarbukaRhythm(ctx: AudioContext, destination: GainNode) {
  let beat = 0;
  // Maqsum rhythm: DOUM - TAK - [rest] - TAK - DOUM - [rest] - TAK - [rest]
  const pattern = ['doum', 'tak', 'tak', 'doum', 'tak', 'tak', 'tak', 'doum'];

  const playHit = () => {
    if (!isPlaying) return;
    const hitType = pattern[beat % pattern.length];
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    if (hitType === 'doum') {
      // Deep low resonant bass skin
      osc.type = 'sine';
      osc.frequency.setValueAtTime(140, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.22);
      gain.gain.setValueAtTime(0.65, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    } else {
      // High crisp aluminum rim tak
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(480, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(180, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
    }

    osc.connect(gain);
    gain.connect(destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.35);
    currentOscillators.push(osc);

    beat++;
    if (isPlaying) {
      setTimeout(playHit, 260);
    }
  };

  playHit();
}

// 5. Bendir (Sufi Frame Drum)
function createBendirRhythm(ctx: AudioContext, destination: GainNode) {
  let step = 0;
  const playDrum = () => {
    if (!isPlaying) return;
    const osc = ctx.createOscillator();
    const drumGain = ctx.createGain();

    osc.type = 'sine';
    const isBass = step % 4 === 0;
    osc.frequency.setValueAtTime(isBass ? 85 : 160, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.2);

    drumGain.gain.setValueAtTime(isBass ? 0.6 : 0.3, ctx.currentTime);
    drumGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

    osc.connect(drumGain);
    drumGain.connect(destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.4);
    currentOscillators.push(osc);

    step++;
    if (isPlaying) {
      setTimeout(playDrum, 300);
    }
  };
  playDrum();
}

// 6. Malouf (Andalusian & Tunisian Classical Heritage Strings)
function createMaloufOrchestra(ctx: AudioContext, destination: GainNode) {
  const maloufScale = [261.63, 293.66, 327.0, 349.23, 392.0, 436.0, 493.88, 523.25]; // Nawa mode
  let idx = 0;

  const playPhrase = () => {
    if (!isPlaying) return;
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sawtooth';
    osc2.type = 'triangle';

    const f = maloufScale[idx % maloufScale.length];
    osc1.frequency.setValueAtTime(f, ctx.currentTime);
    osc2.frequency.setValueAtTime(f * 1.002, ctx.currentTime); // chorus shimmer

    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.9);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(destination);

    osc1.start();
    osc2.start();
    osc1.stop(ctx.currentTime + 0.95);
    osc2.stop(ctx.currentTime + 0.95);

    currentOscillators.push(osc1, osc2);
    idx++;
    if (isPlaying) {
      setTimeout(playPhrase, 380 + (idx % 4 === 0 ? 250 : 0));
    }
  };
  playPhrase();
}

// 7. Gnawa (Guembri Bass Pluck & Qraqeb Clack)
function createGnawaGuembriAndQraqeb(ctx: AudioContext, destination: GainNode) {
  const guembriBass = [55.0, 65.41, 73.42, 82.41, 98.0]; // Low D/A pentatonic
  let step = 0;

  const playGnawa = () => {
    if (!isPlaying) return;
    const bassOsc = ctx.createOscillator();
    const bassGain = ctx.createGain();

    bassOsc.type = 'sawtooth';
    bassOsc.frequency.setValueAtTime(guembriBass[step % guembriBass.length], ctx.currentTime);

    const bassFilter = ctx.createBiquadFilter();
    bassFilter.type = 'lowpass';
    bassFilter.frequency.setValueAtTime(280, ctx.currentTime);

    bassGain.gain.setValueAtTime(0.55, ctx.currentTime);
    bassGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);

    bassOsc.connect(bassFilter);
    bassFilter.connect(bassGain);
    bassGain.connect(destination);

    bassOsc.start();
    bassOsc.stop(ctx.currentTime + 0.65);
    currentOscillators.push(bassOsc);

    step++;
    if (isPlaying) {
      setTimeout(playGnawa, 280);
    }
  };

  playGnawa();
}

// 8. Saharan Desert Wind
function createAmbientWind(ctx: AudioContext, destination: GainNode) {
  const bufferSize = ctx.sampleRate * 2;
  const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const output = noiseBuffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    output[i] = Math.random() * 2 - 1;
  }

  const whiteNoise = ctx.createBufferSource();
  whiteNoise.buffer = noiseBuffer;
  whiteNoise.loop = true;

  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(320, ctx.currentTime);
  filter.Q.setValueAtTime(2.0, ctx.currentTime);

  const windGain = ctx.createGain();
  windGain.gain.setValueAtTime(0.2, ctx.currentTime);

  whiteNoise.connect(filter);
  filter.connect(windGain);
  windGain.connect(destination);

  whiteNoise.start();
  currentOscillators.push(whiteNoise, filter as unknown as OscillatorNode);
}

// 9. Mediterranean Ocean Waves
function createOceanWaves(ctx: AudioContext, destination: GainNode) {
  const bufferSize = ctx.sampleRate * 3;
  const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const output = noiseBuffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    output[i] = Math.random() * 2 - 1;
  }

  const waveSource = ctx.createBufferSource();
  waveSource.buffer = noiseBuffer;
  waveSource.loop = true;

  const lowpass = ctx.createBiquadFilter();
  lowpass.type = 'lowpass';
  lowpass.frequency.setValueAtTime(450, ctx.currentTime);

  const waveGain = ctx.createGain();
  waveGain.gain.setValueAtTime(0.22, ctx.currentTime);

  // Periodic swell simulation
  const lfo = ctx.createOscillator();
  lfo.frequency.setValueAtTime(0.12, ctx.currentTime); // 8-second wave cycle
  const lfoGain = ctx.createGain();
  lfoGain.gain.setValueAtTime(0.15, ctx.currentTime);

  lfo.connect(lfoGain);
  lfoGain.connect(waveGain.gain);

  waveSource.connect(lowpass);
  lowpass.connect(waveGain);
  waveGain.connect(destination);

  waveSource.start();
  lfo.start();
  currentOscillators.push(waveSource, lfo, lowpass as unknown as OscillatorNode);
}

// 10. Oasis Spring & Bubbling Water
function createOasisSpring(ctx: AudioContext, destination: GainNode) {
  const playDrop = () => {
    if (!isPlaying) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    const baseFreq = 500 + Math.random() * 800;
    osc.frequency.setValueAtTime(baseFreq, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);

    osc.connect(gain);
    gain.connect(destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.12);
    currentOscillators.push(osc);

    if (isPlaying) {
      setTimeout(playDrop, 90 + Math.random() * 160);
    }
  };
  playDrop();
}

// 11. Ichkeul Birdsong Biophony
function createBirdBiophony(ctx: AudioContext, destination: GainNode) {
  const playChirp = () => {
    if (!isPlaying) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    const startF = 2200 + Math.random() * 1200;
    osc.frequency.setValueAtTime(startF, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(startF + 600, ctx.currentTime + 0.06);
    osc.frequency.exponentialRampToValueAtTime(startF - 300, ctx.currentTime + 0.14);

    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.16);

    osc.connect(gain);
    gain.connect(destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.18);
    currentOscillators.push(osc);

    if (isPlaying) {
      setTimeout(playChirp, 400 + Math.random() * 900);
    }
  };
  playChirp();
}

// 12. Medina Atmosphere (Morning Call & Echo Drone)
function createMedinaAtmosphere(ctx: AudioContext, destination: GainNode) {
  const droneOsc = ctx.createOscillator();
  const droneGain = ctx.createGain();

  droneOsc.type = 'sine';
  droneOsc.frequency.setValueAtTime(146.83, ctx.currentTime); // D3
  droneGain.gain.setValueAtTime(0.18, ctx.currentTime);

  droneOsc.connect(droneGain);
  droneGain.connect(destination);
  droneOsc.start();
  currentOscillators.push(droneOsc);

  createOudMelody(ctx, destination);
}
