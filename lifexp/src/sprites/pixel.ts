// Tiny pixel-art toolkit: draw into an RGBA buffer, then export as a cached data URL.
// All LIFE//XP art is generated in code, so there are no image assets to download.

export type RGBA = [number, number, number, number];

export function hex(c: string | RGBA): RGBA {
  if (typeof c !== 'string') return c;
  let s = c.replace('#', '');
  if (s.length === 3) s = s.split('').map((x) => x + x).join('');
  const n = parseInt(s.slice(0, 6), 16);
  const a = s.length === 8 ? parseInt(s.slice(6, 8), 16) : 255;
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255, a];
}

const toHex = (r: number, g: number, b: number) => '#' + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');

/** amt -1..1 : negative mixes toward black, positive toward white */
export function shade(c: string, amt: number): string {
  const [r, g, b] = hex(c);
  const t = amt < 0 ? 0 : 255;
  const k = Math.abs(amt);
  return toHex(r + (t - r) * k, g + (t - g) * k, b + (t - b) * k);
}

export class Pix {
  readonly d: Uint8ClampedArray;
  constructor(readonly w: number, readonly h: number) {
    this.d = new Uint8ClampedArray(w * h * 4);
  }

  set(x: number, y: number, c: string | RGBA): this {
    x = Math.floor(x);
    y = Math.floor(y);
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return this;
    const [r, g, b, a] = hex(c);
    const i = (y * this.w + x) * 4;
    this.d[i] = r;
    this.d[i + 1] = g;
    this.d[i + 2] = b;
    this.d[i + 3] = a;
    return this;
  }

  alpha(x: number, y: number): number {
    x = Math.floor(x);
    y = Math.floor(y);
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return 0;
    return this.d[(y * this.w + x) * 4 + 3];
  }

  rect(x: number, y: number, w: number, h: number, c: string): this {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, c);
    return this;
  }

  ell(cx: number, cy: number, rx: number, ry: number, c: string): this {
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
      for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
        const dx = (x + 0.5 - cx) / rx;
        const dy = (y + 0.5 - cy) / ry;
        if (dx * dx + dy * dy <= 1) this.set(x, y, c);
      }
    }
    return this;
  }

  ring(cx: number, cy: number, r: number, c: string, t = 1): this {
    for (let y = Math.floor(cy - r - t); y <= Math.ceil(cy + r + t); y++) {
      for (let x = Math.floor(cx - r - t); x <= Math.ceil(cx + r + t); x++) {
        const dist = Math.hypot(x + 0.5 - cx, y + 0.5 - cy);
        if (dist <= r + t / 2 && dist >= r - t / 2) this.set(x, y, c);
      }
    }
    return this;
  }

  line(x0: number, y0: number, x1: number, y1: number, c: string): this {
    x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
    const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    for (;;) {
      this.set(x0, y0, c);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) { err += dy; x0 += sx; }
      if (e2 <= dx) { err += dx; y0 += sy; }
    }
    return this;
  }

  poly(pts: [number, number][], c: string): this {
    const ys = pts.map((p) => p[1]);
    const y0 = Math.floor(Math.min(...ys)), y1 = Math.ceil(Math.max(...ys));
    for (let y = y0; y <= y1; y++) {
      const yy = y + 0.5;
      const xs: number[] = [];
      for (let i = 0; i < pts.length; i++) {
        const [ax, ay] = pts[i];
        const [bx, by] = pts[(i + 1) % pts.length];
        if ((ay <= yy && by > yy) || (by <= yy && ay > yy)) xs.push(ax + ((yy - ay) / (by - ay)) * (bx - ax));
      }
      xs.sort((a, b) => a - b);
      for (let k = 0; k + 1 < xs.length; k += 2) {
        for (let x = Math.round(xs[k]); x < Math.round(xs[k + 1]); x++) this.set(x, y, c);
      }
    }
    return this;
  }

  /** Copies the left half onto the right half, mirrored (for symmetrical creatures). */
  sym(): this {
    const half = Math.floor(this.w / 2);
    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < half; x++) {
        const i = (y * this.w + x) * 4;
        if (this.d[i + 3] === 0) continue;
        const j = (y * this.w + (this.w - 1 - x)) * 4;
        this.d[j] = this.d[i]; this.d[j + 1] = this.d[i + 1]; this.d[j + 2] = this.d[i + 2]; this.d[j + 3] = this.d[i + 3];
      }
    }
    return this;
  }

  /** 1px outline around opaque pixels. */
  outline(c: string): this {
    const add: [number, number][] = [];
    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < this.w; x++) {
        if (this.alpha(x, y) > 0) continue;
        if (this.alpha(x - 1, y) > 0 || this.alpha(x + 1, y) > 0 || this.alpha(x, y - 1) > 0 || this.alpha(x, y + 1) > 0) add.push([x, y]);
      }
    }
    for (const [x, y] of add) this.set(x, y, c);
    return this;
  }

  /** Nearest-neighbour blit of another buffer (scale may be fractional). */
  blit(src: Pix, ox: number, oy: number, scale = 1): this {
    const W = Math.round(src.w * scale), H = Math.round(src.h * scale);
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const sx = Math.min(src.w - 1, Math.floor(x / scale)), sy = Math.min(src.h - 1, Math.floor(y / scale));
        const i = (sy * src.w + sx) * 4;
        if (src.d[i + 3] === 0) continue;
        this.set(ox + x, oy + y, [src.d[i], src.d[i + 1], src.d[i + 2], src.d[i + 3]]);
      }
    }
    return this;
  }

  toURL(): string {
    const cv = document.createElement('canvas');
    cv.width = this.w;
    cv.height = this.h;
    const ctx = cv.getContext('2d')!;
    ctx.putImageData(new ImageData(new Uint8ClampedArray(this.d), this.w, this.h), 0, 0);
    return cv.toDataURL('image/png');
  }
}

const cache = new Map<string, string>();

/** Draws (once) and returns a PNG data URL for `key`. */
export function sprite(key: string, w: number, h: number, draw: (p: Pix) => void): string {
  const hit = cache.get(key);
  if (hit) return hit;
  const p = new Pix(w, h);
  draw(p);
  const url = p.toURL();
  cache.set(key, url);
  return url;
}

// Tiny 3x5 bitmap font for in-sprite glyphs (letters used by art: F, Z, !, ?, 0-9)
const GLYPHS: Record<string, string[]> = {
  F: ['111', '100', '110', '100', '100'],
  Z: ['111', '001', '010', '100', '111'],
  z: ['11', '01', '10', '11', '00'],
  '!': ['1', '1', '1', '0', '1'],
  '?': ['111', '001', '011', '000', '010'],
  A: ['010', '101', '111', '101', '101'],
  X: ['101', '101', '010', '101', '101'],
  P: ['110', '101', '110', '100', '100'],
};

export function glyph(p: Pix, ch: string, x: number, y: number, c: string, scale = 1) {
  const g = GLYPHS[ch];
  if (!g) return;
  g.forEach((row, j) => [...row].forEach((v, i) => { if (v === '1') p.rect(x + i * scale, y + j * scale, scale, scale, c); }));
}
