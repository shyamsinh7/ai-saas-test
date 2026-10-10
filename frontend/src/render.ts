import type { Profile } from '../../backend/src/schema';

type Child = Node | string;

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Record<string, string> = {},
  ...children: Child[]
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
  node.append(...children);
  return node;
}

function link(href: string, label: string): HTMLAnchorElement {
  const attrs: Record<string, string> = { href };
  if (href.startsWith('http')) attrs.rel = 'noopener';
  return el('a', attrs, label);
}

const TOC_LINKS = [
  ['About Me', '#about'],
  ['Core Skills', '#skills'],
  ['My Portfolio', '#portfolio'],
] as const;

function renderToc(): HTMLElement {
  return el(
    'nav',
    { class: 'toc', 'aria-label': 'Table of contents' },
    el(
      'ul',
      { class: 'plain' },
      ...TOC_LINKS.map(([label, href]) => el('li', {}, link(href, label))),
    ),
  );
}

function section(id: string, heading: string, ...children: Node[]): HTMLElement {
  return el(
    'section',
    { id, 'aria-labelledby': `${id}-h` },
    el('h2', { id: `${id}-h` }, heading),
    ...children,
  );
}

function renderHeader(profile: Profile): HTMLElement {
  const items = profile.contacts.map((c) =>
    el(
      'li',
      c.href ? {} : { class: 'no-link' },
      `${c.label}: `,
      c.href ? link(c.href, c.value) : c.value,
    ),
  );
  return el(
    'header',
    {},
    el('h1', {}, profile.name),
    el('p', { class: 'role' }, profile.title),
    el('ul', { class: 'plain contact', id: 'contact', 'aria-label': 'Contact' }, ...items),
  );
}

function renderAbout(profile: Profile): HTMLElement {
  const highlights = profile.about.highlights.map((h) =>
    el('li', {}, el('strong', {}, h.title), ` – ${h.text}`),
  );
  return section(
    'about',
    'About Me',
    el('p', {}, profile.about.summary),
    el('ul', {}, ...highlights),
  );
}

function renderSkills(profile: Profile): HTMLElement {
  const cards = profile.skills.map((s) =>
    el(
      'div',
      { class: 'card' },
      el('h3', {}, s.category),
      el('ul', {}, ...s.items.map((i) => el('li', {}, i))),
    ),
  );
  const filter = el(
    'div',
    { class: 'skills-filter' },
    el('label', { for: 'skills-filter-input' }, 'Filter skills'),
    el('input', {
      id: 'skills-filter-input',
      type: 'search',
      autocomplete: 'off',
      placeholder: 'e.g. LangChain',
    }),
  );
  const empty = el('p', {
    id: 'skills-empty',
    class: 'skills-empty',
    role: 'status',
    'aria-live': 'polite',
    hidden: '',
  });
  return section(
    'skills',
    'Core Skills & Technologies',
    filter,
    empty,
    el('div', { class: 'grid' }, ...cards),
  );
}

function renderPortfolio(profile: Profile): HTMLElement {
  const cards = profile.portfolio.map((p) => {
    const card = el(
      'article',
      { class: 'card project', 'data-category': p.category },
      ...(p.image
        ? [el('img', { src: p.image, alt: `${p.name} screenshot`, loading: 'lazy' })]
        : []),
      el('h3', {}, p.name),
      el('span', { class: 'badge' }, p.category),
      el('p', { class: 'summary' }, p.summary),
      el('ul', { class: 'tags' }, ...p.tags.map((t) => el('li', {}, t))),
    );
    if (p.url) {
      const label = p.urlLabel ?? p.url;
      const a = link(p.url, label);
      // Keep the visible text inside the accessible name (WCAG 2.5.3) while naming the project.
      if (!label.includes(p.name)) a.setAttribute('aria-label', `${p.name} – ${label}`);
      card.append(a);
    }
    return card;
  });
  const count = profile.portfolio.length;
  const heading = count
    ? `My Portfolio (${count} ${count === 1 ? 'project' : 'projects'})`
    : 'My Portfolio';
  const categories = [...new Set(profile.portfolio.map((p) => p.category))];
  const filter: Node[] = count
    ? [
        el(
          'div',
          { class: 'portfolio-filter', role: 'group', 'aria-label': 'Filter projects by category' },
          el('button', { type: 'button', class: 'filter-btn', 'aria-pressed': 'true' }, 'All'),
          ...categories.map((c) =>
            el(
              'button',
              { type: 'button', class: 'filter-btn', 'data-category': c, 'aria-pressed': 'false' },
              c,
            ),
          ),
        ),
        el(
          'p',
          {
            id: 'portfolio-status',
            class: 'portfolio-status',
            role: 'status',
            'aria-live': 'polite',
          },
          `Showing ${count} of ${count} ${count === 1 ? 'project' : 'projects'}`,
        ),
      ]
    : [];
  return section('portfolio', heading, ...filter, el('div', { class: 'grid' }, ...cards));
}

function renderWhy(profile: Profile): HTMLElement {
  return section(
    'why',
    'Why Work with Me?',
    el('ul', {}, ...profile.why.map((w) => el('li', {}, w))),
  );
}

function renderGetInTouch(profile: Profile): HTMLElement {
  const email = profile.contacts.find((c) => c.href?.startsWith('mailto:'));
  const github = profile.contacts.find((c) => c.href?.startsWith('https://github.com/'));
  const parts: Child[] = [];
  if (email?.href) parts.push('Email ', link(email.href, email.value));
  if (github?.href) {
    parts.push(
      parts.length ? ' or explore my work on ' : 'Explore my work on ',
      link(github.href, 'GitHub'),
    );
  }
  parts.push('.');
  return section('links', 'Get in Touch', el('p', {}, ...parts));
}

/** Formats an ISO date (YYYY-MM-DD) as e.g. "6 October 2026"; undefined if absent or invalid. */
export function formatUpdatedAt(iso: string | undefined): string | undefined {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return undefined;
  const date = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return undefined;
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

function renderFooter(profile: Profile, year: number): HTMLElement {
  const updated = formatUpdatedAt(profile.updatedAt);
  return el(
    'footer',
    { id: 'footer' },
    el('span', { class: 'copyright' }, `© ${year} ${profile.name}`),
    ...(updated ? [el('span', { class: 'updated' }, `Last updated: ${updated}`)] : []),
  );
}

/** Renders the whole profile page into `root`, replacing its content. */
export function renderProfile(
  root: HTMLElement,
  profile: Profile,
  year = new Date().getFullYear(),
): void {
  document.title = `${profile.name} – ${profile.title}`;
  const main = el(
    'main',
    { id: 'main' },
    renderAbout(profile),
    renderSkills(profile),
    renderPortfolio(profile),
    ...(profile.why.length ? [renderWhy(profile)] : []),
    renderGetInTouch(profile),
  );
  root.replaceChildren(
    el('a', { class: 'skip-link', href: '#main' }, 'Skip to content'),
    renderHeader(profile),
    renderToc(),
    main,
    renderFooter(profile, year),
  );
}
