import { describe, expect, it } from 'vitest';
import {
  DAILY_IP_CAP, checkLimits, clientIp, dayKey, secsToUtcMidnight, type LimitStore,
} from '../../src/lib/assistant/limits';

const CAPS = { dailyIp: DAILY_IP_CAP, dailyGlobal: 200 };
const NOW = Date.UTC(2026, 8, 21, 12, 0, 0); // 2026-09-21T12:00:00Z

const fake = (over: Partial<LimitStore> = {}) => {
  const keys: string[] = [];
  const store: LimitStore = {
    window: over.window ?? (async () => ({ ok: true })),
    incr: over.incr ?? (async (key) => { keys.push(key); return 1; }),
  };
  return { store, keys };
};

describe('checkLimits', () => {
  it('passes when every store call allows', async () => {
    const { store, keys } = fake();
    expect(await checkLimits('1.2.3.4', NOW, CAPS, store)).toEqual({ ok: true });
    expect(keys).toEqual([
      `assistant:daily-ip:2026-09-21:1.2.3.4`,
      `assistant:daily:2026-09-21`,
    ]);
  });
  it('rejects when the short window rejects, with a whole-second retry-after', async () => {
    const { store, keys } = fake({ window: async () => ({ ok: false, retryAfterMs: 61_400 }) });
    const r = await checkLimits('ip', NOW, CAPS, store);
    expect(r).toEqual({ ok: false, retryAfterSec: 62 });
    expect(keys).toEqual([]); // no daily keys touched after a window rejection
  });
  it('defaults the window retry to 1s when the store omits it', async () => {
    const { store } = fake({ window: async () => ({ ok: false }) });
    expect(await checkLimits('ip', NOW, CAPS, store)).toEqual({ ok: false, retryAfterSec: 1 });
  });
  it('rejects the 31st message of the day per IP, retrying at the next UTC midnight', async () => {
    const { store, keys } = fake({ incr: async (key) => { keys.push(key); return key.includes('daily-ip') ? DAILY_IP_CAP + 1 : 1; } });
    const r = await checkLimits('ip', NOW, CAPS, store);
    expect(r).toEqual({ ok: false, retryAfterSec: secsToUtcMidnight(NOW) });
    expect(r.ok === false && r.retryAfterSec).toBe(12 * 3600); // noon → 12h to midnight
    expect(keys.some((k) => k === 'assistant:daily:2026-09-21')).toBe(false); // global untouched
  });
  it('rejects when the global cap is reached', async () => {
    const { store } = fake({ incr: async (key) => (key === 'assistant:daily:2026-09-21' ? 201 : 5) });
    expect(await checkLimits('ip', NOW, CAPS, store)).toEqual({ ok: false, retryAfterSec: 12 * 3600 });
  });
  it('allows exactly at the caps (per IP 30, global 200)', async () => {
    const { store } = fake({ incr: async (key) => (key.includes('daily-ip') ? 30 : 200) });
    expect(await checkLimits('ip', NOW, CAPS, store)).toEqual({ ok: true });
  });
  it('FAILS CLOSED when the store throws (window or incr)', async () => {
    const boom = fake({ window: async () => { throw new Error('redis down'); } });
    await expect(checkLimits('ip', NOW, CAPS, boom.store)).rejects.toThrow('redis down');
    const boom2 = fake({ incr: async () => { throw new Error('redis down'); } });
    await expect(checkLimits('ip', NOW, CAPS, boom2.store)).rejects.toThrow('redis down');
  });
  it('rolls the day key over exactly at UTC midnight', async () => {
    expect(dayKey(Date.UTC(2026, 8, 21, 23, 59, 59, 999))).toBe('2026-09-21');
    expect(dayKey(Date.UTC(2026, 8, 22, 0, 0, 0, 0))).toBe('2026-09-22');
    const keys: string[] = [];
    const store: LimitStore = { window: async () => ({ ok: true }), incr: async (k) => { keys.push(k); return 1; } };
    await checkLimits('9.9.9.9', Date.UTC(2026, 8, 21, 23, 59, 59), CAPS, store);
    expect(keys[0]).toContain('2026-09-21');
  });
  it('computes seconds to the next UTC midnight', () => {
    expect(secsToUtcMidnight(Date.UTC(2026, 8, 21, 0, 0, 1))).toBe(86_399);
    expect(secsToUtcMidnight(NOW)).toBe(43_200);
  });
});

describe('clientIp', () => {
  const h = (init: Record<string, string>) => new Headers(init);
  it('prefers x-real-ip', () => {
    expect(clientIp(h({ 'x-real-ip': '1.1.1.1', 'x-forwarded-for': '2.2.2.2, 3.3.3.3' }))).toBe('1.1.1.1');
  });
  it('falls back to the first x-forwarded-for value', () => {
    expect(clientIp(h({ 'x-forwarded-for': ' 2.2.2.2 , 3.3.3.3' }))).toBe('2.2.2.2');
  });
  it('falls back to a shared unknown bucket', () => {
    expect(clientIp(h({}))).toBe('unknown');
    expect(clientIp(h({ 'x-forwarded-for': '' }))).toBe('unknown');
  });
});
