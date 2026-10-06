// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import profile from '../../data/profile.json';
import { parseProfile } from '../../backend/src/schema';
import { renderProfile } from './render';

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
      'Principal Engineer & Enterprise Architect',
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

  it('renders the About Me section', () => {
    const about = root.querySelector('#about')!;
    expect(about.querySelector('h2')?.textContent).toBe('About Me');
    expect(about.textContent).toContain('8 years of experience');
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
    expect(projects).toHaveLength(19);
    const links = root.querySelectorAll<HTMLAnchorElement>('#portfolio article a');
    expect(links.length).toBe(data.portfolio.filter((p) => p.url).length);
    links.forEach((a) => expect(a.rel).toBe('noopener'));
  });

  it('renders the closing sections and a footer with the year', () => {
    expect(root.querySelectorAll('#why li')).toHaveLength(data.why.length);
    expect(root.querySelector('#links a[href^="mailto:"]')).not.toBeNull();
    expect(root.querySelector('footer')?.textContent).toBe('© 2030 Shyamsinh Parmar');
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
    expect(root.querySelector('img')).toBeNull();
    expect(root.querySelector('h1')?.textContent).toBe('<img src=x onerror=alert(1)>');
  });
});
