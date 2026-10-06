/** Plain, case-insensitive substring match; an empty or whitespace-only query matches everything. */
export function matchesSkill(item: string, query: string): boolean {
  const q = query.trim().toLowerCase();
  return q === '' || item.toLowerCase().includes(q);
}

export function initSkillsFilter(root: ParentNode = document): void {
  const input = root.querySelector<HTMLInputElement>('#skills-filter-input');
  if (!input) return;
  const empty = root.querySelector<HTMLElement>('#skills-empty');
  const cards = [...root.querySelectorAll<HTMLElement>('#skills .card')];

  const update = (): void => {
    let anyVisible = false;
    for (const card of cards) {
      const items = [...card.querySelectorAll<HTMLElement>('li')];
      for (const li of items) li.hidden = !matchesSkill(li.textContent ?? '', input.value);
      card.hidden = items.every((li) => li.hidden);
      if (!card.hidden) anyVisible = true;
    }
    if (empty) {
      const none = !anyVisible;
      empty.textContent = none ? 'No skills match' : '';
      empty.hidden = !none;
    }
  };

  input.addEventListener('input', update);
  update();
}
