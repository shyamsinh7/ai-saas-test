// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import profile from '../../data/profile.json';
import { parseProfile } from '../../backend/src/schema';
import { renderProfile } from './render';
import { startApp } from './bootstrap';

const data = parseProfile(profile);
let root: HTMLElement;

beforeEach(() => {
  vi.useFakeTimers();
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
  document.body.innerHTML = '<div id="app"></div>';
  root = document.getElementById('app')!;
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

const retryButton = () => root.querySelector<HTMLButtonElement>('button.retry-btn')!;

describe('startApp', () => {
  it('shows a loading status when load is slow', async () => {
    const load = vi.fn(() => new Promise<never>(() => undefined));
    void startApp(root, { load, delayMs: 150, init: vi.fn() });
    expect(root.innerHTML).toBe('');
    await vi.advanceTimersByTimeAsync(150);
    const status = root.querySelector('[role=status]')!;
    expect(status.getAttribute('aria-live')).toBe('polite');
    expect(status.textContent).toContain('Loading profile');
    expect(root.querySelector('.skeleton')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('does not flash the loading state on a fast load', async () => {
    const render = vi.fn();
    const init = vi.fn();
    await startApp(root, { load: () => Promise.resolve(data), render, init, delayMs: 150 });
    await vi.advanceTimersByTimeAsync(500);
    expect(root.querySelector('.state-loading')).toBeNull();
    expect(render).toHaveBeenCalledWith(root, data);
    expect(init).toHaveBeenCalledTimes(1);
  });

  it('shows an error with Retry when load rejects', async () => {
    await startApp(root, { load: () => Promise.reject(new Error('boom')), init: vi.fn() });
    const alert = root.querySelector('[role=alert]')!;
    expect(alert.textContent).toContain("We couldn't load this profile");
    expect(retryButton().textContent).toBe('Retry');
    expect(document.activeElement?.tagName).toBe('H2');
  });

  it('shows an error with Retry when render throws', async () => {
    const init = vi.fn();
    await startApp(root, {
      load: () => Promise.resolve(data),
      render: () => {
        throw new Error('bad render');
      },
      init,
    });
    expect(root.querySelector('[role=alert]')).not.toBeNull();
    expect(retryButton()).not.toBeNull();
    expect(init).not.toHaveBeenCalled();
  });

  it('does not leak technical details in the error text', async () => {
    await startApp(root, {
      load: () => Promise.reject(new Error('ZodError: secret path /x')),
    });
    expect(root.textContent).not.toContain('ZodError');
    expect(root.textContent).not.toContain('secret');
    expect(console.error).toHaveBeenCalled();
  });

  it('Retry renders the profile and removes the error', async () => {
    const load = vi
      .fn<() => Promise<typeof data>>()
      .mockRejectedValueOnce(new Error('x'))
      .mockResolvedValueOnce(data);
    const init = vi.fn();
    await startApp(root, { load, render: renderProfile, init });
    retryButton().click();
    await vi.advanceTimersByTimeAsync(0);
    expect(root.querySelector('h1')).not.toBeNull();
    expect(root.querySelector('.state-error')).toBeNull();
    expect(init).toHaveBeenCalledTimes(1);
    expect(document.activeElement?.tagName).toBe('H1');
  });

  it('repeated Retry clicks render once', async () => {
    let resolve!: (p: typeof data) => void;
    const load = vi
      .fn<() => Promise<typeof data>>()
      .mockRejectedValueOnce(new Error('x'))
      .mockReturnValueOnce(new Promise((r) => (resolve = r)));
    const init = vi.fn();
    await startApp(root, { load, render: renderProfile, init });
    const button = retryButton();
    button.click();
    button.click();
    button.click();
    expect(button.disabled).toBe(true);
    expect(button.getAttribute('aria-busy')).toBe('true');
    resolve(data);
    await vi.advanceTimersByTimeAsync(0);
    expect(load).toHaveBeenCalledTimes(2);
    expect(root.querySelectorAll('h1')).toHaveLength(1);
    expect(root.querySelectorAll('main')).toHaveLength(1);
    expect(init).toHaveBeenCalledTimes(1);
  });

  it('keeps the error view and re-enables Retry when the retry fails', async () => {
    const load = vi.fn(() => Promise.reject(new Error('x')));
    await startApp(root, { load });
    retryButton().click();
    await vi.advanceTimersByTimeAsync(0);
    expect(root.querySelectorAll('.state-error')).toHaveLength(1);
    expect(retryButton().disabled).toBe(false);
  });

  it('renders the bundled profile with no error when the API is unavailable', async () => {
    const { loadProfile } = await import('./data');
    await startApp(root, {
      load: () => loadProfile(() => Promise.reject(new Error('offline')), true),
      init: vi.fn(),
    });
    expect(root.querySelector('h1')).not.toBeNull();
    expect(root.querySelector('.state-error')).toBeNull();
  });
});
