import { Pix, shade, sprite } from './pixel.ts';

export const COMP_W = 40;
export const COMP_H = 42;

interface Pal { main: string; dark: string; belly: string; wing: string; horn: string; eye: string }

const PALS: Record<number, Pal> = {
  1: { main: '#ff8a2e', dark: '#c4521a', belly: '#ffd89a', wing: '#ff5b7a', horn: '#fff1d0', eye: '#ffffff' },
  2: { main: '#ff6a3d', dark: '#a8331a', belly: '#ffc98a', wing: '#b84dff', horn: '#fff1d0', eye: '#ffffff' },
  3: { main: '#d6463d', dark: '#7a1f2c', belly: '#ffb98a', wing: '#4a2a8a', horn: '#dfe8ff', eye: '#7ff6ff' },
  4: { main: '#ffd23a', dark: '#d98a14', belly: '#fff6d6', wing: '#fff0b8', horn: '#ffffff', eye: '#7ff6ff' },
};

export function drawDragon(p: Pix, stage: 1 | 2 | 3 | 4) {
  const c = PALS[stage];
  const rx = [7, 8.5, 9.5, 10][stage - 1];
  const ry = [6, 7, 8, 8.5][stage - 1];
  const bx = 17, by = 30 - (stage - 1) * 0.5;
  const hx = bx + rx - 2, hy = by - ry - 3;
  const hr = [6, 6.2, 6.6, 7][stage - 1];

  // mane flames (legendary)
  if (stage === 4) {
    for (const [x, y, h] of [[hx - 8, hy - 2, 7], [hx - 5, hy - 6, 8], [hx, hy - 9, 7], [hx + 5, hy - 7, 6]] as number[][]) {
      p.poly([[x - 2, y + 4], [x + 3, y + 4], [x + 0.5, y - h + 4]], '#ff8a2e');
      p.poly([[x - 1, y + 4], [x + 2, y + 4], [x + 0.5, y - h * 0.6 + 4]], '#fff08a');
    }
  }

  // far wing
  const wing = (dx: number, shadeAmt: number) => {
    const col = shade(c.wing, shadeAmt);
    const s = [0.8, 1.1, 1.35, 1.6][stage - 1];
    p.poly(
      [[bx - 1 + dx, by - ry + 2], [bx - 8 * s + dx, by - ry - 9 * s], [bx - 4 * s + dx, by - ry - 3 * s], [bx - 1 * s + dx, by - ry - 8 * s], [bx + 3 + dx, by - ry]],
      col,
    );
    if (stage >= 3) {
      p.line(bx - 1 + dx, by - ry + 1, bx - 8 * s + dx, by - ry - 9 * s, shade(col, -0.45));
      p.line(bx - 1 + dx, by - ry + 1, bx - 1 * s + dx, by - ry - 8 * s, shade(col, -0.45));
    }
  };
  wing(-3, -0.25);

  // tail
  const tail: [number, number][] = [[bx - rx + 1, by + 2], [bx - rx - 3, by + 4], [bx - rx - 6, by + 3], [bx - rx - 8, by], [bx - rx - 9, by - 3]];
  tail.forEach(([x, y], i) => p.ell(x, y, 3.2 - i * 0.35, 3 - i * 0.35, i % 2 ? c.main : c.dark));
  const [tx, ty] = tail[tail.length - 1];
  if (stage === 3) p.poly([[tx - 1, ty], [tx + 2, ty - 1], [tx + 1, ty - 6], [tx - 3, ty - 1]], '#dfe8ff');
  else {
    p.poly([[tx - 3, ty + 1], [tx + 2, ty + 1], [tx - 0.5, ty - 6]], '#ff8a2e');
    p.poly([[tx - 2, ty + 1], [tx + 1, ty + 1], [tx - 0.5, ty - 3]], '#fff08a');
  }

  // legs
  p.ell(bx - 3, by + ry - 0.5, 3, 2.2, c.dark);
  p.ell(bx + 4, by + ry - 0.5, 3, 2.2, c.dark);
  // body
  p.ell(bx, by, rx, ry, c.dark);
  p.ell(bx - 0.5, by - 0.8, rx - 0.6, ry - 0.8, c.main);
  p.ell(bx + 1.5, by + 2, rx - 3.2, ry - 2.6, c.belly);
  // belly bands
  for (let i = 0; i < 3; i++) p.rect(bx - 1 + i * 0, by + 1 + i * 2.4, rx - 2, 1, shade(c.belly, -0.18));

  // back spikes
  for (let i = 0; i < 3 + stage; i++) {
    const x = bx - rx + 3 + i * 2.6;
    const y = by - ry + 1 + Math.abs(i - 2) * 0.5;
    p.poly([[x - 1, y + 1], [x + 1, y + 1], [x, y - 2 - (stage >= 3 ? 1 : 0)]], stage === 4 ? '#ffffff' : c.horn);
  }
  // armor plates (elite)
  if (stage === 3) {
    p.rect(bx - 4, by - ry + 1, 9, 3, '#b8c4dc');
    p.rect(bx - 4, by - ry + 1, 9, 1, '#eef3ff');
    p.rect(bx - 2, by - 1, 6, 3, '#8f9bb8');
  }

  // near wing
  wing(2, 0);

  // head
  p.ell(hx, hy, hr, hr - 0.4, c.main);
  p.ell(hx - 1.5, hy - 2, 2.6, 1.8, shade(c.main, 0.3));
  p.ell(hx + hr - 1.5, hy + 2, 3.6, 2.8, c.main);
  p.ell(hx + hr - 1, hy + 3, 3, 1.6, c.belly);
  p.set(hx + hr + 1, hy + 1, '#3a0f08');
  p.set(hx + hr + 1, hy + 2, '#3a0f08');
  // horns
  const hl = [2, 4, 5.5, 7][stage - 1];
  p.poly([[hx - 3, hy - hr + 2], [hx - 1, hy - hr + 2], [hx - 3 - hl * 0.5, hy - hr - hl]], c.horn);
  p.poly([[hx + 1, hy - hr + 1], [hx + 3, hy - hr + 2], [hx + 2 + hl * 0.4, hy - hr - hl + 1]], shade(c.horn, -0.12));
  if (stage === 3) p.rect(hx - 4, hy - 2, 4, 2, '#b8c4dc');
  // eye
  p.ell(hx + 2, hy - 0.8, 2.4, 2.4, c.eye);
  p.ell(hx + 2.8, hy - 0.5, 1.2, 1.4, stage >= 3 ? '#0a2a4a' : '#1a0b33');
  p.set(hx + 3, hy - 1, '#ffffff');
  if (stage >= 3) p.rect(hx - 1, hy - 3, 4, 1, '#1a0b33');

  // halo (legendary)
  if (stage === 4) {
    for (let a = 0; a < 360; a += 10) {
      const x = hx - 1 + Math.cos((a * Math.PI) / 180) * 7.5, y = hy - hr - 5 + Math.sin((a * Math.PI) / 180) * 2.2;
      p.set(x, y, '#fff6a8');
    }
  }
  p.outline(stage === 4 ? '#7a4a05' : '#2a0c06');
  // sparkles
  if (stage === 4) for (const [x, y] of [[4, 8], [35, 10], [30, 34], [6, 26]] as number[][]) { p.set(x, y, '#ffffff'); p.set(x - 1, y, '#fff08a'); p.set(x + 1, y, '#fff08a'); p.set(x, y - 1, '#fff08a'); p.set(x, y + 1, '#fff08a'); }
}

export function companionURL(stage: number): string {
  const s = (Math.min(4, Math.max(1, stage)) as 1 | 2 | 3 | 4);
  return sprite(`ember:${s}`, COMP_W, COMP_H, (p) => drawDragon(p, s));
}

/** A glowing egg shown for the hatch state / silhouette. */
export function companionSilhouetteURL(stage: number): string {
  const s = (Math.min(4, Math.max(1, stage)) as 1 | 2 | 3 | 4);
  return sprite(`embersil:${s}`, COMP_W, COMP_H, (p) => {
    drawDragon(p, s);
    for (let i = 0; i < p.d.length; i += 4) if (p.d[i + 3] > 0) { p.d[i] = 22; p.d[i + 1] = 20; p.d[i + 2] = 44; }
  });
}
