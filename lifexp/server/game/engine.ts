import crypto from 'node:crypto';
import { db } from '../db.ts';
import {
  ARMOR_COLORS, BASE_ATTR, CATEGORY_ATTR, COMPANION_XP_SHARE, HELM_STYLES, MAX_EQUIPPED, PLUME_COLORS,
  classById, companionStageForLevel, DEFAULT_COMPANION_NAME,
  type AchievementCondition, type Appearance, type Attr, type CardEffect, type Category, type ClassId, type UnlockCondition,
} from '../../shared/content.ts';
import { progressFromTotalXp } from '../../shared/xp.ts';
import type { CompleteQuestResponse, GameEvent } from '../../shared/types.ts';
import { conflict, forbidden, notFound, badRequest } from '../errors.ts';
import { dayKey, daysBetween, shiftDay } from '../time.ts';
import { minQuestSeconds } from '../config.ts';
import { findReadySaveCard, getGameState, getSettings } from './state.ts';

interface Ctx {
  userId: number;
  day: string;
  events: GameEvent[];
  primary: Attr;
  /** attribute that receives the per-level bonus alongside the class primary */
  bonusAttr: Attr;
}

interface CharRow {
  user_id: number; name: string; class: ClassId; level: number; xp_total: number;
  discipline: number; focus: number; fitness: number; creativity: number; current_world_id: string;
}

const getChar = (userId: number) => db.prepare('SELECT * FROM characters WHERE user_id = ?').get(userId) as CharRow | undefined;

// ───────────────────────── Character creation ─────────────────────────

export function createCharacter(userId: number, input: { name: string; class: ClassId; appearance: Appearance }) {
  db.transaction(() => {
    if (getChar(userId)) throw conflict('CHARACTER_EXISTS', 'You already have a character.');
    const cls = classById(input.class);
    if (!cls) throw badRequest('BAD_CLASS', 'Unknown class.');
    if (!ARMOR_COLORS.some((a) => a.id === input.appearance.armor) || !PLUME_COLORS.some((p) => p.id === input.appearance.plume) || !HELM_STYLES.some((h) => h.id === input.appearance.helm)) {
      throw badRequest('BAD_APPEARANCE', 'Unknown appearance option.');
    }
    const attrs: Record<Attr, number> = { discipline: BASE_ATTR, focus: BASE_ATTR, fitness: BASE_ATTR, creativity: BASE_ATTR };
    for (const [k, v] of Object.entries(cls.bonus)) attrs[k as Attr] += v ?? 0;

    db.prepare(
      `INSERT INTO characters (user_id, name, class, armor, plume, helm, discipline, focus, fitness, creativity, current_world_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'the-beginning')`,
    ).run(userId, input.name, input.class, input.appearance.armor, input.appearance.plume, input.appearance.helm, attrs.discipline, attrs.focus, attrs.fitness, attrs.creativity);
    db.prepare('INSERT OR IGNORE INTO streaks (user_id) VALUES (?)').run(userId);
    db.prepare('INSERT INTO companions (user_id, name) VALUES (?, ?)').run(userId, DEFAULT_COMPANION_NAME);

    const tz = getSettings(userId).timezone;
    const ctx: Ctx = { userId, day: dayKey(tz), events: [], primary: cls.primary, bonusAttr: cls.primary };
    evaluateMilestones(ctx); // opens world 1, spawns its boss, grants the starter card
    // auto-equip the starter card so the very first quest already benefits
    const owned = db.prepare('SELECT card_id FROM user_power_cards WHERE user_id = ? ORDER BY unlocked_at LIMIT 1').get(userId) as { card_id: string } | undefined;
    if (owned) db.prepare('INSERT OR IGNORE INTO equipped_cards (user_id, slot, card_id) VALUES (?, 0, ?)').run(userId, owned.card_id);
  })();
  return getGameState(userId);
}

// ───────────────────────── Quests ─────────────────────────

