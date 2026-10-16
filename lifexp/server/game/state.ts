import { db } from '../db.ts';
import { BOSSES, QUESTS, WORLDS, bossById, worldById, type Appearance, type Attr, type ClassId } from '../../shared/content.ts';
import { progressFromTotalXp } from '../../shared/xp.ts';
import type { BossStateDTO, GameState, Settings, WorldStateDTO } from '../../shared/types.ts';
import { dayKey, daysBetween, shiftDay } from '../time.ts';
import { minQuestSeconds } from '../config.ts';

interface SettingsRow {
  sound: number;
  music: number;
  animation: Settings['animation'];
  reduced_motion: Settings['reducedMotion'];
  theme: Settings['theme'];
  timezone: string;
}

export function getSettings(userId: number): Settings {
  const r = db.prepare('SELECT * FROM user_settings WHERE user_id = ?').get(userId) as SettingsRow | undefined;
  if (!r) return { sound: true, music: false, animation: 'high', reducedMotion: 'auto', theme: 'neon', timezone: 'UTC' };
  return {
    sound: !!r.sound,
    music: !!r.music,
    animation: r.animation,
    reducedMotion: r.reduced_motion,
    theme: r.theme,
    timezone: r.timezone,
  };
}

interface StreakRow {
  current: number;
  longest: number;
  last_day: string | null;
}

/** Streak as the player should see it right now (a lapsed streak shows 0). */
export function displayStreak(row: StreakRow | undefined, today: string, saveReady: boolean): number {
  if (!row || !row.last_day || row.current <= 0) return 0;
  const gap = daysBetween(row.last_day, today);
  if (gap <= 1) return row.current;
  if (gap === 2 && saveReady) return row.current; // Second Wind can still rescue it
  return 0;
}

export function saveCardReady(userId: number, today: string): boolean {
  return findReadySaveCard(userId, today) !== null;
}

export const SAVE_COOLDOWN_DAYS = 7;

/** An equipped streak_save card that is not recharging, or null. */
export function findReadySaveCard(userId: number, today: string): string | null {
  const rows = db
    .prepare(
      `SELECT e.card_id, u.last_used_day, c.effects
         FROM equipped_cards e
         JOIN user_power_cards u ON u.user_id = e.user_id AND u.card_id = e.card_id
         JOIN power_cards c ON c.id = e.card_id
        WHERE e.user_id = ?`,
    )
    .all(userId) as { card_id: string; last_used_day: string | null; effects: string }[];
  for (const r of rows) {
    const effects = JSON.parse(r.effects) as { kind: string }[];
    if (!effects.some((e) => e.kind === 'streak_save')) continue;
    if (!r.last_used_day || daysBetween(r.last_used_day, today) >= SAVE_COOLDOWN_DAYS) return r.card_id;
  }
  return null;
}

