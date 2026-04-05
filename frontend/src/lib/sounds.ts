// Synthesized sound effects using Web Audio API — no external dependencies needed

let audioCtx: AudioContext | null = null;

const getCtx = () => {
  if (!audioCtx) audioCtx = new AudioContext();
  if (audioCtx.state === "suspended") audioCtx.resume();
  return audioCtx;
};

// Call this on any user click to unlock audio
export const unlockAudio = () => { getCtx(); };

/** Short percussive card flip — crisp "thwip" */
export const playCardFlip = () => {
  const ctx = getCtx();
  const now = ctx.currentTime;

  // Click transient
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(1800, now);
  osc.frequency.exponentialRampToValueAtTime(400, now + 0.08);
  gain.gain.setValueAtTime(0.18, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
  osc.connect(gain).connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.12);

  // Noise burst for paper texture
  const bufferSize = ctx.sampleRate * 0.06;
  const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = noiseBuffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
  }
  const noise = ctx.createBufferSource();
  const noiseGain = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = 3000;
  filter.Q.value = 0.8;
  noise.buffer = noiseBuffer;
  noiseGain.gain.setValueAtTime(0.12, now);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
  noise.connect(filter).connect(noiseGain).connect(ctx.destination);
  noise.start(now);
};

/** Shuffle sound — rapid series of soft card taps */
export const playCardShuffle = () => {
  const ctx = getCtx();
  const now = ctx.currentTime;
  const taps = 6;

  for (let i = 0; i < taps; i++) {
    const t = now + i * 0.055;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(1200 + Math.random() * 800, t);
    osc.frequency.exponentialRampToValueAtTime(300, t + 0.04);
    gain.gain.setValueAtTime(0.06 + Math.random() * 0.04, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.05);

    // Tiny noise
    const len = ctx.sampleRate * 0.03;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let j = 0; j < len; j++) d[j] = (Math.random() * 2 - 1) * (1 - j / len) * 0.5;
    const ns = ctx.createBufferSource();
    const ng = ctx.createGain();
    ns.buffer = buf;
    ng.gain.setValueAtTime(0.04, t);
    ng.gain.exponentialRampToValueAtTime(0.001, t + 0.03);
    ns.connect(ng).connect(ctx.destination);
    ns.start(t);
  }
};

/** Victory fanfare — ascending major chord arpeggio with shimmer */
export const playVictoryFanfare = () => {
  const ctx = getCtx();
  const now = ctx.currentTime;

  // Major chord arpeggio: C5, E5, G5, C6
  const notes = [523.25, 659.25, 783.99, 1046.5];
  const durations = [0.25, 0.2, 0.2, 0.5];

  let offset = 0;
  notes.forEach((freq, i) => {
    const t = now + offset;
    const dur = durations[i];

    // Main tone
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.15, t + 0.02);
    gain.gain.setValueAtTime(0.15, t + dur * 0.6);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + dur + 0.05);

    // Harmonic shimmer
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.value = freq * 2;
    gain2.gain.setValueAtTime(0, t);
    gain2.gain.linearRampToValueAtTime(0.04, t + 0.02);
    gain2.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc2.connect(gain2).connect(ctx.destination);
    osc2.start(t);
    osc2.stop(t + dur + 0.05);

    offset += dur * 0.7; // overlap slightly
  });

  // Final sparkle — white noise shimmer
  const sparkleTime = now + offset;
  const sparkleLen = ctx.sampleRate * 0.3;
  const sparkleBuffer = ctx.createBuffer(1, sparkleLen, ctx.sampleRate);
  const sd = sparkleBuffer.getChannelData(0);
  for (let i = 0; i < sparkleLen; i++) {
    sd[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / sparkleLen, 2);
  }
  const sparkle = ctx.createBufferSource();
  const sparkleGain = ctx.createGain();
  const sparkleFilter = ctx.createBiquadFilter();
  sparkleFilter.type = "highpass";
  sparkleFilter.frequency.value = 6000;
  sparkle.buffer = sparkleBuffer;
  sparkleGain.gain.setValueAtTime(0.08, sparkleTime);
  sparkleGain.gain.exponentialRampToValueAtTime(0.001, sparkleTime + 0.3);
  sparkle.connect(sparkleFilter).connect(sparkleGain).connect(ctx.destination);
  sparkle.start(sparkleTime);
};