interface QuestRow {
  id: string; world_id: string; title: string; category: Category; difficulty: number;
  xp_reward: number; boss_damage: number; attr: Attr; attr_amount: number;
}

function loadQuest(questId: string): QuestRow {
  const q = db.prepare('SELECT * FROM quests WHERE id = ?').get(questId) as QuestRow | undefined;
  if (!q) throw notFound('That quest does not exist.');
  return q;
}

function assertWorldUnlocked(userId: number, worldId: string) {
  const ok = db.prepare('SELECT 1 FROM user_world_progress WHERE user_id = ? AND world_id = ?').get(userId, worldId);
  if (!ok) throw forbidden('WORLD_LOCKED', 'That world is still locked.');
}

export function startQuest(userId: number, questId: string) {
  db.transaction(() => {
    if (!getChar(userId)) throw forbidden('NO_CHARACTER', 'Create your character first.');
    const q = loadQuest(questId);
    assertWorldUnlocked(userId, q.world_id);
    const day = dayKey(getSettings(userId).timezone);
    const done = db.prepare('SELECT 1 FROM quest_completions WHERE user_id = ? AND quest_id = ? AND day_key = ?').get(userId, questId, day);
    if (done) throw conflict('ALREADY_COMPLETED', 'You already completed this quest today. New quests arrive tomorrow.');
    // Starting is idempotent: the *first* start time wins so it can't be reset to dodge the minimum wait.
    db.prepare('INSERT OR IGNORE INTO quest_attempts (user_id, quest_id, started_at) VALUES (?, ?, ?)').run(userId, questId, Date.now());
  })();
  return getGameState(userId);
}

export function abandonQuest(userId: number, questId: string) {
  db.prepare('DELETE FROM quest_attempts WHERE user_id = ? AND quest_id = ?').run(userId, questId);
  return getGameState(userId);
}

interface EquippedEffect { cardId: string; effect: CardEffect }

function equippedEffects(userId: number): EquippedEffect[] {
  const rows = db
    .prepare('SELECT e.card_id, c.effects FROM equipped_cards e JOIN power_cards c ON c.id = e.card_id WHERE e.user_id = ?')
    .all(userId) as { card_id: string; effects: string }[];
  return rows.flatMap((r) => (JSON.parse(r.effects) as CardEffect[]).map((effect) => ({ cardId: r.card_id, effect })));
}

