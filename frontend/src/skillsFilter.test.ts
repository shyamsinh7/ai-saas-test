// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import profile from '../../data/profile.json';
import { parseProfile } from '../../backend/src/schema';
import { renderProfile } from './render';
import { initSkillsFilter, matchesSkill } from './skillsFilter';

describe('matchesSkill', () => {
  it.each([
    ['LangChain', '', true],
    ['LangChain', '   ', true],
    ['LangChain', 'lang', true],
    ['LangChain', 'LANGCHAIN', true],
    ['LangChain', '  chain  ', true],
    ['C++', 'c++', true],
    ['Java', 'c++', false],
    ['Node (LTS)', '(', true],
    ['Java', '.', false],
    ['Node.js', '.', true],
    ['LangChain', 'zzz', false],
    ['LangChain', 'x'.repeat(10000), false],
  ])('matchesSkill(%j, %j) is %s', (item, query, expected) => {
    expect(matchesSkill(item, query)).toBe(expected);
  });
});

describe('initSkillsFilter', () => {
  let input: HTMLInputElement;
  let empty: HTMLElement;
  const cards = (): HTMLElement[] => [...document.querySelectorAll<HTMLElement>('#skills .card')];
  const type = (value: string): void => {
    input.value = value;
    input.dispatchEvent(new Event('input'));
  };

  beforeEach(() => {
    document.body.innerHTML = '<div id="app"></div>';
    renderProfile(document.getElementById('app')!, parseProfile(profile), 2030);
    initSkillsFilter();
    input = document.getElementById('skills-filter-input') as HTMLInputElement;
    empty = document.getElementById('skills-empty')!;
  });

  it('hides non-matching items and cards, keeping matches visible', () => {
    type('  langchain ');
    const visible = cards().filter((c) => !c.hidden);
    expect(visible.length).toBeGreaterThan(0);
    expect(visible.length).toBeLessThan(8);
    for (const card of visible) {
      const shown = [...card.querySelectorAll('li')].filter((li) => !li.hidden);
      expect(shown.length).toBeGreaterThan(0);
      for (const li of shown) expect(li.textContent!.toLowerCase()).toContain('langchain');
    }
    expect(empty.hidden).toBe(true);
    expect(cards()).toHaveLength(8);
  });

  it('shows a polite message when nothing matches', () => {
    type('zzzz');
    expect(cards().every((c) => c.hidden)).toBe(true);
    expect(empty.hidden).toBe(false);
    expect(empty.textContent).toBe('No skills match');
    expect(empty.getAttribute('aria-live')).toBe('polite');
  });

  it('restores everything when cleared or whitespace-only', () => {
    type('zzzz');
    type('langchain');
    type('   ');
    expect(document.querySelectorAll('#skills [hidden]:not(#skills-empty)')).toHaveLength(0);
    expect(empty.hidden).toBe(true);
    expect(empty.textContent).toBe('');
  });

  it('is a no-op when the input is absent', () => {
    document.body.innerHTML = '';
    expect(() => initSkillsFilter()).not.toThrow();
  });
});
