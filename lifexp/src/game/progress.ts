import { CATEGORIES, QUESTS, type AchievementDef, type Category } from '@shared/content.ts';
import type { GameState } from '@shared/types.ts';

/** Client-side *display* progress toward an achievement (the server decides the actual unlock). */
export function achievementProgress(def: AchievementDef, g: GameState): { cur: number; target: number } {
  const c = def.condition;
  const byCat = (cat: Category) =>
    g.quests.reduce((n, q) => n + (QUESTS.find((d) => d.id === q.id)?.category === cat ? q.timesCompleted : 0), 0);
  switch (c.kind) {
    case 'quests_total': return { cur: Math.min(g.stats.totalQuests, c.n), target: c.n };
    case 'quests_category': return { cur: Math.min(byCat(c.category), c.n), target: c.n };
    case 'level': return { cur: Math.min(g.character?.level ?? 1, c.n), target: c.n };
    case 'streak': return { cur: Math.min(g.streak.longest, c.n), target: c.n };
    case 'bosses': return { cur: Math.min(g.stats.bossesDefeated, c.n), target: c.n };
    case 'worlds': return { cur: Math.min(g.worlds.filter((w) => w.unlocked).length, c.n), target: c.n };
    case 'cards': return { cur: Math.min(g.cards.owned.length, c.n), target: c.n };
    case 'day_quests': return { cur: Math.min(g.today.quests, c.n), target: c.n };
    case 'companion_stage': return { cur: Math.min(g.companion?.stage ?? 1, c.n), target: c.n };
    case 'crits': return { cur: Math.min(g.stats.crits, c.n), target: c.n };
  }
}

export const CATEGORY_COLOR: Record<Category, string> = {
  FOCUS: '#18d9ff',
  FITNESS: '#48ef9f',
  LEARNING: '#4a9bff',
  HEALTH: '#ff6a9c',
  CREATIVITY: '#ffb32e',
  DISCIPLINE: '#bd4eff',
};
export { CATEGORIES };
