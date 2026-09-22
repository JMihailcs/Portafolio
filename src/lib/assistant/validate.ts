/** Request contract (spec §5). Lengths are JS string units, matching the widget's maxlength. */
export interface ChatMessage { role: 'user' | 'assistant'; content: string }
export interface ValidRequest { lang: 'es' | 'en'; messages: ChatMessage[] }

export const LIMITS = { userChars: 500, assistantChars: 2000, turns: 10, bodyBytes: 16 * 1024 } as const;

const isTurn = (m: unknown): m is ChatMessage => {
  if (typeof m !== 'object' || m === null) return false;
  const { role, content } = m as { role?: unknown; content?: unknown };
  if (role !== 'user' && role !== 'assistant') return false;
  if (typeof content !== 'string' || content.trim().length === 0) return false;
  return true;
};

export function validate(raw: string): ValidRequest | null {
  if (new TextEncoder().encode(raw).length > LIMITS.bodyBytes) return null; // cheap guard, before parsing
  let parsed: unknown;
  try { parsed = JSON.parse(raw); } catch { return null; }
  if (typeof parsed !== 'object' || parsed === null) return null;
  const { lang, messages } = parsed as { lang?: unknown; messages?: unknown };
  if (lang !== 'es' && lang !== 'en') return null;
  if (!Array.isArray(messages) || messages.length === 0) return null;

  // Truncate first (spec §5), then enforce every rule on the kept turns only.
  const kept = messages.slice(-LIMITS.turns);
  if (!kept.every(isTurn)) return null;
  if (kept.at(-1)!.role !== 'user') return null;
  // Check character limits before removing leading assistant messages
  for (const m of kept) {
    const max = m.role === 'user' ? LIMITS.userChars : LIMITS.assistantChars;
    if (m.content.length > max) return null;
  }
  // Truncation can orphan the opening user turn; the API needs the first message to be `user`.
  while (kept.length > 1 && kept[0].role === 'assistant') kept.shift();
  if (kept[0].role === 'assistant') return null; // all-assistant (impossible if last is user, kept as a guard)
  return { lang, messages: kept };
}

/** The Anthropic API needs alternating turns; a client retry after an error can send two `user`s in a row. */
export function mergeTurns(messages: ChatMessage[]): ChatMessage[] {
  const out: ChatMessage[] = [];
  for (const m of messages) {
    const prev = out.at(-1);
    if (prev && prev.role === m.role) prev.content += `\n\n${m.content}`;
    else out.push({ ...m });
  }
  return out;
}
