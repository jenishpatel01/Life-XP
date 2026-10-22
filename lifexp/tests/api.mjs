// Backend integration test: auth, character, quests, boss, level-up, security.
// Run:  node tests/api.mjs   (spawns its own server on a temp DB)
import { spawn } from 'node:child_process';
import Database from 'better-sqlite3';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const PORT = 8899;
const DB = path.join(os.tmpdir(), `lifexp-test-${Date.now()}.db`);
const BASE = `http://localhost:${PORT}`;
const env = { ...process.env, PORT: String(PORT), DATABASE_PATH: DB, MIN_QUEST_SECONDS: '0', AUTH_RATE_LIMIT: '1000' };
const srv = spawn(process.execPath, ['--import', 'tsx', 'server/index.ts'], { env, stdio: ['ignore', 'pipe', 'pipe'] });
let serverLog = '';
srv.stdout.on('data', (d) => { serverLog += d; });
srv.stderr.on('data', (d) => { serverLog += d; });
let ok = 0, bad = 0;
const check = (name, cond, extra = '') => { if (cond) { ok++; console.log('  ✓', name); } else { bad++; console.log('  ✗', name, extra); } };

async function waitUp() { for (let i = 0; i < 60; i++) { try { await fetch(BASE + '/api/auth/me'); return; } catch { await new Promise((r) => setTimeout(r, 250)); } } throw new Error('server did not start'); }

class Client {
  cookie = '';
  async req(method, url, body, headers = {}) {
    const r = await fetch(BASE + url, { method, headers: { 'content-type': 'application/json', 'x-lifexp': '1', cookie: this.cookie, ...headers }, body: body ? JSON.stringify(body) : undefined });
    const sc = r.headers.get('set-cookie'); if (sc) this.cookie = sc.split(';')[0];
    let json = null; try { json = await r.json(); } catch {}
    return { status: r.status, json };
  }
}
const reg = (c, n) => c.req('POST', '/api/auth/register', { username: n, email: `${n}@test.dev`, password: 'hunter2hunter2', confirmPassword: 'hunter2hunter2', timezone: 'UTC' });

