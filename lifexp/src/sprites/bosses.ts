import { DEFAULT_APPEARANCE } from '@shared/content.ts';
import { Pix, glyph, shade, sprite } from './pixel.ts';
import { drawKnight } from './knight.ts';

export const BOSS_W = 48;
export const BOSS_H = 48;

const BONE = '#f4efe0';
const BONE_D = '#c9bfa4';

function procrastination(p: Pix) {
  const B = '#7a3fd1', Bl = '#a46bf5', Bd = '#4a2490';
  // horns
  p.poly([[12, 18], [10, 9], [5, 2], [9, 4], [15, 11], [18, 17]], BONE);
  p.poly([[12, 18], [11, 11], [8, 6], [10, 8], [14, 13]], BONE_D);
  p.poly([[35, 18], [37, 9], [42, 2], [38, 4], [32, 11], [29, 17]], BONE);
  p.poly([[35, 18], [36, 11], [39, 6], [37, 8], [33, 13]], BONE_D);
  // body
  p.ell(24, 30, 17.5, 15, Bd);
  p.ell(23.5, 28, 16.5, 13.5, B);
  p.ell(16, 20, 6, 3.5, Bl);
  // arms with gadgets
  p.ell(7, 34, 3.5, 6, B);
  p.ell(40, 34, 3.5, 6, B);
  p.rect(3, 36, 5, 8, '#4ad0ff');
  p.rect(4, 37, 3, 5, '#d6f6ff');
  p.rect(40, 37, 6, 5, '#ff7ad9');
  p.rect(41, 38, 4, 1, '#ffd0f2');
  // feet
  p.ell(16, 45, 6, 2.6, Bd);
  p.ell(32, 45, 6, 2.6, Bd);
  // eyes
  p.poly([[13, 21], [20, 24], [20, 20], [13, 19]], '#1a0b33');
  p.poly([[34, 21], [27, 24], [27, 20], [34, 19]], '#1a0b33');
  p.rect(15, 22, 4, 2, '#ff3b3b');
  p.rect(29, 22, 4, 2, '#ff3b3b');
  p.set(16, 22, '#ffe08a');
  p.set(31, 22, '#ffe08a');
  // maw
  p.ell(24, 31, 9.5, 5, '#1a0610');
  for (let x = 16; x <= 31; x += 3) {
    p.poly([[x, 27], [x + 2, 27], [x + 1, 31]], '#ffffff');
    p.poly([[x + 1, 36], [x + 3, 36], [x + 2, 32]], '#ffffff');
  }
  p.ell(24, 35, 4, 1.6, '#ff6f9c');
  // clock belly
  p.ell(24, 41, 5.6, 5.6, '#2b1458');
  p.ell(24, 41, 4.6, 4.6, BONE);
  for (const [x, y] of [[24, 37], [28, 41], [24, 45], [20, 41]] as [number, number][]) p.set(x, y, '#2b1458');
  p.line(24, 41, 24, 38, '#1a0b33');
  p.line(24, 41, 27, 42, '#ff3b3b');
  p.outline('#12082a');
}

function distraction(p: Pix) {
  const B = '#2fb86a', Bl = '#6af2a6', Bd = '#17703f';
  // antennae with red notification bubbles
  p.line(14, 14, 10, 6, Bd);
  p.line(33, 14, 38, 6, Bd);
  p.ell(10, 5, 3.2, 3.2, '#ff445f');
  p.ell(38, 5, 3.2, 3.2, '#ff445f');
  glyph(p, '!', 9, 3, '#ffffff');
  glyph(p, '!', 37, 3, '#ffffff');
  p.ell(24, 29, 17, 14.5, Bd);
  p.ell(23.5, 27.5, 16, 13, B);
  p.ell(17, 20, 6, 3, Bl);
  // screens as arms
  p.rect(1, 28, 7, 12, '#1f2a55');
  p.rect(2, 29, 5, 10, '#4ad0ff');
  p.rect(3, 31, 3, 1, '#ffffff');
  p.rect(3, 34, 3, 1, '#ffffff');
  // many eyes
  for (const [x, y, r] of [[24, 24, 6], [14, 29, 3], [34, 29, 3], [18, 18, 2.5], [30, 18, 2.5]] as [number, number, number][]) {
    p.ell(x, y, r, r, '#ffffff');
    p.ell(x + 0.5, y + 0.5, r * 0.55, r * 0.55, '#18d9ff');
    p.ell(x + 0.5, y + 0.5, r * 0.25, r * 0.25, '#05050c');
  }
  p.ell(24, 36, 8, 3.2, '#12331f');
  for (let x = 18; x <= 29; x += 3) p.rect(x, 34, 2, 2, '#ffffff');
  p.ell(15, 44, 5, 2.6, Bd);
  p.ell(33, 44, 5, 2.6, Bd);
  p.sym();
  p.outline('#07210f');
}

