// LIFE//XP — static game content (single source of truth).
// The server seeds its database from this file; the client reads it for
// presentation only. Rewards are ALWAYS re-derived server-side from the DB.

export type Attr = 'discipline' | 'focus' | 'fitness' | 'creativity';
export const ATTRS: Attr[] = ['discipline', 'focus', 'fitness', 'creativity'];

export type Category = 'FOCUS' | 'FITNESS' | 'LEARNING' | 'HEALTH' | 'CREATIVITY' | 'DISCIPLINE';
export const CATEGORIES: Category[] = ['FOCUS', 'FITNESS', 'LEARNING', 'HEALTH', 'CREATIVITY', 'DISCIPLINE'];

export type ClassId = 'DISCIPLINE' | 'FOCUS' | 'FITNESS' | 'CREATIVE';

export interface ClassDef {
  id: ClassId;
  name: string;
  tagline: string;
  primary: Attr;
  /** starting bonuses on top of the base value (5) */
  bonus: Partial<Record<Attr, number>>;
  color: string;
}

export const BASE_ATTR = 5;

export const CLASSES: ClassDef[] = [
  { id: 'DISCIPLINE', name: 'DISCIPLINE', tagline: 'Iron habits. Unbreakable routine.', primary: 'discipline', bonus: { discipline: 3, focus: 1 }, color: '#bd4eff' },
  { id: 'FOCUS', name: 'FOCUS', tagline: 'Deep work. Zero distractions.', primary: 'focus', bonus: { focus: 3, discipline: 1 }, color: '#18d9ff' },
  { id: 'FITNESS', name: 'FITNESS', tagline: 'Strong body. Endless energy.', primary: 'fitness', bonus: { fitness: 3, discipline: 1 }, color: '#48ef9f' },
  { id: 'CREATIVE', name: 'CREATIVE', tagline: 'Make things only you can make.', primary: 'creativity', bonus: { creativity: 3, focus: 1 }, color: '#ffb32e' },
];

export const CATEGORY_ATTR: Record<Category, Attr> = {
  FOCUS: 'focus',
  FITNESS: 'fitness',
  LEARNING: 'focus',
  HEALTH: 'fitness',
  CREATIVITY: 'creativity',
  DISCIPLINE: 'discipline',
};

export const ATTR_LABEL: Record<Attr, string> = {
  discipline: 'DISCIPLINE',
  focus: 'FOCUS',
  fitness: 'FITNESS',
  creativity: 'CREATIVITY',
};

// ───────────────────────── Appearance ─────────────────────────
export const ARMOR_COLORS = [
  { id: 'azure', name: 'AZURE', main: '#1fb6ff', light: '#8ff0ff', dark: '#0b5a9c' },
  { id: 'violet', name: 'VIOLET', main: '#a64bff', light: '#e0a8ff', dark: '#5a1d9c' },
  { id: 'jade', name: 'JADE', main: '#2fe29a', light: '#a6ffd8', dark: '#0f7a52' },
  { id: 'ember', name: 'EMBER', main: '#ff8a2e', light: '#ffd29a', dark: '#9c3d0b' },
  { id: 'crimson', name: 'CRIMSON', main: '#ff4466', light: '#ffa3b5', dark: '#8f1230' },
  { id: 'steel', name: 'STEEL', main: '#9fb0c7', light: '#e8f1ff', dark: '#4b5a70' },
] as const;

export const PLUME_COLORS = [
  { id: 'pink', name: 'PINK', color: '#ff4fd8' },
  { id: 'gold', name: 'GOLD', color: '#ffc83a' },
  { id: 'cyan', name: 'CYAN', color: '#3df0ff' },
  { id: 'lime', name: 'LIME', color: '#a8ff4a' },
  { id: 'white', name: 'WHITE', color: '#f3f6ff' },
  { id: 'red', name: 'RED', color: '#ff3b4a' },
] as const;

export const HELM_STYLES = [
  { id: 'knight', name: 'KNIGHT' },
  { id: 'hood', name: 'HOOD' },
  { id: 'crown', name: 'CROWN' },
] as const;

