export const config = {
  port: Number(process.env.PORT ?? 8787),
  isProd: process.env.NODE_ENV === 'production',
  cookieSecure: process.env.COOKIE_SECURE === '1' || process.env.NODE_ENV === 'production' && process.env.COOKIE_SECURE !== '0',
  authRateLimit: Number(process.env.AUTH_RATE_LIMIT ?? 40),
};

export const minQuestSeconds = (): number => {
  const n = Number(process.env.MIN_QUEST_SECONDS ?? 3);
  return Number.isFinite(n) && n >= 0 ? n : 3;
};
