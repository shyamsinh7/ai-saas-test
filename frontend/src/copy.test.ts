// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { copyButton, copyText } from './copy';

describe('copyText', () => {
  it('writes the exact text and resolves true', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    expect(await copyText('a@b.co', { writeText })).toBe(true);
    expect(writeText).toHaveBeenCalledWith('a@b.co');
  });
  it('resolves false when the clipboard is missing or rejects', async () => {
    expect(await copyText('x', undefined)).toBe(false);
    expect(await copyText('x', { writeText: () => Promise.reject(new Error('no')) })).toBe(false);
  });
});

describe('copyButton', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  function setup(clipboard: unknown) {
    vi.stubGlobal('navigator', { clipboard });
    const wrap = copyButton('a@b.co');
    return {
      button: wrap.querySelector('button')!,
      status: wrap.querySelector('[aria-live]')!,
    };
  }

  it('has an accessible name and shows Copied for 2 seconds', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    const { button, status } = setup({ writeText });
    expect(button.getAttribute('aria-label')).toBe('Copy email address');
    button.click();
    await vi.advanceTimersByTimeAsync(0);
    expect(writeText).toHaveBeenCalledWith('a@b.co');
    expect(status.textContent).toBe('Copied');
    await vi.advanceTimersByTimeAsync(1999);
    expect(status.textContent).toBe('Copied');
    await vi.advanceTimersByTimeAsync(1);
    expect(status.textContent).toBe('');
  });

  it('shows Copy failed without a clipboard', async () => {
    const { button, status } = setup(undefined);
    button.click();
    await vi.advanceTimersByTimeAsync(0);
    expect(status.textContent).toBe('Copy failed');
  });
});
