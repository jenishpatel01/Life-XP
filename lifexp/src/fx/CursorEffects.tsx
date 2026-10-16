import { useEffect, useRef } from 'react';
import { motionReduced, usePrefs } from '@/lib/prefs.ts';
import { registerBurst, type BurstOpts, intensity } from './fx.ts';

interface P { x: number; y: number; vx: number; vy: number; life: number; max: number; size: number; color: string; g: number }

const DEFAULT_COLORS = ['#18d9ff', '#bd4eff', '#ffb32e', '#f8fbff'];

/**
 * Global interaction layer (one canvas + a few delegated listeners):
 *  - soft cursor glow + short pixel trail (fine pointers only)
 *  - click pixel bursts
 *  - magnetic buttons (.magnetic) and tilting cards (.tilt)
 *  - hover "energy" sparks on [data-energy] elements
 * Everything is skipped when reduced-motion is on, and scaled by the animation-intensity setting.
 */
export default function CursorEffects() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const prefs = usePrefs();

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    const parts: P[] = [];
    let raf = 0;
    let running = false;
    let w = 0;
    let h = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);

    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    const spawn = (x: number, y: number, o: BurstOpts) => {
      const n = o.count ?? 12;
      const colors = o.colors ?? DEFAULT_COLORS;
      const spread = o.spread ?? Math.PI * 2;
      const base = o.angle ?? 0;
      for (let i = 0; i < n && parts.length < 420; i++) {
        const a = base - spread / 2 + Math.random() * spread;
        const sp = (o.speed ?? 3) * (0.35 + Math.random() * 0.9);
        parts.push({
          x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - (o.gravity ? 0 : 0.2),
          life: 0, max: (o.life ?? 38) * (0.6 + Math.random() * 0.7),
          size: (o.size ?? 4) * (Math.random() > 0.6 ? 1 : 0.65), color: colors[(Math.random() * colors.length) | 0], g: o.gravity ?? 0.08,
        });
      }
      start();
    };
    registerBurst(spawn);

    const frame = () => {
      ctx.clearRect(0, 0, w, h);
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i];
        p.life++;
        p.vy += p.g;
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.985;
        if (p.life >= p.max) { parts.splice(i, 1); continue; }
        ctx.globalAlpha = 1 - p.life / p.max;
        ctx.fillStyle = p.color;
        const s = Math.max(2, Math.round(p.size));
        ctx.fillRect(Math.round(p.x), Math.round(p.y), s, s);
      }
      ctx.globalAlpha = 1;
      if (parts.length) raf = requestAnimationFrame(frame);
      else running = false;
    };
    const start = () => {
      if (!running && !document.hidden) { running = true; raf = requestAnimationFrame(frame); }
    };

    const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    let mx = -100, my = -100, lastTrail = 0, glowRaf = 0;
    let mag: HTMLElement | null = null;
    let tiltEl: HTMLElement | null = null;
    const energyAt = new WeakMap<Element, number>();

    const setGlow = () => {
      glowRaf = 0;
      const g = glowRef.current;
      if (g) g.style.transform = `translate3d(${mx - 160}px, ${my - 160}px, 0)`;
    };

    const resetMag = (el: HTMLElement | null) => { if (el) { el.style.setProperty('--tx', '0px'); el.style.setProperty('--ty', '0px'); } };
    const resetTilt = (el: HTMLElement | null) => {
      if (el) { el.style.setProperty('--rx', '0deg'); el.style.setProperty('--ry', '0deg'); el.style.setProperty('--glare', '0'); }
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch' || motionReduced()) return;
      mx = e.clientX; my = e.clientY;
      if (!glowRaf) glowRaf = requestAnimationFrame(setGlow);
      const k = intensity();
      const now = performance.now();
      if (k >= 1 && now - lastTrail > 45) {
        lastTrail = now;
        spawn(mx, my, { count: 1, speed: 0.6, size: 3, life: 22, gravity: 0.01, colors: ['#18d9ff', '#bd4eff'] });
      }
      const t = e.target as HTMLElement | null;
      // magnetic
      const m = (t?.closest?.('.magnetic') as HTMLElement | null) ?? null;
      if (m !== mag) { resetMag(mag); mag = m; }
      if (m && k > 0.3) {
        const r = m.getBoundingClientRect();
        m.style.setProperty('--tx', `${((e.clientX - (r.left + r.width / 2)) * 0.16).toFixed(1)}px`);
        m.style.setProperty('--ty', `${((e.clientY - (r.top + r.height / 2)) * 0.22).toFixed(1)}px`);
      }
      // tilt
      const c = (t?.closest?.('.tilt') as HTMLElement | null) ?? null;
      if (c !== tiltEl) { resetTilt(tiltEl); tiltEl = c; }
      if (c && k > 0.3) {
        const r = c.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        const max = Number(c.dataset.tilt ?? 9);
        c.style.setProperty('--ry', `${((px - 0.5) * 2 * max).toFixed(2)}deg`);
        c.style.setProperty('--rx', `${((0.5 - py) * 2 * max).toFixed(2)}deg`);
        c.style.setProperty('--gx', `${(px * 100).toFixed(1)}%`);
        c.style.setProperty('--gy', `${(py * 100).toFixed(1)}%`);
        c.style.setProperty('--glare', '1');
      }
    };

    const onOver = (e: MouseEvent) => {
      if (motionReduced()) return;
      const el = (e.target as HTMLElement | null)?.closest?.('[data-energy]') as HTMLElement | null;
      if (!el || el.contains(e.relatedTarget as Node | null)) return;
      const now = performance.now();
      if (now - (energyAt.get(el) ?? 0) < 500) return;
      energyAt.set(el, now);
      const r = el.getBoundingClientRect();
      const color = el.dataset.energy || '#18d9ff';
      const k = intensity();
      for (let i = 0; i < Math.round(7 * k); i++) {
        spawn(r.left + Math.random() * r.width, r.top + r.height - 4 - Math.random() * 10, {
          count: 1, speed: 1.1, size: 4, life: 46, gravity: -0.03, colors: [color, '#f8fbff'], angle: -Math.PI / 2, spread: 0.9,
        });
      }
    };

    const onDown = (e: PointerEvent) => {
      if (motionReduced()) return;
      const t = e.target as HTMLElement | null;
      const color = (t?.closest?.('[data-fx]') as HTMLElement | null)?.dataset.fx;
      const interactive = t?.closest?.('button, a, [role=button], .tilt, .quest-card, input, select');
      spawn(e.clientX, e.clientY, {
        count: interactive ? 14 : 8, speed: 3.6, size: 4, life: 30,
        colors: color ? [color, '#f8fbff'] : DEFAULT_COLORS,
      });
    };

    const onLeaveDoc = () => { resetMag(mag); resetTilt(tiltEl); mag = null; tiltEl = null; };
    const onVis = () => { if (!document.hidden && parts.length) start(); };

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerdown', onDown, { passive: true });
    document.addEventListener('mouseover', onOver, { passive: true });
    document.addEventListener('mouseleave', onLeaveDoc);
    document.addEventListener('visibilitychange', onVis);
    void fine;

    return () => {
      registerBurst(null);
      cancelAnimationFrame(raf);
      cancelAnimationFrame(glowRaf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerdown', onDown);
      document.removeEventListener('mouseover', onOver);
      document.removeEventListener('mouseleave', onLeaveDoc);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  const showGlow = !motionReduced(prefs) && prefs.animation !== 'low';
  return (
    <>
      {showGlow && <div ref={glowRef} className="cursor-glow" aria-hidden />}
      <canvas ref={canvasRef} className="fx-canvas" aria-hidden />
    </>
  );
}