export function completeQuest(userId: number, questId: string, now: Date = new Date()): CompleteQuestResponse {
  const events = db.transaction((): GameEvent[] => {
    const ch = getChar(userId);
    if (!ch) throw forbidden('NO_CHARACTER', 'Create your character first.');
    const quest = loadQuest(questId);
    assertWorldUnlocked(userId, quest.world_id);

    const settings = getSettings(userId);
    const day = dayKey(settings.timezone, now);

    // 1) duplicate protection (also enforced by a UNIQUE constraint)
    const dup = db.prepare('SELECT 1 FROM quest_completions WHERE user_id = ? AND quest_id = ? AND day_key = ?').get(userId, questId, day);
    if (dup) throw conflict('ALREADY_COMPLETED', 'You already completed this quest today. New quests arrive tomorrow.');

    // 2) must have been started, and not instantly
    const attempt = db.prepare('SELECT started_at FROM quest_attempts WHERE user_id = ? AND quest_id = ?').get(userId, questId) as { started_at: number } | undefined;
    if (!attempt) throw conflict('NOT_STARTED', 'Start the quest first.');
    const waitMs = minQuestSeconds() * 1000 - (now.getTime() - attempt.started_at);
    if (waitMs > 0) throw conflict('TOO_FAST', 'Do the real action first — then claim your reward.', { retryAfterMs: Math.ceil(waitMs) });

    const cls = classById(ch.class)!;
    const ctx: Ctx = { userId, day, events: [], primary: cls.primary, bonusAttr: quest.attr };
    const effects = equippedEffects(userId);

    // 3) streak (may consume Second Wind / Phoenix Heart)
    const streak = resolveStreak(userId, day);
    ctx.events.push({ type: 'quest_complete', questId, title: quest.title });
    ctx.events.push({ type: 'streak', current: streak.current, longest: streak.longest, saved: streak.saved });

    // 4) XP — computed from DB values + equipped cards + streak, never from the client
    const breakdown: { label: string; pct: number }[] = [];
    for (const { effect } of effects) {
      if (effect.kind === 'xp_category' && effect.category === quest.category) breakdown.push({ label: `${quest.category} card`, pct: effect.pct });
      if (effect.kind === 'xp_difficulty' && quest.difficulty >= effect.minDifficulty) breakdown.push({ label: 'IRON WILL', pct: effect.pct });
      if (effect.kind === 'xp_all') breakdown.push({ label: 'CARD BONUS', pct: effect.pct });
    }
    const streakPct = Math.min(10, Math.max(0, streak.current - 1));
    if (streakPct > 0) breakdown.push({ label: `${streak.current}-DAY STREAK`, pct: streakPct });
    const totalPct = breakdown.reduce((s, b) => s + b.pct, 0);
    const xpGain = Math.round(quest.xp_reward * (1 + totalPct / 100));

    // 5) boss damage (only against the quest's own world boss, if it is alive)
    const world = db.prepare('SELECT boss_id FROM worlds WHERE id = ?').get(quest.world_id) as { boss_id: string };
    const ub = db.prepare('SELECT current_hp, status FROM user_bosses WHERE user_id = ? AND boss_id = ?').get(userId, world.boss_id) as
      | { current_hp: number; status: 'active' | 'defeated' }
      | undefined;
    let dealt = 0;
    let crit = false;
    let bossDefeated = false;
    if (ub && ub.status === 'active' && quest.boss_damage > 0) {
      const dmgPct = effects.reduce((s, e) => s + (e.effect.kind === 'boss_damage' ? e.effect.pct : 0), 0);
      const critPct = 5 + effects.reduce((s, e) => s + (e.effect.kind === 'crit_chance' ? e.effect.pct : 0), 0);
      crit = crypto.randomInt(0, 100) < critPct;
      const raw = quest.boss_damage * (1 + dmgPct / 100) * (crit ? 1.5 : 1);
      const damage = Math.round(raw);
      const hpAfter = Math.max(0, ub.current_hp - damage);
      const maxHp = (db.prepare('SELECT max_hp FROM bosses WHERE id = ?').get(world.boss_id) as { max_hp: number }).max_hp;
      db.prepare('UPDATE user_bosses SET current_hp = ? WHERE user_id = ? AND boss_id = ?').run(hpAfter, userId, world.boss_id);
      dealt = damage;
      bossDefeated = hpAfter === 0;
      ctx.events.push({ type: 'boss_damage', bossId: world.boss_id, damage, crit, hpBefore: ub.current_hp, hpAfter, maxHp });
    }

    // 6) persist the completion — the UNIQUE(user, quest, day) constraint is the last line of defence
    db.prepare('INSERT INTO quest_completions (user_id, quest_id, day_key, xp_awarded, boss_damage, crit) VALUES (?, ?, ?, ?, ?, ?)').run(
      userId, questId, day, xpGain, dealt, crit ? 1 : 0,
    );
    db.prepare('DELETE FROM quest_attempts WHERE user_id = ? AND quest_id = ?').run(userId, questId);
    ctx.events.push({ type: 'xp', amount: xpGain, base: quest.xp_reward, breakdown });

    // 7) attribute reward for the quest
    db.prepare(`UPDATE characters SET ${quest.attr} = ${quest.attr} + ? WHERE user_id = ?`).run(quest.attr_amount, userId);
    ctx.events.push({ type: 'attribute', attr: quest.attr, amount: quest.attr_amount });

    grantXp(ctx, xpGain, 'quest', questId);

    if (bossDefeated) {
      const boss = db.prepare('SELECT id, reward_xp FROM bosses WHERE id = ?').get(world.boss_id) as { id: string; reward_xp: number };
      db.prepare(`UPDATE user_bosses SET status = 'defeated', defeated_at = datetime('now') WHERE user_id = ? AND boss_id = ?`).run(userId, boss.id);
      const rc = (db.prepare('SELECT reward_card FROM bosses WHERE id = ?').get(boss.id) as { reward_card: string }).reward_card;
      ctx.events.push({ type: 'boss_defeated', bossId: boss.id, rewardXp: boss.reward_xp, cardId: rc });
      grantXp(ctx, boss.reward_xp, 'boss', boss.id);
    }

    evaluateMilestones(ctx);
    return ctx.events;
  }).immediate();

  return { events, state: getGameState(userId, now) };
}

