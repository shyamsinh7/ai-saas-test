// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { initBackToTop, shouldShowBackToTop } from './backToTop';

describe('shouldShowBackToTop', () => {
  it('is hidden at the top and up to one screen height', () => {
    expect(shouldShowBackToTop(0, 800)).toBe(false);
    expect(shouldShowBackToTop(800, 800)).toBe(false);
  });

  it('shows once scrolled more than one screen height', () => {
    expect(shouldShowBackToTop(801, 800)).toBe(true);
  });
});

describe('initBackToTop', () => {
  const scrollTo = vi.fn();

  beforeEach(() => {
    document.body.innerHTML = '<h1>Name</h1>';
    scrollTo.mockClear();
    window.scrollTo = scrollTo as unknown as typeof window.scrollTo;
    window.matchMedia = ((q: string) => ({
      matches: q.includes('reduce') && reduced,
    })) as unknown as typeof window.matchMedia;
    reduced = false;
    Object.defineProperty(window, 'innerHeight', { value: 800, configurable: true });
    setScroll(0);
  });

  let reduced = false;
  function setScroll(y: number): void {
    Object.defineProperty(window, 'scrollY', { value: y, configurable: true });
    window.dispatchEvent(new Event('scroll'));
  }

  it('is a real button named "Back to top", hidden initially, toggled on scroll', () => {
    const button = initBackToTop();
    expect(button.tagName).toBe('BUTTON');
    expect(button.textContent).toBe('Back to top');
    expect(button.hidden).toBe(true);
    setScroll(1000);
    expect(button.hidden).toBe(false);
    setScroll(10);
    expect(button.hidden).toBe(true);
  });

  it('scrolls smoothly to the top and focuses the heading on click', () => {
    const button = initBackToTop();
    setScroll(1000);
    button.click();
    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
    expect(document.activeElement).toBe(document.querySelector('h1'));
  });

  it('jumps instantly when reduced motion is preferred', () => {
    reduced = true;
    const button = initBackToTop();
    button.click();
    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'auto' });
  });
});
