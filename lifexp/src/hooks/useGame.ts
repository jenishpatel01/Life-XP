import { useEffect, useRef, useState } from 'react';

/** Smoothly counts a number toward `target` (used for XP counters). Honors reduced motion by jumping. */
export function useCountUp(target: number, ms = 900): number {
  const [v, setV] = useState(target);
  const from = useRef(target);
  useEffect(() => {
    const reduced = document.documentElement.dataset.motion === 'reduced';
    if (reduced || from.current === target) {
      from.current = target;
      setV(target);
      return;
    }
    const start = performance.now();
    const a = from.current;
    let raf = 0;
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / ms);
      const e = 1 - Math.pow(1 - t, 3);
      setV(Math.round(a + (target - a) * e));
      if (t < 1) raf = requestAnimationFrame(step);
      else from.current = target;
    };
    raf = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(raf);
      from.current = target;
    };
  }, [target, ms]);
  return v;
}

export function useMediaQuery(query: string): boolean {
  const [m, setM] = useState(() => (typeof window !== 'undefined' ? window.matchMedia(query).matches : false));
  useEffect(() => {
    const mq = window.matchMedia(query);
    const h = () => setM(mq.matches);
    h();
    mq.addEventListener('change', h);
    return () => mq.removeEventListener('change', h);
  }, [query]);
  return m;
}

/** Ticks every `ms` — used for quest timers. */
export function useNow(ms = 500, active = true): number {
  const [n, setN] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    const id = window.setInterval(() => setN(Date.now()), ms);
    return () => window.clearInterval(id);
  }, [ms, active]);
  return n;
}

import { useGame } from '@/lib/store.ts';
/** Current time on the SERVER's clock (client clock + measured skew). */
export function useServerNow(ms = 250, active = true): number {
  const now = useNow(ms, active);
  const skew = useGame((s) => s.skew);
  return now + skew;
}

/** Rolls a number up from 0 to `target` (celebration counters). */
export function useRoll(target: number, ms = 900, delay = 150): number {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (document.documentElement.dataset.motion === 'reduced') { setV(target); return; }
    let raf = 0;
    const t0 = performance.now() + delay;
    const step = (now: number) => {
      const t = Math.max(0, Math.min(1, (now - t0) / ms));
      setV(Math.round(target * (1 - Math.pow(1 - t, 3))));
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, ms, delay]);
  return v;
}
