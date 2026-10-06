// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import profile from '../../data/profile.json';
import { parseProfile } from '../../backend/src/schema';
import { COPIED_MS, copyText, createCopyButton } from './copy';
import { renderProfile } from './render';

function setClipboard(value: unknown) {
  Object.defineProperty(navigator, 'clipboard', { value, configurable: true });
}

afterEach(() => {
  vi.useRealTimers();
  setClipboard(undefined);
});

describe('copyText', () => {
  it('writes the text and resolves true', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    setClipboard({ writeText });
    expect(await copyText('a@b.c')).toBe(true);
    expect(writeText).toHaveBeenCalledWith('a@b.c');
  });

  it('resolves false without a clipboard', async () => {
    setClipboard(undefined);
    expect(await copyText('a@b.c')).toBe(false);
  });

  it('resolves false when writing is rejected', async () => {
    setClipboard({ writeText: vi.fn().mockRejectedValue(new Error('denied')) });
    expect(await copyText('a@b.c')).toBe(false);
  });
});

describe('createCopyButton', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('shows Copied for about 2 seconds, then clears', async () => {
    setClipboard({ writeText: vi.fn().mockResolvedValue(undefined) });
    const [button, status] = createCopyButton('a@b.c');
    button.click();
    await vi.advanceTimersByTimeAsync(0);
    expect(status.textContent).toBe('Copied');
    expect(status.getAttribute('aria-live')).toBe('polite');
    await vi.advanceTimersByTimeAsync(COPIED_MS);
    expect(status.textContent).toBe('');
  });

  it('shows Copy failed without clipboard access', async () => {
    const [button, status] = createCopyButton('a@b.c');
    button.click();
    await vi.advanceTimersByTimeAsync(0);
    expect(status.textContent).toBe('Copy failed');
  });
});

describe('contact links', () => {
  it('gives every email contact a labelled Copy button', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const data = parseProfile(profile);
    renderProfile(document.getElementById('app')!, data, 2030);
    const emails = data.contacts.filter((c) => c.href?.startsWith('mailto:'));
    const buttons = document.querySelectorAll('#contact button');
    expect(buttons).toHaveLength(emails.length);
    expect(buttons[0]?.getAttribute('aria-label')).toBe('Copy email address');
  });
});
