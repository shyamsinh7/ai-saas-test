import { test, expect } from '@playwright/test';

const ERROR = 'Please enter your name.';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('clicking Greet shows the greeting', async ({ page }) => {
  await page.getByLabel('Your name').fill('Ada');
  await page.getByRole('button', { name: 'Greet' }).click();
  await expect(page.locator('#greeting')).toHaveText('Hello, Ada!');
  await expect(page.locator('#error')).toBeEmpty();
});

test('pressing Enter greets without reloading', async ({ page }) => {
  await page.evaluate(() => { window.__marker = 'same-page'; });
  await page.getByLabel('Your name').fill('Ada');
  await page.getByLabel('Your name').press('Enter');
  await expect(page.locator('#greeting')).toHaveText('Hello, Ada!');
  expect(await page.evaluate(() => window.__marker)).toBe('same-page');
  expect(new URL(page.url()).search).toBe('');
});

for (const [label, value] of [['empty', ''], ['whitespace-only', '   ']]) {
  test(`${label} name shows an error and no greeting`, async ({ page }) => {
    await page.getByLabel('Your name').fill(value);
    await page.getByRole('button', { name: 'Greet' }).click();
    await expect(page.locator('#error')).toHaveText(ERROR);
    await expect(page.locator('#greeting')).toBeEmpty();
  });
}

test('a valid name after an error clears the error', async ({ page }) => {
  await page.getByRole('button', { name: 'Greet' }).click();
  await expect(page.locator('#error')).toHaveText(ERROR);
  await page.getByLabel('Your name').fill('Ada');
  await page.getByRole('button', { name: 'Greet' }).click();
  await expect(page.locator('#error')).toBeEmpty();
  await expect(page.locator('#greeting')).toHaveText('Hello, Ada!');
});

test('HTML in the name is shown as literal text', async ({ page }) => {
  const name = '<img src=x onerror=alert(1)>';
  let dialog = false;
  page.on('dialog', (d) => { dialog = true; d.dismiss(); });
  await page.getByLabel('Your name').fill(name);
  await page.getByRole('button', { name: 'Greet' }).click();
  await expect(page.locator('#greeting')).toHaveText(`Hello, ${name}!`);
  await expect(page.locator('img')).toHaveCount(0);
  expect(dialog).toBe(false);
});