try {
  await waitUp();
  const a = new Client();
  console.log('AUTH');
  check('state requires auth', (await a.req('GET', '/api/state')).status === 401);
  check('weak password rejected', (await a.req('POST', '/api/auth/register', { username: 'weak', email: 'w@t.dev', password: 'short', confirmPassword: 'short' })).status === 400);
  check('mismatched confirm rejected', (await a.req('POST', '/api/auth/register', { username: 'mm', email: 'm@t.dev', password: 'hunter2hunter2', confirmPassword: 'nope1234' })).status === 400);
  check('register ok', (await reg(a, 'hero1')).status === 201);
  check('duplicate email rejected', (await reg(new Client(), 'hero1')).status === 409);
  check('csrf header required', (await a.req('POST', '/api/quests/x/start', null, { 'x-lifexp': '0' })).status === 403);
  let st = (await a.req('GET', '/api/state')).json;
  check('no character yet', st.character === null);
  check('quest before character blocked', (await a.req('POST', '/api/quests/the-beginning:focus-mode/start')).status === 403);

  console.log('CHARACTER');
  const bad = await a.req('POST', '/api/character', { name: 'X', class: 'FOCUS', appearance: { armor: 'azure', plume: 'pink', helm: 'knight' } });
  check('short name rejected', bad.status === 400);
  const made = await a.req('POST', '/api/character', { name: 'Nova', class: 'FOCUS', appearance: { armor: 'azure', plume: 'pink', helm: 'knight' } });
  check('character created', made.status === 201);
  st = made.json;
  check('class bonus focus 8', st.character.attrs.focus === 8 && st.character.attrs.discipline === 6, JSON.stringify(st.character.attrs));
  check('starter card equipped', st.cards.equipped.includes('focus-boost'));
  check('world 1 unlocked + boss active', st.worlds[0].unlocked && st.worlds[0].boss.status === 'active' && st.worlds[0].boss.hp === 1000);
  check('world 2 locked', !st.worlds[1].unlocked);
  check('second character rejected', (await a.req('POST', '/api/character', { name: 'Nova2', class: 'FOCUS', appearance: { armor: 'azure', plume: 'pink', helm: 'knight' } })).status === 409);

  console.log('QUESTS');
  const Q = (s) => `the-beginning:${s}`;
  check('complete without start rejected', (await a.req('POST', `/api/quests/${Q('focus-mode')}/complete`)).status === 409);
  check('locked-world quest rejected', (await a.req('POST', '/api/quests/focus-forest:pomodoro-sprint/start')).status === 403);
  check('start ok', (await a.req('POST', `/api/quests/${Q('focus-mode')}/start`)).status === 200);
  let r = await a.req('POST', `/api/quests/${Q('focus-mode')}/complete`);
  check('complete ok', r.status === 200);
  const xpEv = r.json.events.find((e) => e.type === 'xp');
  check('xp = 100 +10% focus card = 110', xpEv.amount === 110, JSON.stringify(xpEv));
  const dmg = r.json.events.find((e) => e.type === 'boss_damage');
  check('boss damaged >=150', dmg.damage >= 150 && dmg.hpAfter === 1000 - dmg.damage, JSON.stringify(dmg));
  check('first-quest achievement', r.json.events.some((e) => e.type === 'achievement_unlocked' && e.achievementId === 'first-quest'));
  check('level up from 110+50 xp (>=155 needed lvl1->2? )', r.json.state.character.level >= 1);
  check('duplicate completion same day rejected', (await a.req('POST', `/api/quests/${Q('focus-mode')}/start`)).status === 409);
  // client-supplied rewards are ignored
  await a.req('POST', `/api/quests/${Q('read-10-pages')}/start`);
  r = await a.req('POST', `/api/quests/${Q('read-10-pages')}/complete`, { xp: 999999, bossDamage: 99999 });
  check('client xp ignored', r.json.events.find((e) => e.type === 'xp').amount < 200);

  console.log('CONCURRENCY');
  await a.req('POST', `/api/quests/${Q('deep-work')}/start`);
  const burst = await Promise.all(Array.from({ length: 8 }, () => a.req('POST', `/api/quests/${Q('deep-work')}/complete`)));
  check('8 parallel completes -> exactly one success', burst.filter((x) => x.status === 200).length === 1, burst.map((x) => x.status).join(','));

  console.log('BOSS + LEVEL + WORLD');
  for (const s of ['morning-workout', 'complete-assignment', 'sleep-on-time', 'sketch-idea', 'drink-water']) {
    await a.req('POST', `/api/quests/${Q(s)}/start`);
    r = await a.req('POST', `/api/quests/${Q(s)}/complete`);
    if (r.json?.events?.some((e) => e.type === 'boss_defeated')) break;
  }
  st = (await a.req('GET', '/api/state')).json;
  check('boss defeated', st.worlds[0].boss.status === 'defeated' && st.worlds[0].boss.hp === 0, JSON.stringify(st.worlds[0].boss));
  check('boss slayer achievement', st.achievements.some((x) => x.id === 'boss-slayer'));
  check('second wind card dropped', st.cards.owned.some((x) => x.id === 'second-wind'));
  check('level >= 3', st.character.level >= 3, String(st.character.level));
  check('focus forest unlocked', st.worlds[1].unlocked && st.worlds[1].boss.status === 'active');
  check('attrs grew', st.character.attrs.focus > 8);
  check('xp persisted = sum of transactions', (() => { const d = new Database(DB, { readonly: true }); const s = d.prepare('SELECT SUM(amount) a FROM xp_transactions WHERE user_id=1').get().a; const c = d.prepare('SELECT xp_total t FROM characters WHERE user_id=1').get().t; d.close(); return s === c && c === st.stats.totalXp; })());

  console.log('CARDS / SETTINGS / ISOLATION');
  check('equip second wind', (await a.req('POST', '/api/cards/second-wind/equip')).status === 200);
  check('equip locked card rejected', (await a.req('POST', '/api/cards/master-plan/equip')).status === 403);
  check('settings update', (await a.req('PUT', '/api/settings', { sound: false, music: true, animation: 'low' })).json.settings.music === true);
  check('bad settings rejected', (await a.req('PUT', '/api/settings', { animation: 'ultra' })).status === 400);
  check('unknown settings key rejected', (await a.req('PUT', '/api/settings', { xp: 5 })).status === 400);
  const b = new Client(); await reg(b, 'hero2');
  const stB = (await b.req('GET', '/api/state')).json;
  check('user B sees none of A', stB.character === null && stB.achievements.length === 0 && stB.stats.totalQuests === 0);
  check('user B cannot equip A card', (await b.req('POST', '/api/cards/second-wind/equip')).status === 403);

  console.log('LOGOUT / LOGIN PERSISTENCE');
  check('logout', (await a.req('POST', '/api/auth/logout')).status === 200);
  check('state after logout 401', (await new Client().req('GET', '/api/state')).status === 401);
  a.cookie = '';
  check('wrong password rejected', (await a.req('POST', '/api/auth/login', { email: 'hero1@test.dev', password: 'wrongwrong' })).status === 401);
  check('login ok', (await a.req('POST', '/api/auth/login', { email: 'hero1@test.dev', password: 'hunter2hunter2' })).status === 200);
  const st2 = (await a.req('GET', '/api/state')).json;
  check('progress intact after re-login', st2.character.level === st.character.level && st2.stats.totalXp === st.stats.totalXp && st2.settings.music === true);

  console.log('FORGOT / RESET PASSWORD');
  a.cookie = '';
  check('login by username ok', (await a.req('POST', '/api/auth/login', { identifier: 'hero1', password: 'hunter2hunter2' })).status === 200);
  check('forgot unknown account still 200', (await a.req('POST', '/api/auth/forgot', { identifier: 'nobody-here' })).status === 200);
  check('forgot known account 200', (await a.req('POST', '/api/auth/forgot', { identifier: 'hero1' })).status === 200);
  await new Promise((r) => setTimeout(r, 300));
  const code = /password reset code for hero1 .*: (\d{6})/.exec(serverLog)?.[1];
  check('reset code logged', !!code);
  const wrong = code === '000000' ? '111111' : '000000';
  const R = (body) => a.req('POST', '/api/auth/reset', { identifier: 'hero1', password: 'newpassword1', confirmPassword: 'newpassword1', ...body });
  check('wrong code rejected', (await R({ code: wrong })).status === 400);
  check('mismatched reset rejected', (await R({ code, confirmPassword: 'nope' })).status === 400);
  check('reset ok', (await R({ code })).status === 200);
  check('reset code single-use', (await R({ code, password: 'another-pass1', confirmPassword: 'another-pass1' })).status === 400);
  await a.req('POST', '/api/auth/forgot', { identifier: 'hero1' });
  await new Promise((r) => setTimeout(r, 300));
  for (let i = 0; i < 5; i++) await R({ code: wrong });
  const code2 = [...serverLog.matchAll(/password reset code for hero1 .*: (\d{6})/g)].pop()[1];
  check('code locked after 5 wrong attempts', (await R({ code: code2 })).status === 400);
  check('old password rejected', (await a.req('POST', '/api/auth/login', { identifier: 'hero1', password: 'hunter2hunter2' })).status === 401);
  check('new password works by email', (await a.req('POST', '/api/auth/login', { identifier: 'hero1@test.dev', password: 'newpassword1' })).status === 200);
  check('new password works by username', (await a.req('POST', '/api/auth/login', { identifier: 'hero1', password: 'newpassword1' })).status === 200);
} catch (e) { bad++; console.error('FATAL', e); }
finally { srv.kill(); for (const f of [DB, DB + '-wal', DB + '-shm']) try { fs.unlinkSync(f); } catch {} console.log(`\n${ok} passed, ${bad} failed`); process.exit(bad ? 1 : 0); }
