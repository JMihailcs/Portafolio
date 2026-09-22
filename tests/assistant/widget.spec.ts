import { expect, test } from '@playwright/test';

const SSE_OK =
  'data: {"type":"delta","text":"Hola, "}\n\n' +
  'data: {"type":"delta","text":"soy el asistente."}\n\n' +
  'data: {"type":"done"}\n\n';

const openWidget = async (page: import('@playwright/test').Page, path = '/es/') => {
  await page.goto(path);
  await page.locator('[data-assistant-toggle]').click();
  await expect(page.locator('[data-assistant-panel]')).toBeVisible();
};

test('opens with focus in the input, traps Tab, Escape closes and restores focus', async ({ page }) => {
  await openWidget(page);
  await expect(page.locator('[data-assistant-input]')).toBeFocused();
  for (let i = 0; i < 12; i++) {
    await page.keyboard.press('Tab');
    const inside = await page.evaluate(
      () => !!document.querySelector('[data-assistant-panel]')?.contains(document.activeElement),
    );
    expect(inside, `Tab press #${i + 1} escaped the panel`).toBe(true);
  }
  await page.keyboard.press('Shift+Tab');
  const stillInside = await page.evaluate(
    () => !!document.querySelector('[data-assistant-panel]')?.contains(document.activeElement),
  );
  expect(stillInside).toBe(true);
  await page.keyboard.press('Escape');
  await expect(page.locator('[data-assistant-panel]')).toBeHidden();
  await expect(page.locator('[data-assistant-toggle]')).toBeFocused();
});

test('streams a mocked answer and sends the last turns', async ({ page }) => {
  type SentBody = { lang: string; messages: { role: string }[] };
  const state: { sent: SentBody | null } = { sent: null };
  await page.route('**/api/chat', async (route) => {
    state.sent = JSON.parse(route.request().postData() ?? 'null') as SentBody | null;
    await route.fulfill({
      status: 200,
      headers: { 'content-type': 'text/event-stream', 'cache-control': 'no-cache' },
      body: SSE_OK,
    });
  });
  await openWidget(page);
  await page.locator('[data-assistant-input]').fill('¿Quién es Johan?');
  await page.locator('[data-assistant-form]').evaluate((f) => (f as HTMLFormElement).requestSubmit());
  const msgs = page.locator('[data-assistant-messages] .assistant-msg');
  await expect(msgs).toHaveCount(2);
  await expect(msgs.nth(1)).toHaveText('Hola, soy el asistente.');
  await expect(page.locator('[data-assistant-pending]')).toBeHidden();
  expect(state.sent?.lang).toBe('es');
  expect(state.sent?.messages.at(-1)?.role).toBe('user');
  // history grows: a second send includes the assistant turn
  await page.locator('[data-assistant-input]').fill('¿De dónde es?');
  await page.locator('[data-assistant-form]').evaluate((f) => (f as HTMLFormElement).requestSubmit());
  await expect(msgs).toHaveCount(4);
  expect(state.sent?.messages.map((m) => m.role)).toContain('assistant');
});

test('renders assistant markdown (bold, list, safe link) as real elements', async ({ page }) => {
  const sse =
    'data: {"type":"delta","text":"**bold** text and a list:\\n\\n- one\\n- two\\n\\nand a [link](https://example.com)."}\n\n' +
    'data: {"type":"done"}\n\n';
  await page.route('**/api/chat', (route) =>
    route.fulfill({ status: 200, headers: { 'content-type': 'text/event-stream' }, body: sse }),
  );
  await openWidget(page);
  await page.locator('[data-assistant-input]').fill('hola');
  await page.locator('[data-assistant-form]').evaluate((f) => (f as HTMLFormElement).requestSubmit());
  const bubble = page.locator('[data-assistant-messages] .assistant-msg').nth(1);
  await expect(bubble.locator('strong')).toHaveText('bold');
  await expect(bubble.locator('li')).toHaveCount(2);
  const link = bubble.locator('a');
  await expect(link).toHaveAttribute('href', 'https://example.com');
});

