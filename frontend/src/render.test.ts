// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import profile from '../../data/profile.json';
import { parseProfile } from '../../backend/src/schema';
import { formatUpdatedAt, renderProfile } from './render';

const data = parseProfile(profile);
let root: HTMLElement;

beforeEach(() => {
  document.body.innerHTML = '<div id="app"></div>';
  root = document.getElementById('app')!;
  renderProfile(root, data, 2030);
});

describe('renderProfile', () => {
  it('shows the name and title in the header and document title', () => {
    expect(root.querySelector('h1')?.textContent).toBe('Shyamsinh Parmar');
    expect(root.querySelector('.role')?.textContent).toBe(
      'AI Agent Engineer | AI-native SaaS & Autonomous Business Systems',
    );
    expect(document.title).toContain('Shyamsinh Parmar');
  });

  it('renders contact links, keeping emails and phone numbers', () => {
    const hrefs = [...root.querySelectorAll<HTMLAnchorElement>('#contact a')].map((a) =>
      a.getAttribute('href'),
    );
    expect(hrefs).toContain('mailto:parmarshyamsingh8@gmail.com');
    expect(hrefs).toContain('tel:+918866060908');
    expect(root.querySelectorAll('#contact li')).toHaveLength(data.contacts.length);
  });

  it('contacts without a link render as plain text with the no-link class', () => {
    const lis = [...root.querySelectorAll<HTMLElement>('#contact li')];
    expect(lis).toHaveLength(data.contacts.length);
    data.contacts.forEach((c, i) => {
      const li = lis[i]!;
      expect(li.classList.contains('no-link')).toBe(!c.href);
      expect(li.querySelector('a') === null).toBe(!c.href);
      expect(li.textContent).toBe(`${c.label}: ${c.value}`);
    });
    expect(root.querySelectorAll('#contact li.no-link').length).toBeGreaterThan(0);
  });

  it('renders the About Me section', () => {
    const about = root.querySelector('#about')!;
    expect(about.querySelector('h2')?.textContent).toBe('About Me');
    expect(about.textContent).toContain('8+ years of software engineering experience');
    expect(about.querySelectorAll('li')).toHaveLength(data.about.highlights.length);
  });

  it('renders a card for every skill category', () => {
    const cards = root.querySelectorAll('#skills .card');
    expect(root.querySelector('#skills h2')?.textContent).toBe('Core Skills & Technologies');
    expect(cards).toHaveLength(data.skills.length);
    expect(cards[0]?.querySelector('h3')?.textContent).toBe('Languages');
  });

  describe('portfolio heading count', () => {
    const headingFor = (n: number) => {
      renderProfile(root, { ...data, portfolio: data.portfolio.slice(0, n) });
      return root.querySelector('#portfolio-h')?.textContent;
    };
    it('shows no count when there are no projects', () => {
      expect(headingFor(0)).toBe('My Portfolio');
    });
    it('uses the singular for one project', () => {
      expect(headingFor(1)).toBe('My Portfolio (1 project)');
    });
    it('uses the plural for several projects', () => {
      expect(headingFor(3)).toBe('My Portfolio (3 projects)');
      renderProfile(root, data);
      expect(root.querySelector('#portfolio-h')?.textContent).toBe(
        `My Portfolio (${data.portfolio.length} projects)`,
      );
    });
  });

  it('renders every portfolio project, with safe links only where a url exists', () => {
    const projects = root.querySelectorAll('#portfolio article');
    expect(projects).toHaveLength(23);
    const links = root.querySelectorAll<HTMLAnchorElement>('#portfolio article a');
    expect(links.length).toBe(data.portfolio.filter((p) => p.url).length);
    links.forEach((a) => expect(a.rel).toBe('noopener'));
  });

  it('renders the category filter row and status without changing the heading total', () => {
    expect(root.querySelectorAll('#portfolio .filter-btn').length).toBeGreaterThan(1);
    expect(root.querySelector('#portfolio-status')?.textContent).toBe(
      `Showing ${data.portfolio.length} of ${data.portfolio.length} projects`,
    );
    expect(root.querySelector('#portfolio-h')?.textContent).toBe(
      `My Portfolio (${data.portfolio.length} projects)`,
    );
  });

  describe('portfolio cards', () => {
    const cards = () => [
      ...root.querySelectorAll<HTMLElement>('#portfolio .grid > article.card.project'),
    ];

    it('renders every project as article.card.project inside .grid', () => {
      expect(cards()).toHaveLength(data.portfolio.length);
    });

    it('shows name, summary, category badge and a ul/li tag list per card', () => {
      cards().forEach((card, i) => {
        const p = data.portfolio[i]!;
        expect(card.querySelector('h3')?.textContent).toBe(p.name);
        expect(card.querySelector('p.summary')?.textContent).toBe(p.summary);
        expect(card.querySelector('.badge')?.textContent).toBe(p.category);
        expect(card.dataset.category).toBe(p.category);
        const tags = [...card.querySelectorAll('ul.tags > li')].map((li) => li.textContent);
        expect(tags).toEqual(p.tags);
      });
    });

    it('gives linked cards a descriptive link containing the project name', () => {
      cards().forEach((card, i) => {
        const p = data.portfolio[i]!;
        const a = card.querySelector('a');
        if (!p.url) return;
        expect(a?.getAttribute('href')).toBe(p.url);
        expect(a?.textContent).toBe(p.urlLabel ?? p.url);
        const name = a?.getAttribute('aria-label') ?? a?.textContent ?? '';
        expect(name).toContain(p.name);
        expect(name).toContain(a?.textContent ?? '');
        expect(a?.rel).toBe('noopener');
      });
    });

    it('shows each project screenshot as a lazy-loaded image with alt text', () => {
      cards().forEach((card, i) => {
        const p = data.portfolio[i]!;
        const img = card.querySelector('img');
        expect(img?.getAttribute('src')).toBe(p.image);
        expect(img?.getAttribute('alt')).toBe(`${p.name} screenshot`);
        expect(img?.getAttribute('loading')).toBe('lazy');
      });
    });

    it('renders no image for a project without one', () => {
      renderProfile(root, {
        ...data,
        portfolio: [{ ...data.portfolio[0]!, image: undefined }],
      });
      expect(root.querySelector('#portfolio article img')).toBeNull();
    });

    it('renders no anchor for a project without a url', () => {
      const idx = data.portfolio.findIndex((p) => p.name.includes('Handytrack'));
      expect(idx).toBeGreaterThanOrEqual(0);
      expect(data.portfolio[idx]!.url).toBeUndefined();
      expect(cards()[idx]!.querySelector('a')).toBeNull();
    });

    it('uses the url as link text when there is no urlLabel', () => {
      renderProfile(root, {
        ...data,
        portfolio: [{ ...data.portfolio[0]!, url: 'https://example.com/x', urlLabel: undefined }],
      });
      const a = root.querySelector('#portfolio article a')!;
      expect(a.textContent).toBe('https://example.com/x');
      expect(a.getAttribute('aria-label')).toContain(data.portfolio[0]!.name);
    });

    it('keeps section ids and renders an empty portfolio without error', () => {
      expect(root.querySelector('#portfolio')).not.toBeNull();
      expect(root.querySelector('#portfolio-h')).not.toBeNull();
      expect(() => renderProfile(root, { ...data, portfolio: [] })).not.toThrow();
      expect(root.querySelectorAll('#portfolio article')).toHaveLength(0);
      expect(root.querySelector('#portfolio-h')?.textContent).toBe('My Portfolio');
    });
  });

  it('renders the closing sections and a footer with the year', () => {
    expect(root.querySelectorAll('#why li')).toHaveLength(data.why.length);
    expect(root.querySelector('#links a[href^="mailto:"]')).not.toBeNull();
    expect(root.querySelector('footer .copyright')?.textContent).toBe('© 2030 Shyamsinh Parmar');
  });

  it('renders Get in Touch without any anchor when no mailto or github contact has a url', () => {
    renderProfile(root, {
      ...data,
      contacts: data.contacts.map((c) => ({ label: c.label, value: c.value })),
    });
    expect(root.querySelector('#links-h')?.textContent).toBe('Get in Touch');
    expect(root.querySelector('#links a')).toBeNull();
  });

  it('labels each section by its heading and offers a skip link', () => {
    for (const id of ['about', 'skills', 'portfolio', 'why', 'links']) {
      const section = root.querySelector(`#${id}`)!;
      expect(section.getAttribute('aria-labelledby')).toBe(`${id}-h`);
      expect(root.querySelector(`#${id}-h`)).not.toBeNull();
    }
    expect(root.querySelector('a.skip-link')?.getAttribute('href')).toBe('#main');
  });

  it('treats profile text as text, not HTML', () => {
    renderProfile(root, { ...data, name: '<img src=x onerror=alert(1)>' });
    expect(root.querySelector('header img')).toBeNull();
    expect(root.querySelector('h1')?.textContent).toBe('<img src=x onerror=alert(1)>');
  });
});

