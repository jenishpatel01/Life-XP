// LIFE//XP audio — everything is synthesised with WebAudio (no files to download).
//  • UI/SFX are very short and soft (notification-style pings, not beeps).
//  • Nothing plays before the first user gesture (browser autoplay rules).
//  • Music is OFF by default and is a quiet generative chiptune loop.

import { usePrefs } from '@/lib/prefs.ts';

export type SfxName =
  | 'click' | 'notify' | 'quest' | 'xp' | 'boss_hit' | 'boss_crit' | 'boss_defeated'
  | 'card' | 'achievement' | 'level_up' | 'world' | 'error' | 'login' | 'evolve' | 'whoosh';

const midi = (n: number) => 440 * Math.pow(2, (n - 69) / 12);

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let sfxBus: GainNode | null = null;
let musicBus: GainNode | null = null;
let noiseBuf: AudioBuffer | null = null;
let unlocked = false;

function ensure(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -18;
    comp.ratio.value = 4;
    master = ctx.createGain();
    master.gain.value = 0.85;
    sfxBus = ctx.createGain();
    sfxBus.gain.value = 0.9;
    musicBus = ctx.createGain();
    musicBus.gain.value = 0.32;
    sfxBus.connect(master);
    musicBus.connect(master);
    master.connect(comp).connect(ctx.destination);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 0.6, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  return ctx;
}

interface ToneOpts {
  f: number;
  f2?: number;
  type?: OscillatorType;
  t?: number; // start offset (s)
  d?: number; // duration
  g?: number; // peak gain
  a?: number; // attack
  lp?: number; // lowpass cutoff
  bus?: GainNode | null;
}

function tone(o: ToneOpts) {
  const c = ctx!;
  const t0 = c.currentTime + (o.t ?? 0);
  const dur = o.d ?? 0.12;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = o.type ?? 'sine';
  osc.frequency.setValueAtTime(o.f, t0);
  if (o.f2) osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.f2), t0 + dur);
  const peak = o.g ?? 0.1;
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(peak, t0 + (o.a ?? 0.006));
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  let node: AudioNode = osc;
  if (o.lp) {
    const f = c.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = o.lp;
    osc.connect(f);
    node = f;
  }
  node.connect(g).connect(o.bus ?? sfxBus!);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

