/** Spec §6: the backend is injected so tests run against a simulation and prod against Upstash. */
export interface LimitStore {
  /** Consumes one unit from the short sliding window; ok=false carries the reset hint in ms. */
  window(ip: string): Promise<{ ok: boolean; retryAfterMs?: number }>;
  /** INCR with a TTL applied on first hit; returns the new value. Throws ⇒ fail closed. */
  incr(key: string, ttlSeconds: number): Promise<number>;
}

export interface LimitCaps { dailyIp: number; dailyGlobal: number }
export type LimitOutcome = { ok: true } | { ok: false; retryAfterSec: number };

export const DAILY_IP_CAP = 30;
export const KEY_TTL_SECONDS = 48 * 3600; // spec §6: 48h expiry on daily keys
export const ipKey = (day: string, ip: string): string => `assistant:daily-ip:${day}:${ip}`;
export const globalKey = (day: string): string => `assistant:daily:${day}`;

export const dayKey = (now: number): string => new Date(now).toISOString().slice(0, 10);

export const secsToUtcMidnight = (now: number): number => {
  const msIntoDay = now % 86_400_000; // valid for positive epoch values
  return Math.max(1, Math.ceil((86_400_000 - msIntoDay) / 1000));
};

/** Spec §6 "IP": Vercel's header, else the first forwarded hop, else a shared bucket. */
export function clientIp(headers: Headers): string {
  const real = headers.get('x-real-ip')?.trim();
  if (real) return real;
  const first = headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  if (first) return first;
  return 'unknown';
}

/**
 * Spec §4 step 4. Order: short window → daily per IP → daily global.
 * Counting happens on every attempt that reaches it (an INCR can exceed a cap by
 * the concurrency in flight — bounded and harmless, since counters are per abuser
 * bucket or global). Any throw propagates: the handler maps it to 503 (fail closed).
 */
export async function checkLimits(
  ip: string,
  now: number,
  caps: LimitCaps,
  store: LimitStore,
): Promise<LimitOutcome> {
  const w = await store.window(ip);
  if (!w.ok) return { ok: false, retryAfterSec: Math.max(1, Math.ceil((w.retryAfterMs ?? 1000) / 1000)) };

  const day = dayKey(now);
  const perIp = await store.incr(ipKey(day, ip), KEY_TTL_SECONDS);
  if (perIp > caps.dailyIp) return { ok: false, retryAfterSec: secsToUtcMidnight(now) };

  const global = await store.incr(globalKey(day), KEY_TTL_SECONDS);
  if (global > caps.dailyGlobal) return { ok: false, retryAfterSec: secsToUtcMidnight(now) };

  return { ok: true };
}
