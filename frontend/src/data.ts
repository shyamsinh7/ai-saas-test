import bundled from '../../data/profile.json';
import { parseProfile, type Profile } from '../../backend/src/schema';

/** The backend marks the pages it serves; static hosting has no marker. */
export function backendServesPage(): boolean {
  return document.querySelector('meta[name="profile-source"][content="api"]') !== null;
}

/**
 * Loads the profile from the backend API when one is serving the page,
 * otherwise (static hosting such as GitHub Pages) from the copy bundled at build time,
 * without requesting an API that does not exist there.
 * The URL is relative so it resolves under a sub-path like /ai-saas-test/.
 */
export async function loadProfile(
  fetchFn: typeof fetch = fetch,
  useApi: boolean = backendServesPage(),
): Promise<Profile> {
  if (!useApi) return parseProfile(bundled);
  try {
    const response = await fetchFn('api/profile', { headers: { Accept: 'application/json' } });
    if (response.ok && response.headers.get('content-type')?.includes('application/json')) {
      return parseProfile(await response.json());
    }
  } catch {
    // No backend available: fall back to the bundled copy.
  }
  return parseProfile(bundled);
}
