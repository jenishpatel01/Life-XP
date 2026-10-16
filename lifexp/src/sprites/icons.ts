import { Pix, shade, sprite } from './pixel.ts';

export const ICON = 16;

const G = '#ffc83a', C = '#18d9ff', P = '#bd4eff', R = '#ff445f', O = '#ff8a2e', W = '#f3f6ff', L = '#48ef9f', K = '#0a0d1f';

type D = (p: Pix) => void;

const DRAW: Record<string, D> = {
  target: (p) => { p.ring(8, 8, 6.5, C, 1.6); p.ring(8, 8, 3.8, W, 1.4); p.ell(8, 8, 1.4, 1.4, R); p.line(8, 0, 8, 3, C); p.line(8, 13, 8, 16, C); p.line(0, 8, 3, 8, C); p.line(13, 8, 16, 8, C); },
  bolt: (p) => { p.poly([[9, 0], [3, 9], [7, 9], [5, 16], [13, 6], [9, 6], [11, 0]], G); p.poly([[9, 1], [5, 8], [8, 8]], '#fff3b0'); },
  star: (p) => { p.poly([[8, 0], [10, 5.5], [16, 6], [11.5, 9.6], [13, 15.5], [8, 12], [3, 15.5], [4.5, 9.6], [0, 6], [6, 5.5]], G); p.poly([[8, 2], [9, 6], [7, 6]], '#fff3b0'); },
  shield: (p) => { p.poly([[2, 1], [14, 1], [14, 8], [8, 15], [2, 8]], '#8fb4ff'); p.poly([[8, 1], [14, 1], [14, 8], [8, 15]], '#4a78e0'); p.rect(7, 4, 2, 7, W); p.rect(5, 6, 6, 2, W); },
  clover: (p) => { for (const [x, y] of [[5, 5], [11, 5], [5, 10], [11, 10]] as number[][]) p.ell(x, y, 3.2, 3.2, L); p.ell(5, 4.5, 1.2, 1.2, '#b8ffd8'); p.line(8, 9, 11, 15, '#1f8a4c'); },
  swirl: (p) => { p.ring(8, 8, 6, P, 1.8); p.ring(8, 8, 3, C, 1.6); p.rect(8, 1, 6, 2, P); p.rect(2, 13, 6, 2, C); p.ell(8, 8, 1, 1, W); },
  chain: (p) => { p.ring(5, 6, 3.4, '#aab4cc', 1.8); p.ring(11, 10, 3.4, '#dfe8ff', 1.8); p.line(7, 8, 9, 8, '#5a6482'); },
  wave: (p) => { for (let x = 0; x < 16; x++) p.set(x, 8 + Math.round(Math.sin(x / 2.2) * 3), C); for (let x = 0; x < 16; x++) p.set(x, 9 + Math.round(Math.sin(x / 2.2) * 3), C); for (let x = 0; x < 16; x++) p.set(x, 4 + Math.round(Math.sin(x / 2.2 + 1) * 2), P); for (let x = 0; x < 16; x++) p.set(x, 13 + Math.round(Math.sin(x / 2.2 + 2) * 2), L); },
  eye: (p) => { p.ell(8, 8, 7.5, 4.6, W); p.ell(8, 8, 3.4, 3.4, C); p.ell(8, 8, 1.6, 1.6, K); p.set(6, 6, W); p.line(1, 8, 4, 4, '#9fb0c7'); },
  book: (p) => { p.rect(2, 2, 12, 12, '#2a78e0'); p.rect(2, 2, 2, 12, '#163c80'); p.rect(5, 4, 7, 2, W); p.rect(5, 7, 5, 1, '#9fd8ff'); p.rect(5, 9, 6, 1, '#9fd8ff'); p.rect(2, 13, 12, 1, '#0a1c44'); },
  flame: (p) => { p.poly([[8, 0], [13, 6], [14, 11], [11, 15], [5, 15], [2, 11], [4, 5], [6, 8]], O); p.poly([[8, 5], [11, 9], [10, 14], [6, 14], [5, 10]], G); p.poly([[8, 9], [9, 12], [7, 13]], '#fff7c0'); },
  hourglass: (p) => { p.rect(2, 0, 12, 2, P); p.rect(2, 14, 12, 2, P); p.poly([[3, 2], [13, 2], [9, 8], [13, 14], [3, 14], [7, 8]], '#bfe9ff'); p.poly([[4, 13], [12, 13], [9, 10], [7, 10]], O); p.poly([[5, 2.5], [11, 2.5], [8, 6]], '#eaffff'); },
  sword: (p) => { p.line(13, 1, 4, 10, W); p.line(14, 2, 5, 11, '#9fd8ff'); p.line(2, 9, 7, 14, G); p.line(2, 14, 4, 12, '#7a5a0a'); p.rect(1, 13, 3, 3, '#6b4a2a'); },
  phoenix: (p) => { p.poly([[8, 1], [11, 6], [15, 4], [13, 10], [10, 11], [10, 15], [8, 13], [6, 15], [6, 11], [3, 10], [1, 4], [5, 6]], O); p.poly([[8, 4], [10, 8], [8, 11], [6, 8]], G); p.set(8, 5, W); p.rect(7, 2, 2, 1, '#fff3b0'); },
  crown: (p) => { p.poly([[1, 12], [1, 4], [5, 8], [8, 2], [11, 8], [15, 4], [15, 12]], G); p.rect(1, 12, 14, 3, '#c9930a'); p.set(8, 4, R); p.set(3, 10, C); p.set(13, 10, C); p.set(8, 10, L); },
  // achievement-only
  flag: (p) => { p.rect(3, 1, 2, 14, '#dfe8ff'); p.poly([[5, 2], [14, 4], [5, 9]], R); p.poly([[5, 2], [10, 3], [5, 5]], '#ff8fa0'); },
  skull: (p) => { p.ell(8, 7, 6, 6, W); p.rect(4, 11, 8, 4, W); p.rect(4, 6, 3, 3, K); p.rect(9, 6, 3, 3, K); p.rect(7, 10, 2, 2, '#9fb0c7'); p.rect(5, 13, 1, 2, K); p.rect(8, 13, 1, 2, K); p.rect(11, 13, 1, 2, K); },
  brain: (p) => { p.ell(5.5, 7, 4.5, 5.5, '#ff8fb8'); p.ell(10.5, 7, 4.5, 5.5, '#ff6a9c'); p.line(8, 2, 8, 13, '#a83a62'); p.line(3, 6, 6, 8, '#a83a62'); p.line(10, 5, 13, 8, '#a83a62'); p.rect(7, 13, 2, 3, '#a83a62'); },
  spark: (p) => { p.poly([[8, 0], [10, 6], [16, 8], [10, 10], [8, 16], [6, 10], [0, 8], [6, 6]], '#ff7ae8'); p.poly([[8, 3], [9, 7], [8, 8], [7, 7]], W); },
  sun: (p) => { p.ell(8, 8, 4.5, 4.5, G); p.ell(7, 7, 2, 2, '#fff3b0'); for (let a = 0; a < 8; a++) { const r = (a * Math.PI) / 4; p.line(8 + Math.cos(r) * 6, 8 + Math.sin(r) * 6, 8 + Math.cos(r) * 7.8, 8 + Math.sin(r) * 7.8, O); } },
  map: (p) => { p.poly([[1, 3], [6, 1], [10, 3], [15, 1], [15, 13], [10, 15], [6, 13], [1, 15]], '#e9d9a6'); p.line(6, 1, 6, 13, '#b69a52'); p.line(10, 3, 10, 15, '#b69a52'); p.set(4, 8, R); p.set(8, 6, R); p.set(12, 9, R); p.line(4, 8, 8, 6, R); },
  card: (p) => { p.rect(3, 1, 10, 14, '#2a2f5a'); p.rect(4, 2, 8, 12, '#6a4aff'); p.rect(5, 3, 6, 5, '#b9a8ff'); p.rect(5, 10, 6, 1, W); p.rect(5, 12, 4, 1, '#d6ccff'); },
  burst: (p) => { p.poly([[8, 0], [10, 5], [15, 3], [12, 7], [16, 9], [11, 10], [12, 15], [8, 12], [4, 15], [5, 10], [0, 9], [4, 7], [1, 3], [6, 5]], R); p.poly([[8, 4], [10, 7], [8, 11], [6, 7]], G); },
  egg: (p) => { p.ell(8, 9, 5.5, 6.8, '#fff1d0'); p.ell(6.5, 6.5, 2, 2.4, W); p.poly([[3, 9], [5, 11], [7, 9], [9, 11], [11, 9], [13, 11], [13, 12], [3, 12]], O); },
  lock: (p) => { p.ring(8, 6, 3.6, '#aab4cc', 1.8); p.rect(3, 7, 10, 8, '#c9a227'); p.rect(4, 8, 8, 6, G); p.rect(7, 10, 2, 3, '#3a2a05'); },
  check: (p) => { p.line(2, 8, 6, 12, L); p.line(3, 8, 6, 11, L); p.line(6, 12, 14, 3, L); p.line(6, 11, 13, 3, L); },
  heart: (p) => { p.ell(5, 5, 3.6, 3.6, R); p.ell(11, 5, 3.6, 3.6, R); p.poly([[1.6, 6], [14.4, 6], [8, 14]], R); p.set(4, 4, '#ffb3c0'); },
  home: (p) => { p.poly([[8, 1], [15, 8], [13, 8], [13, 15], [3, 15], [3, 8], [1, 8]], C); p.rect(7, 10, 3, 5, K); },
  scroll: (p) => { p.rect(3, 2, 10, 12, '#e9d9a6'); p.ell(3, 2, 2, 2, '#c9b078'); p.ell(13, 14, 2, 2, '#c9b078'); p.rect(5, 5, 6, 1, '#8a6a30'); p.rect(5, 8, 6, 1, '#8a6a30'); p.rect(5, 11, 4, 1, '#8a6a30'); },
  user: (p) => { p.ell(8, 5, 3.4, 3.6, C); p.ell(8, 14, 6, 5, C); },
  gear: (p) => { p.ring(8, 8, 4.5, '#9fb0c7', 3); for (let a = 0; a < 8; a++) { const r = (a * Math.PI) / 4; p.rect(8 + Math.cos(r) * 6.2 - 1, 8 + Math.sin(r) * 6.2 - 1, 2, 2, '#c8d4ea'); } p.ell(8, 8, 1.8, 1.8, K); },
  hero: (p) => { p.ell(8, 4, 3.4, 3.6, '#7fd0ff'); p.rect(4, 8, 8, 6, '#1fb6ff'); p.rect(3, 9, 2, 4, '#8ff0ff'); p.rect(11, 9, 2, 4, '#0b5a9c'); p.rect(6, 3, 4, 2, K); },
  trophy: (p) => { p.rect(4, 1, 8, 6, G); p.ell(8, 7, 4, 2.4, G); p.rect(7, 9, 2, 3, '#c9930a'); p.rect(4, 13, 8, 2, '#c9930a'); p.ring(3, 4, 2, G, 1); p.ring(13, 4, 2, G, 1); p.rect(5, 2, 2, 4, '#fff3b0'); },
};

export const ICON_IDS = Object.keys(DRAW);

export function iconURL(id: string, tint?: string): string {
  const fn = DRAW[id] ?? DRAW.star;
  return sprite(`icon:${id}:${tint ?? ''}`, ICON, ICON, (p) => {
    fn(p);
    if (tint) {
      for (let i = 0; i < p.d.length; i += 4) {
        if (p.d[i + 3] === 0) continue;
        p.d[i] = p.d[i] * 0.2 + parseInt(tint.slice(1, 3), 16) * 0.8;
        p.d[i + 1] = p.d[i + 1] * 0.2 + parseInt(tint.slice(3, 5), 16) * 0.8;
        p.d[i + 2] = p.d[i + 2] * 0.2 + parseInt(tint.slice(5, 7), 16) * 0.8;
      }
    }
    p.outline(shade('#05050c', 0));
  });
}
