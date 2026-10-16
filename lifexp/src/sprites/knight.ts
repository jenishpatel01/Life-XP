import { ARMOR_COLORS, PLUME_COLORS, type Appearance, type ClassId } from '@shared/content.ts';
import { Pix, shade, sprite } from './pixel.ts';

export const KNIGHT_W = 26;
export const KNIGHT_H = 32;

const OUT = '#090c1d';
const SKIN = '#f4cfa5';
const GOLD = '#ffc83a';
const VISOR = '#0a1024';

interface KnightOpts {
  armor: string;
  light: string;
  dark: string;
  plume: string;
  helm: string;
  cls: ClassId;
  /** Corrupted "shadow self" palette used by the final boss */
  shadow?: boolean;
}

function emblem(p: Pix, cls: ClassId, c: string) {
  // 5x5 glyph on the chest at x=10..14, y=15..19
  const g: Record<ClassId, string[]> = {
    DISCIPLINE: ['11111', '11111', '11111', '01110', '00100'], // shield
    FOCUS: ['00100', '01110', '11111', '01110', '00100'], // diamond
    FITNESS: ['00110', '01100', '11111', '00110', '01100'], // bolt
    CREATIVE: ['00100', '10101', '01110', '10101', '00100'], // star
  };
  g[cls].forEach((row, j) => [...row].forEach((v, i) => v === '1' && p.set(10 + i, 15 + j, c)));
}

export function drawKnight(p: Pix, o: KnightOpts) {
  const eye = o.shadow ? '#ff3b4a' : '#7ff6ff';
  // cape (behind)
  p.poly([[6, 14], [19, 14], [21, 27], [4, 27]], shade(o.plume, -0.55));
  // legs
  p.rect(8, 23, 4, 7, o.dark);
  p.rect(14, 23, 4, 7, o.dark);
  p.rect(8, 23, 1, 6, o.armor);
  p.rect(14, 23, 1, 6, o.armor);
  p.rect(7, 29, 5, 2, '#1a2038');
  p.rect(14, 29, 5, 2, '#1a2038');
  // torso
  p.rect(7, 13, 12, 10, o.armor);
  p.rect(16, 13, 3, 10, o.dark);
  p.rect(8, 14, 2, 6, o.light);
  p.rect(7, 21, 12, 2, '#2a2f4a');
  p.rect(12, 21, 2, 2, GOLD);
  emblem(p, o.cls, o.light);
  // pauldrons + arms
  p.ell(6, 14.5, 3.2, 2.8, o.light);
  p.ell(19, 14.5, 3.2, 2.8, o.armor);
  p.rect(4, 16, 3, 6, o.armor);
  p.rect(19, 16, 3, 6, o.dark);
  p.rect(4, 22, 3, 2, '#e9efff');
  p.rect(19, 22, 3, 2, '#c2cbe6');
  // weapon
  if (o.cls === 'CREATIVE') {
    // staff with an orb
    p.rect(22, 8, 1, 18, '#7b5733');
    p.ell(22.5, 6, 2.6, 2.6, o.shadow ? '#a33' : o.plume);
    p.ell(22, 5.5, 1, 1, '#ffffff');
  } else {
    const blade = o.shadow ? '#9aa3c9' : '#e9faff';
    p.rect(22, 4, 2, 17, blade);
    p.rect(22, 4, 1, 17, '#ffffff');
    p.set(22, 3, blade);
    p.rect(20, 21, 6, 1, GOLD);
    p.rect(22, 22, 2, 3, '#6b4a2a');
  }
  // head
  if (o.helm === 'knight') {
    p.ell(13, 8.5, 5.8, 6.2, o.armor);
    p.ell(11.5, 6.5, 2.2, 2.4, o.light);
    p.rect(16, 4, 2, 9, o.dark);
    p.rect(8, 7, 10, 3, VISOR);
    p.rect(9, 8, 2, 1, eye);
    p.rect(14, 8, 2, 1, eye);
    p.rect(12, 1, 2, 3, o.light);
    // plume
    for (const [x, y] of [[13, 0], [14, 0], [15, 0], [16, 1], [17, 1], [17, 2], [18, 3], [17, 4], [16, 3], [15, 2], [14, 1]] as [number, number][]) p.set(x, y, o.plume);
    p.set(15, 1, shade(o.plume, 0.5));
    p.set(16, 2, shade(o.plume, -0.25));
  } else if (o.helm === 'hood') {
    p.poly([[13, 0], [19, 6], [19, 13], [7, 13], [7, 6]], shade(o.dark, -0.1));
    p.ell(13, 8, 5.4, 5.6, o.dark);
    p.rect(8, 6, 10, 6, VISOR);
    p.rect(9, 8, 2, 2, eye);
    p.rect(15, 8, 2, 2, eye);
    p.rect(12, 1, 2, 2, o.plume);
    p.rect(12, 3, 2, 1, shade(o.plume, -0.3));
  } else {
    // crown + face
    p.ell(13, 9, 5, 5.4, SKIN);
    p.rect(8, 4, 10, 4, o.plume); // hair
    p.rect(8, 8, 2, 3, o.plume);
    p.rect(16, 8, 2, 3, o.plume);
    p.rect(9, 9, 2, 2, '#10142b');
    p.rect(15, 9, 2, 2, '#10142b');
    p.rect(12, 12, 2, 1, '#c98d6a');
    p.rect(8, 3, 10, 2, GOLD);
    for (const x of [8, 11, 14, 17]) p.rect(x, 1, 1, 2, GOLD);
    p.set(12, 2, '#ff4466');
  }
  p.outline(OUT);
}

export function knightURL(a: Appearance, cls: ClassId, shadow = false): string {
  const armor = ARMOR_COLORS.find((x) => x.id === a.armor) ?? ARMOR_COLORS[0];
  const plume = PLUME_COLORS.find((x) => x.id === a.plume) ?? PLUME_COLORS[0];
  const key = `knight:${a.armor}:${a.plume}:${a.helm}:${cls}:${shadow ? 1 : 0}`;
  return sprite(key, KNIGHT_W, KNIGHT_H, (p) => {
    if (shadow) {
      drawKnight(p, { armor: '#2b2644', light: '#4a4270', dark: '#15122a', plume: '#6a1b3a', helm: a.helm, cls, shadow: true });
    } else {
      drawKnight(p, { armor: armor.main, light: armor.light, dark: armor.dark, plume: plume.color, helm: a.helm, cls });
    }
  });
}
