import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync(new URL('./style.css', import.meta.url), 'utf8');
const root = /:root\s*{([^}]*)}/.exec(css)?.[1] ?? '';

function token(name: string): string {
  const value = new RegExp(`--${name}:\\s*([^;]+);`).exec(root)?.[1]?.trim();
  if (!value) throw new Error(`missing token --${name}`);
  return value;
}

function luminance(hex: string): number {
  const full = hex.length === 4 ? `#${[...hex.slice(1)].map((c) => c + c).join('')}` : hex;
  const [r = 0, g = 0, b = 0] = [1, 3, 5].map((i) => {
    const c = parseInt(full.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function ratio(fg: string, bg: string): number {
  const [a, b] = [luminance(token(fg)), luminance(token(bg))];
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

describe('design tokens', () => {
  it('defines every token group', () => {
    for (const name of [
      'bg',
      'surface',
      'surface-tint',
      'border',
      'text',
      'muted',
      'accent',
      'link',
      'fs-sm',
      'fs-base',
      'fs-lg',
      'fs-xl',
      'fs-h2',
      'fs-h1',
      'lh-body',
      'lh-tight',
      'space-1',
      'space-8',
      'radius-sm',
      'radius-md',
      'radius-pill',
      'shadow-sm',
      'shadow-md',
      'measure',
    ]) {
      expect(token(name)).not.toBe('');
    }
  });

  it('keeps the brand accent', () => {
    expect(token('accent')).toBe('#1a74b0');
  });

  it('uses no hardcoded colours outside :root', () => {
    expect(css.replace(/:root\s*{[^}]*}/, '')).not.toMatch(/#[0-9a-f]{3,8}\b/i);
  });

  it.each([
    ['text', 'bg'],
    ['text', 'surface'],
    ['muted', 'bg'],
    ['muted', 'surface'],
    ['link', 'bg'],
    ['link', 'surface'],
    ['badge-text', 'badge-bg'],
    ['tag-text', 'tag-bg'],
    ['text', 'selected-bg'],
    ['on-link', 'link'],
  ])('text %s on %s meets AA 4.5:1', (fg, bg) => {
    expect(ratio(fg, bg)).toBeGreaterThanOrEqual(4.5);
  });

  it.each([
    ['accent', 'bg'],
    ['accent', 'surface'],
    ['focus-ring', 'bg'],
    ['focus-ring', 'surface'],
    ['focus-ring', 'surface-tint'],
    ['focus-ring', 'badge-bg'],
    ['focus-ring', 'selected-bg'],
    ['focus-ring-halo', 'link'],
  ])('large text / UI %s on %s meets 3:1', (fg, bg) => {
    expect(ratio(fg, bg)).toBeGreaterThanOrEqual(3);
  });
});