function noise(o: { t?: number; d?: number; g?: number; f?: number; f2?: number; type?: BiquadFilterType; bus?: GainNode | null }) {
  const c = ctx!;
  const t0 = c.currentTime + (o.t ?? 0);
  const dur = o.d ?? 0.2;
  const src = c.createBufferSource();
  src.buffer = noiseBuf;
  const f = c.createBiquadFilter();
  f.type = o.type ?? 'lowpass';
  f.frequency.setValueAtTime(o.f ?? 1200, t0);
  if (o.f2) f.frequency.exponentialRampToValueAtTime(o.f2, t0 + dur);
  const g = c.createGain();
  g.gain.setValueAtTime(o.g ?? 0.1, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(f).connect(g).connect(o.bus ?? sfxBus!);
  src.start(t0);
  src.stop(t0 + dur + 0.05);
}

const SOUNDS: Record<SfxName, () => void> = {
  // soft "tap" — a phone-notification-style ping
  click: () => {
    tone({ f: 988, type: 'sine', d: 0.07, g: 0.07 });
    tone({ f: 1480, type: 'sine', d: 0.09, g: 0.05, t: 0.035 });
  },
  notify: () => {
    tone({ f: 1318, d: 0.1, g: 0.08 });
    tone({ f: 1760, d: 0.16, g: 0.07, t: 0.08 });
  },
  quest: () => {
    [72, 76, 79, 84].forEach((n, i) => tone({ f: midi(n), type: 'triangle', d: 0.22, g: 0.1, t: i * 0.075, lp: 4200 }));
    tone({ f: midi(88), type: 'sine', d: 0.5, g: 0.06, t: 0.3 });
  },
  xp: () => {
    for (let i = 0; i < 6; i++) tone({ f: 1200 + i * 220, f2: 1500 + i * 260, type: 'sine', d: 0.07, g: 0.045, t: i * 0.04 });
  },
  boss_hit: () => {
    tone({ f: 190, f2: 42, type: 'sine', d: 0.28, g: 0.28 });
    noise({ d: 0.18, g: 0.2, f: 3200, f2: 300 });
    tone({ f: 520, f2: 140, type: 'square', d: 0.09, g: 0.05, lp: 1800 });
  },
  boss_crit: () => {
    tone({ f: 150, f2: 32, type: 'sine', d: 0.4, g: 0.34 });
    noise({ d: 0.3, g: 0.28, f: 5200, f2: 200 });
    tone({ f: 880, f2: 220, type: 'sawtooth', d: 0.2, g: 0.06, lp: 2400 });
    tone({ f: 1760, d: 0.35, g: 0.05, t: 0.06 });
  },
  boss_defeated: () => {
    noise({ d: 0.7, g: 0.22, f: 2400, f2: 120 });
    tone({ f: 110, f2: 38, d: 0.7, g: 0.3 });
    [60, 64, 67, 72, 76, 79, 84].forEach((n, i) => tone({ f: midi(n), type: 'square', d: 0.28, g: 0.06, t: 0.45 + i * 0.09, lp: 3000 }));
    tone({ f: midi(88), type: 'triangle', d: 1.1, g: 0.09, t: 1.1 });
  },
  card: () => {
    noise({ d: 0.35, g: 0.06, f: 1500, f2: 7000, type: 'bandpass' });
    [84, 88, 91, 96].forEach((n, i) => tone({ f: midi(n), d: 0.45, g: 0.05, t: 0.12 + i * 0.07 }));
  },
  achievement: () => {
    [79, 84, 88].forEach((n, i) => tone({ f: midi(n), type: 'triangle', d: 0.35, g: 0.09, t: i * 0.11, lp: 5000 }));
    tone({ f: midi(91), d: 0.8, g: 0.06, t: 0.36 });
  },
  level_up: () => {
    [60, 64, 67, 72, 76, 79, 84, 88].forEach((n, i) => {
      tone({ f: midi(n), type: 'square', d: 0.2, g: 0.06, t: i * 0.075, lp: 3400 });
      tone({ f: midi(n + 12), type: 'sine', d: 0.3, g: 0.04, t: i * 0.075 });
    });
    [72, 76, 79, 84].forEach((n) => tone({ f: midi(n), type: 'triangle', d: 1.3, g: 0.07, t: 0.65, lp: 4200 }));
  },
  world: () => {
    noise({ d: 0.9, g: 0.12, f: 200, f2: 3500, type: 'bandpass' });
    [48, 55, 60, 64, 67].forEach((n, i) => tone({ f: midi(n), type: 'triangle', d: 1.1, g: 0.07, t: 0.2 + i * 0.1, lp: 3000 }));
  },
  error: () => {
    tone({ f: 220, type: 'square', d: 0.12, g: 0.06, lp: 900 });
    tone({ f: 165, type: 'square', d: 0.2, g: 0.06, t: 0.1, lp: 800 });
  },
  login: () => {
    tone({ f: midi(79), d: 0.14, g: 0.08 });
    tone({ f: midi(84), d: 0.3, g: 0.08, t: 0.1 });
    tone({ f: midi(88), d: 0.4, g: 0.05, t: 0.2 });
  },
  evolve: () => {
    noise({ d: 1.4, g: 0.14, f: 300, f2: 6000, type: 'bandpass' });
    [55, 62, 67, 74, 79, 86].forEach((n, i) => tone({ f: midi(n), type: 'sawtooth', d: 0.9, g: 0.04, t: i * 0.18, lp: 2600 }));
    [79, 83, 86, 91].forEach((n) => tone({ f: midi(n), d: 1.6, g: 0.07, t: 1.2 }));
  },
  whoosh: () => noise({ d: 0.3, g: 0.06, f: 400, f2: 4000, type: 'bandpass' }),
};

/** Called from a user gesture to satisfy autoplay rules. */
function unlock() {
  if (unlocked) return;
  const c = ensure();
  if (!c) return;
  void c.resume().then(() => {
    unlocked = true;
    syncMusic();
  });
}

if (typeof window !== 'undefined') {
  const handler = () => unlock();
  window.addEventListener('pointerdown', handler, { passive: true });
  window.addEventListener('keydown', handler, { passive: true });
  window.addEventListener('touchend', handler, { passive: true });
}

export const sfx = {
  play(name: SfxName) {
    if (!usePrefs.getState().sound) return;
    const c = ensure();
    if (!c || c.state !== 'running') {
      if (c && c.state === 'suspended') void c.resume();
      if (!c || c.state !== 'running') return;
    }
    try {
      SOUNDS[name]();
    } catch {
      /* audio is best-effort */
    }
  },
};

// ───────────────────────── music ─────────────────────────
const BPM = 92;
const STEP = 60 / BPM / 2; // 8th note
const CHORDS = [
  { bass: 45, notes: [57, 60, 64, 69] }, // Am
  { bass: 41, notes: [53, 57, 60, 65] }, // F
  { bass: 48, notes: [60, 64, 67, 72] }, // C
  { bass: 43, notes: [55, 59, 62, 67] }, // G
];
let musicTimer: number | null = null;
let nextStepTime = 0;
let stepIndex = 0;

function scheduleStep(t: number, i: number) {
  const c = ctx!;
  const chord = CHORDS[Math.floor(i / 8) % 4];
  const s = i % 8;
  const bus = musicBus!;
  const at = t - c.currentTime;
  // bass on beats
  if (s % 2 === 0) tone({ f: midi(chord.bass), type: 'triangle', t: at, d: STEP * 1.8, g: 0.2, lp: 700, bus });
  // soft kick on 1 and 3
  if (s === 0 || s === 4) tone({ f: 120, f2: 45, type: 'sine', t: at, d: 0.16, g: 0.16, bus });
  // arpeggio
  const arp = [0, 2, 1, 3, 2, 1, 3, 2][s];
  tone({ f: midi(chord.notes[arp] + (s % 4 === 3 ? 12 : 0)), type: 'square', t: at, d: STEP * 0.9, g: 0.05, lp: 2200, bus });
  // hat
  if (s % 2 === 1) noise({ t: at, d: 0.04, g: 0.03, f: 7000, type: 'highpass', bus });
  // pad on chord change
  if (s === 0) chord.notes.forEach((n) => tone({ f: midi(n), type: 'sine', t: at, d: STEP * 8, g: 0.035, a: 0.4, bus }));
}

function tick() {
  const c = ctx;
  if (!c) return;
  while (nextStepTime < c.currentTime + 0.25) {
    scheduleStep(nextStepTime, stepIndex);
    nextStepTime += STEP;
    stepIndex++;
  }
}

function startMusic() {
  const c = ensure();
  if (!c || !unlocked || musicTimer !== null) return;
  void c.resume();
  nextStepTime = c.currentTime + 0.1;
  stepIndex = 0;
  musicTimer = window.setInterval(tick, 60);
}

function stopMusic() {
  if (musicTimer !== null) {
    clearInterval(musicTimer);
    musicTimer = null;
  }
}

export function syncMusic() {
  const on = usePrefs.getState().music;
  if (on && unlocked && !document.hidden) startMusic();
  else stopMusic();
}

if (typeof window !== 'undefined') {
  usePrefs.subscribe((s, prev) => {
    if (s.music !== prev.music) {
      if (s.music) unlock();
      syncMusic();
    }
  });
  document.addEventListener('visibilitychange', syncMusic);
}
