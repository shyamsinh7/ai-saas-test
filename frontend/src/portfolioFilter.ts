/** Exact category match; null or '' means "All". */
export function matchesCategory(cardCategory: string, selected: string | null): boolean {
  return !selected || cardCategory === selected;
}

/**
 * Category from `?category=`: the first occurrence, matched EXACTLY (case-sensitive) against the
 * known categories. Anything else (missing, empty, unknown, wrong case) is null, i.e. "All".
 */
export function readCategory(search: string, known: string[]): string | null {
  const value = new URLSearchParams(search).get('category');
  return value !== null && known.includes(value) ? value : null;
}

/** Same location with `category` set (or removed for null); other params and the hash are kept. */
export function buildUrl(
  loc: { pathname: string; search: string; hash: string },
  category: string | null,
): string {
  const params = new URLSearchParams(loc.search);
  if (category) params.set('category', category);
  else params.delete('category');
  const query = params.toString();
  return loc.pathname + (query ? `?${query}` : '') + loc.hash;
}

export function initPortfolioFilter(root: ParentNode = document): void {
  const group = root.querySelector<HTMLElement>('#portfolio .portfolio-filter');
  const status = root.querySelector<HTMLElement>('#portfolio-status');
  const cards = [...root.querySelectorAll<HTMLElement>('#portfolio article.project')];
  if (!group || !status || cards.length === 0) return;
  const buttons = [...group.querySelectorAll<HTMLButtonElement>('.filter-btn')];

  const known = buttons.map((b) => b.dataset.category ?? '').filter(Boolean);
  const fromUrl = (): string | null => readCategory(location.search, known);

  const apply = (selected: string | null): void => {
    let shown = 0;
    for (const card of cards) {
      card.hidden = !matchesCategory(card.dataset.category ?? '', selected);
      if (!card.hidden) shown++;
    }
    for (const b of buttons) {
      const isSelected = (b.dataset.category ?? null) === (selected || null);
      b.setAttribute('aria-pressed', String(isSelected));
    }
    status.textContent = `Showing ${shown} of ${cards.length} ${cards.length === 1 ? 'project' : 'projects'}`;
  };

  group.addEventListener('click', (e) => {
    const b = (e.target as Element).closest<HTMLButtonElement>('.filter-btn');
    if (!b || !group.contains(b)) return;
    const selected = b.dataset.category || null;
    apply(selected);
    history.replaceState(history.state, '', buildUrl(location, selected));
  });
  window.addEventListener('popstate', () => apply(fromUrl()));
  apply(fromUrl());
}