export interface Appearance {
  armor: (typeof ARMOR_COLORS)[number]['id'];
  plume: (typeof PLUME_COLORS)[number]['id'];
  helm: (typeof HELM_STYLES)[number]['id'];
}
export const DEFAULT_APPEARANCE: Appearance = { armor: 'azure', plume: 'pink', helm: 'knight' };

// ───────────────────────── Worlds & bosses ─────────────────────────
export interface WorldDef {
  id: string;
  order: number;
  name: string;
  blurb: string;
  levelReq: number;
  /** boss that must be defeated to open this world (previous world's boss) */
  requiresBoss: string | null;
  bossId: string;
  color: string;
  /** map position, percent of the map canvas */
  x: number;
  y: number;
}

export const WORLDS: WorldDef[] = [
  { id: 'the-beginning', order: 1, name: 'THE BEGINNING', blurb: 'Every legend starts with a single quest.', levelReq: 1, requiresBoss: null, bossId: 'procrastination', color: '#48ef9f', x: 9, y: 78 },
  { id: 'focus-forest', order: 2, name: 'FOCUS FOREST', blurb: 'Quiet the noise. Find the deep green silence.', levelReq: 3, requiresBoss: 'procrastination', bossId: 'distraction', color: '#2fe29a', x: 27, y: 60 },
  { id: 'discipline-city', order: 3, name: 'DISCIPLINE CITY', blurb: 'Neon streets built on routine.', levelReq: 6, requiresBoss: 'distraction', bossId: 'bad-habits', color: '#1fb6ff', x: 45, y: 74 },
  { id: 'knowledge-valley', order: 4, name: 'KNOWLEDGE VALLEY', blurb: 'Crystal towers hum with everything you learn.', levelReq: 10, requiresBoss: 'bad-habits', bossId: 'exam-boss', color: '#3df0ff', x: 64, y: 56 },
  { id: 'fitness-peak', order: 5, name: 'FITNESS PEAK', blurb: 'Climb. Breathe. Become unstoppable.', levelReq: 15, requiresBoss: 'exam-boss', bossId: 'laziness', color: '#ff8a2e', x: 74, y: 28 },
  { id: 'creators-realm', order: 6, name: "CREATOR'S REALM", blurb: 'Ship the work only you can make.', levelReq: 22, requiresBoss: 'laziness', bossId: 'deadline-monster', color: '#ff4fd8', x: 48, y: 22 },
  { id: 'final-challenge', order: 7, name: 'FINAL CHALLENGE', blurb: 'The last gate. Beyond it: the best version of you.', levelReq: 30, requiresBoss: 'deadline-monster', bossId: 'the-old-you', color: '#ff445f', x: 22, y: 20 },
];

export interface BossDef {
  id: string;
  name: string;
  blurb: string;
  maxHp: number;
  /** 1-5 */
  difficulty: number;
  rewardXp: number;
  rewardCard: string;
  worldId: string;
  palette: 'purple' | 'green' | 'blue' | 'orange' | 'red' | 'void';
}

