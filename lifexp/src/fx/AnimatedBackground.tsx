import { useEffect, useRef } from 'react';
import { motionReduced, usePrefs } from '@/lib/prefs.ts';

export type BgVariant = 'hero' | 'world' | 'boss' | 'map';

interface Palette {
  top: string; mid: string; horizon: string; sunA: string; sunB: string; grid: string; mount1: string; mount2: string; ground: string; cloud: string; glow: string; particles: string[];
}

const PALETTES: Record<BgVariant, Palette> = {
  hero: { top: '#05050c', mid: '#160a3a', horizon: '#6a1fa8', sunA: '#ffb32e', sunB: '#ff2d95', grid: '#18d9ff', mount1: '#1a0f45', mount2: '#0c0724', ground: '#06030f', cloud: '#bd4eff', glow: '#ff2dd5', particles: ['#18d9ff', '#bd4eff', '#ffb32e', '#f8fbff'] },
  world: { top: '#04040b', mid: '#0d0830', horizon: '#35177a', sunA: '#7a5cff', sunB: '#c23bff', grid: '#2a8bd8', mount1: '#120a34', mount2: '#090520', ground: '#05030c', cloud: '#7a4cff', glow: '#8a3dff', particles: ['#18d9ff', '#bd4eff', '#f8fbff'] },
  boss: { top: '#0a0206', mid: '#3a0a1a', horizon: '#a1142e', sunA: '#ff6a3d', sunB: '#ff1f4d', grid: '#ff445f', mount1: '#2a0a16', mount2: '#14040b', ground: '#080204', cloud: '#ff445f', glow: '#ff2d4d', particles: ['#ff445f', '#ffb32e', '#f8fbff'] },
  map: { top: '#05061a', mid: '#0a1a4a', horizon: '#1d6fa8', sunA: '#7ff6ff', sunB: '#3d8bff', grid: '#48ef9f', mount1: '#0c1f48', mount2: '#071230', ground: '#040a1c', cloud: '#7ff6ff', glow: '#3dd9ff', particles: ['#48ef9f', '#18d9ff', '#f8fbff'] },
};

