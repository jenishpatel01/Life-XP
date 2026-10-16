import type { Attr } from '@shared/content.ts';
import type { GameEvent, GameState } from '@shared/types.ts';
import { cardById, worldById } from '@shared/content.ts';

// A "scene" is one full-screen moment in the celebration sequence that follows
// a server response. Scenes are built purely from server events.

export type Scene =
  | { kind: 'quest'; title: string; xp: number; base: number; breakdown: { label: string; pct: number }[]; attrs: { attr: Attr; amount: number }[]; streak: { current: number; saved: boolean } | null }
  | { kind: 'boss_hit'; bossId: string; damage: number; crit: boolean; hpBefore: number; hpAfter: number; maxHp: number }
  | { kind: 'boss_defeated'; bossId: string; rewardXp: number; cardId: string }
  | { kind: 'level_up'; level: number; gains: { attr: Attr; amount: number }[]; rewards: string[]; companionName: string }
  | { kind: 'world'; worldId: string }
  | { kind: 'card'; cardId: string; source: string }
  | { kind: 'evolve'; stage: number; level: number; name: string };

export interface Toast {
  id: string;
  kind: 'achievement' | 'info' | 'error' | 'success';
  title: string;
  body?: string;
  icon?: string;
  tier?: 'bronze' | 'silver' | 'gold';
}

export function buildScenes(events: GameEvent[], next: GameState): { scenes: Scene[]; achievementIds: { id: string; rewardXp: number }[] } {
  const scenes: Scene[] = [];
  const attrs = events.filter((e): e is Extract<GameEvent, { type: 'attribute' }> => e.type === 'attribute').map((e) => ({ attr: e.attr, amount: e.amount }));
  const done = events.find((e) => e.type === 'quest_complete');
  const xp = events.find((e) => e.type === 'xp');
  const streak = events.find((e) => e.type === 'streak');
  if (done && done.type === 'quest_complete' && xp && xp.type === 'xp') {
    scenes.push({
      kind: 'quest', title: done.title, xp: xp.amount, base: xp.base, breakdown: xp.breakdown, attrs,
      streak: streak && streak.type === 'streak' ? { current: streak.current, saved: streak.saved } : null,
    });
  }
  for (const e of events) {
    if (e.type === 'boss_damage') scenes.push({ kind: 'boss_hit', bossId: e.bossId, damage: e.damage, crit: e.crit, hpBefore: e.hpBefore, hpAfter: e.hpAfter, maxHp: e.maxHp });
  }
  for (const e of events) {
    if (e.type === 'boss_defeated') scenes.push({ kind: 'boss_defeated', bossId: e.bossId, rewardXp: e.rewardXp, cardId: e.cardId });
  }
  const levelUp = [...events].reverse().find((e) => e.type === 'level_up');
  if (levelUp && levelUp.type === 'level_up') {
    const rewards: string[] = [];
    const newCards = events.filter((e) => e.type === 'card_unlocked');
    const newWorlds = events.filter((e) => e.type === 'world_unlocked');
    if (newCards.length) rewards.push('NEW REWARD UNLOCKED');
    if (newWorlds.length) rewards.push('NEW WORLD AVAILABLE');
    // merge every level_up in this batch (multiple grants can level up)
    const merged = new Map<Attr, number>();
    for (const e of events) if (e.type === 'level_up') for (const g of e.gains) merged.set(g.attr, (merged.get(g.attr) ?? 0) + g.amount);
    scenes.push({ kind: 'level_up', level: levelUp.level, gains: [...merged].map(([attr, amount]) => ({ attr, amount })), rewards, companionName: next.companion?.name ?? 'EMBER' });
  }
  for (const e of events) if (e.type === 'world_unlocked' && worldById(e.worldId)) scenes.push({ kind: 'world', worldId: e.worldId });
  for (const e of events) if (e.type === 'card_unlocked' && cardById(e.cardId)) scenes.push({ kind: 'card', cardId: e.cardId, source: e.source });
  for (const e of events) if (e.type === 'companion_evolved') scenes.push({ kind: 'evolve', stage: e.stage, level: e.level, name: next.companion?.name ?? 'EMBER' });

  const achievementIds = events.filter((e): e is Extract<GameEvent, { type: 'achievement_unlocked' }> => e.type === 'achievement_unlocked').map((e) => ({ id: e.achievementId, rewardXp: e.rewardXp }));
  return { scenes, achievementIds };
}