export const BOSSES: BossDef[] = [
  { id: 'procrastination', name: 'PROCRASTINATION', blurb: '"I\'ll start tomorrow." It has said that for years.', maxHp: 1000, difficulty: 1, rewardXp: 400, rewardCard: 'second-wind', worldId: 'the-beginning', palette: 'purple' },
  { id: 'distraction', name: 'DISTRACTION', blurb: 'A thousand tiny pings. One huge enemy.', maxHp: 1500, difficulty: 2, rewardXp: 600, rewardCard: 'tunnel-vision', worldId: 'focus-forest', palette: 'green' },
  { id: 'bad-habits', name: 'BAD HABITS', blurb: 'Chained to the routine you never chose.', maxHp: 1900, difficulty: 3, rewardXp: 800, rewardCard: 'habit-breaker', worldId: 'discipline-city', palette: 'blue' },
  { id: 'exam-boss', name: 'EXAM BOSS', blurb: 'It grades on a curve. You break the curve.', maxHp: 2300, difficulty: 3, rewardXp: 1100, rewardCard: 'scholars-edge', worldId: 'knowledge-valley', palette: 'orange' },
  { id: 'laziness', name: 'LAZINESS', blurb: 'Soft, heavy, and very convincing.', maxHp: 2700, difficulty: 4, rewardXp: 1500, rewardCard: 'adrenaline', worldId: 'fitness-peak', palette: 'red' },
  { id: 'deadline-monster', name: 'DEADLINE MONSTER', blurb: 'Feeds on last-minute panic. Starve it early.', maxHp: 3200, difficulty: 4, rewardXp: 2000, rewardCard: 'deadline-crusher', worldId: 'creators-realm', palette: 'purple' },
  { id: 'the-old-you', name: 'THE OLD YOU', blurb: 'Everything you used to be. Time to outgrow it.', maxHp: 5000, difficulty: 5, rewardXp: 5000, rewardCard: 'master-plan', worldId: 'final-challenge', palette: 'void' },
];

// ───────────────────────── Quests ─────────────────────────
export interface QuestDef {
  id: string;
  worldId: string;
  title: string;
  description: string;
  category: Category;
  difficulty: number; // 1-5
  xp: number;
  bossDamage: number;
  attr: Attr;
  attrAmount: number;
  /** suggested real-world duration in minutes, if timed */
  minutes?: number;
}

type Q = [string, string, string, Category, number, number, number, Attr, number?];
function mk(worldId: string, rows: Q[]): QuestDef[] {
  return rows.map(([id, title, description, category, difficulty, xp, bossDamage, attr, minutes]) => ({
    id: `${worldId}:${id}`,
    worldId,
    title,
    description,
    category,
    difficulty,
    xp,
    bossDamage,
    attr,
    attrAmount: 1,
    minutes,
  }));
}

