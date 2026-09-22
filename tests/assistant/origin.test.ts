import { describe, expect, it } from 'vitest';
import { isSameOrigin } from '../../src/lib/assistant/origin';

const URL_ = 'https://portafolio.test/api/chat';
const req = (init: Record<string, string>) => new Request(URL_, { method: 'POST', headers: init });

describe('isSameOrigin', () => {
  it('accepts sec-fetch-site: same-origin even if the URL origin looks odd (proxy-safe)', () => {
    const r = req({ 'sec-fetch-site': 'same-origin' });
    expect(isSameOrigin(r.headers, 'http://localhost:4321/api/chat')).toBe(true);
  });
  it('accepts an Origin that matches the request URL origin', () => {
    const r = req({ origin: 'https://portafolio.test' });
    expect(isSameOrigin(r.headers, URL_)).toBe(true);
  });
  it('rejects a different Origin', () => {
    const r = req({ origin: 'https://evil.test' });
    expect(isSameOrigin(r.headers, URL_)).toBe(false);
  });
  it('rejects a cross-site sec-fetch-site', () => {
    const r = req({ 'sec-fetch-site': 'cross-site', origin: 'https://evil.test' });
    expect(isSameOrigin(r.headers, URL_)).toBe(false);
  });
  it('rejects the absence of both headers', () => {
    expect(isSameOrigin(req({}).headers, URL_)).toBe(false);
  });
  it('rejects Origin: null (sandboxed documents)', () => {
    expect(isSameOrigin(req({ origin: 'null' }).headers, URL_)).toBe(false);
  });
});
