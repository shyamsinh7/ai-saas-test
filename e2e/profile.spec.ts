import { readFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';

type Project = { name: string; category: string };
const projects: Project[] = JSON.parse(readFileSync('data/profile.json', 'utf8')).portfolio;
const categories = [...new Set(projects.map((p) => p.category))];
const total = projects.length;
const inCategory = (c: string) => projects.filter((p) => p.category === c).length;
const [known = '', other = ''] = categories;

test.beforeEach(async ({ page }) => {
  await page.goto('./');
});

test('shows the name, title and page title', async ({ page }) => {
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Shyamsinh Parmar');
  await expect(page.locator('.role')).toHaveText(
    'AI Agent Engineer | AI-native SaaS & Autonomous Business Systems',
  );
  await expect(page).toHaveTitle(/Shyamsinh Parmar/);
});

test('contact links keep email, phone and GitHub', async ({ page }) => {
  const contact = page.locator('#contact');
  await expect(contact.getByRole('link', { name: 'parmarshyamsingh8@gmail.com' })).toHaveAttribute(
    'href',
    'mailto:parmarshyamsingh8@gmail.com',
  );
  await expect(contact.getByRole('link', { name: '+91 8866060908' })).toHaveAttribute(
    'href',
    'tel:+918866060908',
  );
  await expect(contact.getByRole('link', { name: 'ssparmar8' })).toHaveAttribute(
    'href',
    'https://github.com/ssparmar8',
  );
});

test('About Me section is shown', async ({ page }) => {
  const about = page.locator('#about');
  await expect(about.getByRole('heading', { name: 'About Me' })).toBeVisible();
  await expect(about).toContainText('8+ years of software engineering experience');
  await expect(about.locator('li')).toHaveCount(5);
});

test('Core Skills & Technologies section is shown', async ({ page }) => {
  const skills = page.locator('#skills');
  await expect(skills.getByRole('heading', { name: 'Core Skills & Technologies' })).toBeVisible();
  await expect(skills.locator('.card')).toHaveCount(10);
  await expect(skills).toContainText('LangChain');
});

test('My Portfolio section lists the projects with links', async ({ page }) => {
  const portfolio = page.locator('#portfolio');
  await expect(
    portfolio.getByRole('heading', { name: 'My Portfolio (23 projects)' }),
  ).toBeVisible();
  await expect(portfolio.locator('article')).toHaveCount(total);
  const card = portfolio.locator('article', { hasText: 'HWS (Health Wealth Safe)' });
  await expect(card.getByRole('heading', { level: 3 })).toHaveText('HWS (Health Wealth Safe)');
  await expect(card.locator('.badge')).toHaveText('Healthcare');
  await expect(portfolio.getByRole('link', { name: 'healthwealthsafe.com' })).toHaveAttribute(
    'href',
    'https://www.healthwealthsafe.com/',
  );
});

test('footer shows the current year', async ({ page }) => {
  await expect(page.locator('footer .copyright')).toHaveText(
    `© ${new Date().getFullYear()} Shyamsinh Parmar`,
  );
});

test('footer shows when the profile was last updated', async ({ page }) => {
  await expect(page.locator('footer .updated')).toHaveText('Last updated: 10 October 2026');
});

test('nothing of the greeting app remains', async ({ page }) => {
  await expect(page.getByLabel('Your name')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Greet' })).toHaveCount(0);
});

test('page does not scroll horizontally on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});

test('Back to top button appears after scrolling and returns to the top', async ({ page }) => {
  const button = page.getByRole('button', { name: 'Back to top' });
  // Wait for the profile to render: before that there is nothing to scroll.
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(button).toBeHidden();
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await expect(button).toBeVisible();
  await button.click();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
  await expect(page.getByRole('heading', { level: 1 })).toBeFocused();
  await expect(button).toBeHidden();
});

test('Back to top button is a 44px target that does not cover the footer text', async ({
  page,
}) => {
  const button = page.getByRole('button', { name: 'Back to top' });
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await expect(button).toBeVisible();
  const box = await button.boundingBox();
  expect(box!.height).toBeGreaterThanOrEqual(44);
  expect(box!.width).toBeGreaterThanOrEqual(44);
  for (const selector of ['footer .updated', 'footer .copyright']) {
    const target = page.locator(selector);
    if ((await target.count()) === 0) continue;
    const other = await target.first().boundingBox();
    const overlaps =
      box!.x < other!.x + other!.width &&
      box!.x + box!.width > other!.x &&
      box!.y < other!.y + other!.height &&
      box!.y + box!.height > other!.y;
    expect(overlaps, `${selector} is covered`).toBe(false);
  }
});

test('table of contents links are 44px pills that fit a 375px screen', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  const links = page.getByRole('navigation', { name: 'Table of contents' }).getByRole('link');
  await expect(links).toHaveCount(3);
  for (const link of await links.all()) {
    const box = await link.boundingBox();
    expect(box!.height).toBeGreaterThanOrEqual(44);
    expect(box!.x + box!.width).toBeLessThanOrEqual(375);
  }
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});

test('table of contents links change background on hover', async ({ page }) => {
  const link = page
    .getByRole('navigation', { name: 'Table of contents' })
    .getByRole('link')
    .first();
  await expect(link).toBeVisible();
  const resting = await link.evaluate((el) => getComputedStyle(el).backgroundColor);
  await link.hover();
  await expect
    .poll(() => link.evaluate((el) => getComputedStyle(el).backgroundColor))
    .not.toBe(resting);
});

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('navigation jumps without animation', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    expect(
      await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior),
    ).toBe('auto');
    const link = page
      .getByRole('navigation', { name: 'Table of contents' })
      .getByRole('link')
      .first();
    expect(await link.evaluate((el) => getComputedStyle(el).transitionDuration)).toBe('0s');
    await page.getByRole('link', { name: 'My Portfolio' }).click();
    await expect(page.locator('#portfolio-h')).toBeInViewport();
    const button = page.getByRole('button', { name: 'Back to top' });
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await expect(button).toBeVisible();
    expect(await button.evaluate((el) => getComputedStyle(el).transitionDuration)).toBe('0s');
    await button.click();
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
  });
});

