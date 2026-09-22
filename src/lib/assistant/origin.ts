/**
 * Spec §4 step 2: same-origin only. Browsers set both headers on every POST and
 * they are forbidden headers, so a cross-site page can neither spoof
 * `sec-fetch-site: same-origin` nor omit `Origin`. Non-browser clients can forge
 * anything — the rate limits, not this check, are the real defence.
 */
export function isSameOrigin(headers: Headers, url: string): boolean {
  if (headers.get('sec-fetch-site') === 'same-origin') return true;
  const origin = headers.get('origin');
  if (!origin) return false;
  try {
    return origin === new URL(url).origin;
  } catch {
    return false;
  }
}
