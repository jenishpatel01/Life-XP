import { Pix, shade, sprite } from './pixel.ts';

export const WORLD_W = 56;
export const WORLD_H = 48;

function island(p: Pix, grass: string, rock = '#4a3a5e') {
  // floating rock underside
  p.poly([[6, 30], [50, 30], [42, 40], [34, 46], [28, 47], [22, 45], [14, 38]], rock);
  p.poly([[8, 31], [30, 31], [28, 46], [22, 45], [14, 38]], shade(rock, -0.25));
  p.rect(26, 34, 3, 2, shade(rock, 0.2));
  // grass slab
  p.ell(28, 30, 23, 6.5, shade(grass, -0.35));
  p.ell(28, 28.5, 23, 6, grass);
  p.ell(21, 26.5, 8, 2.2, shade(grass, 0.3));
}

function tree(p: Pix, x: number, y: number, h: number, col = '#1f8a4c') {
  p.rect(x, y - 2, 2, 4, '#6b4a2a');
  p.poly([[x - 4, y - 1], [x + 6, y - 1], [x + 1, y - h]], shade(col, -0.2));
  p.poly([[x - 3, y - 4], [x + 5, y - 4], [x + 1, y - h - 2]], col);
  p.poly([[x - 2, y - h + 2], [x + 4, y - h + 2], [x + 1, y - h - 5]], shade(col, 0.2));
}