/** Chess piece placement — solid wooden "thunk" */
export const playPiecePlace = () => {
  const ctx = getCtx();
  const now = ctx.currentTime;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(220, now);
  osc.frequency.exponentialRampToValueAtTime(80, now + 0.1);
  gain.gain.setValueAtTime(0.25, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
  osc.connect(gain).connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.15);

  // Wood resonance
  const osc2 = ctx.createOscillator();
  const g2 = ctx.createGain();
  osc2.type = "triangle";
  osc2.frequency.value = 440;
  g2.gain.setValueAtTime(0.06, now);
  g2.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
  osc2.connect(g2).connect(ctx.destination);
  osc2.start(now);
  osc2.stop(now + 0.08);
};

/** Dice roll — rattling percussive burst */
export const playDiceRoll = () => {
  const ctx = getCtx();
  const now = ctx.currentTime;
  const hits = 8;

  for (let i = 0; i < hits; i++) {
    const t = now + i * 0.04 + Math.random() * 0.02;
    const freq = 600 + Math.random() * 1200;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "square";
    osc.frequency.setValueAtTime(freq, t);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.3, t + 0.03);
    gain.gain.setValueAtTime(0.05 + Math.random() * 0.04, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.04);
  }

  // Final settle thud
  const settle = now + hits * 0.05;
  const osc3 = ctx.createOscillator();
  const g3 = ctx.createGain();
  osc3.type = "sine";
  osc3.frequency.setValueAtTime(180, settle);
  osc3.frequency.exponentialRampToValueAtTime(60, settle + 0.1);
  g3.gain.setValueAtTime(0.12, settle);
  g3.gain.exponentialRampToValueAtTime(0.001, settle + 0.12);
  osc3.connect(g3).connect(ctx.destination);
  osc3.start(settle);
  osc3.stop(settle + 0.12);
};

/** Card deal — single soft card slide */
export const playCardDeal = () => {
  const ctx = getCtx();
  const now = ctx.currentTime;

  const bufferSize = ctx.sampleRate * 0.08;
  const buf = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 1.5);
  }
  const src = ctx.createBufferSource();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = 2500;
  filter.Q.value = 1.2;
  src.buffer = buf;
  gain.gain.setValueAtTime(0.15, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
  src.connect(filter).connect(gain).connect(ctx.destination);
  src.start(now);

  // Soft tonal click
  const osc = ctx.createOscillator();
  const g2 = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(1400, now);
  osc.frequency.exponentialRampToValueAtTime(600, now + 0.05);
  g2.gain.setValueAtTime(0.08, now);
  g2.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
  osc.connect(g2).connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.06);
};

/** Chip drop — plastic "plonk" with bounce */
export const playChipDrop = () => {
  const ctx = getCtx();
  const now = ctx.currentTime;

  // Main drop
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(800, now);
  osc.frequency.exponentialRampToValueAtTime(200, now + 0.15);
  gain.gain.setValueAtTime(0.2, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
  osc.connect(gain).connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.2);

  // Bounce
  const osc2 = ctx.createOscillator();
  const g2 = ctx.createGain();
  osc2.type = "sine";
  osc2.frequency.setValueAtTime(500, now + 0.12);
  osc2.frequency.exponentialRampToValueAtTime(150, now + 0.22);
  g2.gain.setValueAtTime(0, now);
  g2.gain.setValueAtTime(0.08, now + 0.12);
  g2.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
  osc2.connect(g2).connect(ctx.destination);
  osc2.start(now + 0.12);
  osc2.stop(now + 0.22);
};

/** Snap buzz — sharp electric zap */
export const playSnapBuzz = () => {
  const ctx = getCtx();
  const now = ctx.currentTime;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(600, now);
  osc.frequency.exponentialRampToValueAtTime(200, now + 0.08);
  gain.gain.setValueAtTime(0.12, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
  osc.connect(gain).connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.1);

  const osc2 = ctx.createOscillator();
  const g2 = ctx.createGain();
  osc2.type = "square";
  osc2.frequency.value = 1200;
  g2.gain.setValueAtTime(0.06, now);
  g2.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
  osc2.connect(g2).connect(ctx.destination);
  osc2.start(now);
  osc2.stop(now + 0.05);
};

