// End-to-end QA of the seven core flows in a real browser (desktop + mobile).
// Run:  npm run build && node tests/e2e.mjs      (spawns its own server on a temp DB, serves ./dist)
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import { chromium } from 'playwright-core';

const PORT = 8898;
const BASE = `http://127.0.0.1:${PORT}`;
const DB = `/tmp/lifexp-e2e-${process.pid}.db`;
const SHOTS = process.env.SHOTS || '';
const env = { ...process.env, PORT: String(PORT), DATABASE_PATH: DB, MIN_QUEST_SECONDS: '2', AUTH_RATE_LIMIT: '1000' };
const srv = spawn(process.execPath, ['--import', 'tsx', 'server/index.ts'], { env, stdio: ['ignore', 'pipe', 'pipe'] });
srv.stderr.on('data', (d) => process.stderr.write(d));

let ok = 0, bad = 0;
const check = (name, cond, extra = '') => { if (cond) { ok++; console.log('  ✓', name); } else { bad++; console.log('  ✗', name, extra); } };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const errors = [];

async function waitServer() {
  for (let i = 0; i < 80; i++) { try { const r = await fetch(BASE + '/api/auth/me'); if (r.ok) return; } catch {} await sleep(150); }
  throw new Error('server did not start');
}

function track(page, label) {
  page.on('console', (m) => { if (m.type() === 'error') errors.push(`[${label}] console: ${m.text()}`); });
  page.on('pageerror', (e) => errors.push(`[${label}] pageerror: ${e.message}`));
}

async function register(page, name) {
  await page.goto(BASE + '/');
  await page.click('[data-testid=cta-start]');
  await page.waitForURL('**/auth?mode=register');
  await page.fill('#username', name); await page.fill('#email', `${name}@example.com`);
  await page.fill('#password', 'Sup3rSecret!x'); await page.fill('#confirmPassword', 'Sup3rSecret!x');
  await page.click('[data-testid=auth-submit]');
  await page.waitForURL('**/create');
}
async function createChar(page, name, cls = 'FOCUS') {
  await page.fill('[data-testid=char-name]', name);
  await page.click(`[data-testid=class-${cls}]`);
  await page.click('[data-testid=begin]');
  await page.waitForURL('**/app');
  await page.waitForSelector('[data-testid=home]');
}
/** Press space until the given scene element shows (or scenes are gone). */
async function advanceUntil(page, testid, tries = 40) {
  for (let i = 0; i < tries; i++) {
    if (await page.locator(`[data-testid=${testid}]`).isVisible().catch(() => false)) return true;
    if (!(await page.locator('[data-testid=scene]').count())) return false;
    await page.keyboard.press('Space');
    await sleep(350);
  }
  return false;
}
async function skipAll(page) {
  for (let i = 0; i < 6; i++) {
    const b = page.locator('[data-testid=skip-scenes]');
    if (await b.count()) { await b.first().click(); await sleep(200); } else break;
  }
  await page.waitForSelector('[data-testid=scene]', { state: 'detached', timeout: 5000 }).catch(() => undefined);
}
async function doQuest(page, id) {
  await page.click(`[data-testid="start-${id}"]`);
  await page.waitForSelector(`[data-testid="complete-${id}"]:not([disabled])`, { timeout: 15000 });
  await page.click(`[data-testid="complete-${id}"]`);
}
async function apiQuest(ctx, id) {
  const h = { 'X-LifeXP': '1' };
  const s = await ctx.request.post(`${BASE}/api/quests/${encodeURIComponent(id)}/start`, { headers: h });
  if (!s.ok()) throw new Error('start ' + id + ' ' + s.status());
  await sleep(2200);
  const c = await ctx.request.post(`${BASE}/api/quests/${encodeURIComponent(id)}/complete`, { headers: h });
  if (!c.ok()) throw new Error('complete ' + id + ' ' + c.status());
  return c.json();
}
const text = async (page, tid) => (await page.locator(`[data-testid=${tid}]`).first().innerText()).trim();
const noHScroll = (page) => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });

try {
  await waitServer();
  const shot = async (pg, n) => { if (SHOTS) await pg.screenshot({ path: `${SHOTS}/${n}.png` }); };

  // ───────────── FLOW 1: landing → register → character → dashboard ─────────────
  console.log('FLOW 1  landing → register → character → dashboard');
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage(); track(page, 'desktop');
  await page.goto(BASE + '/');
  check('landing renders hero', (await text(page, 'hero-title')).includes('YOUR QUESTS'));
  check('trailer section present', await page.locator('[data-testid=trailer]').isVisible());
  await page.locator('[data-testid=trailer]').scrollIntoViewIfNeeded();
  await page.click('[data-testid=trailer-play]');
  await page.waitForSelector('[data-testid=trailer-video]');
  await sleep(800);
  check('trailer video plays', await page.evaluate(() => { const v = document.querySelector('[data-testid=trailer-video]'); return !!v && v.readyState >= 2; }));
  await shot(page, 'trailer');
  await page.reload();
  // validation errors
  await page.click('[data-testid=cta-start]');
  await page.click('[data-testid=auth-submit]');
  check('empty register shows validation errors', (await page.locator('.field-error:not(:empty)').count()) >= 3);
  await page.fill('#username', 'hero_e2e'); await page.fill('#email', 'hero_e2e@example.com');
  await page.fill('#password', 'Sup3rSecret!x'); await page.fill('#confirmPassword', 'different-pass');
  await page.click('[data-testid=auth-submit]');
  check('password mismatch flagged', (await page.locator('#confirmPassword-err').innerText()).includes('match'));
  await page.fill('#confirmPassword', 'Sup3rSecret!x');
  await page.click('[data-testid=auth-submit]');
  await page.waitForURL('**/create');
  check('redirected to character creation', true);
  await page.goto(BASE + '/app');
  await page.waitForURL('**/create');
  check('/app without a character redirects to /create', true);
  await page.click('[data-testid=begin]');
  check('empty name rejected', (await page.locator('#char-name-err').innerText()).length > 0);
  await shot(page, 'create');
  await createChar(page, 'Jenish', 'FITNESS');
  check('dashboard shows level 1', (await text(page, 'hud-level')) === '1');
  check('class bonus visible on character page', await (async () => { await page.click('[data-testid=nav-character]'); await page.waitForSelector('[data-testid=attr-fitness]'); return (await text(page, 'attr-fitness')) === '8'; })());
  await page.click('[data-testid=nav-home]');
  check('starter boss shown', (await text(page, 'home-boss-name')).includes('PROCRASTINATION'));
  await shot(page, 'home');
  await page.goto(BASE + '/create');
  await page.waitForURL('**/app');
  check('/create with a character redirects to /app', true);

  // ───────────── FLOW 2 + 3: quest → XP animation → boss damage → DB, level-up ─────────────
  console.log('FLOW 2/3  quest → XP → boss damage → level-up');
  await page.click('[data-testid=nav-quests]');
  const Q1 = 'the-beginning:focus-mode';
  await doQuest(page, Q1);
  await page.waitForSelector('[data-testid=qc-xp]', { timeout: 8000 });
  check('achievement toast appeared (FIRST QUEST)', await page.locator('[data-testid=toast-achievement]').count() > 0);
  const xpText = await text(page, 'qc-xp');
  check('quest-complete scene shows XP', /\+\d+ XP/.test(xpText), xpText);
  await shot(page, 'quest-complete');
  check('boss-hit scene follows', await advanceUntil(page, 'bh-dmg'));
  await sleep(1200);
  await shot(page, 'boss-hit');
  check('level-up scene follows (100+ XP ≥ level 1 threshold)', await advanceUntil(page, 'lu-title'));
  await sleep(2200);
  await shot(page, 'level-up');
  await skipAll(page);
  check('HUD level is now 2', (await text(page, 'hud-level')) === '2');
  check('quest card shows done', await page.locator(`[data-testid="quest-${Q1}"]`).evaluate((e) => e.className.includes('done')));
  const hpApi = await (await ctx.request.get(`${BASE}/api/state`)).json();
  const proc = hpApi.worlds.find((w) => w.id === 'the-beginning').boss;
  check('boss HP reduced in the database', proc.hp < proc.maxHp && proc.hp > 0, JSON.stringify(proc));
  await page.click('[data-testid=nav-bosses]');
  await page.waitForSelector('[data-testid=boss-procrastination]');
  check('bosses page reflects reduced HP', (await text(page, 'boss-procrastination')).includes((proc.hp).toLocaleString()));
  // persistence across a hard reload
  await page.reload();
  await page.waitForSelector('[data-testid=hud]');
  check('level persists after reload', (await text(page, 'hud-level')) === '2');
  // double-submit protection: second completion of same quest in the same day is refused
  const dup = await ctx.request.post(`${BASE}/api/quests/${encodeURIComponent(Q1)}/complete`, { headers: { 'X-LifeXP': '1' } });
  check('duplicate completion rejected (no double XP)', dup.status() >= 400);

  // ───────────── FLOW 4: boss defeat ─────────────
  console.log('FLOW 4  boss defeat');
  for (const id of ['deep-work', 'morning-workout', 'read-10-pages', 'sleep-on-time', 'sketch-idea']) await apiQuest(ctx, `the-beginning:${id}`);
  await page.goto(BASE + '/app/quests');
  await page.waitForSelector('[data-testid="quest-the-beginning:complete-assignment"]');
  await doQuest(page, 'the-beginning:complete-assignment');
  await page.waitForSelector('[data-testid=scene]', { timeout: 8000 });
  check('BOSS DEFEATED scene shown', await advanceUntil(page, 'bd-title', 60));
  await sleep(1500);
  await shot(page, 'boss-defeated');
  // continue through remaining scenes looking for the world unlock
  const worldScene = await advanceUntil(page, 'wu-name', 60);
  if (worldScene) await shot(page, 'world-unlocked');
  await skipAll(page);
  const st4 = await (await ctx.request.get(`${BASE}/api/state`)).json();
  check('boss marked defeated in DB', st4.worlds[0].boss.status === 'defeated');
  check('Slayer-type achievements granted', st4.achievements.length >= 2, String(st4.achievements.length));
  check('boss reward card granted (Second Wind)', st4.cards.owned.some((c) => c.id === 'second-wind'));

  // ───────────── FLOW 5: world unlock ─────────────
  console.log('FLOW 5  world unlock');
  const lvl = st4.character.level;
  const forest = st4.worlds.find((w) => w.id === 'focus-forest');
  check(`Focus Forest unlock state matches rules (level ${lvl} ≥ 3 and boss down)`, forest.unlocked === (lvl >= 3), JSON.stringify(forest.blockers));
  await page.goto(BASE + '/app/world');
  await page.waitForSelector('[data-testid=world-focus-forest]');
  await page.click('[data-testid=world-discipline-city]');
  check('locked world shows requirements', await page.locator('[data-testid=world-locked]').isVisible());
  await shot(page, 'world');
  if (forest.unlocked) {
    await page.click('[data-testid=world-focus-forest]');
    await page.click('[data-testid=travel]');
    await page.waitForSelector('[data-testid=world-here]');
    check('can travel to unlocked world', true);
  } else {
    // push level via more quests on a second day is covered by API test; here verify the lock is real
    const res = await ctx.request.post(`${BASE}/api/worlds/focus-forest/select`, { headers: { 'X-LifeXP': '1' } });
    check('travel to still-locked world is refused', res.status() >= 400);
  }
  // cards
  await page.goto(BASE + '/app/cards');
  await page.click('[data-testid=card-second-wind]');
  await page.click('[data-testid=equip]');
  await page.waitForSelector('[data-testid=unequip]');
  check('card equips via UI', (await ctx.request.get(`${BASE}/api/state`).then((r) => r.json())).cards.equipped.includes('second-wind'));
  await page.keyboard.press('Escape');
  await shot(page, 'cards');
  for (const p of ['character', 'achievements', 'profile', 'settings', 'bosses']) { await page.goto(`${BASE}/app/${p}`); await page.waitForSelector(`[data-testid=${p}-page]`); }
  check('all in-app pages render', true);

  // settings persist
  await page.goto(BASE + '/app/settings');
  await page.click('[data-testid=set-anim-low]');
  await page.click('[data-testid=set-theme-void]');
  await sleep(500);
  const sSet = (await ctx.request.get(`${BASE}/api/state`).then((r) => r.json())).settings;
  check('settings saved to account', sSet.animation === 'low' && sSet.theme === 'void');
  await shot(page, 'settings');

  // ───────────── FLOW 6: logout / login persistence ─────────────
  console.log('FLOW 6  logout → login persistence');
  const before = await (await ctx.request.get(`${BASE}/api/state`)).json();
  await page.click('[data-testid=settings-logout]');
  await page.waitForURL(BASE + '/');
  const me = await (await ctx.request.get(`${BASE}/api/auth/me`)).json();
  check('session cleared on logout', me.user === null);
  await page.goto(BASE + '/app');
  await page.waitForURL('**/auth?mode=login');
  check('/app requires login', true);
  await page.fill('#email', 'wrong@example.com'); await page.fill('#password', 'nopenopenope');
  await page.click('[data-testid=auth-submit]');
  await page.waitForSelector('[data-testid=form-error]');
  check('bad login shows an error', true);
  await page.fill('#email', 'hero_e2e@example.com'); await page.fill('#password', 'Sup3rSecret!x');
  await page.click('[data-testid=auth-submit]');
  await page.waitForURL('**/app');
  await page.waitForSelector('[data-testid=hud]');
  const after = await (await ctx.request.get(`${BASE}/api/state`)).json();
  check('level/XP/cards/settings persist', after.character.level === before.character.level && after.stats.totalXp === before.stats.totalXp && after.cards.equipped.join() === before.cards.equipped.join() && after.settings.theme === 'void');
  check('HUD level matches after login', (await text(page, 'hud-level')) === String(before.character.level));
  check('dark Void theme applied on load', (await page.evaluate(() => document.documentElement.dataset.theme)) === 'void');
  check('no horizontal overflow on desktop dashboard', await noHScroll(page));

  // ───────────── FLOW 7: mobile ─────────────
  console.log('FLOW 7  mobile (390×844, touch)');
  const mctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const m = await mctx.newPage(); track(m, 'mobile');
  await m.goto(BASE + '/');
  check('mobile landing: no horizontal overflow', await noHScroll(m));
  await shot(m, 'm-landing');
  await register(m, 'mobilehero');
  check('mobile create: no horizontal overflow', await noHScroll(m));
  await shot(m, 'm-create');
  await createChar(m, 'Mobi', 'CREATIVE');
  check('bottom nav visible, sidebar hidden', (await m.locator('.bottom-nav').isVisible()) && !(await m.locator('.sidebar').isVisible()));
  check('mobile dashboard: no horizontal overflow', await noHScroll(m));
  await shot(m, 'm-home');
  await m.tap('[data-testid=bn-quests]');
  await m.waitForSelector('[data-testid=quests-page]');
  check('mobile quests: no horizontal overflow', await noHScroll(m));
  await m.tap(`[data-testid="start-${Q1}"]`);
  await m.waitForSelector(`[data-testid="complete-${Q1}"]:not([disabled])`, { timeout: 15000 });
  await m.tap(`[data-testid="complete-${Q1}"]`);
  await m.waitForSelector('[data-testid=qc-xp]');
  check('mobile quest completion scene', true);
  await sleep(700);
  await shot(m, 'm-quest-complete');
  await skipAll(m);
  check('mobile HUD updated', Number(await text(m, 'hud-level')) >= 2);
  await m.tap('[data-testid=bn-world]');
  await m.waitForSelector('[data-testid=world-page]');
  check('mobile world map: no horizontal overflow', await noHScroll(m));
  await shot(m, 'm-world');
  await m.tap('[data-testid=bn-more]');
  await m.tap('[data-testid=more-cards]');
  await m.waitForSelector('[data-testid=cards-page]');
  check('mobile cards: no horizontal overflow', await noHScroll(m));
  await shot(m, 'm-cards');
  for (const p of ['bosses', 'character', 'achievements', 'profile', 'settings']) { await m.goto(`${BASE}/app/${p}`); await m.waitForSelector(`[data-testid=${p}-page]`); if (!(await noHScroll(m))) check(`mobile ${p}: no horizontal overflow`, false); }
  check('mobile secondary pages: no horizontal overflow', true);

  // reduced motion is honoured
  const rctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, reducedMotion: 'reduce' });
  const rp = await rctx.newPage(); track(rp, 'reduced');
  await rp.goto(BASE + '/');
  check('prefers-reduced-motion switches the UI to reduced mode', (await rp.evaluate(() => document.documentElement.dataset.motion)) === 'reduced');
  check('reduced-motion landing renders', await rp.locator('[data-testid=hero-title]').isVisible());

  // ───────────── console health ─────────────
  console.log('CONSOLE');
  const real = errors.filter((e) => !/Failed to load resource.*(401|403|409|429)/.test(e));
  check('no console errors / page errors', real.length === 0, '\n    ' + real.join('\n    '));
} catch (e) {
  bad++; console.error('FATAL', e);
} finally {
  await browser.close();
  srv.kill();
  for (const f of [DB, DB + '-wal', DB + '-shm']) try { fs.unlinkSync(f); } catch {}
  console.log(`\n${ok} passed, ${bad} failed`);
  process.exit(bad ? 1 : 0);
}