export const QUESTS: QuestDef[] = [
  ...mk('the-beginning', [
    ['focus-mode', 'FOCUS MODE', 'Study for 30 minutes', 'FOCUS', 3, 100, 150, 'focus', 30],
    ['deep-work', 'DEEP WORK', 'Work without distractions for 60 minutes', 'FOCUS', 4, 200, 250, 'focus', 60],
    ['morning-workout', 'MORNING WORKOUT', 'Complete a workout', 'FITNESS', 3, 150, 100, 'fitness', 30],
    ['read-10-pages', 'READ 10 PAGES', 'Read ten pages of something that matters', 'LEARNING', 1, 75, 50, 'focus', 15],
    ['complete-assignment', 'COMPLETE ASSIGNMENT', 'Finish an assignment or a work deliverable', 'LEARNING', 4, 250, 300, 'discipline'],
    ['sleep-on-time', 'SLEEP ON TIME', 'Be in bed at your target time', 'HEALTH', 2, 100, 150, 'discipline'],
    ['sketch-idea', 'SKETCH AN IDEA', 'Spend 15 minutes sketching, writing, or building something new', 'CREATIVITY', 2, 80, 60, 'creativity', 15],
    ['drink-water', 'HYDRATE', 'Drink 2 litres of water today', 'HEALTH', 1, 50, 40, 'fitness'],
  ]),
  ...mk('focus-forest', [
    ['pomodoro-sprint', 'POMODORO SPRINT', 'One 25-minute block, phone out of reach', 'FOCUS', 2, 110, 140, 'focus', 25],
    ['phone-free-hour', 'PHONE-FREE HOUR', 'One full hour without scrolling', 'FOCUS', 3, 160, 200, 'focus', 60],
    ['inbox-zero', 'CLEAR THE INBOX', 'Process your inbox down to zero or near-zero', 'DISCIPLINE', 3, 140, 180, 'discipline', 20],
    ['single-task', 'SINGLE-TASK', 'Finish one important task before touching anything else', 'FOCUS', 3, 150, 190, 'focus'],
    ['deep-read', 'DEEP READ', 'Read 30 pages without switching tabs', 'LEARNING', 3, 140, 160, 'focus', 40],
    ['notification-purge', 'NOTIFICATION PURGE', 'Turn off five notifications that interrupt you', 'DISCIPLINE', 1, 70, 90, 'discipline'],
    ['mind-reset', 'MIND RESET', 'Ten minutes of quiet — meditate, stretch, or walk', 'HEALTH', 1, 80, 100, 'fitness', 10],
    ['two-hour-block', 'TWO-HOUR BLOCK', 'Protect a 2-hour deep work block', 'FOCUS', 5, 320, 400, 'focus', 120],
  ]),
  ...mk('discipline-city', [
    ['make-bed', 'MAKE YOUR BED', 'Win the first small battle of the day', 'DISCIPLINE', 1, 60, 80, 'discipline', 3],
    ['plan-tomorrow', 'PLAN TOMORROW', 'Write tomorrow\'s top 3 priorities tonight', 'DISCIPLINE', 2, 120, 150, 'discipline', 10],
    ['no-snooze', 'NO SNOOZE', 'Get up on the first alarm', 'DISCIPLINE', 2, 120, 160, 'discipline'],
    ['budget-check', 'BUDGET CHECK', 'Review today\'s spending and log it', 'DISCIPLINE', 2, 110, 140, 'discipline', 10],
    ['cold-start', 'COLD START', 'Start your hardest task first thing', 'DISCIPLINE', 4, 240, 300, 'discipline'],
    ['clean-zone', 'CLEAN ZONE', 'Reset your desk or room in 15 minutes', 'DISCIPLINE', 2, 100, 130, 'discipline', 15],
    ['healthy-meal', 'FUEL UP', 'Eat one properly healthy meal', 'HEALTH', 2, 110, 140, 'fitness'],
    ['habit-streak', 'HOLD THE LINE', 'Complete your key daily habit without excuses', 'DISCIPLINE', 4, 260, 320, 'discipline'],
  ]),
  ...mk('knowledge-valley', [
    ['study-session', 'STUDY SESSION', 'Study one subject for 45 minutes', 'LEARNING', 3, 220, 280, 'focus', 45],
    ['flashcards', 'FLASHCARD RUN', 'Review 30 flashcards or practice questions', 'LEARNING', 2, 150, 190, 'focus', 20],
    ['teach-it', 'TEACH IT', 'Explain a concept out loud as if teaching a friend', 'LEARNING', 3, 200, 250, 'focus', 15],
    ['past-paper', 'PAST PAPER', 'Complete a timed practice paper', 'LEARNING', 5, 420, 500, 'discipline', 90],
    ['notes-summary', 'ONE-PAGE SUMMARY', 'Condense a chapter into one page', 'LEARNING', 3, 190, 240, 'focus', 30],
    ['new-skill', 'NEW SKILL', 'Practice a skill you are learning for 30 minutes', 'LEARNING', 3, 200, 250, 'creativity', 30],
    ['library-trip', 'LIBRARY TRIP', 'Study somewhere with zero friction', 'DISCIPLINE', 2, 130, 160, 'discipline'],
    ['review-mistakes', 'REVIEW MISTAKES', 'Go through errors and write down the fix', 'LEARNING', 3, 190, 240, 'focus', 20],
  ]),
  ...mk('fitness-peak', [
    ['strength-session', 'STRENGTH SESSION', 'A full strength workout', 'FITNESS', 4, 320, 380, 'fitness', 45],
    ['run-5k', 'RUN 5K', 'Run or jog 5 kilometres', 'FITNESS', 4, 330, 400, 'fitness', 35],
    ['ten-k-steps', '10K STEPS', 'Hit 10,000 steps today', 'FITNESS', 2, 170, 210, 'fitness'],
    ['mobility', 'MOBILITY FLOW', '15 minutes of stretching or yoga', 'HEALTH', 1, 100, 120, 'fitness', 15],
    ['protein-day', 'PROTEIN DAY', 'Hit your protein target', 'HEALTH', 2, 140, 170, 'discipline'],
    ['eight-hours', 'RESTORE', 'Sleep a full 8 hours', 'HEALTH', 3, 200, 250, 'discipline'],
    ['new-pr', 'NEW PR', 'Beat a personal best at anything physical', 'FITNESS', 5, 480, 560, 'fitness'],
    ['cold-shower', 'COLD SHOWER', 'Finish with 60 seconds of cold water', 'FITNESS', 2, 120, 150, 'discipline', 2],
  ]),
  ...mk('creators-realm', [
    ['ship-something', 'SHIP SOMETHING', 'Publish or send one finished piece of work', 'CREATIVITY', 5, 520, 600, 'creativity'],
    ['creative-hour', 'CREATIVE HOUR', 'One uninterrupted hour of making', 'CREATIVITY', 3, 280, 340, 'creativity', 60],
    ['daily-draft', 'DAILY DRAFT', 'Write 500 words, a sketch, or a track — rough is fine', 'CREATIVITY', 2, 190, 230, 'creativity', 25],
    ['study-the-greats', 'STUDY THE GREATS', 'Analyse work you admire and note why it works', 'LEARNING', 2, 170, 210, 'creativity', 20],
    ['build-prototype', 'BUILD A PROTOTYPE', 'Turn an idea into something you can show', 'CREATIVITY', 4, 380, 460, 'creativity', 90],
    ['get-feedback', 'GET FEEDBACK', 'Show your work to someone and listen', 'CREATIVITY', 3, 260, 320, 'creativity'],
    ['finish-the-thing', 'FINISH THE THING', 'Close out a project you left at 90%', 'DISCIPLINE', 4, 360, 440, 'discipline'],
    ['inspiration-walk', 'INSPIRATION WALK', 'Walk 20 minutes with no headphones', 'HEALTH', 1, 110, 140, 'creativity', 20],
  ]),
  ...mk('final-challenge', [
    ['perfect-morning', 'PERFECT MORNING', 'Wake on time, move, and plan before 9am', 'DISCIPLINE', 4, 500, 600, 'discipline'],
    ['hard-thing-first', 'THE HARD THING', 'Do the thing you have been avoiding the longest', 'DISCIPLINE', 5, 700, 850, 'discipline'],
    ['four-hour-flow', 'FOUR-HOUR FLOW', 'Four hours of real deep work in one day', 'FOCUS', 5, 800, 950, 'focus', 240],
    ['peak-workout', 'PEAK WORKOUT', 'Your hardest workout of the week', 'FITNESS', 5, 650, 780, 'fitness', 60],
    ['make-it-real', 'MAKE IT REAL', 'Take one concrete step toward your biggest goal', 'CREATIVITY', 4, 560, 680, 'creativity'],
    ['teach-someone', 'PASS IT ON', 'Help someone else level up', 'DISCIPLINE', 3, 400, 480, 'discipline'],
    ['reflect', 'REFLECT & RESET', 'Review the week: wins, losses, next moves', 'DISCIPLINE', 3, 380, 460, 'focus', 20],
    ['no-excuses-day', 'NO-EXCUSES DAY', 'Complete every priority you set today', 'DISCIPLINE', 5, 750, 900, 'discipline'],
  ]),
];