const hexRGB = (c: string): [number, number, number] => { const n = parseInt(c.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const mix = (a: string, b: string, t: number) => {
  const A = hexRGB(a), B = hexRGB(b);
  return `rgb(${Math.round(A[0] + (B[0] - A[0]) * t)},${Math.round(A[1] + (B[1] - A[1]) * t)},${Math.round(A[2] + (B[2] - A[2]) * t)})`;
};

interface Props {
  variant?: BgVariant;
  className?: string;
  /** 0..1 — lowers contrast so UI stays readable on top */
  dim?: number;
  sun?: boolean;
  grid?: boolean;
}

/**
 * Low-resolution canvas world (each logical pixel = 4 CSS px): sky bands, stars, neon sun,
 * parallax mountains, drifting pixel clouds, a moving perspective grid and floating particles.
 * Pauses when hidden / off-screen and renders a single still frame under reduced motion.
 */
export default function AnimatedBackground({ variant = 'hero', className = '', dim = 0, sun = true, grid = true }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  const reducedPref = usePrefs((s) => s.reducedMotion);
  const anim = usePrefs((s) => s.animation);

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext('2d')!;
    const pal = PALETTES[variant];
    const PX = 4;
    let W = 0, H = 0, horizon = 0;
    let raf = 0;
    let visible = true;
    let last = 0;
    let t = 0;
    let px = 0, py = 0, tx = 0, ty = 0;
    const rnd = (() => { let s = 1337; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();

    const stars: { x: number; y: number; p: number }[] = [];
    const clouds: { x: number; y: number; w: number; sp: number }[] = [];
    const parts: { x: number; y: number; vy: number; c: string; p: number }[] = [];
    const peaks1: number[] = [];
    const peaks2: number[] = [];

    const setup = () => {
      const r = canvas.getBoundingClientRect();
      W = Math.max(60, Math.ceil(r.width / PX));
      H = Math.max(60, Math.ceil(r.height / PX));
      canvas.width = W;
      canvas.height = H;
      horizon = Math.floor(H * 0.62);
      stars.length = 0; clouds.length = 0; parts.length = 0;
      for (let i = 0; i < Math.floor(W * 0.22); i++) stars.push({ x: rnd() * W, y: rnd() * horizon * 0.8, p: rnd() * 6 });
      for (let i = 0; i < Math.max(3, Math.floor(W / 60)); i++) clouds.push({ x: rnd() * W, y: horizon * (0.25 + rnd() * 0.45), w: 14 + rnd() * 22, sp: 0.02 + rnd() * 0.03 });
      for (let i = 0; i < Math.floor(W / 9); i++) parts.push({ x: rnd() * W, y: rnd() * H, vy: 0.02 + rnd() * 0.05, c: pal.particles[(rnd() * pal.particles.length) | 0], p: rnd() * 6 });
      peaks1.length = 0; peaks2.length = 0;
      for (let x = 0; x < W * 2; x++) {
        peaks1.push(horizon - (6 + 7 * Math.sin(x / 17) + 5 * Math.sin(x / 7.3 + 1) + 4 * Math.sin(x / 31)) * (H / 120));
        peaks2.push(horizon - (3 + 4 * Math.sin(x / 11 + 2) + 3 * Math.sin(x / 4.1) + 3 * Math.sin(x / 23 + 1)) * (H / 120));
      }
    };

    const draw = (dt: number, animate: boolean) => {
      if (animate) t += dt;
      px += (tx - px) * 0.05; py += (ty - py) * 0.05;
      ctx.imageSmoothingEnabled = false;
      // sky (banded)
      for (let y = 0; y < horizon; y += 2) {
        const k = y / horizon;
        ctx.fillStyle = k < 0.55 ? mix(pal.top, pal.mid, k / 0.55) : mix(pal.mid, pal.horizon, Math.pow((k - 0.55) / 0.45, 1.5));
        ctx.fillRect(0, y, W, 2);
      }
      // stars
      for (const s of stars) {
        const a = 0.35 + 0.65 * Math.abs(Math.sin(t * 0.0012 + s.p));
        ctx.globalAlpha = a;
        ctx.fillStyle = '#f8fbff';
        ctx.fillRect(Math.floor(s.x - px * 1.2) , Math.floor(s.y - py * 0.6), 1, 1);
      }
      ctx.globalAlpha = 1;
      // sun
      if (sun) {
        const r = Math.floor(H * 0.2);
        const cx = Math.floor(W * 0.5 - px * 2), cy = horizon - Math.floor(r * 0.35) - Math.floor(py);
        for (let y = -r; y <= r; y++) {
          if (cy + y >= horizon) continue;
          const lower = (y + r) / (2 * r);
          // horizontal slits in the lower half
          if (lower > 0.5 && Math.floor((cy + y) / 2) % Math.max(2, Math.round(4 - lower * 3)) === 0 && ((cy + y + Math.floor(t * 0.004)) % 4) < 1 + Math.floor((lower - 0.5) * 6)) continue;
          const half = Math.floor(Math.sqrt(r * r - y * y));
          ctx.fillStyle = mix(pal.sunA, pal.sunB, lower);
          ctx.fillRect(cx - half, cy + y, half * 2, 1);
        }
      }
      // clouds
      for (const c of clouds) {
        const x = ((c.x + (animate ? t * c.sp * 0.06 : 0) - px * 2.4) % (W + c.w * 2) + W + c.w * 2) % (W + c.w * 2) - c.w;
        ctx.globalAlpha = 0.22;
        ctx.fillStyle = pal.cloud;
        ctx.fillRect(Math.floor(x), Math.floor(c.y), Math.floor(c.w), 2);
        ctx.fillRect(Math.floor(x + 3), Math.floor(c.y - 2), Math.floor(c.w * 0.6), 2);
        ctx.fillRect(Math.floor(x + c.w * 0.2), Math.floor(c.y + 2), Math.floor(c.w * 0.5), 1);
      }
      ctx.globalAlpha = 1;
      // mountains
      const off1 = Math.floor(px * 3 + (animate ? t * 0.004 : 0)), off2 = Math.floor(px * 6);
      ctx.fillStyle = pal.mount1;
      for (let x = 0; x < W; x++) { const y = peaks1[(x + off1 + W * 2) % peaks1.length]; ctx.fillRect(x, Math.floor(y), 1, horizon - Math.floor(y) + 1); }
      ctx.fillStyle = pal.mount2;
      for (let x = 0; x < W; x++) { const y = peaks2[(x * 2 + off2 + W * 2) % peaks2.length]; ctx.fillRect(x, Math.floor(y + 2), 1, horizon - Math.floor(y) + 1); }
      // ground
      ctx.fillStyle = pal.ground;
      ctx.fillRect(0, horizon, W, H - horizon);
      // horizon glow
      for (let i = 0; i < 6; i++) {
        ctx.globalAlpha = 0.28 - i * 0.045;
        ctx.fillStyle = pal.glow;
        ctx.fillRect(0, horizon - i, W, 1);
      }
      ctx.globalAlpha = 1;
      ctx.fillStyle = pal.glow;
      ctx.fillRect(0, horizon, W, 1);
      // perspective grid
      if (grid) {
        ctx.fillStyle = pal.grid;
        const n = 12;
        const phase = animate ? (t * 0.00035) % 1 : 0;
        for (let i = 0; i < n; i++) {
          const z = (i + phase) / n;
          const y = Math.floor(horizon + 1 + (H - horizon) * Math.pow(z, 2.2));
          ctx.globalAlpha = 0.12 + 0.5 * z;
          ctx.fillRect(0, y, W, 1);
        }
        const cx = W / 2 - px * 3;
        for (let k = -14; k <= 14; k++) {
          ctx.globalAlpha = 0.28;
          const bx = cx + k * (W / 7);
          ctx.beginPath();
          // draw as stepped pixel line
          const steps = H - horizon;
          for (let s = 0; s < steps; s += 1) {
            const z = s / steps;
            const x = Math.floor(cx + (bx - cx) * z);
            ctx.rect(x, horizon + 1 + s, 1, 1);
          }
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      }
      // particles
      for (const p of parts) {
        if (animate) { p.y -= p.vy * dt * 0.06; if (p.y < -2) { p.y = H + 2; p.x = rnd() * W; } }
        ctx.globalAlpha = 0.35 + 0.5 * Math.abs(Math.sin(t * 0.002 + p.p));
        ctx.fillStyle = p.c;
        ctx.fillRect(Math.floor(p.x - px * 4), Math.floor(p.y), 1, 1);
      }
      ctx.globalAlpha = 1;
    };

    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      if (!visible || document.hidden) return;
      const fpsGap = variant === 'hero' ? 1000 / 30 : 1000 / 24;
      if (now - last < fpsGap) return;
      const dt = Math.min(100, now - last);
      last = now;
      draw(dt, true);
    };

    setup();
    const reduced = motionReduced({ reducedMotion: reducedPref });
    draw(0, false);
    if (!reduced) raf = requestAnimationFrame(loop);

    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { threshold: 0 });
    io.observe(canvas);
    let rt = 0;
    const onResize = () => { window.clearTimeout(rt); rt = window.setTimeout(() => { setup(); draw(0, false); }, 150); };
    window.addEventListener('resize', onResize);
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      tx = (e.clientX / window.innerWidth - 0.5) * 2;
      ty = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    if (!reduced && anim !== 'low') window.addEventListener('pointermove', onMove, { passive: true });

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      window.clearTimeout(rt);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('pointermove', onMove);
    };
  }, [variant, sun, grid, reducedPref, anim]);

  return <canvas ref={ref} className={`bg-canvas ${className}`} style={{ opacity: 1 - dim }} aria-hidden />;
}