test('table of contents links to the three sections', async ({ page }) => {
  const toc = page.getByRole('navigation', { name: 'Table of contents' });
  await expect(toc).toBeVisible();
  const links = toc.getByRole('link');
  await expect(links).toHaveText(['About Me', 'Core Skills', 'My Portfolio']);
  await expect(links).toHaveCount(3);
  await expect(links.nth(0)).toHaveAttribute('href', '#about');
  await expect(links.nth(1)).toHaveAttribute('href', '#skills');
  await expect(links.nth(2)).toHaveAttribute('href', '#portfolio');
});

test('table of contents links scroll to their sections', async ({ page }) => {
  const toc = page.getByRole('navigation', { name: 'Table of contents' });
  await expect(toc).toBeVisible();
  await toc.getByRole('link', { name: 'Core Skills' }).click();
  await expect(page).toHaveURL(/#skills$/);
  await expect(page.locator('#skills-h')).toBeInViewport();
  await toc.getByRole('link', { name: 'My Portfolio' }).click();
  await expect(page).toHaveURL(/#portfolio$/);
  await expect(page.locator('#portfolio-h')).toBeInViewport();
});

test('skip link is the first thing Tab reaches', async ({ page }) => {
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await page.keyboard.press('Tab');
  const skip = page.getByRole('link', { name: 'Skip to content' });
  await expect(skip).toBeFocused();
  await expect(skip).toBeInViewport();
  const box = await skip.boundingBox();
  expect(box!.x).toBeGreaterThanOrEqual(0);
});

test.describe('page shell layout', () => {
  const sizes = [
    [1440, 900],
    [1280, 800],
    [768, 1024],
    [390, 844],
    [375, 812],
    [360, 740],
  ] as const;
  const overflow = (page: Page) =>
    page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );

  for (const [width, height] of sizes) {
    test(`no horizontal scroll and aligned header, main and footer at ${width}px`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height });
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      expect(await overflow(page)).toBeLessThanOrEqual(0);
      const [header, main, footer] = await Promise.all(
        ['header', 'main', 'footer'].map((t) => page.locator(t).boundingBox()),
      );
      expect(main!.x).toBe(header!.x);
      expect(main!.width).toBe(header!.width);
      expect(footer!.x).toBe(header!.x);
      expect(footer!.width).toBe(header!.width);
    });
  }

  test('linked contacts are at least 44px high', async ({ page }) => {
    const links = page.locator('#contact a');
    await expect(links.first()).toBeVisible();
    for (const link of await links.all()) {
      expect((await link.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    }
  });

  test('contacts without a link look different from linked ones', async ({ page }) => {
    const plain = page.locator('#contact li.no-link').first();
    await expect(plain).toBeVisible();
    const style = await plain.evaluate((e) => {
      const c = getComputedStyle(e);
      return { line: c.textDecorationLine, cursor: c.cursor };
    });
    expect(style.line).toBe('none');
    expect(style.cursor).not.toBe('pointer');
    const linked = await page
      .locator('#contact a')
      .first()
      .evaluate((e) => getComputedStyle(e).textDecorationLine);
    expect(linked).toContain('underline');
  });

  test('very long name and contact values wrap instead of overflowing', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 740 });
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await page.evaluate(() => {
      const long = 'x'.repeat(200);
      document.querySelector('header h1')!.textContent = long;
      document.querySelector('#contact li.no-link')!.textContent = `Label: ${long}`;
      document.querySelector('#contact a')!.textContent = long;
    });
    expect(await overflow(page)).toBeLessThanOrEqual(0);
  });
});