// ───────────────────────── Streak ─────────────────────────

function resolveStreak(userId: number, day: string): { current: number; longest: number; saved: boolean } {
  const row = db.prepare('SELECT current, longest, last_day FROM streaks WHERE user_id = ?').get(userId) as { current: number; longest: number; last_day: string | null };
  let current: number;
  let saved = false;

  if (row.last_day === day) {
    current = Math.max(1, row.current);
  } else if (!row.last_day) {
    current = 1;
  } else {
    const gap = daysBetween(row.last_day, day);
    if (gap === 1) current = row.current + 1;
    else if (gap === 2 && row.current > 0) {
      const cardId = findReadySaveCard(userId, day);
      if (cardId) {
        db.prepare('UPDATE user_power_cards SET last_used_day = ? WHERE user_id = ? AND card_id = ?').run(day, userId, cardId);
        current = row.current + 1;
        saved = true;
      } else current = 1;
    } else current = 1;
  }

  const longest = Math.max(row.longest, current);
  db.prepare('UPDATE streaks SET current = ?, longest = ?, last_day = ? WHERE user_id = ?').run(current, longest, day, userId);
  return { current, longest, saved };
}

// ───────────────────────── XP, levels, companion ─────────────────────────

function grantXp(ctx: Ctx, amount: number, source: 'quest' | 'boss' | 'achievement', refId: string) {
  if (amount <= 0) return;
  const ch = getChar(ctx.userId)!;
  const newTotal = ch.xp_total + amount;
  const before = progressFromTotalXp(ch.xp_total);
  const after = progressFromTotalXp(newTotal);
  db.prepare('INSERT INTO xp_transactions (user_id, amount, source, ref_id, day_key) VALUES (?, ?, ?, ?, ?)').run(ctx.userId, amount, source, refId, ctx.day);

  const gained = after.level - before.level;
  if (gained > 0) {
    const gains = new Map<Attr, number>();
    gains.set(ctx.primary, (gains.get(ctx.primary) ?? 0) + gained);
    gains.set(ctx.bonusAttr, (gains.get(ctx.bonusAttr) ?? 0) + gained);
    for (const [attr, n] of gains) db.prepare(`UPDATE characters SET ${attr} = ${attr} + ? WHERE user_id = ?`).run(n, ctx.userId);
    ctx.events.push({ type: 'level_up', level: after.level, gains: [...gains].map(([attr, n]) => ({ attr, amount: n })) });
  }
  db.prepare('UPDATE characters SET xp_total = ?, level = ? WHERE user_id = ?').run(newTotal, after.level, ctx.userId);

  // companion
  const comp = db.prepare('SELECT xp_total, stage FROM companions WHERE user_id = ?').get(ctx.userId) as { xp_total: number; stage: number } | undefined;
  if (comp) {
    const cTotal = comp.xp_total + Math.round(amount * COMPANION_XP_SHARE);
    const cProg = progressFromTotalXp(cTotal);
    const stage = companionStageForLevel(cProg.level).stage;
    db.prepare('UPDATE companions SET xp_total = ?, level = ?, stage = ? WHERE user_id = ?').run(cTotal, cProg.level, stage, ctx.userId);
    if (stage > comp.stage) ctx.events.push({ type: 'companion_evolved', stage, level: cProg.level });
  }
}