// ───────────────────────── Power cards ─────────────────────────
export type Rarity = 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';

export type CardEffect =
  | { kind: 'xp_category'; category: Category; pct: number }
  | { kind: 'xp_difficulty'; minDifficulty: number; pct: number }
  | { kind: 'xp_all'; pct: number }
  | { kind: 'boss_damage'; pct: number }
  | { kind: 'crit_chance'; pct: number }
  | { kind: 'streak_save' };

export type UnlockCondition =
  | { kind: 'start' }
  | { kind: 'level'; n: number }
  | { kind: 'streak'; n: number }
  | { kind: 'boss'; id: string }
  | { kind: 'quests'; n: number };

export interface CardDef {
  id: string;
  name: string;
  description: string;
  rarity: Rarity;
  effects: CardEffect[];
  unlock: UnlockCondition;
  unlockText: string;
  art: string; // sprite icon id
}

export const MAX_EQUIPPED = 3;
export const STREAK_SAVE_COOLDOWN_DAYS = 7;

export const CARDS: CardDef[] = [
  { id: 'focus-boost', name: 'FOCUS BOOST', description: '+10% XP on FOCUS quests.', rarity: 'COMMON', effects: [{ kind: 'xp_category', category: 'FOCUS', pct: 10 }], unlock: { kind: 'start' }, unlockText: 'Given to every new hero.', art: 'target' },
  { id: 'body-forged', name: 'BODY FORGED', description: '+10% XP on FITNESS quests.', rarity: 'COMMON', effects: [{ kind: 'xp_category', category: 'FITNESS', pct: 10 }], unlock: { kind: 'quests', n: 5 }, unlockText: 'Complete 5 quests.', art: 'bolt' },
  { id: 'creators-spark', name: "CREATOR'S SPARK", description: '+10% XP on CREATIVITY quests.', rarity: 'COMMON', effects: [{ kind: 'xp_category', category: 'CREATIVITY', pct: 10 }], unlock: { kind: 'quests', n: 10 }, unlockText: 'Complete 10 quests.', art: 'star' },
  { id: 'iron-will', name: 'IRON WILL', description: 'Bonus reward for difficult quests: +25% XP on difficulty 4 and 5.', rarity: 'RARE', effects: [{ kind: 'xp_difficulty', minDifficulty: 4, pct: 25 }], unlock: { kind: 'level', n: 5 }, unlockText: 'Reach level 5.', art: 'shield' },
  { id: 'lucky-strike', name: 'LUCKY STRIKE', description: '+10% critical hit chance against bosses.', rarity: 'RARE', effects: [{ kind: 'crit_chance', pct: 10 }], unlock: { kind: 'level', n: 8 }, unlockText: 'Reach level 8.', art: 'clover' },
  { id: 'second-wind', name: 'SECOND WIND', description: 'Recover a missed streak. Auto-triggers once, then recharges for 7 days.', rarity: 'RARE', effects: [{ kind: 'streak_save' }], unlock: { kind: 'boss', id: 'procrastination' }, unlockText: 'Defeat PROCRASTINATION.', art: 'swirl' },
  { id: 'habit-breaker', name: 'HABIT BREAKER', description: '+20% damage to bosses.', rarity: 'RARE', effects: [{ kind: 'boss_damage', pct: 20 }], unlock: { kind: 'boss', id: 'bad-habits' }, unlockText: 'Defeat BAD HABITS.', art: 'chain' },
  { id: 'steady-rhythm', name: 'STEADY RHYTHM', description: '+8% XP on every quest.', rarity: 'RARE', effects: [{ kind: 'xp_all', pct: 8 }], unlock: { kind: 'streak', n: 7 }, unlockText: 'Reach a 7-day streak.', art: 'wave' },
  { id: 'tunnel-vision', name: 'TUNNEL VISION', description: '+15% damage to bosses.', rarity: 'EPIC', effects: [{ kind: 'boss_damage', pct: 15 }], unlock: { kind: 'boss', id: 'distraction' }, unlockText: 'Defeat DISTRACTION.', art: 'eye' },
  { id: 'scholars-edge', name: "SCHOLAR'S EDGE", description: '+25% XP on LEARNING quests.', rarity: 'EPIC', effects: [{ kind: 'xp_category', category: 'LEARNING', pct: 25 }], unlock: { kind: 'boss', id: 'exam-boss' }, unlockText: 'Defeat EXAM BOSS.', art: 'book' },
  { id: 'adrenaline', name: 'ADRENALINE', description: '+10% XP on every quest.', rarity: 'EPIC', effects: [{ kind: 'xp_all', pct: 10 }], unlock: { kind: 'boss', id: 'laziness' }, unlockText: 'Defeat LAZINESS.', art: 'flame' },
  { id: 'deadline-crusher', name: 'DEADLINE CRUSHER', description: '+15% critical hit chance against bosses.', rarity: 'EPIC', effects: [{ kind: 'crit_chance', pct: 15 }], unlock: { kind: 'boss', id: 'deadline-monster' }, unlockText: 'Defeat DEADLINE MONSTER.', art: 'hourglass' },
  { id: 'quest-hunter', name: 'QUEST HUNTER', description: '+12% XP on every quest.', rarity: 'EPIC', effects: [{ kind: 'xp_all', pct: 12 }], unlock: { kind: 'quests', n: 50 }, unlockText: 'Complete 50 quests.', art: 'sword' },
  { id: 'phoenix-heart', name: 'PHOENIX HEART', description: 'Recovers a missed streak (7-day recharge) and grants +10% XP on every quest.', rarity: 'LEGENDARY', effects: [{ kind: 'streak_save' }, { kind: 'xp_all', pct: 10 }], unlock: { kind: 'streak', n: 30 }, unlockText: 'Reach a 30-day streak.', art: 'phoenix' },
  { id: 'master-plan', name: 'MASTER PLAN', description: '+20% XP on every quest and +20% damage to bosses.', rarity: 'LEGENDARY', effects: [{ kind: 'xp_all', pct: 20 }, { kind: 'boss_damage', pct: 20 }], unlock: { kind: 'boss', id: 'the-old-you' }, unlockText: 'Defeat THE OLD YOU.', art: 'crown' },
];

