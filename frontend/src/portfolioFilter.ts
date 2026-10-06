/** Exact category match; null or '' means "All". */
export function matchesCategory(cardCategory: string, selected: string | null): boolean {
  return !selected || cardCategory === selected;
}

export function initPortfolioFilter(root: ParentNode = document): void {
  const group = root.querySelector<HTMLElement>('#portfolio .portfolio-filter');
  const status = root.querySelector<HTMLElement>('#portfolio-status');
  const cards = [...root.querySelectorAll<HTMLElement>('#portfolio article.project')];
  if (!group || !status || cards.length === 0) return;
  const buttons = [...group.querySelectorAll<HTMLButtonElement>('.filter-btn')];

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
    if (b && group.contains(b)) apply(b.dataset.category ?? null);
  });
  apply(null);
}
