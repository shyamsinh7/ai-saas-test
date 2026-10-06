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
    el('li', {}, `${c.label}: `, c.href ? link(c.href, c.value) : c.value),
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
    el('input', { id: 'skills-filter-input', type: 'search', autocomplete: 'off' }),
  );
  const empty = el('p', {
    id: 'skills-empty',
    class: 'skills-empty',
    role: 'status',
    'aria-live': 'polite',
  });
  empty.hidden = true;
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
      { class: 'card project' },
      el('h3', {}, p.name),
      el('p', {}, p.description),
    );
    if (p.url) card.append(link(p.url, p.urlLabel ?? p.url));
    return card;
  });
  const count = profile.portfolio.length;
  const heading = count
    ? `My Portfolio (${count} ${count === 1 ? 'project' : 'projects'})`
    : 'My Portfolio';
  return section('portfolio', heading, el('div', { class: 'grid' }, ...cards));
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
    main,
    renderFooter(profile, year),
  );
}
