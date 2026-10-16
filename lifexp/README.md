# LIFE//XP — Your life. Your quests. Your level.

A complete, working self-improvement RPG: landing page, real accounts, character creation, a server-authoritative
quest/XP/boss engine, world map, power cards, evolving companion, achievements, streaks, audio and pixel-art FX.

## Run it

```bash
npm install
cp .env.example .env        # optional
npm run dev                 # API on :8787 + Vite on :5173  → open http://localhost:5173
```

Production: `npm run build && npm start` (serves the built app and API from one port; set `COOKIE_SECURE=1` behind HTTPS).

Tests: `npm test` (typecheck → API integration tests → build → 7-flow browser test with Playwright).

## How it is built

| Layer | Choice |
|---|---|
| Frontend | Vite + React + TypeScript (strict), react-router, zustand |
| Backend | Express + better-sqlite3 (relational, foreign keys, WAL), zod validation |
| Auth | scrypt password hashes, random session tokens (stored hashed), httpOnly SameSite cookie, CSRF header, rate limits |
| Art | All pixel art is generated in code (`src/sprites`), no image assets except the trailer/poster |
| Audio | WebAudio synthesized SFX + optional generative chiptune (music is OFF by default, never autoplays) |

**The server is the only authority.** The browser can never send XP, damage, levels, cards, achievements or world
unlocks — it only says "start quest X" / "complete quest X". Rewards come from the database, equipped cards and streak;
duplicate/parallel completions are blocked by a unique constraint inside an immediate transaction.

Game content (quests, bosses, worlds, cards, achievements) lives in one file: `shared/content.ts`.
The schema is in `server/db.ts` (profiles, characters, quests, quest_completions, bosses, user_bosses, worlds,
user_world_progress, power_cards, user_power_cards, equipped_cards, companions, achievements, user_achievements,
user_settings, streaks, xp_transactions).

## Notes

- Database is SQLite (file at `DATABASE_PATH`) so the project runs with zero external setup. The schema is relational
  and each user's rows are isolated by `user_id` on every query, so moving to Supabase/Postgres is a data-layer swap
  (`server/db.ts`, `server/game/*`) — the API and frontend do not change.
- No social/Google login is included (it would need third-party credentials).
- `MIN_QUEST_SECONDS` (default 3) is the minimum time between starting and claiming a quest (anti-script guard).
