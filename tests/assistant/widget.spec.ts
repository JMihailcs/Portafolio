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
  let sent: { lang: string; messages: { role: string }[] } | null = null;
  await page.route('**/api/chat', async (route) => {
    sent = JSON.parse(route.request().postData() ?? 'null');
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
  expect(sent?.lang).toBe('es');
  expect(sent?.messages.at(-1)?.role).toBe('user');
  // history grows: a second send includes the assistant turn
  await page.locator('[data-assistant-input]').fill('¿De dónde es?');
  await page.locator('[data-assistant-form]').evaluate((f) => (f as HTMLFormElement).requestSubmit());
  await expect(msgs).toHaveCount(4);
  expect((sent as unknown as { messages: { role: string }[] }).messages.map((m) => m.role)).toContain('assistant');
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
