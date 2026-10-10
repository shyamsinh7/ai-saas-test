import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseProfile, profileSchema } from './schema.js';

const raw = JSON.parse(
  readFileSync(path.resolve(import.meta.dirname, '../../data/profile.json'), 'utf8'),
);

describe('data/profile.json', () => {
  it('matches the schema', () => {
    expect(profileSchema.safeParse(raw).success).toBe(true);
  });

  it('keeps the contact details and all portfolio projects', () => {
    const hrefs = parseProfile(raw).contacts.map((c) => c.href);
    expect(hrefs).toContain('mailto:parmarshyamsingh8@gmail.com');
    expect(hrefs).toContain('tel:+918866060908');
    expect(raw.portfolio).toHaveLength(23);
  });

  it('gives every project a summary, category and at least one tag', () => {
    for (const p of parseProfile(raw).portfolio) {
      expect(p.summary.length).toBeGreaterThan(0);
      expect(p.category.length).toBeGreaterThan(0);
      expect(p.tags.length).toBeGreaterThan(0);
    }
  });

  it('gives every project a screenshot that exists under frontend/public', () => {
    for (const p of parseProfile(raw).portfolio) {
      expect(p.image, p.name).toBeDefined();
      expect(existsSync(path.resolve(import.meta.dirname, '../../frontend/public', p.image!))).toBe(
        true,
      );
    }
  });

  it('keeps Handytrack valid without a url', () => {
    const stockly = parseProfile(raw).portfolio.find((p) => p.name === 'Handytrack');
    expect(stockly?.url).toBeUndefined();
  });
});

const project = { name: 'a', description: 'b', summary: 's', category: 'AI', tags: ['t'] };

function withProject0(patch: Record<string, unknown>) {
  const portfolio = [{ ...raw.portfolio[0], ...patch }, ...raw.portfolio.slice(1)];
  return { ...raw, portfolio };
}

describe('profileSchema portfolio fields', () => {
  it.each([
    ['missing category', { category: undefined }],
    ['empty category', { category: '' }],
    ['whitespace category', { category: '   ' }],
    ['missing tags', { tags: undefined }],
    ['empty tags array', { tags: [] }],
    ['blank tag', { tags: ['ok', '  '] }],
    ['missing summary', { summary: undefined }],
    ['empty summary', { summary: '' }],
  ])('rejects %s', (_label, patch) => {
    expect(profileSchema.safeParse(withProject0(patch)).success).toBe(false);
  });

  it('trims category and tags', () => {
    const parsed = parseProfile(withProject0({ category: ' AI ', tags: [' x '] }));
    expect(parsed.portfolio[0]?.category).toBe('AI');
    expect(parsed.portfolio[0]?.tags).toEqual(['x']);
  });
});

describe('profileSchema', () => {
  it('rejects a missing name', () => {
    expect(profileSchema.safeParse({ ...raw, name: undefined }).success).toBe(false);
  });

  it('rejects an empty skills list', () => {
    expect(profileSchema.safeParse({ ...raw, skills: [] }).success).toBe(false);
  });

  it('rejects unsafe contact links', () => {
    const contacts = [{ label: 'x', value: 'y', href: 'javascript:alert(1)' }];
    expect(profileSchema.safeParse({ ...raw, contacts }).success).toBe(false);
  });

  it('rejects a project with a non-http url', () => {
    const portfolio = [{ ...project, url: 'ftp://example.com' }];
    expect(profileSchema.safeParse({ ...raw, portfolio }).success).toBe(false);
  });

  it('accepts a profile without updatedAt', () => {
    expect(profileSchema.safeParse({ ...raw, updatedAt: undefined }).success).toBe(true);
  });

  it('rejects an updatedAt that is not an ISO date', () => {
    expect(profileSchema.safeParse({ ...raw, updatedAt: '6 October 2026' }).success).toBe(false);
    expect(profileSchema.safeParse({ ...raw, updatedAt: '2026-13-45' }).success).toBe(false);
  });
});

describe('project image', () => {
  it('accepts a relative image path', () => {
    expect(profileSchema.safeParse(withProject0({ image: 'projects/a.jpg' })).success).toBe(true);
  });

  it.each(['javascript:alert(1)', '//evil.example/x.jpg', '../x.jpg', '/abs.jpg', ''])(
    'rejects the unsafe image %j',
    (image) => {
      expect(profileSchema.safeParse(withProject0({ image })).success).toBe(false);
    },
  );
});
