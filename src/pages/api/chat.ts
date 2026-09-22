import type { APIRoute } from 'astro';
import Anthropic from '@anthropic-ai/sdk';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { handleChat, ModelRefusal } from '../../lib/assistant/handler';
import type { LimitStore } from '../../lib/assistant/limits';

export const prerender = false; // the only non-static route (spec §4)

const MODEL = 'claude-haiku-4-5';
const WINDOW = { messages: 8, per: '10 m' } as const; // spec §6: 8 msgs / 10 min per IP

/** Fail closed: a missing store config yields a store that always throws (spec §4). */
function makeStore(): LimitStore {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    const absent = (): Promise<never> => Promise.reject(new Error('upstash not configured'));
    return { window: absent, incr: absent };
  }
  const redis = new Redis({ url, token });
  const ratelimit = new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(WINDOW.messages, WINDOW.per), prefix: 'assistant:window' });
  return {
    async window(ip) {
      const r = await ratelimit.limit(ip);
      return r.success ? { ok: true } : { ok: false, retryAfterMs: Math.max(0, r.reset - Date.now()) };
    },
    async incr(key, ttlSeconds) {
      const n = await redis.incr(key);
      if (n === 1) await redis.expire(key, ttlSeconds);
      return n;
    },
  };
}

function makeModel(apiKey: string) {
  const anthropic = new Anthropic({ apiKey });
  return async function* model({ system, messages }: { system: string; messages: { role: 'user' | 'assistant'; content: string }[] }) {
    const stream = anthropic.messages.stream({
      model: MODEL,
      max_tokens: 500, // spec §6 output cap
      // Rules-first prefix + cache_control (spec §6 cost); whether the prefix crosses
      // Haiku's minimum cacheable size is verified via usage in Task 12.
      system: [{ type: 'text', text: system, cache_control: { type: 'ephemeral' } }],
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    });
    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') yield event.delta.text;
    }
    const final = await stream.finalMessage();
    // Metadata only (spec §7): tokens, never content.
    console.log(JSON.stringify({
      evt: 'assistant.usage',
      input: final.usage.input_tokens,
      output: final.usage.output_tokens,
      cacheRead: final.usage.cache_read_input_tokens ?? 0,
    }));
    // Cast: keeps working even if the installed SDK types lag behind the refusal stop reason.
    if ((final.stop_reason as string) === 'refusal') throw new ModelRefusal('refusal');
  };
}

export const POST: APIRoute = async ({ request }) => {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const dailyCap = Number(process.env.DAILY_MESSAGE_CAP ?? '200');
  return handleChat(request, {
    env: {
      enabled: process.env.ASSISTANT_ENABLED === 'true',
      hasApiKey: Boolean(apiKey),
      dailyCap: Number.isFinite(dailyCap) && dailyCap > 0 ? dailyCap : 200,
    },
    store: makeStore(),
    // hasApiKey gates this in handleChat before any call.
    model: makeModel(apiKey ?? ''),
    now: () => Date.now(),
    log: (entry) => console.log(JSON.stringify({ evt: 'assistant.request', ...entry })),
  });
};
