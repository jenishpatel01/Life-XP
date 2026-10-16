import crypto from 'node:crypto';
import { promisify } from 'node:util';
import type { NextFunction, Request, Response } from 'express';
import { Router } from 'express';
import { z } from 'zod';
import { db } from './db.ts';
import { config } from './config.ts';
import { AppError, conflict, unauthorized } from './errors.ts';
import { isValidTimezone } from './time.ts';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      userId?: number;
    }
  }
}

const scrypt = promisify(crypto.scrypt) as (pw: string, salt: Buffer, len: number) => Promise<Buffer>;
const COOKIE = 'lxp_session';
const SESSION_DAYS = 30;

async function hashPassword(pw: string): Promise<string> {
  const salt = crypto.randomBytes(16);
  const hash = await scrypt(pw, salt, 64);
  return `scrypt$${salt.toString('base64')}$${hash.toString('base64')}`;
}

// Used so unknown e-mails cost the same time as wrong passwords.
const DUMMY_HASH_PROMISE = hashPassword('lifexp-dummy-password');

async function verifyPassword(pw: string, stored: string): Promise<boolean> {
  const [scheme, saltB64, hashB64] = stored.split('$');
  if (scheme !== 'scrypt' || !saltB64 || !hashB64) return false;
  const expected = Buffer.from(hashB64, 'base64');
  const actual = await scrypt(pw, Buffer.from(saltB64, 'base64'), expected.length);
  return crypto.timingSafeEqual(expected, actual);
}

const sha256 = (s: string) => crypto.createHash('sha256').update(s).digest('hex');

function setSessionCookie(res: Response, token: string) {
  res.cookie(COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.cookieSecure,
    maxAge: SESSION_DAYS * 86_400_000,
    path: '/',
  });
}

function createSession(req: Request, res: Response, userId: number) {
  const token = crypto.randomBytes(32).toString('base64url');
  const expires = new Date(Date.now() + SESSION_DAYS * 86_400_000).toISOString();
  db.prepare('INSERT INTO sessions (id, user_id, expires_at, user_agent) VALUES (?, ?, ?, ?)').run(
    sha256(token), userId, expires, String(req.headers['user-agent'] ?? '').slice(0, 200),
  );
  setSessionCookie(res, token);
}

/** Resolves the session cookie to a user id (or undefined). */
export function resolveSession(req: Request): number | undefined {
  const token = req.cookies?.[COOKIE];
  if (typeof token !== 'string' || token.length < 20 || token.length > 200) return undefined;
  const row = db.prepare('SELECT user_id, expires_at FROM sessions WHERE id = ?').get(sha256(token)) as { user_id: number; expires_at: string } | undefined;
  if (!row) return undefined;
  if (new Date(row.expires_at).getTime() < Date.now()) {
    db.prepare('DELETE FROM sessions WHERE id = ?').run(sha256(token));
    return undefined;
  }
  return row.user_id;
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const uid = resolveSession(req);
  if (!uid) return next(unauthorized());
  req.userId = uid;
  next();
}

/** Mutating requests must carry a custom header: cross-site forms/fetches can't set it without a CORS preflight we never grant. */
export function csrfGuard(req: Request, _res: Response, next: NextFunction) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  if (req.headers['x-lifexp'] !== '1') return next(new AppError(403, 'CSRF', 'Missing request header.'));
  next();
}

const registerSchema = z
  .object({
    username: z.string().trim().min(3, 'Username must be at least 3 characters.').max(20, 'Username can be at most 20 characters.').regex(/^[A-Za-z0-9_]+$/, 'Use letters, numbers and underscores only.'),
    email: z.string().trim().toLowerCase().email('Enter a valid email address.').max(254),
    password: z.string().min(8, 'Password must be at least 8 characters.').max(128),
    confirmPassword: z.string(),
    timezone: z.string().max(64).optional(),
  })
  .refine((d) => d.password === d.confirmPassword, { message: 'Passwords do not match.', path: ['confirmPassword'] });

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(1).max(128),
});

export const authRouter = Router();

authRouter.post('/register', async (req, res, next) => {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      const fields: Record<string, string> = {};
      for (const i of parsed.error.issues) fields[String(i.path[0] ?? 'form')] ??= i.message;
      throw new AppError(400, 'VALIDATION', Object.values(fields)[0] ?? 'Check your details.', { fields });
    }
    const { username, email, password, timezone } = parsed.data;
    if (db.prepare('SELECT 1 FROM users WHERE email = ?').get(email)) {
      throw conflict('EMAIL_TAKEN', 'An account with that email already exists.', { fields: { email: 'An account with that email already exists.' } });
    }
    if (db.prepare('SELECT 1 FROM profiles WHERE username = ?').get(username)) {
      throw conflict('USERNAME_TAKEN', 'That username is taken.', { fields: { username: 'That username is taken.' } });
    }
    const hash = await hashPassword(password);
    const tz = timezone && isValidTimezone(timezone) ? timezone : 'UTC';
    const userId = db.transaction(() => {
      const id = Number(db.prepare('INSERT INTO users (email, password_hash) VALUES (?, ?)').run(email, hash).lastInsertRowid);
      db.prepare('INSERT INTO profiles (user_id, username) VALUES (?, ?)').run(id, username);
      db.prepare('INSERT INTO user_settings (user_id, timezone) VALUES (?, ?)').run(id, tz);
      return id;
    })();
    createSession(req, res, userId);
    res.status(201).json({ ok: true });
  } catch (e) {
    next(e);
  }
});

authRouter.post('/login', async (req, res, next) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) throw new AppError(400, 'VALIDATION', 'Enter your email and password.');
    const { email, password } = parsed.data;
    const row = db.prepare('SELECT id, password_hash FROM users WHERE email = ?').get(email) as { id: number; password_hash: string } | undefined;
    const ok = await verifyPassword(password, row?.password_hash ?? (await DUMMY_HASH_PROMISE));
    if (!row || !ok) throw new AppError(401, 'BAD_CREDENTIALS', 'Wrong email or password.');
    createSession(req, res, row.id);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

authRouter.post('/logout', (req, res) => {
  const token = req.cookies?.[COOKIE];
  if (typeof token === 'string') db.prepare('DELETE FROM sessions WHERE id = ?').run(sha256(token));
  res.clearCookie(COOKIE, { path: '/' });
  res.json({ ok: true });
});

authRouter.get('/me', (req, res) => {
  const uid = resolveSession(req);
  if (!uid) return res.json({ user: null });
  const u = db.prepare('SELECT p.username, u.email FROM users u JOIN profiles p ON p.user_id = u.id WHERE u.id = ?').get(uid) as { username: string; email: string };
  res.json({ user: u });
});
