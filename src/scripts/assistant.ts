/**
 * Widget client (spec §8): modal with focus trap, history capped to 10 turns,
 * assistant turns truncated to 2000 chars before resend, plain-text rendering
 * (textContent only), states for streaming / error / limited / disabled.
 */
import type { ChatMessage } from '../lib/assistant/validate';
import { LIMITS } from '../lib/assistant/validate';

const TURNS = LIMITS.turns;
const ASSISTANT_CHARS = LIMITS.assistantChars;

export function initAssistant(): void {
  const root = document.querySelector<HTMLElement>('[data-assistant]');
  if (!root) return;
  const q = <T extends Element>(s: string): T | null => root.querySelector<T>(s);

  const toggle = q<HTMLButtonElement>('[data-assistant-toggle]');
  const panel = q<HTMLElement>('[data-assistant-panel]');
  const closeBtn = q<HTMLButtonElement>('[data-assistant-close]');
  const messages = q<HTMLElement>('[data-assistant-messages]');
  const pending = q<HTMLElement>('[data-assistant-pending]');
  const alertBox = q<HTMLElement>('[data-assistant-alert]');
  const alertText = q<HTMLElement>('[data-assistant-alert-text]');
  const suggestions = q<HTMLElement>('[data-assistant-suggestions]');
  const form = q<HTMLFormElement>('[data-assistant-form]');
  const input = q<HTMLInputElement>('[data-assistant-input]');
  const count = q<HTMLElement>('[data-assistant-count]');
  if (!toggle || !panel || !closeBtn || !messages || !pending || !alertBox || !alertText
    || !suggestions || !form || !input || !count) return;

  const lang = root.dataset.lang === 'en' ? 'en' : 'es';
  let history: ChatMessage[] = [];
  let busy = false;

  // --- focus trap ---------------------------------------------------------
  const focusables = (): HTMLElement[] =>
    Array.from(panel.querySelectorAll<HTMLElement>('button, a[href], input, [tabindex]:not([tabindex="-1"])'))
      .filter((el) => !el.hasAttribute('disabled') && el.offsetParent !== null);

  const open = (): void => {
    panel.hidden = false;
    root.classList.add('is-open');
    toggle.setAttribute('aria-expanded', 'true');
    input.focus();
  };
  const close = (): void => {
    panel.hidden = true;
    root.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.focus(); // spec §8: Escape/close returns focus to the button
  };

  toggle.addEventListener('click', () => (panel.hidden ? open() : close()));
  closeBtn.addEventListener('click', close);

  panel.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { close(); return; }
    if (e.key !== 'Tab') return;
    const f = focusables();
    if (!f.length) return;
    const first = f[0];
    const last = f[f.length - 1];
    const active = document.activeElement as HTMLElement | null;
    if (e.shiftKey && (active === first || !panel.contains(active))) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && (active === last || !panel.contains(active))) { e.preventDefault(); first.focus(); }
  });

  // --- rendering (plain text only) ---------------------------------------
  const addBubble = (role: 'user' | 'assistant', text: string): HTMLElement => {
    const el = document.createElement('div');
    el.className = 'assistant-msg';
    el.dataset.role = role;
    el.textContent = text; // never innerHTML (spec: no markdown, no HTML)
    messages.appendChild(el);
    messages.scrollTop = messages.scrollHeight;
    return el;
  };
  const showAlert = (kind: 'error' | 'limited' | 'off'): void => {
    alertText.textContent = panel.dataset[`msg${kind[0].toUpperCase()}${kind.slice(1)}`] ?? '';
    alertBox.hidden = false;
  };
  const hideAlert = (): void => { alertBox.hidden = true; };

  // --- counter ------------------------------------------------------------
  const syncCount = (): void => { count.textContent = `${input.value.length}/${LIMITS.userChars}`; };
  input.addEventListener('input', syncCount);

  // --- suggestions --------------------------------------------------------
  suggestions.addEventListener('click', (e) => {
    const chip = (e.target as Element | null)?.closest<HTMLElement>('[data-assistant-suggestion]');
    if (!chip) return;
    input.value = chip.dataset.assistantSuggestion ?? '';
    syncCount();
    form.requestSubmit();
  });

  // --- send + stream ------------------------------------------------------
  const payload = (): string => JSON.stringify({
    lang,
    messages: history.slice(-TURNS).map((m) => ({
      role: m.role,
      content: m.role === 'assistant' ? m.content.slice(0, ASSISTANT_CHARS) : m.content,
    })),
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (busy || !text) return;
    busy = true;
    hideAlert();
    addBubble('user', text);
    history.push({ role: 'user', content: text });
    input.value = '';
    syncCount();
    pending.hidden = false;

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: payload(),
      });

      if (!res.ok) {
        const code = await res.json().then((j: { error?: string }) => j.error).catch(() => '');
        showAlert(code === 'rate_limited' ? 'limited' : code === 'disabled' ? 'off' : 'error');
        return; // the user bubble stays visible; the turn stays in history (server merges repeats)
      }

      const reader = res.body?.getReader();
      if (!reader) { showAlert('error'); return; }
      const decoder = new TextDecoder();
      let buf = '';
      let bubble: HTMLElement | null = null;

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const parts = buf.split('\n\n');
        buf = parts.pop() ?? ''; // keep the incomplete tail
        for (const part of parts) {
          const line = part.split('\n').find((l) => l.startsWith('data: '));
          if (!line) continue;
          const evt = JSON.parse(line.slice(6)) as
            | { type: 'delta'; text: string }
            | { type: 'done' }
            | { type: 'error'; code: string };
          if (evt.type === 'delta') {
            pending.hidden = true;
            bubble ??= addBubble('assistant', '');
            bubble.textContent += evt.text;
            messages.scrollTop = messages.scrollHeight;
          } else if (evt.type === 'done') {
            if (bubble) history.push({ role: 'assistant', content: bubble.textContent ?? '' });
          } else {
            // unavailable | refusal (spec §6): generic error + email, drop a fragment
            if (bubble && !bubble.textContent) bubble.remove();
            showAlert('error');
          }
        }
      }
    } catch {
      showAlert('error'); // network failure mid-stream
    } finally {
      busy = false;
      pending.hidden = true;
      if (!panel.hidden) input.focus();
    }
  });
}