function badHabits(p: Pix) {
  const B = '#2a6fd6', Bl = '#6aa8ff', Bd = '#163c80';
  const steel = '#aab4cc', steelD = '#5a6482';
  // shoulder spikes
  p.poly([[8, 20], [4, 10], [13, 17]], steel);
  p.poly([[39, 20], [43, 10], [34, 17]], steel);
  p.ell(24, 30, 18, 14, Bd);
  p.ell(23.5, 28.5, 17, 12.5, B);
  p.ell(15, 22, 6, 3, Bl);
  // chains across the body
  for (let i = 0; i < 20; i++) {
    const x = 8 + i * 1.6, y = 16 + i * 1.1;
    p.rect(x, y, 2, 2, i % 2 ? steel : steelD);
    const x2 = 39 - i * 1.6;
    p.rect(x2, y, 2, 2, i % 2 ? steelD : steel);
  }
  // face
  p.rect(14, 19, 7, 3, '#0a1530');
  p.rect(27, 19, 7, 3, '#0a1530');
  p.rect(16, 20, 3, 2, '#ffd23a');
  p.rect(29, 20, 3, 2, '#ffd23a');
  p.line(13, 17, 21, 20, '#0a1530');
  p.line(34, 17, 27, 20, '#0a1530');
  p.ell(24, 31, 9, 4, '#0a1530');
  for (let x = 17; x <= 30; x += 2) p.rect(x, x % 4 ? 29 : 30, 1, 3, '#ffffff');
  // fists + ball and chain
  p.ell(6, 36, 4, 5, B);
  p.ell(41, 38, 4, 5, B);
  p.line(41, 42, 44, 45, steel);
  p.ell(42, 45, 3.5, 3.5, '#3a415c');
  p.set(42, 42, steel);
  p.set(45, 44, steel);
  p.ell(16, 45, 6, 2.6, Bd);
  p.ell(30, 45, 6, 2.6, Bd);
  p.outline('#081633');
}

function examBoss(p: Pix) {
  // paper body
  const paper = '#f6eed6', paperD = '#cfc4a0';
  // pencil horns
  p.poly([[14, 8], [10, -1], [16, 2], [19, 8]], '#ffc83a');
  p.poly([[33, 8], [37, -1], [31, 2], [28, 8]], '#ffc83a');
  p.poly([[10, 0], [11, 3], [13, 2]], '#ffd9b0');
  p.poly([[37, 0], [36, 3], [34, 2]], '#ffd9b0');
  p.rect(10, 38, 28, 2, paperD);
  p.rect(10, 5, 28, 34, paper);
  p.rect(36, 5, 2, 34, paperD);
  p.poly([[30, 5], [38, 5], [38, 13]], paperD);
  p.poly([[30, 5], [30, 13], [38, 13]], '#e2d8b8');
  // lines of text
  for (let y = 22; y < 36; y += 3) p.rect(13, y, 18, 1, '#b9ad88');
  // big red F
  glyph(p, 'F', 17, 11, '#e0243e', 4);
  // eyes
  p.rect(14, 9, 6, 3, '#1a0610');
  p.rect(28, 9, 6, 3, '#1a0610');
  p.rect(16, 10, 2, 2, '#ff3b3b');
  p.rect(30, 10, 2, 2, '#ff3b3b');
  // arms and legs
  p.line(10, 22, 4, 30, '#2a1b52');
  p.line(37, 22, 43, 30, '#2a1b52');
  p.rect(2, 30, 4, 3, '#e9efff');
  p.rect(42, 30, 4, 3, '#e9efff');
  p.rect(16, 40, 3, 6, '#2a1b52');
  p.rect(29, 40, 3, 6, '#2a1b52');
  p.rect(14, 45, 6, 2, '#1a2038');
  p.rect(28, 45, 6, 2, '#1a2038');
  p.outline('#1a1030');
}

function laziness(p: Pix) {
  const B = '#d94b5c', Bl = '#ff8fa0', Bd = '#8f2638';
  // pillow
  p.ell(24, 42, 20, 5, '#f5d9e0');
  p.ell(24, 43, 20, 4, '#d9a9ba');
  // blob
  p.ell(24, 30, 19, 13.5, Bd);
  p.ell(23.5, 28.5, 18, 12, B);
  p.ell(15, 22, 6, 3, Bl);
  // blanket stripes
  for (let i = 0; i < 4; i++) p.rect(8 + i * 9, 36, 5, 5, shade(B, -0.18));
  // sleepy eyes
  p.line(13, 26, 20, 26, '#2b0a14');
  p.line(28, 26, 35, 26, '#2b0a14');
  p.line(14, 27, 19, 27, '#2b0a14');
  p.line(29, 27, 34, 27, '#2b0a14');
  p.rect(14, 24, 6, 1, shade(B, 0.25));
  p.rect(28, 24, 6, 1, shade(B, 0.25));
  // yawn
  p.ell(24, 33, 5, 3.6, '#2b0a14');
  p.ell(24, 34.5, 2.6, 1.6, '#ff6f9c');
  // zzz
  glyph(p, 'Z', 37, 6, '#d6f6ff', 2);
  glyph(p, 'Z', 31, 3, '#9fd8ff');
  glyph(p, 'z', 43, 2, '#9fd8ff');
  p.outline('#2a0a12');
}

