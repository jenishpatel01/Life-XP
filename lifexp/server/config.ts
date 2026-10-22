export const config = {
  port: Number(process.env.PORT ?? 8787),
  isProd: process.env.NODE_ENV === 'production',
  cookieSecure: process.env.COOKIE_SECURE === '1' || process.env.NODE_ENV === 'production' && process.env.COOKIE_SECURE !== '0',
  /** Proxy hops in front of the server (Render = 1; Vercel -> Render = 2) so req.ip is the real visitor. */
  trustProxy: Number(process.env.TRUST_PROXY ?? 1),
  authRateLimit: Number(process.env.AUTH_RATE_LIMIT ?? 40),
  /** Optional: send reset codes through Brevo's HTTP API. Without it the code is printed to the server log. */
  brevoApiKey: process.env.BREVO_API_KEY ?? '',
  /** Sender address; must be a verified sender in Brevo. */
  mailFromEmail: process.env.MAIL_FROM_EMAIL ?? '',
  mailFromName: process.env.MAIL_FROM_NAME ?? 'LIFE//XP',
};

export const minQuestSeconds = (): number => {
  const n = Number(process.env.MIN_QUEST_SECONDS ?? 3);
  return Number.isFinite(n) && n >= 0 ? n : 3;
};
