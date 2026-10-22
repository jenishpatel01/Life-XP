import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { ACHIEVEMENTS, BOSSES, CARDS, QUESTS, WORLDS } from '../shared/content.ts';

const dbPath = path.resolve(process.env.DATABASE_PATH ?? './data/lifexp.db');
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

export const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
db.pragma('busy_timeout = 5000');

/**
 * Relational schema. Every piece of private progression data is keyed by
 * user_id and ONLY ever read/written through server code that derives user_id
 * from the authenticated session (the SQLite equivalent of Row Level Security).
 * Catalog tables (quests, bosses, worlds, power_cards, achievements) are seeded
 * from shared/content.ts on boot and are read-only for players.
 */
const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  email         TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sessions (
  id          TEXT PRIMARY KEY,               -- sha256(token); raw token only lives in the cookie
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at  TEXT NOT NULL,
  user_agent  TEXT
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);

CREATE TABLE IF NOT EXISTS password_resets (
  token_hash TEXT PRIMARY KEY,                -- sha256(token); raw token only lives in the e-mailed link
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_resets_user ON password_resets(user_id);

CREATE TABLE IF NOT EXISTS profiles (
  user_id    INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  username   TEXT NOT NULL UNIQUE COLLATE NOCASE,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS user_settings (
  user_id        INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  sound          INTEGER NOT NULL DEFAULT 1,
  music          INTEGER NOT NULL DEFAULT 0,
  animation      TEXT NOT NULL DEFAULT 'high'   CHECK (animation IN ('low','medium','high')),
  reduced_motion TEXT NOT NULL DEFAULT 'auto'   CHECK (reduced_motion IN ('auto','on','off')),
  theme          TEXT NOT NULL DEFAULT 'neon'   CHECK (theme IN ('neon','void')),
  timezone       TEXT NOT NULL DEFAULT 'UTC'
);

CREATE TABLE IF NOT EXISTS characters (
  user_id          INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,
  class            TEXT NOT NULL CHECK (class IN ('DISCIPLINE','FOCUS','FITNESS','CREATIVE')),
  armor            TEXT NOT NULL,
  plume            TEXT NOT NULL,
  helm             TEXT NOT NULL,
  level            INTEGER NOT NULL DEFAULT 1,
  xp_total         INTEGER NOT NULL DEFAULT 0 CHECK (xp_total >= 0),
  discipline       INTEGER NOT NULL,
  focus            INTEGER NOT NULL,
  fitness          INTEGER NOT NULL,
  creativity       INTEGER NOT NULL,
  current_world_id TEXT NOT NULL,
  created_at       TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS worlds (
  id             TEXT PRIMARY KEY,
  sort           INTEGER NOT NULL,
  name           TEXT NOT NULL,
  blurb          TEXT NOT NULL,
  level_req      INTEGER NOT NULL,
  requires_boss  TEXT,
  boss_id        TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS bosses (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  blurb       TEXT NOT NULL,
  max_hp      INTEGER NOT NULL,
  difficulty  INTEGER NOT NULL,
  reward_xp   INTEGER NOT NULL,
  reward_card TEXT NOT NULL,
  world_id    TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS quests (
  id           TEXT PRIMARY KEY,
  world_id     TEXT NOT NULL REFERENCES worlds(id),
  title        TEXT NOT NULL,
  description  TEXT NOT NULL,
  category     TEXT NOT NULL CHECK (category IN ('FOCUS','FITNESS','LEARNING','HEALTH','CREATIVITY','DISCIPLINE')),
  difficulty   INTEGER NOT NULL CHECK (difficulty BETWEEN 1 AND 5),
  xp_reward    INTEGER NOT NULL,
  boss_damage  INTEGER NOT NULL,
  attr         TEXT NOT NULL,
  attr_amount  INTEGER NOT NULL DEFAULT 1,
  minutes      INTEGER,
  sort         INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS power_cards (
  id           TEXT PRIMARY KEY,
  name         TEXT NOT NULL,
  description  TEXT NOT NULL,
  rarity       TEXT NOT NULL CHECK (rarity IN ('COMMON','RARE','EPIC','LEGENDARY')),
  effects      TEXT NOT NULL,       -- JSON
  unlock       TEXT NOT NULL,       -- JSON
  unlock_text  TEXT NOT NULL,
  art          TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS achievements (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  description TEXT NOT NULL,
  condition   TEXT NOT NULL,        -- JSON
  reward_xp   INTEGER NOT NULL,
  icon        TEXT NOT NULL,
  tier        TEXT NOT NULL
);

-- An in-progress ("started") quest. Required before completion.
CREATE TABLE IF NOT EXISTS quest_attempts (
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  quest_id   TEXT NOT NULL REFERENCES quests(id),
  started_at INTEGER NOT NULL,      -- epoch ms, server clock
  PRIMARY KEY (user_id, quest_id)
);

-- UNIQUE(user, quest, day) is what makes duplicate rewards impossible,
-- even under concurrent/replayed requests.
CREATE TABLE IF NOT EXISTS quest_completions (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  quest_id     TEXT NOT NULL REFERENCES quests(id),
  day_key      TEXT NOT NULL,
  completed_at TEXT NOT NULL DEFAULT (datetime('now')),
  xp_awarded   INTEGER NOT NULL,
  boss_damage  INTEGER NOT NULL DEFAULT 0,
  crit         INTEGER NOT NULL DEFAULT 0,
  UNIQUE (user_id, quest_id, day_key)
);
CREATE INDEX IF NOT EXISTS idx_completions_user_day ON quest_completions(user_id, day_key);

CREATE TABLE IF NOT EXISTS user_bosses (
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  boss_id     TEXT NOT NULL REFERENCES bosses(id),
  current_hp  INTEGER NOT NULL CHECK (current_hp >= 0),
  status      TEXT NOT NULL CHECK (status IN ('active','defeated')),
  started_at  TEXT NOT NULL DEFAULT (datetime('now')),
  defeated_at TEXT,
  PRIMARY KEY (user_id, boss_id)
);

CREATE TABLE IF NOT EXISTS user_world_progress (
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  world_id    TEXT NOT NULL REFERENCES worlds(id),
  unlocked_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, world_id)
);

CREATE TABLE IF NOT EXISTS user_power_cards (
  user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  card_id       TEXT NOT NULL REFERENCES power_cards(id),
  unlocked_at   TEXT NOT NULL DEFAULT (datetime('now')),
  source        TEXT NOT NULL,
  last_used_day TEXT,
  PRIMARY KEY (user_id, card_id)
);

CREATE TABLE IF NOT EXISTS equipped_cards (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  slot    INTEGER NOT NULL CHECK (slot BETWEEN 0 AND 2),
  card_id TEXT NOT NULL,
  PRIMARY KEY (user_id, slot),
  UNIQUE (user_id, card_id),
  FOREIGN KEY (user_id, card_id) REFERENCES user_power_cards(user_id, card_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS companions (
  user_id  INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  name     TEXT NOT NULL,
  species  TEXT NOT NULL DEFAULT 'ember',
  xp_total INTEGER NOT NULL DEFAULT 0,
  level    INTEGER NOT NULL DEFAULT 1,
  stage    INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS user_achievements (
  user_id        INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  achievement_id TEXT NOT NULL REFERENCES achievements(id),
  unlocked_at    TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, achievement_id)
);

CREATE TABLE IF NOT EXISTS streaks (
  user_id  INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  current  INTEGER NOT NULL DEFAULT 0,
  longest  INTEGER NOT NULL DEFAULT 0,
  last_day TEXT
);

CREATE TABLE IF NOT EXISTS xp_transactions (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount     INTEGER NOT NULL,
  source     TEXT NOT NULL CHECK (source IN ('quest','boss','achievement')),
  ref_id     TEXT,
  day_key    TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_xp_user_day ON xp_transactions(user_id, day_key);
`;

export function migrate(): void {
  db.exec(SCHEMA);
  seedCatalog();
}

function seedCatalog(): void {
  const tx = db.transaction(() => {
    const insWorld = db.prepare(
      `INSERT INTO worlds (id, sort, name, blurb, level_req, requires_boss, boss_id)
       VALUES (@id, @sort, @name, @blurb, @level_req, @requires_boss, @boss_id)
       ON CONFLICT(id) DO UPDATE SET sort=excluded.sort, name=excluded.name, blurb=excluded.blurb,
         level_req=excluded.level_req, requires_boss=excluded.requires_boss, boss_id=excluded.boss_id`,
    );
    for (const w of WORLDS) {
      insWorld.run({ id: w.id, sort: w.order, name: w.name, blurb: w.blurb, level_req: w.levelReq, requires_boss: w.requiresBoss, boss_id: w.bossId });
    }

    const insBoss = db.prepare(
      `INSERT INTO bosses (id, name, blurb, max_hp, difficulty, reward_xp, reward_card, world_id)
       VALUES (@id, @name, @blurb, @max_hp, @difficulty, @reward_xp, @reward_card, @world_id)
       ON CONFLICT(id) DO UPDATE SET name=excluded.name, blurb=excluded.blurb, max_hp=excluded.max_hp,
         difficulty=excluded.difficulty, reward_xp=excluded.reward_xp, reward_card=excluded.reward_card, world_id=excluded.world_id`,
    );
    for (const b of BOSSES) {
      insBoss.run({ id: b.id, name: b.name, blurb: b.blurb, max_hp: b.maxHp, difficulty: b.difficulty, reward_xp: b.rewardXp, reward_card: b.rewardCard, world_id: b.worldId });
    }

    const insQuest = db.prepare(
      `INSERT INTO quests (id, world_id, title, description, category, difficulty, xp_reward, boss_damage, attr, attr_amount, minutes, sort)
       VALUES (@id, @world_id, @title, @description, @category, @difficulty, @xp_reward, @boss_damage, @attr, @attr_amount, @minutes, @sort)
       ON CONFLICT(id) DO UPDATE SET world_id=excluded.world_id, title=excluded.title, description=excluded.description,
         category=excluded.category, difficulty=excluded.difficulty, xp_reward=excluded.xp_reward,
         boss_damage=excluded.boss_damage, attr=excluded.attr, attr_amount=excluded.attr_amount,
         minutes=excluded.minutes, sort=excluded.sort`,
    );
    QUESTS.forEach((q, i) => {
      insQuest.run({
        id: q.id, world_id: q.worldId, title: q.title, description: q.description, category: q.category,
        difficulty: q.difficulty, xp_reward: q.xp, boss_damage: q.bossDamage, attr: q.attr,
        attr_amount: q.attrAmount, minutes: q.minutes ?? null, sort: i,
      });
    });

    const insCard = db.prepare(
      `INSERT INTO power_cards (id, name, description, rarity, effects, unlock, unlock_text, art)
       VALUES (@id, @name, @description, @rarity, @effects, @unlock, @unlock_text, @art)
       ON CONFLICT(id) DO UPDATE SET name=excluded.name, description=excluded.description, rarity=excluded.rarity,
         effects=excluded.effects, unlock=excluded.unlock, unlock_text=excluded.unlock_text, art=excluded.art`,
    );
    for (const c of CARDS) {
      insCard.run({ id: c.id, name: c.name, description: c.description, rarity: c.rarity, effects: JSON.stringify(c.effects), unlock: JSON.stringify(c.unlock), unlock_text: c.unlockText, art: c.art });
    }

    const insAch = db.prepare(
      `INSERT INTO achievements (id, name, description, condition, reward_xp, icon, tier)
       VALUES (@id, @name, @description, @condition, @reward_xp, @icon, @tier)
       ON CONFLICT(id) DO UPDATE SET name=excluded.name, description=excluded.description, condition=excluded.condition,
         reward_xp=excluded.reward_xp, icon=excluded.icon, tier=excluded.tier`,
    );
    for (const a of ACHIEVEMENTS) {
      insAch.run({ id: a.id, name: a.name, description: a.description, condition: JSON.stringify(a.condition), reward_xp: a.rewardXp, icon: a.icon, tier: a.tier });
    }
  });
  tx();
}
