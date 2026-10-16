// Tiny event bus so any component can trigger pixel bursts, floating numbers,
// screen shake or a flash without owning a canvas.
import { motionReduced, usePrefs } from '@/lib/prefs.ts';

export interface BurstOpts {
  colors?: string[];
  count?: number;
  speed?: number;
  gravity?: number;
  size?: number;
  life?: number;
  /** spread angle in radians; default full circle */
  spread?: number;
  angle?: number;
}

type BurstHandler = (x: number, y: number, o: BurstOpts) => void;
let burstHandler: BurstHandler | null = null;

export function registerBurst(h: BurstHandler | null) {
  burstHandler = h;
}

/** Scales effect density with the player's animation-intensity setting. */
export function intensity(): number {
  const p = usePrefs.getState();
  if (motionReduced(p)) return 0;
  return p.animation === 'high' ? 1 : p.animation === 'medium' ? 0.55 : 0.2;
}

export const fx = {
  burst(x: number, y: number, o: BurstOpts = {}) {
    const k = intensity();
    if (!burstHandler || k === 0) return;
    burstHandler(x, y, { ...o, count: Math.max(2, Math.round((o.count ?? 14) * k)) });
  },
  /** burst from the centre of an element */
  burstAt(el: Element | null, o: BurstOpts = {}) {
    if (!el) return;
    const r = el.getBoundingClientRect();
    fx.burst(r.left + r.width / 2, r.top + r.height / 2, o);
  },
  floatText(x: number, y: number, text: string, cls = '') {
    const el = document.createElement('div');
    el.className = `float-text ${cls}`;
    el.textContent = text;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    document.body.appendChild(el);
    window.setTimeout(() => el.remove(), 1500);
  },
  shake(strength: 'light' | 'heavy' = 'light') {
    if (motionReduced()) return;
    const root = document.getElementById('root');
    if (!root) return;
    root.classList.remove('shake-light', 'shake-heavy');
    void root.offsetWidth; // restart animation
    root.classList.add(strength === 'heavy' ? 'shake-heavy' : 'shake-light');
    window.setTimeout(() => root.classList.remove('shake-light', 'shake-heavy'), 520);
  },
  flash(color = '#ffffff', ms = 260) {
    if (motionReduced()) return;
    const el = document.createElement('div');
    el.className = 'screen-flash';
    el.style.background = color;
    el.style.animationDuration = `${ms}ms`;
    document.body.appendChild(el);
    window.setTimeout(() => el.remove(), ms + 60);
  },
};
