import { describe, expect, it } from 'vitest';
import { LIMITS, mergeTurns, validate } from '../../src/lib/assistant/validate';

const body = (messages: unknown[], lang: unknown = 'es'): string =>
  JSON.stringify({ lang, messages });
const u = (content: string) => ({ role: 'user', content });
const a = (content: string) => ({ role: 'assistant', content });

describe('validate', () => {
  it('accepts a minimal valid request', () => {
    const r = validate(body([u('Hola')]));
    expect(r).toEqual({ lang: 'es', messages: [{ role: 'user', content: 'Hola' }] });
  });
  it('accepts lang en', () => {
    expect(validate(body([u('Hi')], 'en'))?.lang).toBe('en');
  });
  it('rejects empty, non-JSON and non-object bodies', () => {
    expect(validate('')).toBeNull();
    expect(validate('{oops')).toBeNull();
    expect(validate('null')).toBeNull();
    expect(validate('"str"')).toBeNull();
  });
  it('rejects a missing or invalid lang', () => {
    expect(validate(JSON.stringify({ messages: [u('x')] }))).toBeNull();
    expect(validate(body([u('x')], 'fr'))).toBeNull();
    expect(validate(body([u('x')], 42))).toBeNull();
  });
  it('rejects missing, empty or non-array messages', () => {
    expect(validate(JSON.stringify({ lang: 'es' }))).toBeNull();
    expect(validate(JSON.stringify({ lang: 'es', messages: [] }))).toBeNull();
    expect(validate(JSON.stringify({ lang: 'es', messages: 'nope' }))).toBeNull();
  });
  it('rejects a last message that is not from the user', () => {
    expect(validate(body([u('hola'), a('dime')]))).toBeNull();
  });
  it('rejects malformed turns', () => {
    expect(validate(body([{ role: 'system', content: 'x' }, u('y')]))).toBeNull();
    expect(validate(body([{ role: 'user' }, u('y')]))).toBeNull();
    expect(validate(body([{ role: 'user', content: '' }, u('y')]))).toBeNull();
    expect(validate(body([{ role: 'user', content: '   ' }, u('y')]))).toBeNull();
    expect(validate(body([{ role: 'user', content: 7 }, u('y')]))).toBeNull();
  });
  it('enforces the per-role character limits at their exact boundaries', () => {
    expect(validate(body([u('x'.repeat(500))]))).not.toBeNull();
    expect(validate(body([u('x'.repeat(501))]))).toBeNull();
    expect(validate(body([u('q'), a('x'.repeat(2000)), u('q2')]))).not.toBeNull();
    expect(validate(body([u('q'), a('x'.repeat(2001)), u('q2')]))).toBeNull();
  });
  it('rejects a body over 16 KB before parsing', () => {
    const huge = JSON.stringify({ lang: 'es', messages: [u('x'.repeat(20_000))] });
    expect(huge.length).toBeGreaterThan(LIMITS.bodyBytes);
    expect(validate(huge)).toBeNull();
  });
  it('truncates to the last 10 turns instead of rejecting', () => {
    const many = [u('seed'), ...Array.from({ length: 10 }, (_, i) => (i % 2 ? u(`q${i}`) : a(`a${i}`)))];
    expect(validate(body(many))).not.toBeNull();
    const more = Array.from({ length: 14 }, (_, i) => (i === 13 ? u('last') : i % 2 ? a(`a${i}`) : u(`q${i}`)));
    const r = validate(body(more));
    expect(r?.messages).toHaveLength(10);
    expect(r?.messages.at(-1)).toEqual({ role: 'user', content: 'last' });
  });
  it('drops leading assistant turns created by truncation', () => {
    // 11 alternating turns starting with user → the last 10 start with assistant.
    const turns = [u('q0'), a('a0'), u('q1'), a('a1'), u('q2'), a('a2'), u('q3'), a('a3'), u('q4'), a('a4'), u('q5')];
    const r = validate(body(turns));
    expect(r).not.toBeNull();
    expect(r!.messages[0].role).toBe('user');
    expect(r!.messages.at(-1)!.role).toBe('user');
  });
  it('validates only the 10 kept turns (a malformed dropped turn is ignored)', () => {
    const turns = [{ role: 'bogus', content: 'x' }, ...Array.from({ length: 10 }, (_, i) => (i === 9 ? u('last') : u(`q${i}`)))];
    expect(validate(body(turns))).not.toBeNull();
  });
  it('accepts an over-limit leading assistant turn if it gets dropped during truncation', () => {
    // A leading assistant message that exceeds the char limit but gets dropped by the while loop
    // should not cause validation to fail (char limits checked after dropping leading assistant)
    const turns = [a('x'.repeat(2001)), u('q0'), a('a0'), u('q1'), a('a1'), u('q2'), a('a2'), u('q3'), a('a3'), u('q4'), a('a4'), u('q5')];
    // This has 12 messages; truncate to last 10: [u('q1'), a('a1'), u('q2'), a('a2'), u('q3'), a('a3'), u('q4'), a('a4'), u('q5')]... wait that's only 9
    // Let me recalculate: turns has 12 messages total. Last 10 would be messages [2..11]
    // which is [u('q0'), a('a0'), u('q1'), a('a1'), u('q2'), a('a2'), u('q3'), a('a3'), u('q4'), a('a4')]
    // Wait, that's only 10. Let me count again:
    // 0: a('x'.repeat(2001)) - over limit leading assistant
    // 1: u('q0')
    // 2: a('a0')
    // 3: u('q1')
    // 4: a('a1')
    // 5: u('q2')
    // 6: a('a2')
    // 7: u('q3')
    // 8: a('a3')
    // 9: u('q4')
    // 10: a('a4')
    // 11: u('q5')
    // Total: 12. Last 10: [1..10] = [u('q0'), a('a0'), u('q1'), a('a1'), u('q2'), a('a2'), u('q3'), a('a3'), u('q4'), a('a4')]
    // This ends with a, not u. So it should be rejected for that reason, not the char limit.
    // Let me add one more user message:
    const turns2 = [a('x'.repeat(2001)), u('q0'), a('a0'), u('q1'), a('a1'), u('q2'), a('a2'), u('q3'), a('a3'), u('q4'), a('a4'), u('q5')];
    // Now we have 12 messages. Last 10: [2..11] = [a('a0'), u('q1'), a('a1'), u('q2'), a('a2'), u('q3'), a('a3'), u('q4'), a('a4'), u('q5')]
    // This starts with a, so it will be shifted. Then: [u('q1'), a('a1'), u('q2'), a('a2'), u('q3'), a('a3'), u('q4'), a('a4'), u('q5')]
    // But that's only 9 messages and ends with u. Hmm, this doesn't work either.
    // Let me try with 13 messages:
    const turns3 = [a('x'.repeat(2001)), u('q0'), a('a0'), u('q1'), a('a1'), u('q2'), a('a2'), u('q3'), a('a3'), u('q4'), a('a4'), u('q5'), a('a5')];
    // 13 messages. Last 10: [3..12] = [u('q1'), a('a1'), u('q2'), a('a2'), u('q3'), a('a3'), u('q4'), a('a4'), u('q5'), a('a5')]
    // Ends with a, not u. Fails for that reason.
    //
    // I think the issue is that I need the first message (after truncation) to be assistant, so it gets dropped,
    // but also need to end with user. Let me try:
    const turns4 = [a('x'.repeat(2001)), a('x'), u('q0'), a('a0'), u('q1'), a('a1'), u('q2'), a('a2'), u('q3'), a('a3'), u('q4'), a('a4'), u('q5')];
    // 13 messages. Last 10: [3..12] = [u('q0'), a('a0'), u('q1'), a('a1'), u('q2'), a('a2'), u('q3'), a('a3'), u('q4'), a('a4')]
    // Ends with a, not u. Still fails.
    //
    // Wait, I think I'm overcomplicating this. Let me just make sure the first message after truncation is an over-limit assistant,
    // and the last message is a user. That's all I need.
    // If I have: [a(oversized), a(normal), u, a, u, a, u, a, u, a, u, a, u]
    // That's 13 messages. Last 10 would be: [a, u, a, u, a, u, a, u, a, u]
    // That starts with a and ends with u. The while loop shifts the first a, leaving [u, a, u, a, u, a, u, a, u]
    // But that's only 9 messages.
    //
    // OK I think the issue is I need exactly 11 messages so that last 10 starts with a and ends with u.
    // [a(oversized), u, a, u, a, u, a, u, a, u, a]
    // Last 10: [u, a, u, a, u, a, u, a, u, a]
    // That ends with a, not u. Still doesn't work.
    //
    // Maybe I should have: [a(oversized), u, a, u, a, u, a, u, a, u]
    // Last 10: all of them
    // Ends with u, starts with a.
    // While loop shifts first a.
    // Result: [u, a, u, a, u, a, u, a, u]
    // That's 9 messages and ends with u. Perfect!
    const finalTurns = [a('x'.repeat(2001)), u('q0'), a('a0'), u('q1'), a('a1'), u('q2'), a('a2'), u('q3'), a('a3'), u('q4')];
    const r = validate(body(finalTurns));
    expect(r).not.toBeNull();
    expect(r?.messages.length).toBe(9);
  });
});

describe('mergeTurns', () => {
  it('merges consecutive same-role turns for the Anthropic API', () => {
    const merged = mergeTurns([u('hola'), u('de nuevo'), a('dime'), a('sigue'), u('ok')]);
    expect(merged).toEqual([
      { role: 'user', content: 'hola\n\nde nuevo' },
      { role: 'assistant', content: 'dime\n\nsigue' },
      { role: 'user', content: 'ok' },
    ]);
  });
  it('does not mutate the input', () => {
    const input = [u('a'), u('b')];
    mergeTurns(input);
    expect(input).toHaveLength(2);
  });
});
