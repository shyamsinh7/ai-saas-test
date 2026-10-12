import type { Profile } from '../../backend/src/schema';
import { loadProfile } from './data';
import { renderProfile } from './render';
import { initBackToTop } from './backToTop';
import { initSkillsFilter } from './skillsFilter';
import { initPortfolioFilter } from './portfolioFilter';

export type StartDeps = {
  load: () => Promise<Profile>;
  render: (root: HTMLElement, profile: Profile) => void;
  init: () => void;
  /** How long loading may take before the loading view is shown (avoids flicker). */
  delayMs: number;
};

const defaults: StartDeps = {
  load: () => loadProfile(),
  render: renderProfile,
  init: () => {
    initBackToTop();
    initSkillsFilter();
    initPortfolioFilter();
  },
  delayMs: 150,
};

function node<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tag);
  element.className = className;
  if (text) element.textContent = text;
  return element;
}

export function renderLoading(root: HTMLElement): void {
  const view = node('div', 'state state-loading');
  view.setAttribute('role', 'status');
  view.setAttribute('aria-live', 'polite');
  view.append(node('p', 'state-text', 'Loading profile…'));
  for (const size of ['wide', 'narrow', 'wide']) {
    const block = node('div', `skeleton skeleton-${size}`);
    block.setAttribute('aria-hidden', 'true');
    view.append(block);
  }
  root.replaceChildren(view);
}

export function renderError(root: HTMLElement, onRetry: () => void): void {
  const view = node('div', 'state state-error');
  view.setAttribute('role', 'alert');
  const heading = node('h2', 'state-title', "We couldn't load this profile");
  heading.tabIndex = -1;
  const button = node('button', 'retry-btn', 'Retry');
  button.type = 'button';
  button.addEventListener('click', () => {
    button.disabled = true;
    button.setAttribute('aria-busy', 'true');
    onRetry();
  });
  view.append(
    heading,
    node('p', 'state-text', 'Something went wrong while loading the page. Please try again.'),
    button,
  );
  root.replaceChildren(view);
  heading.focus();
}

/**
 * Loads and renders the profile into `root`, showing a loading view if it is slow
 * and an error view with a Retry action if loading or rendering fails.
 * Resolves after the first attempt has settled; never rejects.
 */
export async function startApp(root: HTMLElement, deps: Partial<StartDeps> = {}): Promise<void> {
  const { load, render, init, delayMs } = { ...defaults, ...deps };
  let inFlight = false;

  async function attempt(isRetry = false): Promise<void> {
    if (inFlight) return;
    inFlight = true;
    const timer = setTimeout(() => renderLoading(root), delayMs);
    try {
      const profile = await load();
      render(root, profile);
      clearTimeout(timer);
      init();
      const heading = root.querySelector<HTMLElement>('h1');
      if (isRetry && heading) {
        heading.tabIndex = -1;
        heading.focus({ preventScroll: true });
      }
    } catch (error) {
      clearTimeout(timer);
      console.error(error);
      renderError(root, () => void attempt(true));
    } finally {
      inFlight = false;
    }
  }

  await attempt();
}
