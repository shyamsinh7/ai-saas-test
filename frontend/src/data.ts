import bundled from '../../data/profile.json';
import { parseProfile, type Profile } from '../../backend/src/schema';

/**
 * Loads the profile from the backend API when one is serving the page,
 * otherwise (static hosting such as GitHub Pages) from the copy bundled at build time.
 * The URL is relative so it resolves under a sub-path like /ai-saas-test/.
 */
export async function loadProfile(fetchFn: typeof fetch = fetch): Promise<Profile> {
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