// ───────────────────────── Companion ─────────────────────────
export interface CompanionStageDef {
  stage: 1 | 2 | 3 | 4;
  key: 'BABY' | 'EVOLVED' | 'ELITE' | 'LEGENDARY';
  minLevel: number;
  title: string;
}
export const COMPANION_STAGES: CompanionStageDef[] = [
  { stage: 1, key: 'BABY', minLevel: 1, title: 'EMBER HATCHLING' },
  { stage: 2, key: 'EVOLVED', minLevel: 10, title: 'EMBER DRAKE' },
  { stage: 3, key: 'ELITE', minLevel: 25, title: 'EMBER WYRM' },
  { stage: 4, key: 'LEGENDARY', minLevel: 50, title: 'EMBER SOVEREIGN' },
];
/** The companion receives this share of every XP gain */
export const COMPANION_XP_SHARE = 0.6;
export const DEFAULT_COMPANION_NAME = 'EMBER';

export function companionStageForLevel(level: number): CompanionStageDef {
  let s = COMPANION_STAGES[0];
  for (const st of COMPANION_STAGES) if (level >= st.minLevel) s = st;
  return s;
}

// ───────────────────────── Achievements ─────────────────────────
export type AchievementCondition =
  | { kind: 'quests_total'; n: number }
  | { kind: 'quests_category'; category: Category; n: number }
  | { kind: 'level'; n: number }
  | { kind: 'streak'; n: number }
  | { kind: 'bosses'; n: number }
  | { kind: 'worlds'; n: number }
  | { kind: 'cards'; n: number }
  | { kind: 'day_quests'; n: number }
  | { kind: 'companion_stage'; n: number }
  | { kind: 'crits'; n: number };

