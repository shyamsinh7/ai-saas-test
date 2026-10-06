// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import profile from '../../data/profile.json';
import { parseProfile } from '../../backend/src/schema';
import { renderProfile } from './render';
import { buildUrl, initPortfolioFilter, matchesCategory, readCategory } from './portfolioFilter';

const data = parseProfile(profile);
const total = data.portfolio.length;
const categories: string[] = [...new Set(data.portfolio.map((p) => p.category))];

const mount = (portfolio = data.portfolio): void => {
  document.body.innerHTML = '<div id="app"></div>';
  renderProfile(document.getElementById('app')!, { ...data, portfolio }, 2030);
  initPortfolioFilter();
};
const cards = (): HTMLElement[] => [
  ...document.querySelectorAll<HTMLElement>('#portfolio article'),
];
const buttons = (): HTMLButtonElement[] => [
  ...document.querySelectorAll<HTMLButtonElement>('#portfolio .filter-btn'),
];
const status = (): HTMLElement => document.getElementById('portfolio-status')!;
const btn = (name: string): HTMLButtonElement => buttons().find((b) => b.textContent === name)!;
const countOf = (c: string): number => data.portfolio.filter((p) => p.category === c).length;

describe('matchesCategory', () => {
  it.each([
    ['AI', null, true],
    ['AI', '', true],
    ['AI', 'AI', true],
    ['AI', 'ai', false],
    ['AI', 'Web', false],
  ])('matchesCategory(%j, %j) is %s', (card, sel, expected) => {
    expect(matchesCategory(card, sel)).toBe(expected);
  });
});

describe('initPortfolioFilter', () => {
  beforeEach(() => mount());

  it('renders a labelled group of real buttons: All plus each distinct category', () => {
    const group = document.querySelector('#portfolio [role="group"]')!;
    expect(group.getAttribute('aria-label') ?? group.getAttribute('aria-labelledby')).toBeTruthy();
    expect(buttons().every((b) => b.tagName === 'BUTTON' && b.type === 'button')).toBe(true);
    expect(buttons().map((b) => b.textContent)).toEqual(['All', ...categories]);
  });

  it('starts with All pressed, every card visible and the total shown', () => {
    expect(btn('All').getAttribute('aria-pressed')).toBe('true');
    expect(cards().every((c) => !c.hidden)).toBe(true);
    expect(status().textContent).toBe(`Showing ${total} of ${total} projects`);
    expect(document.getElementById('portfolio-h')!.textContent).toBe(
      `My Portfolio (${total} projects)`,
    );
  });

  it('filters by category, hiding (not removing) other cards and updating the count', () => {
    const c = categories[0]!;
    btn(c).click();
    expect(cards()).toHaveLength(total);
    for (const card of cards()) expect(card.hidden).toBe(card.dataset.category !== c);
    expect(buttons().filter((b) => b.getAttribute('aria-pressed') === 'true')).toEqual([btn(c)]);
    const n = countOf(c);
    expect(status().textContent).toBe(`Showing ${n} of ${total} project${total === 1 ? '' : 's'}`);
    btn('All').click();
    expect(cards().every((x) => !x.hidden)).toBe(true);
    expect(status().textContent).toBe(`Showing ${total} of ${total} projects`);
  });

  it('announces politely and does not move focus', () => {
    expect(status().getAttribute('role')).toBe('status');
    expect(status().getAttribute('aria-live')).toBe('polite');
    const b = btn(categories[0]!);
    b.focus();
    b.click();
    expect(document.activeElement).toBe(b);
  });

  it('stays consistent after rapid repeated clicks', () => {
    const [a, b] = categories as [string, string];
    for (const c of [a, b, a, b, b, a]) btn(c).click();
    expect(cards().filter((x) => !x.hidden)).toHaveLength(countOf(a));
    expect(buttons().filter((x) => x.getAttribute('aria-pressed') === 'true')).toEqual([btn(a)]);
  });

  it('returns early when the elements are missing', () => {
    document.body.innerHTML = '<main></main>';
    expect(() => initPortfolioFilter()).not.toThrow();
  });
});

describe('edge-case data', () => {
  it('works with a single category', () => {
    mount(data.portfolio.filter((p) => p.category === categories[0]!));
    expect(buttons().map((b) => b.textContent)).toEqual(['All', categories[0]!]);
    btn(categories[0]!).click();
    expect(cards().every((c) => !c.hidden)).toBe(true);
  });

  it('uses the singular for one project', () => {
    mount(data.portfolio.slice(0, 1));
    expect(status().textContent).toBe('Showing 1 of 1 project');
  });

  it('renders no filter for zero projects', () => {
    mount([]);
    expect(document.querySelector('#portfolio [role="group"]')).toBeNull();
    expect(status()).toBeNull();
  });
});

