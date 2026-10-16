// LIFE//XP — XP / level progression.
// Formula (XP needed to go from level n -> n+1):  100 + 50(n-1) + 5(n-1)^2
// Smooth early game (a level every 1-2 quests) that scales quadratically.
// The server is the only authority; the client uses this only to draw bars.

export const MAX_LEVEL = 100;

export function xpToNext(level: number): number {
  const n = Math.max(1, Math.min(level, MAX_LEVEL));
  return 100 + 50 * (n - 1) + 5 * (n - 1) * (n - 1);
}

/** Total XP required to *reach* `level` (level 1 = 0). */
export function totalXpForLevel(level: number): number {
  let total = 0;
  for (let l = 1; l < Math.min(level, MAX_LEVEL); l++) total += xpToNext(l);
  return total;
}

export interface LevelProgress {
  level: number;
  /** XP earned inside the current level */
  xpInto: number;
  /** XP needed to finish the current level */
  xpNeeded: number;
  totalXp: number;
  /** 0..1 */
  pct: number;
  maxed: boolean;
}

export function progressFromTotalXp(totalXp: number): LevelProgress {
  const total = Math.max(0, Math.floor(totalXp));
  let level = 1;
  let remaining = total;
  while (level < MAX_LEVEL && remaining >= xpToNext(level)) {
    remaining -= xpToNext(level);
    level++;
  }
  const maxed = level >= MAX_LEVEL;
  const needed = xpToNext(level);
  return {
    level,
    xpInto: maxed ? needed : remaining,
    xpNeeded: needed,
    totalXp: total,
    pct: maxed ? 1 : remaining / needed,
    maxed,
  };
}