function deadline(p: Pix) {
  // hourglass frame
  const frame = '#7a3fd1', glass = '#8fd6ff', sand = '#ff6a3d';
  p.rect(10, 2, 28, 4, frame);
  p.rect(10, 40, 28, 4, frame);
  p.rect(12, 6, 2, 34, shade(frame, -0.3));
  p.rect(34, 6, 2, 34, shade(frame, -0.3));
  p.poly([[14, 6], [34, 6], [26, 22], [26, 26], [34, 40], [14, 40], [22, 26], [22, 22]], shade(glass, -0.2));
  p.poly([[16, 7], [32, 7], [25, 21], [23, 21]], glass);
  p.poly([[15, 39], [33, 39], [26, 30], [22, 30]], sand);
  p.poly([[23, 22], [25, 22], [25, 30], [23, 30]], sand);
  // angry face in the upper glass
  p.rect(17, 10, 5, 3, '#1a0b33');
  p.rect(26, 10, 5, 3, '#1a0b33');
  p.rect(18, 11, 3, 2, '#ffd23a');
  p.rect(27, 11, 3, 2, '#ffd23a');
  p.line(16, 8, 22, 11, '#1a0b33');
  p.line(32, 8, 26, 11, '#1a0b33');
  p.ell(24, 17, 3.4, 1.8, '#1a0b33');
  p.rect(22, 16, 1, 2, '#ffffff');
  p.rect(25, 16, 1, 2, '#ffffff');
  // flames
  for (const [x, h] of [[12, 5], [17, 8], [22, 6], [27, 9], [32, 5]] as [number, number][]) {
    p.poly([[x, 44], [x + 5, 44], [x + 2.5, 44 + h]], '#ff8a2e');
    p.poly([[x + 1, 44], [x + 4, 44], [x + 2.5, 44 + h * 0.6]], '#ffd23a');
  }
  // spiky arms
  p.poly([[10, 14], [2, 10], [4, 16], [1, 20], [10, 20]], frame);
  p.poly([[38, 14], [46, 10], [44, 16], [47, 20], [38, 20]], frame);
  p.outline('#150a30');
}

function oldYou(p: Pix) {
  // corrupted aura shards
  for (const [x, y, w, h] of [[3, 6, 3, 5], [40, 10, 3, 6], [6, 30, 2, 5], [42, 32, 3, 4], [20, 1, 2, 3], [32, 3, 2, 3]] as number[][]) p.rect(x, y, w, h, '#5a1b8a');
  p.ring(24, 26, 20, '#3a1060', 2);
  const k = new Pix(26, 32);
  drawKnight(k, { armor: '#2b2644', light: '#4a4270', dark: '#15122a', plume: '#7a1b4a', helm: 'knight', cls: 'FOCUS', shadow: true });
  p.blit(k, 4, -2, 1.5);
  // glitch slices
  for (const y of [14, 27, 38]) {
    for (let x = 8; x < 40; x++) if (p.alpha(x, y) > 0 && x % 3 === 0) p.set(x + 2, y, '#ff3b4a');
  }
  p.outline('#05010d');
}

const DRAW: Record<string, (p: Pix) => void> = {
  procrastination, distraction, 'bad-habits': badHabits, 'exam-boss': examBoss, laziness, 'deadline-monster': deadline, 'the-old-you': oldYou,
};

export function bossURL(id: string): string {
  const fn = DRAW[id] ?? procrastination;
  return sprite(`boss:${id}`, BOSS_W, BOSS_H, fn);
}

/** Dark silhouette used for undiscovered bosses. */
export function bossSilhouetteURL(id: string): string {
  const fn = DRAW[id] ?? procrastination;
  return sprite(`bosssil:${id}`, BOSS_W, BOSS_H, (p) => {
    fn(p);
    for (let i = 0; i < p.d.length; i += 4) {
      if (p.d[i + 3] > 0) { p.d[i] = 18; p.d[i + 1] = 16; p.d[i + 2] = 36; }
    }
  });
}

export { DEFAULT_APPEARANCE };