describe('readCategory', () => {
  const known = ['AI', 'Backend/Cloud', 'Health care'];
  it.each([
    ['?category=AI', 'AI'],
    ['?category=Backend%2FCloud', 'Backend/Cloud'],
    ['?category=Health%20care', 'Health care'],
    ['?category=Health+care', 'Health care'],
    ['?x=1&category=AI', 'AI'],
    ['?category=AI&category=Health%20care', 'AI'],
    ['?category=ai', null],
    ['?category=', null],
    ['?category=%3Cscript%3E', null],
    ['?category=%E0%A4%A', null],
    ['?category=Nope', null],
    ['?other=AI', null],
    ['', null],
  ])('readCategory(%j) is %j', (search, expected) => {
    expect(readCategory(search, known)).toBe(expected);
  });
});

describe('buildUrl', () => {
  const loc = (search: string, hash = '') => ({ pathname: '/ai-saas-test/', search, hash });
  it.each([
    [loc('', '#portfolio'), 'AI', '/ai-saas-test/?category=AI#portfolio'],
    [loc('?a=1&category=Web', '#portfolio'), 'AI', '/ai-saas-test/?a=1&category=AI#portfolio'],
    [loc('?a=1&category=AI', '#portfolio'), null, '/ai-saas-test/?a=1#portfolio'],
    [loc('?category=AI', '#portfolio'), null, '/ai-saas-test/#portfolio'],
    [loc('?category=AI'), null, '/ai-saas-test/'],
    [loc('', ''), 'Health care', '/ai-saas-test/?category=Health+care'],
  ])('buildUrl(%j, %j) is %s', (l, c, expected) => {
    expect(buildUrl(l, c)).toBe(expected);
  });
});

describe('category in the URL', () => {
  const at = (url: string): void => history.replaceState(null, '', url);
  const pressed = (): string[] =>
    buttons()
      .filter((b) => b.getAttribute('aria-pressed') === 'true')
      .map((b) => b.textContent!);
  afterEach(() => at('/'));

  it('applies a known ?category= on load', () => {
    const c = categories[0]!;
    at(`/ai-saas-test/?category=${encodeURIComponent(c)}#portfolio`);
    mount();
    expect(pressed()).toEqual([c]);
    expect(cards().filter((x) => !x.hidden)).toHaveLength(countOf(c));
    expect(status().textContent).toContain(`Showing ${countOf(c)} of ${total}`);
    expect(location.search).toBe(`?category=${encodeURIComponent(c)}`);
  });

  it('does not rewrite the URL on load', () => {
    at('/ai-saas-test/#portfolio');
    mount();
    expect(location.pathname + location.search + location.hash).toBe('/ai-saas-test/#portfolio');
  });

  it.each(['?category=nope', '?category=', '?category=%3Cscript%3E', '?category=ai'])(
    'falls back to All for %s without injecting HTML',
    (q) => {
      at(`/${q}`);
      mount();
      expect(pressed()).toEqual(['All']);
      expect(cards().every((x) => !x.hidden)).toBe(true);
      expect(document.querySelector('script')).toBeNull();
      expect(document.body.innerHTML).not.toContain('<script');
    },
  );

  it('uses the first of repeated params', () => {
    const [a, b] = categories as [string, string];
    at(`/?category=${encodeURIComponent(a)}&category=${encodeURIComponent(b)}`);
    mount();
    expect(pressed()).toEqual([a]);
  });

  it('writes the category on click, keeping path, hash and other params', () => {
    at('/ai-saas-test/?utm=1#portfolio');
    mount();
    const c = categories[0]!;
    btn(c).click();
    expect(location.pathname).toBe('/ai-saas-test/');
    expect(new URLSearchParams(location.search).get('category')).toBe(c);
    expect(new URLSearchParams(location.search).get('utm')).toBe('1');
    expect(location.hash).toBe('#portfolio');
  });

  it('removes the param when All is clicked, keeping other params and hash', () => {
    at('/ai-saas-test/?utm=1#portfolio');
    mount();
    btn(categories[0]!).click();
    btn('All').click();
    expect(location.search).toBe('?utm=1');
    expect(location.hash).toBe('#portfolio');
    at('/ai-saas-test/#portfolio');
    mount();
    btn(categories[0]!).click();
    btn('All').click();
    expect(location.href.endsWith('/ai-saas-test/#portfolio')).toBe(true);
  });

  it('syncs buttons and cards on popstate', () => {
    at('/');
    mount();
    const c = categories[0]!;
    at(`/?category=${encodeURIComponent(c)}`);
    window.dispatchEvent(new PopStateEvent('popstate'));
    expect(pressed()).toEqual([c]);
    expect(cards().filter((x) => !x.hidden)).toHaveLength(countOf(c));
    at('/');
    window.dispatchEvent(new PopStateEvent('popstate'));
    expect(pressed()).toEqual(['All']);
  });
});
