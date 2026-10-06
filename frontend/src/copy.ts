export const COPIED_MS = 2000;

/** Writes `text` to the clipboard; resolves false when it is unavailable or refused. */
export async function copyText(
  text: string,
  clipboard: Pick<Clipboard, 'writeText'> | undefined = globalThis.navigator?.clipboard,
): Promise<boolean> {
  if (!clipboard) return false;
  try {
    await clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/** Builds a Copy button plus an aria-live status that shows the outcome for ~2 seconds. */
export function copyButton(text: string): HTMLElement {
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
  const wrap = document.createElement('span');
  wrap.className = 'copy';
  wrap.append(button, status);
  return wrap;
}
