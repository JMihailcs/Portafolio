import { describe, expect, it } from 'vitest';
import { LIMITS, mergeTurns, validate, type ChatMessage } from '../../src/lib/assistant/validate';

const body = (messages: unknown[], lang: unknown = 'es'): string =>
  JSON.stringify({ lang, messages });
const u = (content: string): ChatMessage => ({ role: 'user', content });
const a = (content: string): ChatMessage => ({ role: 'assistant', content });

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
    // should not cause validation to fail (char limits checked after dropping leading assistant).
    const turns = [a('x'.repeat(2001)), u('q0'), a('a0'), u('q1'), a('a1'), u('q2'), a('a2'), u('q3'), a('a3'), u('q4')];
    const r = validate(body(turns));
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