test('user bubble keeps its background/alignment; assistant reply has no box and sits flush with the panel (Astro scoped-style regression)', async ({ page }) => {
  const sse = 'data: {"type":"delta","text":"reply"}\n\ndata: {"type":"done"}\n\n';
  await page.route('**/api/chat', (route) =>
    route.fulfill({ status: 200, headers: { 'content-type': 'text/event-stream' }, body: sse }),
  );
  await openWidget(page);
  await page.locator('[data-assistant-input]').fill('hola');
  await page.locator('[data-assistant-form]').evaluate((f) => (f as HTMLFormElement).requestSubmit());
  const msgs = page.locator('[data-assistant-messages] .assistant-msg');
  await expect(msgs).toHaveCount(2);
  // Bubbles are created client-side (assistant.ts): Astro's scoped CSS only applies
  // to elements carrying its data-astro-cid attribute, which document.createElement
  // never sets — a rule scoped that way silently never matches. Guard colour and
  // alignment so a re-scoped rule fails loudly instead of silently never applying.
  const panel = page.locator('[data-assistant-panel]');
  const [userBg, userAlign, assistantBg, assistantAlign, panelBg] = await Promise.all([
    msgs.nth(0).evaluate((el) => getComputedStyle(el).backgroundColor),
    msgs.nth(0).evaluate((el) => getComputedStyle(el).alignSelf),
    msgs.nth(1).evaluate((el) => getComputedStyle(el).backgroundColor),
    msgs.nth(1).evaluate((el) => getComputedStyle(el).alignSelf),
    panel.evaluate((el) => getComputedStyle(el).backgroundColor),
  ]);
  expect(userBg).not.toBe('rgba(0, 0, 0, 0)');
  // Assistant replies no longer get their own bubble box — they blend into the panel.
  expect(assistantBg === 'rgba(0, 0, 0, 0)' || assistantBg === panelBg).toBe(true);
  expect(userBg).not.toBe(assistantBg);
  expect(userAlign).toBe('flex-end');
  expect(assistantAlign).toBe('flex-start');
});

test('sanitizes an assistant reply that tries to inject a script/onerror payload', async ({ page }) => {
  const evil = '<img src=x onerror=alert(1)>hi <script>window.__xss = true;</script> [link](javascript:alert(1))';
  const sse = `data: ${JSON.stringify({ type: 'delta', text: evil })}\n\ndata: {"type":"done"}\n\n`;
  await page.route('**/api/chat', (route) =>
    route.fulfill({ status: 200, headers: { 'content-type': 'text/event-stream' }, body: sse }),
  );
  await openWidget(page);
  await page.locator('[data-assistant-input]').fill('hola');
  await page.locator('[data-assistant-form]').evaluate((f) => (f as HTMLFormElement).requestSubmit());
  const bubble = page.locator('[data-assistant-messages] .assistant-msg').nth(1);
  await expect(bubble).toContainText('hi');
  const hasXss = await page.evaluate(() => (window as unknown as { __xss?: boolean }).__xss ?? false);
  expect(hasXss).toBe(false);
  const html = await bubble.innerHTML();
  expect(html).not.toContain('<script');
  expect(html).not.toContain('onerror');
  expect(html).not.toContain('javascript:');
  await expect(bubble.locator('img')).toHaveCount(0);
});

test('suggestion chips hide after the first message is sent', async ({ page }) => {
  await page.route('**/api/chat', async (route) => {
    await route.fulfill({
      status: 200,
      headers: { 'content-type': 'text/event-stream' },
      body: SSE_OK,
    });
  });
  await openWidget(page);
  await expect(page.locator('[data-assistant-suggestions]')).toBeVisible();
  await page.locator('[data-assistant-input]').fill('hola');
  await page.locator('[data-assistant-form]').evaluate((f) => (f as HTMLFormElement).requestSubmit());
  await expect(page.locator('[data-assistant-suggestions]')).toBeHidden();
});

test('clicking a suggestion chip sends it and hides the row', async ({ page }) => {
  await page.route('**/api/chat', async (route) => {
    await route.fulfill({
      status: 200,
      headers: { 'content-type': 'text/event-stream' },
      body: SSE_OK,
    });
  });
  await openWidget(page);
  await page.locator('[data-assistant-suggestion]').first().click();
  const msgs = page.locator('[data-assistant-messages] .assistant-msg');
  await expect(msgs).toHaveCount(2);
  await expect(page.locator('[data-assistant-suggestions]')).toBeHidden();
});

test('429 shows the rate-limit state with the email', async ({ page }) => {
  await page.route('**/api/chat', (route) =>
    route.fulfill({ status: 429, headers: { 'content-type': 'application/json', 'retry-after': '30' }, body: '{"error":"rate_limited"}' }),
  );
  await openWidget(page);
  await page.locator('[data-assistant-input]').fill('hola');
  await page.locator('[data-assistant-form]').evaluate((f) => (f as HTMLFormElement).requestSubmit());
  const alert = page.locator('[data-assistant-alert]');
  await expect(alert).toBeVisible();
  await expect(alert).toContainText('Alcanzaste el límite');
  await expect(alert.locator('a')).toHaveAttribute('href', 'mailto:jm.condesallo@gmail.com');
});