// ───────────────────────── Worlds, cards, achievements ─────────────────────────

function unlockCard(ctx: Ctx, cardId: string, source: string): boolean {
  const r = db.prepare('INSERT OR IGNORE INTO user_power_cards (user_id, card_id, source) VALUES (?, ?, ?)').run(ctx.userId, cardId, source);
  if (r.changes > 0) {
    ctx.events.push({ type: 'card_unlocked', cardId, source });
    return true;
  }
  return false;
}

/** Re-checks every unlock rule until the game state is stable. */
function evaluateMilestones(ctx: Ctx) {
  for (let i = 0; i < 12; i++) {
    let changed = false;

    const ch = getChar(ctx.userId)!;

    // worlds
    const worlds = db.prepare('SELECT id, level_req, requires_boss, boss_id FROM worlds ORDER BY sort').all() as {
      id: string; level_req: number; requires_boss: string | null; boss_id: string;
    }[];
    for (const w of worlds) {
      const has = db.prepare('SELECT 1 FROM user_world_progress WHERE user_id = ? AND world_id = ?').get(ctx.userId, w.id);
      if (has) continue;
      if (ch.level < w.level_req) continue;
      if (w.requires_boss) {
        const b = db.prepare(`SELECT 1 FROM user_bosses WHERE user_id = ? AND boss_id = ? AND status = 'defeated'`).get(ctx.userId, w.requires_boss);
        if (!b) continue;
      }
      db.prepare('INSERT INTO user_world_progress (user_id, world_id) VALUES (?, ?)').run(ctx.userId, w.id);
      const maxHp = (db.prepare('SELECT max_hp FROM bosses WHERE id = ?').get(w.boss_id) as { max_hp: number }).max_hp;
      db.prepare(`INSERT OR IGNORE INTO user_bosses (user_id, boss_id, current_hp, status) VALUES (?, ?, ?, 'active')`).run(ctx.userId, w.boss_id, maxHp);
      if (w.id !== 'the-beginning') ctx.events.push({ type: 'world_unlocked', worldId: w.id });
      changed = true;
    }

    // cards
    const cards = db.prepare('SELECT id, unlock FROM power_cards').all() as { id: string; unlock: string }[];
    for (const c of cards) {
      const owned = db.prepare('SELECT 1 FROM user_power_cards WHERE user_id = ? AND card_id = ?').get(ctx.userId, c.id);
      if (owned) continue;
      if (unlockMet(ctx, ch, JSON.parse(c.unlock) as UnlockCondition)) {
        const src = (JSON.parse(c.unlock) as UnlockCondition).kind;
        if (unlockCard(ctx, c.id, src)) changed = true;
      }
    }

    // achievements
    const achs = db.prepare('SELECT id, condition, reward_xp FROM achievements').all() as { id: string; condition: string; reward_xp: number }[];
    for (const a of achs) {
      const has = db.prepare('SELECT 1 FROM user_achievements WHERE user_id = ? AND achievement_id = ?').get(ctx.userId, a.id);
      if (has) continue;
      if (achievementMet(ctx, JSON.parse(a.condition) as AchievementCondition)) {
        db.prepare('INSERT INTO user_achievements (user_id, achievement_id) VALUES (?, ?)').run(ctx.userId, a.id);
        ctx.events.push({ type: 'achievement_unlocked', achievementId: a.id, rewardXp: a.reward_xp });
        grantXp(ctx, a.reward_xp, 'achievement', a.id);
        changed = true;
      }
    }

    if (!changed) break;
  }
}

const count = (sql: string, ...args: unknown[]) => (db.prepare(sql).get(...args) as { n: number }).n;