export function getGameState(userId: number, now: Date = new Date()): GameState {
  const user = db
    .prepare('SELECT u.email, u.created_at, p.username FROM users u JOIN profiles p ON p.user_id = u.id WHERE u.id = ?')
    .get(userId) as { email: string; created_at: string; username: string };
  const settings = getSettings(userId);
  const today = dayKey(settings.timezone, now);

  const ch = db.prepare('SELECT * FROM characters WHERE user_id = ?').get(userId) as
    | {
        name: string; class: ClassId; armor: string; plume: string; helm: string; level: number; xp_total: number;
        discipline: number; focus: number; fitness: number; creativity: number; current_world_id: string; created_at: string;
      }
    | undefined;

  const progress = ch ? progressFromTotalXp(ch.xp_total) : null;

  const streakRow = db.prepare('SELECT current, longest, last_day FROM streaks WHERE user_id = ?').get(userId) as StreakRow | undefined;
  const saveReady = saveCardReady(userId, today);
  const weekDays = Array.from({ length: 7 }, (_, i) => shiftDay(today, i - 6));
  const weekRows = db
    .prepare('SELECT day_key, COUNT(*) AS n FROM quest_completions WHERE user_id = ? AND day_key >= ? GROUP BY day_key')
    .all(userId, weekDays[0]) as { day_key: string; n: number }[];
  const weekMap = new Map(weekRows.map((r) => [r.day_key, r.n]));

  const todayAgg = db
    .prepare('SELECT COUNT(*) AS n, COALESCE(SUM(boss_damage),0) AS dmg FROM quest_completions WHERE user_id = ? AND day_key = ?')
    .get(userId, today) as { n: number; dmg: number };
  const todayXp = (db.prepare('SELECT COALESCE(SUM(amount),0) AS xp FROM xp_transactions WHERE user_id = ? AND day_key = ?').get(userId, today) as { xp: number }).xp;

  // worlds
  const unlockedRows = db.prepare('SELECT world_id, unlocked_at FROM user_world_progress WHERE user_id = ?').all(userId) as { world_id: string; unlocked_at: string }[];
  const unlocked = new Map(unlockedRows.map((r) => [r.world_id, r.unlocked_at]));
  const bossRows = db.prepare('SELECT boss_id, current_hp, status, defeated_at FROM user_bosses WHERE user_id = ?').all(userId) as {
    boss_id: string; current_hp: number; status: 'active' | 'defeated'; defeated_at: string | null;
  }[];
  const bossMap = new Map(bossRows.map((r) => [r.boss_id, r]));
  const everDone = db.prepare('SELECT quest_id, COUNT(*) AS n FROM quest_completions WHERE user_id = ? GROUP BY quest_id').all(userId) as { quest_id: string; n: number }[];
  const everMap = new Map(everDone.map((r) => [r.quest_id, r.n]));
  const todayDone = new Set(
    (db.prepare('SELECT quest_id FROM quest_completions WHERE user_id = ? AND day_key = ?').all(userId, today) as { quest_id: string }[]).map((r) => r.quest_id),
  );
  const attempts = new Map(
    (db.prepare('SELECT quest_id, started_at FROM quest_attempts WHERE user_id = ?').all(userId) as { quest_id: string; started_at: number }[]).map((r) => [r.quest_id, r.started_at]),
  );

  const level = ch?.level ?? 1;
  const worlds: WorldStateDTO[] = WORLDS.map((w) => {
    const bossDef = bossById(w.bossId)!;
    const br = bossMap.get(w.bossId);
    const isUnlocked = unlocked.has(w.id);
    const boss: BossStateDTO = {
      id: w.bossId,
      unlocked: !!br,
      status: !br ? 'locked' : br.status,
      hp: br ? br.current_hp : bossDef.maxHp,
      maxHp: bossDef.maxHp,
      defeatedAt: br?.defeated_at ?? null,
    };
    const worldQuests = QUESTS.filter((q) => q.worldId === w.id);
    const questsDone = worldQuests.filter((q) => (everMap.get(q.id) ?? 0) > 0).length;
    const questFrac = worldQuests.length ? questsDone / worldQuests.length : 0;
    const pct = Math.round(100 * (0.5 * questFrac + 0.5 * (boss.status === 'defeated' ? 1 : 0)));
    const reqBossMet = !w.requiresBoss || bossMap.get(w.requiresBoss)?.status === 'defeated';
    return {
      id: w.id,
      unlocked: isUnlocked,
      unlockedAt: unlocked.get(w.id) ?? null,
      questsDone,
      questsTotal: worldQuests.length,
      pct,
      boss,
      blockers: { level: w.levelReq, bossId: w.requiresBoss, levelMet: level >= w.levelReq, bossMet: reqBossMet },
    };
  });

  // Active boss: the current world's boss if still alive, otherwise the first live boss
  let activeBossId: string | null = null;
  if (ch) {
    const curWorld = worldById(ch.current_world_id);
    const curBoss = curWorld ? bossMap.get(curWorld.bossId) : undefined;
    if (curWorld && curBoss?.status === 'active') activeBossId = curWorld.bossId;
    else {
      for (const w of WORLDS) {
        if (bossMap.get(w.bossId)?.status === 'active') {
          activeBossId = w.bossId;
          break;
        }
      }
    }
  }

  const ownedCards = db.prepare('SELECT card_id, unlocked_at, source, last_used_day FROM user_power_cards WHERE user_id = ?').all(userId) as {
    card_id: string; unlocked_at: string; source: string; last_used_day: string | null;
  }[];
  const equipped = (db.prepare('SELECT card_id FROM equipped_cards WHERE user_id = ? ORDER BY slot').all(userId) as { card_id: string }[]).map((r) => r.card_id);

  const comp = db.prepare('SELECT name, species, xp_total, level, stage FROM companions WHERE user_id = ?').get(userId) as
    | { name: string; species: string; xp_total: number; level: number; stage: number }
    | undefined;
  const achievements = db.prepare('SELECT achievement_id AS id, unlocked_at AS unlockedAt FROM user_achievements WHERE user_id = ?').all(userId) as { id: string; unlockedAt: string }[];

  const crits = (db.prepare('SELECT COALESCE(SUM(crit),0) AS n FROM quest_completions WHERE user_id = ?').get(userId) as { n: number }).n;
  const totalQuests = (db.prepare('SELECT COUNT(*) AS n FROM quest_completions WHERE user_id = ?').get(userId) as { n: number }).n;

  return {
    serverTime: now.getTime(),
    user: { username: user.username, email: user.email, createdAt: user.created_at },
    character: ch
      ? {
          name: ch.name,
          class: ch.class,
          appearance: { armor: ch.armor, plume: ch.plume, helm: ch.helm } as Appearance,
          level: ch.level,
          progress: progress!,
          attrs: { discipline: ch.discipline, focus: ch.focus, fitness: ch.fitness, creativity: ch.creativity } as Record<Attr, number>,
          currentWorldId: ch.current_world_id,
          createdAt: ch.created_at,
        }
      : null,
    streak: {
      current: displayStreak(streakRow, today, saveReady),
      longest: streakRow?.longest ?? 0,
      lastDay: streakRow?.last_day ?? null,
      doneToday: streakRow?.last_day === today,
      week: weekDays.map((d) => ({ day: d, count: weekMap.get(d) ?? 0 })),
    },
    today: { day: today, xp: todayXp, quests: todayAgg.n, bossDamage: todayAgg.dmg },
    worlds,
    activeBossId,
    quests: QUESTS.map((q) => ({
      id: q.id,
      doneToday: todayDone.has(q.id),
      startedAt: attempts.get(q.id) ?? null,
      timesCompleted: everMap.get(q.id) ?? 0,
    })),
    cards: {
      owned: ownedCards.map((c) => ({
        id: c.card_id,
        unlockedAt: c.unlocked_at,
        source: c.source,
        rechargeUntil:
          c.last_used_day && daysBetween(c.last_used_day, today) < SAVE_COOLDOWN_DAYS ? shiftDay(c.last_used_day, SAVE_COOLDOWN_DAYS) : null,
      })),
      equipped,
    },
    companion: comp
      ? { name: comp.name, species: comp.species, level: comp.level, stage: comp.stage, progress: progressFromTotalXp(comp.xp_total) }
      : null,
    achievements,
    settings,
    stats: {
      totalQuests,
      totalXp: ch?.xp_total ?? 0,
      bossesDefeated: bossRows.filter((b) => b.status === 'defeated').length,
      crits,
    },
    minQuestSeconds: minQuestSeconds(),
  };
}

export { BOSSES };
