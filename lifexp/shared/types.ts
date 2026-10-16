import type { Appearance, Attr, ClassId } from './content.ts';

export interface ApiErrorBody {
  error: { code: string; message: string; details?: unknown };
}

export type GameEvent =
  | { type: 'quest_complete'; questId: string; title: string }
  | { type: 'xp'; amount: number; base: number; breakdown: { label: string; pct: number }[] }
  | { type: 'attribute'; attr: Attr; amount: number }
  | { type: 'boss_damage'; bossId: string; damage: number; crit: boolean; hpBefore: number; hpAfter: number; maxHp: number }
  | { type: 'boss_defeated'; bossId: string; rewardXp: number; cardId: string }
  | { type: 'level_up'; level: number; gains: { attr: Attr; amount: number }[] }
  | { type: 'card_unlocked'; cardId: string; source: string }
  | { type: 'achievement_unlocked'; achievementId: string; rewardXp: number }
  | { type: 'world_unlocked'; worldId: string }
  | { type: 'companion_evolved'; stage: number; level: number }
  | { type: 'streak'; current: number; longest: number; saved: boolean };

export interface Settings {
  sound: boolean;
  music: boolean;
  animation: 'low' | 'medium' | 'high';
  reducedMotion: 'auto' | 'on' | 'off';
  theme: 'neon' | 'void';
  timezone: string;
}

export interface LevelProgressDTO {
  level: number;
  xpInto: number;
  xpNeeded: number;
  totalXp: number;
  pct: number;
  maxed: boolean;
}

export interface CharacterDTO {
  name: string;
  class: ClassId;
  appearance: Appearance;
  level: number;
  progress: LevelProgressDTO;
  attrs: Record<Attr, number>;
  currentWorldId: string;
  createdAt: string;
}

export interface StreakDTO {
  current: number;
  longest: number;
  lastDay: string | null;
  doneToday: boolean;
  /** last 7 days, oldest first */
  week: { day: string; count: number }[];
}

export interface BossStateDTO {
  id: string;
  unlocked: boolean;
  status: 'locked' | 'active' | 'defeated';
  hp: number;
  maxHp: number;
  defeatedAt: string | null;
}

export interface WorldStateDTO {
  id: string;
  unlocked: boolean;
  unlockedAt: string | null;
  questsDone: number;
  questsTotal: number;
  /** 0..100 */
  pct: number;
  boss: BossStateDTO;
  blockers: { level: number | null; bossId: string | null; levelMet: boolean; bossMet: boolean };
}

export interface QuestStateDTO {
  id: string;
  /** completed today (user's local day) */
  doneToday: boolean;
  /** epoch ms when the user started this quest, or null */
  startedAt: number | null;
  timesCompleted: number;
}

export interface OwnedCardDTO {
  id: string;
  unlockedAt: string;
  source: string;
  /** streak-save cards: day key until which the card is recharging */
  rechargeUntil: string | null;
}

export interface CompanionDTO {
  name: string;
  species: string;
  level: number;
  stage: number;
  progress: LevelProgressDTO;
}

export interface GameState {
  serverTime: number;
  user: { username: string; email: string; createdAt: string };
  character: CharacterDTO | null;
  streak: StreakDTO;
  today: { day: string; xp: number; quests: number; bossDamage: number };
  worlds: WorldStateDTO[];
  activeBossId: string | null;
  quests: QuestStateDTO[];
  cards: { owned: OwnedCardDTO[]; equipped: string[] };
  companion: CompanionDTO | null;
  achievements: { id: string; unlockedAt: string }[];
  settings: Settings;
  stats: { totalQuests: number; totalXp: number; bossesDefeated: number; crits: number };
  minQuestSeconds: number;
}

export interface CompleteQuestResponse {
  events: GameEvent[];
  state: GameState;
}
