import { describe, expect, it } from 'vitest';
import { resolveUpstashCredentials } from '../../src/pages/api/chat';

describe('resolveUpstashCredentials', () => {
  it('resolves KV_REST_API_URL / KV_REST_API_TOKEN (Vercel Upstash-via-Marketplace names)', () => {
    expect(resolveUpstashCredentials({
      KV_REST_API_URL: 'https://kv.example',
      KV_REST_API_TOKEN: 'kv-token',
    })).toEqual({ url: 'https://kv.example', token: 'kv-token' });
  });

  it('ignores the read-only token and raw redis:// connection strings', () => {
    expect(resolveUpstashCredentials({
      KV_REST_API_READ_ONLY_TOKEN: 'ro-token',
      REDIS_URL: 'redis://example',
      KV_URL: 'redis://example',
    })).toBeNull();
  });

  it('returns null when either var is missing', () => {
    expect(resolveUpstashCredentials({})).toBeNull();
    expect(resolveUpstashCredentials({ KV_REST_API_URL: 'https://kv.example' })).toBeNull();
    expect(resolveUpstashCredentials({ KV_REST_API_TOKEN: 'kv-token' })).toBeNull();
  });
});
