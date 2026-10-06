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
    const query = input.value;
    let anyVisible = false;
    for (const card of cards) {
      let cardVisible = false;
      for (const li of card.querySelectorAll('li')) {
        li.hidden = !matchesSkill(li.textContent ?? '', query);
        if (!li.hidden) cardVisible = true;
      }
      card.hidden = !cardVisible;
      if (cardVisible) anyVisible = true;
    }
    if (empty) {
      const none = !anyVisible && query.trim() !== '';
      empty.textContent = none ? 'No skills match' : '';
      empty.hidden = !none;
    }
  };

  input.addEventListener('input', update);
  update();
}
