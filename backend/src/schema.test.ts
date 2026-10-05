import { readFileSync } from 'node:fs';
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
    expect(raw.portfolio).toHaveLength(19);
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
    const portfolio = [{ name: 'a', description: 'b', url: 'ftp://example.com' }];
    expect(profileSchema.safeParse({ ...raw, portfolio }).success).toBe(false);
  });
});
