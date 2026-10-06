// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { backendServesPage, loadProfile } from './data';

const apiProfile = {
  name: 'From API',
  title: 't',
  description: 'd',
  contacts: [{ label: 'a', value: 'b' }],
  about: { summary: 's', highlights: [] },
  skills: [{ category: 'c', items: ['i'] }],
  portfolio: [{ name: 'n', description: 'd' }],
  why: [],
};

describe('loadProfile', () => {
  it('uses /api/profile when the backend answers', async () => {
    const fetchFn = vi.fn(async () => Response.json(apiProfile));
    expect((await loadProfile(fetchFn, true)).name).toBe('From API');
    expect(fetchFn).toHaveBeenCalledWith('api/profile', expect.anything());
  });

  it('uses the bundled copy without requesting the API on static hosting', async () => {
    const fetchFn = vi.fn(async () => Response.json(apiProfile));
    expect((await loadProfile(fetchFn, false)).name).toBe('Shyamsinh Parmar');
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it('detects the backend from the page marker', () => {
    document.head.innerHTML = '';
    expect(backendServesPage()).toBe(false);
    document.head.innerHTML = '<meta name="profile-source" content="api" />';
    expect(backendServesPage()).toBe(true);
  });

  it('falls back to the bundled copy when the request fails', async () => {
    const fetchFn = vi.fn(async () => {
      throw new TypeError('network');
    });
    expect((await loadProfile(fetchFn, true)).name).toBe('Shyamsinh Parmar');
  });

  it('falls back when static hosting answers with a 404 page', async () => {
    const fetchFn = vi.fn(async () => new Response('<html>404</html>', { status: 404 }));
    expect((await loadProfile(fetchFn, true)).name).toBe('Shyamsinh Parmar');
  });

  it('falls back when the response is HTML (SPA-style catch-all)', async () => {
    const fetchFn = vi.fn(
      async () => new Response('<html></html>', { headers: { 'content-type': 'text/html' } }),
    );
    expect((await loadProfile(fetchFn, true)).name).toBe('Shyamsinh Parmar');
  });

  it('falls back when the API payload is invalid', async () => {
    const fetchFn = vi.fn(async () => Response.json({ name: 'broken' }));
    expect((await loadProfile(fetchFn, true)).name).toBe('Shyamsinh Parmar');
  });
});
