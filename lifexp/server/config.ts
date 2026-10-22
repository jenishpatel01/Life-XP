export const config = {
  port: Number(process.env.PORT ?? 8787),
  isProd: process.env.NODE_ENV === 'production',
  cookieSecure: process.env.COOKIE_SECURE === '1' || process.env.NODE_ENV === 'production' && process.env.COOKIE_SECURE !== '0',
  authRateLimit: Number(process.env.AUTH_RATE_LIMIT ?? 40),
  /** Public origin used in password-reset links. */
  appUrl: (process.env.APP_URL ?? 'http://localhost:5173').replace(/\/+$/, ''),
  /** Optional: send reset e-mails through Resend. Without it the link is printed to the server log. */
  resendApiKey: process.env.RESEND_API_KEY ?? '',
  mailFrom: process.env.MAIL_FROM ?? 'LIFE//XP <onboarding@resend.dev>',
};

export const minQuestSeconds = (): number => {
  const n = Number(process.env.MIN_QUEST_SECONDS ?? 3);
  return Number.isFinite(n) && n >= 0 ? n : 3;
};