export interface AchievementDef {
  id: string;
  name: string;
  description: string;
  condition: AchievementCondition;
  rewardXp: number;
  icon: string;
  tier: 'bronze' | 'silver' | 'gold';
}

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'first-quest', name: 'FIRST QUEST', description: 'Complete your first quest.', condition: { kind: 'quests_total', n: 1 }, rewardXp: 50, icon: 'flag', tier: 'bronze' },
  { id: 'boss-slayer', name: 'BOSS SLAYER', description: 'Defeat your first boss.', condition: { kind: 'bosses', n: 1 }, rewardXp: 250, icon: 'skull', tier: 'silver' },
  { id: 'level-5', name: 'RISING HERO', description: 'Reach level 5.', condition: { kind: 'level', n: 5 }, rewardXp: 100, icon: 'star', tier: 'bronze' },
  { id: 'level-10', name: 'LEVEL 10', description: 'Reach level 10.', condition: { kind: 'level', n: 10 }, rewardXp: 250, icon: 'star', tier: 'silver' },
  { id: 'level-25', name: 'VETERAN', description: 'Reach level 25.', condition: { kind: 'level', n: 25 }, rewardXp: 750, icon: 'star', tier: 'gold' },
  { id: 'iron-mind', name: 'IRON MIND', description: 'Complete 7 focus quests.', condition: { kind: 'quests_category', category: 'FOCUS', n: 7 }, rewardXp: 200, icon: 'brain', tier: 'silver' },
  { id: 'body-builder', name: 'BODY BUILDER', description: 'Complete 10 fitness quests.', condition: { kind: 'quests_category', category: 'FITNESS', n: 10 }, rewardXp: 200, icon: 'bolt', tier: 'silver' },
  { id: 'maker', name: 'MAKER', description: 'Complete 10 creativity quests.', condition: { kind: 'quests_category', category: 'CREATIVITY', n: 10 }, rewardXp: 200, icon: 'spark', tier: 'silver' },
  { id: 'week-warrior', name: 'WEEK WARRIOR', description: 'Maintain a 7-day streak.', condition: { kind: 'streak', n: 7 }, rewardXp: 300, icon: 'flame', tier: 'silver' },
  { id: 'disciplined', name: 'DISCIPLINED', description: 'Maintain a 14-day streak.', condition: { kind: 'streak', n: 14 }, rewardXp: 600, icon: 'flame', tier: 'gold' },
  { id: 'perfect-day', name: 'PERFECT DAY', description: 'Complete 5 quests in a single day.', condition: { kind: 'day_quests', n: 5 }, rewardXp: 150, icon: 'sun', tier: 'bronze' },
  { id: 'quest-master', name: 'QUEST MASTER', description: 'Complete 100 quests.', condition: { kind: 'quests_total', n: 100 }, rewardXp: 1000, icon: 'crown', tier: 'gold' },
  { id: 'world-walker', name: 'WORLD WALKER', description: 'Unlock 3 worlds.', condition: { kind: 'worlds', n: 3 }, rewardXp: 300, icon: 'map', tier: 'silver' },
  { id: 'card-collector', name: 'CARD COLLECTOR', description: 'Collect 5 Power Cards.', condition: { kind: 'cards', n: 5 }, rewardXp: 250, icon: 'card', tier: 'silver' },
  { id: 'critical', name: 'CRITICAL!', description: 'Land a critical hit on a boss.', condition: { kind: 'crits', n: 1 }, rewardXp: 100, icon: 'burst', tier: 'bronze' },
  { id: 'evolution', name: 'EVOLUTION', description: 'Evolve your companion.', condition: { kind: 'companion_stage', n: 2 }, rewardXp: 400, icon: 'egg', tier: 'silver' },
  { id: 'boss-hunter', name: 'BOSS HUNTER', description: 'Defeat 4 bosses.', condition: { kind: 'bosses', n: 4 }, rewardXp: 800, icon: 'skull', tier: 'gold' },
  { id: 'legend', name: 'LEGEND', description: 'Defeat every boss in LIFE//XP.', condition: { kind: 'bosses', n: 7 }, rewardXp: 3000, icon: 'crown', tier: 'gold' },
];

// ───────────────────────── Helpers ─────────────────────────
export const worldById = (id: string) => WORLDS.find((w) => w.id === id);
export const bossById = (id: string) => BOSSES.find((b) => b.id === id);
export const questById = (id: string) => QUESTS.find((q) => q.id === id);
export const cardById = (id: string) => CARDS.find((c) => c.id === id);
export const classById = (id: string) => CLASSES.find((c) => c.id === id);
export const achievementById = (id: string) => ACHIEVEMENTS.find((a) => a.id === id);
