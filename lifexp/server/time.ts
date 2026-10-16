// Day boundaries are computed per-user in their own timezone, on the server.

export function isValidTimezone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

/** YYYY-MM-DD for `date` in `tz`. */
export function dayKey(tz: string, date: Date = new Date()): string {
  const safe = isValidTimezone(tz) ? tz : 'UTC';
  return new Intl.DateTimeFormat('en-CA', { timeZone: safe, year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
}

export function shiftDay(key: string, delta: number): string {
  const [y, m, d] = key.split('-').map(Number);
  const t = Date.UTC(y, m - 1, d) + delta * 86_400_000;
  return new Date(t).toISOString().slice(0, 10);
}

/** whole days from a to b (b - a) */
export function daysBetween(a: string, b: string): number {
  const [ay, am, ad] = a.split('-').map(Number);
  const [by, bm, bd] = b.split('-').map(Number);
  return Math.round((Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad)) / 86_400_000);
}
