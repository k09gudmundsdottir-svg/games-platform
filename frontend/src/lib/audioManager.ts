/**
 * PlayVault Audio Manager — iOS + Android robust sound system.
 *
 * iOS Safari rules enforced:
 *   1. AudioContext starts suspended — resumed inside direct user tap
 *   2. Re-suspends on background/screen lock — re-unlocked on next tap
 *   3. Gesture must be "trusted" — no async chains break the unlock
 *
 * Sounds are generated procedurally — no files, no CORS, no loading.
 */

type SoundName = "click" | "move" | "dice" | "win" | "lose" | "notify" | "capture";

let ctx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let soundEnabled = false;
let unlocked = false;
let pendingQueue: (() => void)[] = [];
let needsRejoin = false;

const isIOS = typeof navigator !== "undefined" &&
  /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;

// ── Core: Create and unlock AudioContext ────────────────────

function getContext(): AudioContext | null {
  if (!ctx) {
    const Ctor = window.AudioContext || (window as any).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
    masterGain = ctx.createGain();
    masterGain.connect(ctx.destination);
    masterGain.gain.value = soundEnabled ? 1 : 0;
  }
  return ctx;
}

// MUST be called directly inside a user gesture handler (tap/click)
async function unlock(): Promise<boolean> {
  const context = getContext();
  if (!context) return false;

  if (context.state === "suspended") {
    try { await context.resume(); } catch { return false; }
  }

  // iOS: play a silent buffer to fully unlock
  if (isIOS && !unlocked) {
    try {
      const buffer = context.createBuffer(1, 1, 22050);
      const source = context.createBufferSource();
      source.buffer = buffer;
      source.connect(context.destination);
      source.start(0);
      source.stop(0.001);
    } catch {}
  }

  unlocked = context.state === "running";

  // Drain queued sounds
  if (unlocked && pendingQueue.length > 0) {
    const queue = [...pendingQueue];
    pendingQueue = [];
    queue.forEach(fn => fn());
  }

  return unlocked;
}

// ── Visibility: Re-unlock when tab returns ─────────────────

if (typeof document !== "undefined") {
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) { needsRejoin = true; unlocked = false; }
  });
  window.addEventListener("focus", () => { needsRejoin = true; unlocked = false; });

  // Re-unlock on any tap after backgrounding
  const handleAnyTap = () => {
    if (needsRejoin && soundEnabled) {
      unlock();
      needsRejoin = false;
    }
  };
  document.addEventListener("touchstart", handleAnyTap, { passive: true });
  document.addEventListener("click", handleAnyTap);
}

// ── Sound generators ───────────────────────────────────────