function unlockMet(ctx: Ctx, ch: CharRow, u: UnlockCondition): boolean {
  switch (u.kind) {
    case 'start': return true;
    case 'level': return ch.level >= u.n;
    case 'streak': return count('SELECT longest AS n FROM streaks WHERE user_id = ?', ctx.userId) >= u.n;
    case 'boss': return !!db.prepare(`SELECT 1 FROM user_bosses WHERE user_id = ? AND boss_id = ? AND status = 'defeated'`).get(ctx.userId, u.id);
    case 'quests': return count('SELECT COUNT(*) AS n FROM quest_completions WHERE user_id = ?', ctx.userId) >= u.n;
  }
}

function achievementMet(ctx: Ctx, c: AchievementCondition): boolean {
  const uid = ctx.userId;
  switch (c.kind) {
    case 'quests_total': return count('SELECT COUNT(*) AS n FROM quest_completions WHERE user_id = ?', uid) >= c.n;
    case 'quests_category':
      return count('SELECT COUNT(*) AS n FROM quest_completions qc JOIN quests q ON q.id = qc.quest_id WHERE qc.user_id = ? AND q.category = ?', uid, c.category) >= c.n;
    case 'level': return getChar(uid)!.level >= c.n;
    case 'streak': return count('SELECT longest AS n FROM streaks WHERE user_id = ?', uid) >= c.n;
    case 'bosses': return count(`SELECT COUNT(*) AS n FROM user_bosses WHERE user_id = ? AND status = 'defeated'`, uid) >= c.n;
    case 'worlds': return count('SELECT COUNT(*) AS n FROM user_world_progress WHERE user_id = ?', uid) >= c.n;
    case 'cards': return count('SELECT COUNT(*) AS n FROM user_power_cards WHERE user_id = ?', uid) >= c.n;
    case 'day_quests': return count('SELECT COUNT(*) AS n FROM quest_completions WHERE user_id = ? AND day_key = ?', uid, ctx.day) >= c.n;
    case 'companion_stage': return count('SELECT stage AS n FROM companions WHERE user_id = ?', uid) >= c.n;
    case 'crits': return count('SELECT COALESCE(SUM(crit),0) AS n FROM quest_completions WHERE user_id = ?', uid) >= c.n;
  }
}

// ───────────────────────── Cards / worlds / companion actions ─────────────────────────

export function equipCard(userId: number, cardId: string) {
  db.transaction(() => {
    const owned = db.prepare('SELECT 1 FROM user_power_cards WHERE user_id = ? AND card_id = ?').get(userId, cardId);
    if (!owned) throw forbidden('CARD_LOCKED', 'You have not unlocked that card yet.');
    const eq = db.prepare('SELECT slot, card_id FROM equipped_cards WHERE user_id = ?').all(userId) as { slot: number; card_id: string }[];
    if (eq.some((e) => e.card_id === cardId)) return;
    const used = new Set(eq.map((e) => e.slot));
    let slot = -1;
    for (let s = 0; s < MAX_EQUIPPED; s++) if (!used.has(s)) { slot = s; break; }
    if (slot < 0) throw conflict('SLOTS_FULL', `All ${MAX_EQUIPPED} card slots are full. Unequip one first.`);
    db.prepare('INSERT INTO equipped_cards (user_id, slot, card_id) VALUES (?, ?, ?)').run(userId, slot, cardId);
  }).immediate();
  return getGameState(userId);
}

export function unequipCard(userId: number, cardId: string) {
  db.prepare('DELETE FROM equipped_cards WHERE user_id = ? AND card_id = ?').run(userId, cardId);
  return getGameState(userId);
}

export function selectWorld(userId: number, worldId: string) {
  const w = db.prepare('SELECT id FROM worlds WHERE id = ?').get(worldId);
  if (!w) throw notFound('Unknown world.');
  assertWorldUnlocked(userId, worldId);
  db.prepare('UPDATE characters SET current_world_id = ? WHERE user_id = ?').run(worldId, userId);
  return getGameState(userId);
}

export function renameCompanion(userId: number, name: string) {
  db.prepare('UPDATE companions SET name = ? WHERE user_id = ?').run(name, userId);
  return getGameState(userId);
}

export { shiftDay };