const DRAW: Record<string, (p: Pix) => void> = {
  'the-beginning': (p) => {
    island(p, '#48ef9f');
    // house + flag
    p.rect(18, 16, 14, 10, '#f4efe0');
    p.rect(18, 24, 14, 2, '#c9bfa4');
    p.poly([[16, 17], [34, 17], [25, 9]], '#e0453a');
    p.poly([[16, 17], [25, 17], [25, 9]], '#ff6a5d');
    p.rect(23, 20, 4, 6, '#6b4a2a');
    p.rect(20, 19, 3, 3, '#7fe8ff');
    p.rect(40, 12, 1, 16, '#dfe8ff');
    p.poly([[41, 12], [49, 14], [41, 17]], '#ff4fd8');
    tree(p, 10, 28, 9);
    p.outline('#0c1530');
  },
  'focus-forest': (p) => {
    island(p, '#2fb86a', '#3a4a4e');
    tree(p, 9, 28, 14, '#1f8a4c');
    tree(p, 17, 27, 18, '#27a85d');
    tree(p, 26, 29, 15, '#1f8a4c');
    tree(p, 34, 27, 19, '#2fb86a');
    tree(p, 42, 28, 13, '#1f8a4c');
    p.rect(30, 20, 2, 2, '#ffe08a');
    p.rect(14, 18, 2, 2, '#fff7c0');
    p.outline('#07210f');
  },
  'discipline-city': (p) => {
    island(p, '#2a78e0', '#34395e');
    const bld = (x: number, w: number, h: number, c: string) => {
      p.rect(x, 28 - h, w, h, c);
      p.rect(x + w - 2, 28 - h, 2, h, shade(c, -0.3));
      for (let y = 28 - h + 2; y < 26; y += 3) for (let xx = x + 1; xx < x + w - 2; xx += 3) p.set(xx, y, '#ffe08a');
    };
    bld(10, 7, 11, '#3a4a86');
    bld(18, 8, 18, '#4a5ab0');
    bld(27, 6, 13, '#35457d');
    bld(34, 9, 21, '#5568c8');
    bld(44, 6, 10, '#3a4a86');
    p.rect(37, 6, 1, 4, '#dfe8ff');
    p.set(37, 5, '#ff445f');
    p.outline('#0a1030');
  },
  'knowledge-valley': (p) => {
    island(p, '#27c4d8', '#2f4a66');
    // crystal tower
    p.poly([[22, 28], [34, 28], [31, 8], [25, 8]], '#7ff6ff');
    p.poly([[28, 28], [34, 28], [31, 8], [28, 8]], '#3ab8d8');
    p.poly([[25, 8], [31, 8], [28, 1]], '#d6fbff');
    p.rect(26, 14, 4, 2, '#0a2a4a');
    p.rect(26, 20, 4, 2, '#0a2a4a');
    for (const [x, h] of [[12, 8], [16, 12], [40, 10], [45, 7]] as number[][]) {
      p.poly([[x, 28], [x + 4, 28], [x + 2, 28 - h]], '#9fe8ff');
      p.poly([[x + 2, 28], [x + 4, 28], [x + 2, 28 - h]], '#3ab8d8');
    }
    p.rect(8, 8, 1, 3, '#ffffff'); p.rect(7, 9, 3, 1, '#ffffff');
    p.rect(48, 14, 1, 3, '#ffffff'); p.rect(47, 15, 3, 1, '#ffffff');
    p.outline('#07203a');
  },
  'fitness-peak': (p) => {
    island(p, '#8a6a4a', '#3a3040');
    p.poly([[8, 29], [27, 4], [46, 29]], '#6a5a78');
    p.poly([[27, 4], [46, 29], [30, 29]], '#4a3e5e');
    p.poly([[22, 11], [27, 4], [32, 11], [29, 13], [27, 11], [25, 13]], '#ffffff');
    p.poly([[27, 4], [32, 11], [29, 13], [28, 8]], '#bcd4ff');
    p.ell(44, 8, 5, 5, '#fff3c4');
    p.ell(46, 7, 4, 4, '#05050c');
    p.ell(44, 8, 5, 5, '#fff3c4');
    p.ell(46, 7, 3.6, 3.6, '#2a1250');
    p.rect(10, 26, 6, 3, '#4a3a2a');
    p.rect(40, 24, 4, 5, '#4a3a2a');
    p.outline('#0e0a1c');
  },
  'creators-realm': (p) => {
    island(p, '#e04fd0', '#4a2a6e');
    p.rect(20, 14, 16, 14, '#ffb3f0');
    p.rect(30, 14, 6, 14, '#e04fd0');
    for (const x of [18, 25, 33]) p.poly([[x, 14], [x + 5, 14], [x + 2.5, 3]], '#ff7ae8');
    p.poly([[25, 14], [30, 14], [27.5, 1]], '#fff0fb');
    p.rect(26, 21, 4, 7, '#3a1050');
    p.rect(22, 18, 3, 3, '#7ff6ff');
    p.rect(32, 18, 3, 3, '#ffe08a');
    for (const [x, y] of [[10, 12], [46, 10], [8, 22], [48, 22]] as number[][]) { p.set(x, y, '#ffffff'); p.set(x - 1, y, '#ffb3f0'); p.set(x + 1, y, '#ffb3f0'); p.set(x, y - 1, '#ffb3f0'); p.set(x, y + 1, '#ffb3f0'); }
    p.outline('#2a0a3a');
  },
  'final-challenge': (p) => {
    island(p, '#3a3250', '#241c36');
    p.rect(14, 12, 28, 16, '#2a2342');
    p.rect(34, 12, 8, 16, '#1b1630');
    for (const x of [12, 22, 32, 40]) {
      p.rect(x, 5, 6, 9, '#2a2342');
      p.rect(x, 3, 2, 3, '#2a2342'); p.rect(x + 4, 3, 2, 3, '#2a2342');
    }
    p.poly([[22, 28], [22, 20], [28, 16], [34, 20], [34, 28]], '#0e0a1c');
    p.rect(26, 21, 4, 4, '#ffc83a');
    p.ring(28, 21, 2, '#ffc83a', 1);
    p.rect(27, 22, 2, 3, '#7a5a0a');
    for (const x of [18, 38]) { p.rect(x, 17, 2, 3, '#ff445f'); }
    p.rect(28, 0, 1, 3, '#ff445f');
    p.outline('#05010d');
  },
};

export function worldURL(id: string): string {
  return sprite(`world:${id}`, WORLD_W, WORLD_H, DRAW[id] ?? DRAW['the-beginning']);
}

export function worldLockedURL(id: string): string {
  return sprite(`worldlock:${id}`, WORLD_W, WORLD_H, (p) => {
    (DRAW[id] ?? DRAW['the-beginning'])(p);
    for (let i = 0; i < p.d.length; i += 4) {
      if (p.d[i + 3] === 0) continue;
      const g = (p.d[i] * 0.3 + p.d[i + 1] * 0.5 + p.d[i + 2] * 0.2) * 0.35 + 14;
      p.d[i] = g; p.d[i + 1] = g; p.d[i + 2] = g + 10;
    }
    // padlock
    p.rect(24, 22, 9, 8, '#c9a227').rect(25, 23, 7, 6, '#ffc83a').rect(28, 25, 1, 3, '#3a2a05');
    p.ring(28.5, 21, 3, '#c9a227', 1.4);
  });
}