test('503 disabled shows the service-off state (button stays usable)', async ({ page }) => {
  await page.route('**/api/chat', (route) =>
    route.fulfill({ status: 503, headers: { 'content-type': 'application/json' }, body: '{"error":"disabled"}' }),
  );
  await openWidget(page);
  await page.locator('[data-assistant-input]').fill('hola');
  await page.locator('[data-assistant-form]').evaluate((f) => (f as HTMLFormElement).requestSubmit());
  await expect(page.locator('[data-assistant-alert]')).toContainText('apagado');
});

test('mid-stream error shows the generic error state', async ({ page }) => {
  await page.route('**/api/chat', (route) =>
    route.fulfill({
      status: 200,
      headers: { 'content-type': 'text/event-stream' },
      body: 'data: {"type":"delta","text":"parcial"}\n\ndata: {"type":"error","code":"refusal"}\n\n',
    }),
  );
  await openWidget(page);
  await page.locator('[data-assistant-input]').fill('hola');
  await page.locator('[data-assistant-form]').evaluate((f) => (f as HTMLFormElement).requestSubmit());
  await expect(page.locator('[data-assistant-alert]')).toContainText('No pude responder');
});

test('EN page uses the English copy', async ({ page }) => {
  await openWidget(page, '/en/');
  await expect(page.locator('[data-assistant-panel]')).toHaveAttribute('aria-label', 'Ask about Johan');
});

test('mobile 375px: full-screen sheet, floating button hidden while open', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await openWidget(page);
  const box = await page.locator('[data-assistant-panel]').boundingBox();
  expect(box!.width).toBeGreaterThanOrEqual(374);
  expect(box!.height).toBeGreaterThanOrEqual(666);
  await expect(page.locator('[data-assistant-toggle]')).toBeHidden();
});

test('reduced motion: no panel transition', async ({ browser }) => {
  const ctx = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await page.goto('/es/');
  await page.locator('[data-assistant-toggle]').click();
  const duration = await page.locator('[data-assistant-panel]').evaluate(
    (el) => getComputedStyle(el).transitionDuration,
  );
  expect(duration).toBe('0s');
  await ctx.close();
});

test('reduced motion: no pulse animation on the fab', async ({ browser }) => {
  const ctx = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await page.goto('/es/');
  const duration = await page.locator('[data-assistant-toggle]').evaluate(
    (el) => getComputedStyle(el, '::before').animationDuration,
  );
  expect(duration).toBe('0s');
  await ctx.close();
});

test('teaser bubble appears once, is dismissible with its own close control', async ({ page }) => {
  await page.goto('/es/');
  const teaser = page.locator('[data-assistant-teaser]');
  await expect(teaser).toBeHidden();
  await expect(teaser).toBeVisible({ timeout: 6000 });
  await expect(teaser).toContainText('Clera');
  await page.locator('[data-assistant-teaser-close]').click();
  await expect(teaser).toBeHidden();
  await expect(page.locator('[data-assistant-panel]')).toBeHidden();
});

test('clicking the teaser opens the panel and dismisses the bubble', async ({ page }) => {
  await page.goto('/es/');
  const teaser = page.locator('[data-assistant-teaser]');
  await expect(teaser).toBeVisible({ timeout: 6000 });
  await teaser.click();
  await expect(page.locator('[data-assistant-panel]')).toBeVisible();
  await expect(teaser).toBeHidden();
});

test('teaser never appears if the panel was opened before the timer fires', async ({ page }) => {
  await page.goto('/es/');
  await page.locator('[data-assistant-toggle]').click();
  await expect(page.locator('[data-assistant-panel]')).toBeVisible();
  await page.waitForTimeout(5000);
  await expect(page.locator('[data-assistant-teaser]')).toBeHidden();
});

test('hero reveal still works with the widget present', async ({ page }) => {
  await page.goto('/es/');
  const hit = page.locator('[data-hit]');
  await expect(hit).toBeVisible();
  await hit.hover({ position: { x: 60, y: 60 } });
  // The rim path is drawn while the pointer is inside the face zone (src/scripts/hero-reveal.ts).
  await expect
    .poll(async () => ((await page.locator('[data-rim]').getAttribute('d'))?.length ?? 0), { timeout: 5000 })
    .toBeGreaterThan(0);
  // The widget never overlaps the hit zone: it is fixed bottom-right.
  const fab = await page.locator('[data-assistant-toggle]').boundingBox();
  const hitBox = await hit.boundingBox();
  const overlaps = fab && hitBox &&
    fab.x < hitBox.x + hitBox.width && fab.x + fab.width > hitBox.x &&
    fab.y < hitBox.y + hitBox.height && fab.y + fab.height > hitBox.y;
  expect(overlaps ?? false).toBe(false);
});