test.describe('skills filter', () => {
  test('filters by item name, case-insensitively and ignoring spaces', async ({ page }) => {
    const skills = page.locator('#skills');
    const input = skills.getByLabel('Filter skills');
    await expect(skills.locator('.card')).toHaveCount(10);
    await input.fill('  langchain ');
    const matching = skills.locator('.card', { has: page.locator('li', { hasText: 'LangChain' }) });
    await expect(matching.first()).toBeVisible();
    await expect(skills.locator('.card:not(:has(li:not([hidden])))').first()).toBeHidden();
    await expect(skills.getByText('No skills match')).toBeHidden();
    await expect(skills.getByRole('heading', { name: 'Core Skills & Technologies' })).toBeVisible();
  });

  test('shows a message when nothing matches and restores on clear', async ({ page }) => {
    const skills = page.locator('#skills');
    const input = skills.getByLabel('Filter skills');
    await input.fill('zzzz');
    const empty = skills.locator('#skills-empty');
    await expect(empty).toBeVisible();
    await expect(empty).toHaveAttribute('role', 'status');
    expect(await empty.evaluate((e) => getComputedStyle(e).backgroundColor)).not.toBe(
      'rgba(0, 0, 0, 0)',
    );
    await expect(skills.locator('.card').first()).toBeHidden();
    await input.fill('');
    await expect(empty).toBeHidden();
    for (const card of await skills.locator('.card').all()) await expect(card).toBeVisible();
  });

  test('filter input is touch friendly with a visible label and focus state', async ({ page }) => {
    const input = page.locator('#skills').getByLabel('Filter skills');
    await expect(page.locator('#skills label[for="skills-filter-input"]')).toBeVisible();
    const box = await input.boundingBox();
    expect(box!.height).toBeGreaterThanOrEqual(44);
    await input.focus();
    expect(await input.evaluate((e) => getComputedStyle(e).outlineStyle)).not.toBe('none');
  });

  test('hidden cards occupy no space', async ({ page }) => {
    const skills = page.locator('#skills');
    await skills.getByLabel('Filter skills').fill('langchain');
    const displays = await skills
      .locator('.card')
      .evaluateAll((els) => els.map((e) => getComputedStyle(e).display));
    expect(displays.filter((d) => d !== 'none')).toHaveLength(1);
  });

  for (const [width, multi] of [
    [1440, true],
    [768, true],
    [375, false],
  ] as const) {
    test(`skill cards form a balanced grid at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      const cards = page.locator('#skills .card');
      await expect(cards).toHaveCount(10);
      const lefts = await cards.evaluateAll((els) =>
        els.map((e) => Math.round(e.getBoundingClientRect().left)),
      );
      const columns = new Set(lefts).size;
      if (multi) expect(columns).toBeGreaterThan(1);
      else expect(columns).toBe(1);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }

  test('TOC link still works while filtering', async ({ page }) => {
    await page.locator('#skills').getByLabel('Filter skills').fill('zzzz');
    await page.getByRole('navigation').getByRole('link', { name: 'Core Skills' }).click();
    await expect(page).toHaveURL(/#skills$/);
  });
});

test.describe('portfolio filter', () => {
  const group = (page: Page) =>
    page.locator('#portfolio').getByRole('group', { name: 'Filter projects by category' });
  // The pressed button gets a CSS checkmark prefix in its accessible name ("✓ All").
  const button = (page: Page, name: string) =>
    group(page).getByRole('button', {
      name: new RegExp(`^(✓ )?${name.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')}$`),
    });
  const cards = (page: Page) => page.locator('#portfolio article');
  const status = (page: Page) => page.locator('#portfolio').getByRole('status');

  async function expectOnly(page: Page, category: string | null) {
    for (const p of projects) {
      const card = cards(page).filter({
        has: page.getByRole('heading', { name: p.name, exact: true }),
      });
      if (!category || p.category === category) await expect(card).toBeVisible();
      else await expect(card).toBeHidden();
    }
  }

  test('lists a button per category read from the data, plus All', async ({ page }) => {
    await expect(group(page).getByRole('button')).toHaveText([/^(✓ )?All$/, ...categories]);
    await expect(button(page, 'All')).toHaveAttribute('aria-pressed', 'true');
  });

  test('clicking a category shows only matching cards, updates the count and the URL', async ({
    page,
  }) => {
    for (const category of categories) {
      await button(page, category).click();
      await expect(button(page, category)).toHaveAttribute('aria-pressed', 'true');
      await expect(button(page, 'All')).toHaveAttribute('aria-pressed', 'false');
      await expect(status(page)).toHaveText(`Showing ${inCategory(category)} of ${total} projects`);
      await expect(page).toHaveURL(new RegExp(`[?&]category=${encodeURIComponent(category)}`));
      await expectOnly(page, category);
    }
    await button(page, 'All').click();
    await expect(status(page)).toHaveText(`Showing ${total} of ${total} projects`);
    await expect(page).not.toHaveURL(/[?&]category=/);
    await expectOnly(page, null);
  });

  test('a known ?category= deep link is applied on load', async ({ page }) => {
    await page.goto(`./?category=${encodeURIComponent(known)}`);
    await expect(button(page, known)).toHaveAttribute('aria-pressed', 'true');
    for (const other of ['All', ...categories.filter((c) => c !== known)]) {
      await expect(button(page, other)).toHaveAttribute('aria-pressed', 'false');
    }
    await expect(status(page)).toHaveText(`Showing ${inCategory(known)} of ${total} projects`);
    await expectOnly(page, known);
  });

  test('an unknown ?category= falls back to All', async ({ page }) => {
    await page.goto('./?category=bogus');
    await expect(button(page, 'All')).toHaveAttribute('aria-pressed', 'true');
    await expect(status(page)).toHaveText(`Showing ${total} of ${total} projects`);
    await expectOnly(page, null);
  });

  test('works with the keyboard: Enter and Space apply the filter and focus stays', async ({
    page,
  }) => {
    await expect(group(page)).toBeVisible();
    await button(page, 'All').focus();
    await page.keyboard.press('Tab');
    const first = button(page, known);
    await expect(first).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(first).toHaveAttribute('aria-pressed', 'true');
    await expect(first).toBeFocused();
    await expectOnly(page, known);

    await page.keyboard.press('Tab');
    const second = button(page, other);
    await expect(second).toBeFocused();
    await page.keyboard.press('Space');
    await expect(second).toHaveAttribute('aria-pressed', 'true');
    await expect(second).toBeFocused();
    await expectOnly(page, other);
  });

  test('on a 360px phone the buttons wrap and the page does not scroll sideways', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 360, height: 740 });
    await button(page, known).click();
    await expectOnly(page, known);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
    const boxes = await group(page)
      .getByRole('button')
      .evaluateAll((els) => els.map((e) => e.getBoundingClientRect()));
    for (const b of boxes) {
      expect(b.left).toBeGreaterThanOrEqual(0);
      expect(b.right).toBeLessThanOrEqual(360);
    }
    expect(new Set(boxes.map((b) => Math.round(b.top))).size).toBeGreaterThan(1);
  });
});