/** Error/miss — descending tone */
export const playMiss = () => {
  const ctx = getCtx();
  const now = ctx.currentTime;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(400, now);
  osc.frequency.exponentialRampToValueAtTime(200, now + 0.2);
  gain.gain.setValueAtTime(0.12, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
  osc.connect(gain).connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.25);
};

/** Piece select — gentle rising "tick" */
export const playPieceSelect = () => {
  const ctx = getCtx();
  const now = ctx.currentTime;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(600, now);
  osc.frequency.exponentialRampToValueAtTime(900, now + 0.06);
  gain.gain.setValueAtTime(0.1, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
  osc.connect(gain).connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.1);
};

/** Piece deselect — soft descending "tock" */
export const playPieceDeselect = () => {
  const ctx = getCtx();
  const now = ctx.currentTime;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(700, now);
  osc.frequency.exponentialRampToValueAtTime(400, now + 0.08);
  gain.gain.setValueAtTime(0.08, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
  osc.connect(gain).connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.1);
};

/** Correct answer — bright rising major third ding */
export const playCorrectDing = () => {
  const ctx = getCtx();
  const now = ctx.currentTime;

  // First note (C5)
  const osc1 = ctx.createOscillator();
  const g1 = ctx.createGain();
  osc1.type = "sine";
  osc1.frequency.value = 523;
  g1.gain.setValueAtTime(0.2, now);
  g1.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
  osc1.connect(g1).connect(ctx.destination);
  osc1.start(now);
  osc1.stop(now + 0.3);

  // Second note (E5) — major third
  const osc2 = ctx.createOscillator();
  const g2 = ctx.createGain();
  osc2.type = "sine";
  osc2.frequency.value = 659;
  g2.gain.setValueAtTime(0, now);
  g2.gain.setValueAtTime(0.18, now + 0.08);
  g2.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
  osc2.connect(g2).connect(ctx.destination);
  osc2.start(now + 0.08);
  osc2.stop(now + 0.35);

  // Shimmer
  const osc3 = ctx.createOscillator();
  const g3 = ctx.createGain();
  osc3.type = "sine";
  osc3.frequency.value = 1318;
  g3.gain.setValueAtTime(0, now);
  g3.gain.setValueAtTime(0.06, now + 0.1);
  g3.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
  osc3.connect(g3).connect(ctx.destination);
  osc3.start(now + 0.1);
  osc3.stop(now + 0.4);
};

/** Wrong answer — dissonant descending buzz */
export const playBuzzerWrong = () => {
  const ctx = getCtx();
  const now = ctx.currentTime;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(300, now);
  osc.frequency.exponentialRampToValueAtTime(150, now + 0.25);
  gain.gain.setValueAtTime(0.1, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
  osc.connect(gain).connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.3);

  const osc2 = ctx.createOscillator();
  const g2 = ctx.createGain();
  osc2.type = "square";
  osc2.frequency.setValueAtTime(280, now);
  osc2.frequency.exponentialRampToValueAtTime(120, now + 0.2);
  g2.gain.setValueAtTime(0.05, now);
  g2.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
  osc2.connect(g2).connect(ctx.destination);
  osc2.start(now);
  osc2.stop(now + 0.25);
};

/** Tick tock — clock tick for timer pressure */
export const playTickTock = () => {
  const ctx = getCtx();
  const now = ctx.currentTime;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(1200, now);
  osc.frequency.exponentialRampToValueAtTime(800, now + 0.03);
  gain.gain.setValueAtTime(0.1, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
  osc.connect(gain).connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.05);
};

/** Countdown beep — for 3-2-1 countdown */
export const playCountdownBeep = () => {
  const ctx = getCtx();
  const now = ctx.currentTime;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.value = 880;
  gain.gain.setValueAtTime(0.15, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
  osc.connect(gain).connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.15);
};
