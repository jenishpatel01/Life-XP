import express, { type NextFunction, type Request, type Response } from 'express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { migrate } from './db.ts';
import { config } from './config.ts';
import { AppError } from './errors.ts';
import { authRouter, csrfGuard, requireAuth } from './auth.ts';
import { gameRouter } from './routes/game.ts';

migrate();

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1);

app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: false,
      directives: {
        'default-src': ["'self'"],
        'script-src': ["'self'"],
        'style-src': ["'self'", "'unsafe-inline'"], // React style="" attributes
        'img-src': ["'self'", 'data:', 'blob:'],
        'media-src': ["'self'", 'blob:'],
        'font-src': ["'self'", 'data:'],
        'connect-src': ["'self'"],
        'object-src': ["'none'"],
        'base-uri': ["'self'"],
        'frame-ancestors': ["'none'"],
        'form-action': ["'self'"],
      },
    },
    crossOriginEmbedderPolicy: false,
    // Vite dev server serves the page over http on another port — HSTS only makes sense in prod
    strictTransportSecurity: config.isProd,
  }),
);
app.use(compression());
app.use(express.json({ limit: '20kb' }));
app.use(cookieParser());

const here = path.dirname(fileURLToPath(import.meta.url));
const dist = path.resolve(here, '../dist');

app.use('/api', csrfGuard);
app.use(['/api/auth/login', '/api/auth/register'], rateLimit({ windowMs: 15 * 60_000, limit: config.authRateLimit, standardHeaders: 'draft-7', legacyHeaders: false, message: { error: { code: 'RATE_LIMITED', message: 'Too many attempts. Try again in a few minutes.' } } }));
app.use('/api/auth', authRouter);
app.use('/api', requireAuth, rateLimit({ windowMs: 60_000, limit: 240, standardHeaders: 'draft-7', legacyHeaders: false }), gameRouter);
app.use('/api', (_req, res) => res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Unknown endpoint.' } }));

if (fs.existsSync(dist)) {
  app.use('/assets', express.static(path.join(dist, 'assets'), { immutable: true, maxAge: '1y' }));
  app.use('/media', express.static(path.join(dist, 'media'), { maxAge: '7d' }));
  app.use(express.static(dist, { maxAge: '1h', index: false }));
  app.get(/^(?!\/api).*/, (_req, res) => res.sendFile(path.join(dist, 'index.html')));
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof AppError) {
    return res.status(err.status).json({ error: { code: err.code, message: err.message, details: err.details } });
  }
  if (err && typeof err === 'object' && 'type' in err && (err as { type: string }).type === 'entity.parse.failed') {
    return res.status(400).json({ error: { code: 'BAD_JSON', message: 'Malformed request body.' } });
  }
  console.error('[lifexp] unhandled error', err);
  res.status(500).json({ error: { code: 'INTERNAL', message: 'Something went wrong on our side. Please try again.' } });
});

app.listen(config.port, () => {
  console.log(`[lifexp] API listening on http://localhost:${config.port}${fs.existsSync(dist) ? ' (serving built app)' : ''}`);
});