const SOUNDS: Record<SoundName, (vol?: number) => void> = {
  click: (vol = 0.3) => {
    const c = getContext();
    if (!c || !unlocked || !soundEnabled) return;
    const o = c.createOscillator();
    const g = c.createGain();
    o.connect(g); g.connect(masterGain!);
    o.frequency.value = 800; o.type = "sine";
    g.gain.setValueAtTime(vol, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.08);
    o.start(c.currentTime); o.stop(c.currentTime + 0.08);
  },

  move: (vol = 0.25) => {
    const c = getContext();
    if (!c || !unlocked || !soundEnabled) return;
    const o = c.createOscillator();
    const g = c.createGain();
    o.connect(g); g.connect(masterGain!);
    o.frequency.setValueAtTime(400, c.currentTime);
    o.frequency.exponentialRampToValueAtTime(200, c.currentTime + 0.12);
    o.type = "sine";
    g.gain.setValueAtTime(vol, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.12);
    o.start(c.currentTime); o.stop(c.currentTime + 0.12);
  },

  dice: (vol = 0.35) => {
    const c = getContext();
    if (!c || !unlocked || !soundEnabled) return;
    // Dice rattle — short noise burst
    const bufferSize = c.sampleRate * 0.15;
    const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
    }
    const source = c.createBufferSource();
    source.buffer = buffer;
    const g = c.createGain();
    const filter = c.createBiquadFilter();
    filter.type = "bandpass"; filter.frequency.value = 3000; filter.Q.value = 1;
    source.connect(filter); filter.connect(g); g.connect(masterGain!);
    g.gain.setValueAtTime(vol, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.15);
    source.start(c.currentTime);
  },

  capture: (vol = 0.3) => {
    const c = getContext();
    if (!c || !unlocked || !soundEnabled) return;
    const o = c.createOscillator();
    const g = c.createGain();
    o.connect(g); g.connect(masterGain!);
    o.frequency.setValueAtTime(600, c.currentTime);
    o.frequency.exponentialRampToValueAtTime(300, c.currentTime + 0.15);
    o.type = "triangle";
    g.gain.setValueAtTime(vol, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.15);
    o.start(c.currentTime); o.stop(c.currentTime + 0.15);
  },

  win: (vol = 0.4) => {
    const c = getContext();
    if (!c || !unlocked || !soundEnabled) return;
    [523, 659, 784, 1047].forEach((freq, i) => {
      const o = c.createOscillator();
      const g = c.createGain();
      o.connect(g); g.connect(masterGain!);
      o.frequency.value = freq; o.type = "sine";
      const t = c.currentTime + i * 0.12;
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
      o.start(t); o.stop(t + 0.3);
    });
  },

  lose: (vol = 0.4) => {
    const c = getContext();
    if (!c || !unlocked || !soundEnabled) return;
    const o = c.createOscillator();
    const g = c.createGain();
    o.connect(g); g.connect(masterGain!);
    o.frequency.setValueAtTime(400, c.currentTime);
    o.frequency.exponentialRampToValueAtTime(100, c.currentTime + 0.5);
    o.type = "sawtooth";
    g.gain.setValueAtTime(vol * 0.5, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.5);
    o.start(c.currentTime); o.stop(c.currentTime + 0.5);
  },

  notify: (vol = 0.3) => {
    const c = getContext();
    if (!c || !unlocked || !soundEnabled) return;
    [600, 800].forEach((freq, i) => {
      const o = c.createOscillator();
      const g = c.createGain();
      o.connect(g); g.connect(masterGain!);
      o.frequency.value = freq; o.type = "sine";
      const t = c.currentTime + i * 0.15;
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
      o.start(t); o.stop(t + 0.15);
    });
  },
};

// ── Public API ─────────────────────────────────────────────

/** Call directly in onclick handler — toggles sound on/off. Returns new state. */
export async function toggleSound(): Promise<boolean> {
  soundEnabled = !soundEnabled;

  if (soundEnabled) {
    const ok = await unlock();
    if (ok && masterGain) {
      masterGain.gain.setTargetAtTime(1, ctx!.currentTime, 0.01);
    }
    try { localStorage.setItem("pv_sound", "1"); } catch {}
  } else {
    if (masterGain && ctx) {
      masterGain.gain.setTargetAtTime(0, ctx.currentTime, 0.01);
    }
    try { localStorage.setItem("pv_sound", "0"); } catch {}
  }

  return soundEnabled;
}

/** Play a sound. Safe to call from Supabase callbacks — queues if locked. */
export function play(sound: SoundName, vol?: number): void {
  if (!soundEnabled) return;

  if (!unlocked || (ctx && ctx.state !== "running")) {
    pendingQueue.push(() => SOUNDS[sound]?.(vol));
    if (ctx && ctx.state === "suspended") ctx.resume().catch(() => {});
    return;
  }

  SOUNDS[sound]?.(vol);
}

/** Restore saved preference. Call once on mount. */
export function init(): boolean {
  try { soundEnabled = localStorage.getItem("pv_sound") === "1"; } catch { soundEnabled = false; }
  return soundEnabled;
}

export function isEnabled(): boolean {
  return soundEnabled;
}
