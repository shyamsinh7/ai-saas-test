import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('./');
});

test('shows the name, title and page title', async ({ page }) => {
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Shyamsinh Parmar');
  await expect(page.locator('.role')).toHaveText('Principal Engineer & Enterprise Architect');
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
  await expect(about).toContainText('8 years of experience');
  await expect(about.locator('li')).toHaveCount(4);
});

test('Core Skills & Technologies section is shown', async ({ page }) => {
  const skills = page.locator('#skills');
  await expect(skills.getByRole('heading', { name: 'Core Skills & Technologies' })).toBeVisible();
  await expect(skills.locator('.card')).toHaveCount(8);
  await expect(skills).toContainText('LangChain');
});

test('My Portfolio section lists the projects with links', async ({ page }) => {
  const portfolio = page.locator('#portfolio');
  await expect(
    portfolio.getByRole('heading', { name: 'My Portfolio (19 projects)' }),
  ).toBeVisible();
  await expect(portfolio.locator('article')).toHaveCount(19);
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
  await expect(page.locator('footer .updated')).toHaveText('Last updated: 6 October 2026');
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
  await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
});
