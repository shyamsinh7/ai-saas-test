// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import profile from '../../data/profile.json';
import { parseProfile } from '../../backend/src/schema';
import { renderProfile } from './render';
import { initSkillsFilter, matchesSkill } from './skillsFilter';

describe('matchesSkill', () => {
  it('matches everything for an empty or whitespace-only query', () => {
    expect(matchesSkill('Python', '')).toBe(true);
    expect(matchesSkill('Python', '   ')).toBe(true);
  });

  it('ignores case and surrounding spaces', () => {
    expect(matchesSkill('LangChain, LangGraph', '  LANGCHAIN ')).toBe(true);
    expect(matchesSkill('LangChain', 'chain')).toBe(true);
  });

  it('treats regex characters literally', () => {
    expect(matchesSkill('C++, Go', 'c++')).toBe(true);
    expect(matchesSkill('Node.js', '.js')).toBe(true);
    expect(matchesSkill('Nodexjs', '.js')).toBe(false);
    expect(matchesSkill('foo (bar)', '(')).toBe(true);
    expect(matchesSkill('foo', '(')).toBe(false);
  });

  it('does not match unrelated or very long queries', () => {
    expect(matchesSkill('Python', 'zzzz')).toBe(false);
    expect(matchesSkill('Python', 'p'.repeat(10000))).toBe(false);
  });
});

describe('initSkillsFilter', () => {
  let input: HTMLInputElement;
  let empty: HTMLElement;
  const cards = (): HTMLElement[] => [...document.querySelectorAll<HTMLElement>('#skills .card')];

  function type(value: string): void {
    input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }

  beforeEach(() => {
    document.body.innerHTML = '<div id="app"></div>';
    renderProfile(document.getElementById('app')!, parseProfile(profile), 2030);
    initSkillsFilter();
    input = document.getElementById('skills-filter-input') as HTMLInputElement;
    empty = document.getElementById('skills-empty')!;
  });

  it('hides non-matching items and cards but keeps matching ones', () => {
    type(' langchain ');
    const visible = cards().filter((c) => !c.hidden);
    expect(visible).toHaveLength(1);
    expect(visible[0]?.querySelector('h3')?.textContent).toBe('AI Frameworks');
    const items = [...(visible[0]?.querySelectorAll('li') ?? [])];
    expect(items.filter((li) => !li.hidden).map((li) => li.textContent)).toEqual([
      'LangChain, LangGraph, LlamaIndex',
    ]);
    expect(items.some((li) => li.hidden)).toBe(true);
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
    type('');
    expect(document.querySelectorAll('#skills [hidden]:not(#skills-empty)')).toHaveLength(0);
    expect(empty.hidden).toBe(true);
    type('langchain');
    type('   ');
    expect(document.querySelectorAll('#skills [hidden]:not(#skills-empty)')).toHaveLength(0);
    expect(empty.hidden).toBe(true);
  });

  it('is a no-op when the input is absent', () => {
    document.body.innerHTML = '';
    expect(() => initSkillsFilter()).not.toThrow();
  });
});
