/** Spec §5: one `data: <json>` line per event, separated by a blank line. */
export const SSE_HEADERS: Record<string, string> = {
  'content-type': 'text/event-stream',
  'cache-control': 'no-cache',
};

const event = (payload: Record<string, unknown>): string => `data: ${JSON.stringify(payload)}\n\n`;

export const sseDelta = (text: string): string => event({ type: 'delta', text });
export const sseDone = (): string => event({ type: 'done' });
export const sseError = (code: 'unavailable' | 'refusal'): string => event({ type: 'error', code });
