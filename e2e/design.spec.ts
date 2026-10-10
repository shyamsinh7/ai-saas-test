import { expect, test } from '@playwright/test';

test('loads with no external requests', async ({ page, baseURL }) => {
  const origins: string[] = [];
  page.on('request', (r) => {
    if (!r.url().startsWith('data:')) origins.push(new URL(r.url()).origin);
  });
  await page.goto('./');
  await page.waitForLoadState('networkidle');
  expect(origins.length).toBeGreaterThan(0);
  for (const origin of origins) expect(origin).toBe(new URL(baseURL ?? '').origin);
});

test('has no horizontal scroll at 360px', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto('./');
  const { scroll, client } = await page.evaluate(() => ({
    scroll: document.documentElement.scrollWidth,
    client: document.documentElement.clientWidth,
  }));
  expect(scroll).toBeLessThanOrEqual(client);
});

test('design tokens exist and h2 styling is consistent', async ({ page }) => {
  await page.goto('./');
  const tokens = await page.evaluate(() =>
    ['--accent', '--bg', '--space-4', '--radius-md', '--shadow-sm', '--fs-h2'].map((t) =>
      getComputedStyle(document.documentElement).getPropertyValue(t).trim(),
    ),
  );
  for (const value of tokens) expect(value).not.toBe('');
  const styles = await page.evaluate(() =>
    ['about', 'skills', 'portfolio', 'why', 'links'].map((id) => {
      const h = document.querySelector(`#${id} h2`);
      if (!h) return null;
      const c = getComputedStyle(h);
      return `${c.color}|${c.fontSize}`;
    }),
  );
  expect(styles.every((s) => s !== null)).toBe(true);
  expect(new Set(styles).size).toBe(1);
});

test('keyboard focus shows the dark ring', async ({ page }) => {
  await page.goto('./');
  const ring = await page.evaluate(() => {
    const probe = document.createElement('i');
    probe.style.color = 'var(--focus-ring)';
    document.body.append(probe);
    const color = getComputedStyle(probe).color;
    probe.remove();
    return color;
  });
  const link = page.locator('.toc a').first();
  await link.focus();
  await page.keyboard.press('Shift+Tab');
  await page.keyboard.press('Tab');
  await expect(link).toBeFocused();
  for (const target of [link, page.locator('.filter-btn').first()]) {
    await target.focus();
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Tab');
    const style = await target.evaluate((e) => {
      const c = getComputedStyle(e);
      return { style: c.outlineStyle, color: c.outlineColor, width: c.outlineWidth };
    });
    expect(style.style).not.toBe('none');
    expect(style.color).toBe(ring);
    expect(style.width).toBe('3px');
  }
});

test('reduced motion disables smooth scroll and transitions', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('./');
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior)).toBe(
    'auto',
  );
  for (const sel of ['.filter-btn', '.toc a']) {
    const d = await page
      .locator(sel)
      .first()
      .evaluate((e) => getComputedStyle(e).transitionDuration);
    expect(d).toBe('0s');
  }
});

test('hidden cards stay hidden when a category is applied', async ({ page }) => {
  await page.goto('./');
  const buttons = page.locator('.filter-btn');
  const count = await buttons.count();
  expect(count).toBeGreaterThan(2);
  await buttons.nth(1).click();
  const displays = await page
    .locator('#portfolio .card')
    .evaluateAll((els) =>
      els.filter((e) => e.hasAttribute('hidden')).map((e) => getComputedStyle(e).display),
    );
  expect(displays.length).toBeGreaterThan(0);
  for (const d of displays) expect(d).toBe('none');
});
