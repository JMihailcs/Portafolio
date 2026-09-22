import { describe, expect, it } from 'vitest';
import { SSE_HEADERS, sseDelta, sseDone, sseError } from '../../src/lib/assistant/sse';

describe('sse', () => {
  it('formats a delta event exactly (JSON + blank line)', () => {
    expect(sseDelta('Hola')).toBe('data: {"type":"delta","text":"Hola"}\n\n');
  });
  it('formats the done event exactly', () => {
    expect(sseDone()).toBe('data: {"type":"done"}\n\n');
  });
  it('formats error events for both codes', () => {
    expect(sseError('unavailable')).toBe('data: {"type":"error","code":"unavailable"}\n\n');
    expect(sseError('refusal')).toBe('data: {"type":"error","code":"refusal"}\n\n');
  });
  it('keeps unicode intact', () => {
    expect(sseDelta('Cusco, ñ ño')).toContain('Cusco, ñ ño');
  });
  it('declares stream headers', () => {
    expect(SSE_HEADERS['content-type']).toBe('text/event-stream');
    expect(SSE_HEADERS['cache-control']).toBe('no-cache');
  });
});
