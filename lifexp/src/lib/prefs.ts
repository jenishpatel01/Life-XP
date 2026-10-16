import { create } from 'zustand';
import type { Settings } from '@shared/types.ts';

// Display + audio preferences. Stored locally so they apply on the landing page
// (before login) and are mirrored to the server for signed-in players.

export type Prefs = Pick<Settings, 'sound' | 'music' | 'animation' | 'reducedMotion' | 'theme'>;

const KEY = 'lifexp.prefs.v1';
const DEFAULTS: Prefs = { sound: true, music: false, animation: 'high', reducedMotion: 'auto', theme: 'neon' };

function load(): Prefs {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...DEFAULTS, ...(JSON.parse(raw) as Partial<Prefs>) };
  } catch {
    /* storage unavailable */
  }
  return { ...DEFAULTS };
}

function save(p: Prefs) {
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    /* ignore */
  }
}

interface PrefsStore extends Prefs {
  set: (patch: Partial<Prefs>) => void;
  /** replace from server without echoing back */
  hydrate: (p: Prefs) => void;
}

const mq = typeof window !== 'undefined' ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;

export const motionReduced = (p: Pick<Prefs, 'reducedMotion'> = usePrefs.getState()): boolean =>
  p.reducedMotion === 'on' || (p.reducedMotion === 'auto' && !!mq?.matches);

export function applyPrefsToDom(p: Prefs) {
  const el = document.documentElement;
  el.dataset.theme = p.theme;
  el.dataset.anim = p.animation;
  el.dataset.motion = motionReduced(p) ? 'reduced' : 'full';
}

export const usePrefs = create<PrefsStore>((set, get) => ({
  ...load(),
  set: (patch) => {
    set(patch);
    const { sound, music, animation, reducedMotion, theme } = get();
    const next = { sound, music, animation, reducedMotion, theme };
    save(next);
    applyPrefsToDom(next);
  },
  hydrate: (p) => {
    set(p);
    save(p);
    applyPrefsToDom(p);
  },
}));

if (typeof window !== 'undefined') {
  applyPrefsToDom(usePrefs.getState());
  mq?.addEventListener?.('change', () => applyPrefsToDom(usePrefs.getState()));
}
