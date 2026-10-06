/** The button shows once the visitor has scrolled down more than one screen height. */
export function shouldShowBackToTop(scrollY: number, viewportHeight: number): boolean {
  return scrollY > viewportHeight;
}

export function initBackToTop(): HTMLButtonElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'back-to-top';
  button.textContent = 'Back to top';
  button.hidden = true;
  document.body.append(button);

  const update = (): void => {
    button.hidden = !shouldShowBackToTop(window.scrollY, window.innerHeight);
  };

  button.addEventListener('click', () => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    const heading = document.querySelector<HTMLElement>('h1');
    if (heading) {
      heading.tabIndex = -1;
      heading.focus({ preventScroll: true });
    }
  });

  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  update();
  return button;
}