describe('footer last-updated date', () => {
  it('formats an ISO date in English', () => {
    expect(formatUpdatedAt('2026-10-06')).toBe('6 October 2026');
    expect(formatUpdatedAt('2026-01-31')).toBe('31 January 2026');
  });

  it('shows the formatted date in the footer', () => {
    expect(root.querySelector('footer .updated')?.textContent).toBe(
      'Last updated: 10 October 2026',
    );
  });

  it('returns nothing for a missing or invalid date', () => {
    expect(formatUpdatedAt(undefined)).toBeUndefined();
    expect(formatUpdatedAt('')).toBeUndefined();
    expect(formatUpdatedAt('2026-13-45')).toBeUndefined();
    expect(formatUpdatedAt('soon')).toBeUndefined();
  });

  it('renders no date and does not break without updatedAt', () => {
    renderProfile(root, { ...data, updatedAt: undefined }, 2030);
    expect(root.querySelector('footer .updated')).toBeNull();
    expect(root.querySelector('footer')?.textContent).toBe('© 2030 Shyamsinh Parmar');
  });

  describe('table of contents', () => {
    const toc = () => root.querySelector('nav[aria-label="Table of contents"]')!;

    it('sits between the header and main', () => {
      expect(toc().previousElementSibling?.tagName).toBe('HEADER');
      expect(toc().nextElementSibling?.tagName).toBe('MAIN');
    });

    it('links to About Me, Core Skills and My Portfolio in order', () => {
      const links = [...toc().querySelectorAll('a')];
      expect(links.map((a) => a.textContent)).toEqual(['About Me', 'Core Skills', 'My Portfolio']);
      expect(links.map((a) => a.getAttribute('href'))).toEqual(['#about', '#skills', '#portfolio']);
    });

    it('points at sections that exist', () => {
      for (const a of toc().querySelectorAll('a')) {
        expect(root.querySelector(a.getAttribute('href')!)).not.toBeNull();
      }
    });

    it('keeps the skip link first', () => {
      expect(root.firstElementChild?.classList.contains('skip-link')).toBe(true);
    });
  });
});

describe('skills filter markup', () => {
  it('renders a labelled input before the grid, with a hidden live message', () => {
    const section = root.querySelector('#skills')!;
    const label = section.querySelector('label[for="skills-filter-input"]')!;
    expect(label.textContent).toBe('Filter skills');
    const input = section.querySelector('input#skills-filter-input')!;
    const grid = section.querySelector('.grid')!;
    expect(input.compareDocumentPosition(grid) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    const empty = section.querySelector('#skills-empty')!;
    expect(empty.hasAttribute('hidden')).toBe(true);
    expect(empty.getAttribute('role')).toBe('status');
    expect(empty.getAttribute('aria-live')).toBe('polite');
    expect(section.querySelectorAll('.card')).toHaveLength(10);
    expect(section.querySelectorAll('.card[hidden]')).toHaveLength(0);
  });
});
