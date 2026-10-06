export const COPIED_MS = 2000;

/** Copies `text` to the clipboard; resolves false when the clipboard is unavailable or rejects. */
export async function copyText(text: string): Promise<boolean> {
  try {
    if (!navigator.clipboard?.writeText) return false;
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/** Builds a Copy button plus an aria-live status that reports "Copied" or "Copy failed". */
export function createCopyButton(text: string): [HTMLButtonElement, HTMLSpanElement] {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'copy-btn';
  button.textContent = 'Copy';
  button.setAttribute('aria-label', 'Copy email address');

  const status = document.createElement('span');
  status.className = 'copy-status';
  status.setAttribute('aria-live', 'polite');

  let timer: ReturnType<typeof setTimeout> | undefined;
  button.addEventListener('click', () => {
    void copyText(text).then((ok) => {
      status.textContent = ok ? 'Copied' : 'Copy failed';
      clearTimeout(timer);
      timer = setTimeout(() => {
        status.textContent = '';
      }, COPIED_MS);
    });
  });
  return [button, status];
}
