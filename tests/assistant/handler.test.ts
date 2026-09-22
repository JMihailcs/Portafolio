import { describe, expect, it, vi } from 'vitest';
import {
  handleChat, ModelRefusal, type HandlerDeps,
} from '../../src/lib/assistant/handler';
import type { LimitStore } from '../../src/lib/assistant/limits';

const URL_ = 'https://portafolio.test/api/chat';
const NOW = Date.UTC(2026, 8, 21, 12, 0, 0);

const okStore: LimitStore = { window: async () => ({ ok: true }), incr: async () => 1 };

const post = (body: unknown, init: Record<string, string> = { origin: 'https://portafolio.test' }): Request =>
  new Request(URL_, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...init },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });

const valid = { lang: 'es', messages: [{ role: 'user', content: '¿Quién es Johan?' }] };

const chunks = (...texts: string[]) => (async function* () { for (const t of texts) yield t; })();

const deps = (over: Partial<HandlerDeps> = {}): HandlerDeps => ({
  env: { enabled: true, hasApiKey: true, dailyCap: 200 },
  store: okStore,
  model: () => chunks('Hola ', 'mundo'),
  now: () => NOW,
  ...over,
});

describe('handleChat — guards, in spec order', () => {
  it('503 disabled when the switch is off, before any other check', async () => {
    const res = await handleChat(post(valid, {}), deps({ env: { enabled: false, hasApiKey: true, dailyCap: 200 } }));
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ error: 'disabled' });
  });
  it('403 forbidden for a cross-site origin', async () => {
    const res = await handleChat(post(valid, { origin: 'https://evil.test' }), deps());
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ error: 'forbidden' });
  });
  it('403 forbidden with no origin headers at all', async () => {
    const res = await handleChat(post(valid, {}), deps());
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ error: 'forbidden' });
  });
  it('400 invalid for a body that fails validation', async () => {
    const res = await handleChat(post({ lang: 'es', messages: [] }), deps());
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: 'invalid' });
  });
  it('429 rate_limited with Retry-After when the window rejects', async () => {
    const store: LimitStore = { window: async () => ({ ok: false, retryAfterMs: 9000 }), incr: async () => 1 };
    const res = await handleChat(post(valid), deps({ store }));
    expect(res.status).toBe(429);
    expect(res.headers.get('retry-after')).toBe('9');
    expect(await res.json()).toEqual({ error: 'rate_limited' });
  });
  it('429 with Retry-After when the daily per-IP cap is exceeded', async () => {
    const store: LimitStore = { window: async () => ({ ok: true }), incr: async (k) => (k.includes('daily-ip:') ? 31 : 1) };
    const res = await handleChat(post(valid), deps({ store }));
    expect(res.status).toBe(429);
    expect(Number(res.headers.get('retry-after'))).toBeGreaterThan(0);
    expect(await res.json()).toEqual({ error: 'rate_limited' });
  });
  it('503 unavailable when the store throws (fail closed, no model call)', async () => {
    const model = vi.fn(() => chunks('x'));
    const store: LimitStore = { window: async () => { throw new Error('down'); }, incr: async () => 1 };
    const res = await handleChat(post(valid), deps({ store, model }));
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ error: 'unavailable' });
    expect(model).not.toHaveBeenCalled();
  });
  it('503 unavailable when the API key is missing (after limits)', async () => {
    const model = vi.fn(() => chunks('x'));
    const res = await handleChat(post(valid), deps({ env: { enabled: true, hasApiKey: false, dailyCap: 200 }, model }));
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ error: 'unavailable' });
    expect(model).not.toHaveBeenCalled();
  });
});

describe('handleChat — happy path and stream', () => {
  it('streams deltas then done with the SSE headers', async () => {
    const res = await handleChat(post(valid), deps());
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('text/event-stream');
    expect(res.headers.get('cache-control')).toBe('no-cache');
    expect(await res.text()).toBe(
      'data: {"type":"delta","text":"Hola "}\n\n' +
      'data: {"type":"delta","text":"mundo"}\n\n' +
      'data: {"type":"done"}\n\n',
    );
  });
  it('passes the built system prompt and validated messages to the model', async () => {
    const model = vi.fn(() => chunks('ok'));
    await handleChat(post(valid), deps({ model }));
    expect(model).toHaveBeenCalledTimes(1);
    const args = model.mock.calls[0][0];
    expect(args.system).toContain('Reglas del asistente');
    expect(args.messages).toEqual([{ role: 'user', content: '¿Quién es Johan?' }]);
  });
  it('merges consecutive user turns before calling the model', async () => {
    const model = vi.fn(() => chunks('ok'));
    const body = { lang: 'es', messages: [{ role: 'user', content: 'hola' }, { role: 'user', content: 'de nuevo' }] };
    await handleChat(post(body), deps({ model }));
    expect((model.mock.calls[0][0]).messages).toEqual([{ role: 'user', content: 'hola\n\nde nuevo' }]);
  });
  it('emits error unavailable when the model fails mid-stream (after some deltas)', async () => {
    const model = () => (async function* () { yield 'parcial'; throw new Error('socket reset'); })();
    const res = await handleChat(post(valid), deps({ model }));
    expect(res.status).toBe(200); // headers already sent
    expect(await res.text()).toBe(
      'data: {"type":"delta","text":"parcial"}\n\ndata: {"type":"error","code":"unavailable"}\n\n',
    );
  });
  it('emits error refusal when the model refuses, never done', async () => {
    const model = () => (async function* () { throw new ModelRefusal('refusal'); })();
    const res = await handleChat(post(valid), deps({ model }));
    expect(await res.text()).toBe('data: {"type":"error","code":"refusal"}\n\n');
  });
  it('logs metadata only — no message content, no IP', async () => {
    const log = vi.fn();
    const body = { lang: 'es', messages: [{ role: 'user', content: 'SECRETO-SALARIO-999' }] };
    const res = await handleChat(post(body), deps({ log }));
    await res.text(); // drain so the terminal log fires
    const dump = JSON.stringify(log.mock.calls);
    expect(dump).not.toContain('SECRETO-SALARIO-999');
    expect(dump).not.toContain('1.2.3.4');
    expect(log).toHaveBeenCalled();
    expect(log.mock.calls.at(-1)[0]).toHaveProperty('status', 200);
    expect(log.mock.calls.at(-1)[0]).toHaveProperty('ms');
  });
});
