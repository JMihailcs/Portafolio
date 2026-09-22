import { buildSystemPrompt } from '../../assistant/system-prompt';
import { isSameOrigin } from './origin';
import {
  checkLimits, clientIp, DAILY_IP_CAP, type LimitCaps, type LimitStore,
} from './limits';
import { SSE_HEADERS, sseDelta, sseDone, sseError } from './sse';
import { mergeTurns, validate, type ChatMessage } from './validate';

/** Thrown by the model adapter when `stop_reason === 'refusal'` (spec §6). */
export class ModelRefusal extends Error {}

export interface HandlerDeps {
  env: { enabled: boolean; hasApiKey: boolean; dailyCap: number };
  store: LimitStore;
  /** Yields text chunks; throws ModelRefusal on refusal, Error otherwise. */
  model: (args: { system: string; messages: ChatMessage[] }) => AsyncIterable<string>;
  now: () => number;
  /** Metadata-only logger (spec §7): status, ms, usage, limit reason. Never content or IP. */
  log?: (entry: Record<string, unknown>) => void;
}

const json = (status: number, error: string, extra: Record<string, string> = {}): Response =>
  new Response(JSON.stringify({ error }), {
    status,
    headers: { 'content-type': 'application/json', ...extra },
  });

/**
 * Spec §4 pipeline: switch → origin → validation → limits → model → SSE.
 * Pure orchestration: every dependency is injected, so the whole contract is
 * testable without network (tests/assistant/handler.test.ts).
 */
export async function handleChat(request: Request, deps: HandlerDeps): Promise<Response> {
  const t0 = deps.now();
  const finish = (status: number, extra: Record<string, unknown> = {}): void => {
    deps.log?.({ status, ms: Math.max(0, deps.now() - t0), ...extra });
  };

  // 1. Switch (spec §2: the widget stays visible; off ⇒ 503 disabled).
  if (!deps.env.enabled) { finish(503, { code: 'disabled' }); return json(503, 'disabled'); }

  // 2. Same-origin only.
  if (!isSameOrigin(request.headers, request.url)) { finish(403, { code: 'forbidden' }); return json(403, 'forbidden'); }

  // 3. Validation (reads the body only after the origin gate).
  const raw = await request.text(); // bounded by the platform (~4.5 MB) before our 16 KB rule rejects it
  const parsed = validate(raw);
  if (!parsed) { finish(400, { code: 'invalid' }); return json(400, 'invalid'); }

  // 4. Limits — any store throw becomes 503 (fail closed, no model call).
  const caps: LimitCaps = { dailyIp: DAILY_IP_CAP, dailyGlobal: deps.env.dailyCap };
  let outcome;
  try {
    outcome = await checkLimits(clientIp(request.headers), deps.now(), caps, deps.store);
  } catch {
    finish(503, { code: 'unavailable', reason: 'store' });
    return json(503, 'unavailable');
  }
  if (!outcome.ok) {
    finish(429, { code: 'rate_limited' });
    return json(429, 'rate_limited', { 'retry-after': String(outcome.retryAfterSec) });
  }

  // 5. Model availability, then stream.
  if (!deps.env.hasApiKey) { finish(503, { code: 'unavailable', reason: 'api_key' }); return json(503, 'unavailable'); }

  const system = buildSystemPrompt(parsed.lang);
  const messages = mergeTurns(parsed.messages);
  const encoder = new TextEncoder();
  let closed = false;
  const closeOnce = (controller: ReadableStreamDefaultController<Uint8Array>): void => {
    if (closed) return;
    closed = true;
    try { controller.close(); } catch { /* client already gone */ }
  };

  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const text of deps.model({ system, messages })) {
          controller.enqueue(encoder.encode(sseDelta(text)));
        }
        controller.enqueue(encoder.encode(sseDone()));
        finish(200, { stream: 'done' });
      } catch (err) {
        const code = err instanceof ModelRefusal ? 'refusal' : 'unavailable';
        try { controller.enqueue(encoder.encode(sseError(code))); } catch { /* client gone */ }
        finish(200, { stream: 'error', code });
      }
      closeOnce(controller);
    },
  });

  return new Response(body, { status: 200, headers: SSE_HEADERS });
}
