# Profile site

A single-page personal profile (name, title, contact links, About Me, Core Skills & Technologies,
My Portfolio) with a small Express backend and a Vite + TypeScript frontend.

## Structure

```
data/profile.json     Single source of the profile content
backend/src/          Express app (TypeScript): /api/health, /api/profile, serves dist/
frontend/             Vite + TypeScript page that renders the profile (no UI framework)
e2e/                  Playwright end-to-end tests
dist/                 Build output (generated, git-ignored)
```

- `GET /api/health` returns `{"status":"ok"}`.
- `GET /api/profile` returns `data/profile.json`, validated against the zod schema in
  `backend/src/schema.ts` (HTTP 500 if it is invalid).
- When the backend serves the page it adds `<meta name="profile-source" content="api">` and the
  frontend fetches `api/profile`. Without that marker (static hosting) it renders the copy of
  `profile.json` bundled at build time and makes no API request, so the same build works on both.

To change the content, edit `data/profile.json`.

## Last updated date

`updatedAt` in `data/profile.json` is an optional ISO date (e.g. `2026-10-06`). When present, the
footer shows a second line below the copyright, "Last updated: 6 October 2026", formatted in
English from that date (in UTC, so it does not shift with the visitor's time zone). Without the
field, or with an unparseable value on the frontend, the footer shows no date. The schema rejects
values that are not valid ISO dates, such as `2026-13-45`, so an invalid `updatedAt` makes
`/api/profile` return HTTP 500.

## Back to top button

A "Back to top" button (`frontend/src/backToTop.ts`) is fixed to the bottom-right corner. It is
hidden until the visitor has scrolled down more than one screen height. Clicking it scrolls to the
top (instantly when the visitor prefers reduced motion, smoothly otherwise) and moves keyboard focus
to the page heading.

## Skills filter

A "Filter skills" search box (`frontend/src/skillsFilter.ts`) sits above the Core Skills cards.
Typing hides the skill items that do not match and any card left with no matching items. Matching
is a case-insensitive plain substring match on the item text, ignoring leading and trailing
spaces, so characters such as `C++`, `.` and `(` are matched literally. Category names are not
matched. If nothing matches, a "No skills match" message is shown (announced politely to screen
readers). An empty or whitespace-only box shows everything again. Hidden nodes keep the `hidden`
attribute and stay in the DOM. The filter runs in the browser only, in both API and static modes.

## npm scripts

| Script              | What it does                                                             |
| ------------------- | ------------------------------------------------------------------------ |
| `npm start`         | Builds the frontend, then serves site + API on one port (3000, `PORT`)   |
| `npm run dev`       | Vite dev server for the frontend (bundled data; run `npm start` for API) |
| `npm run build`     | Writes the static site to `dist/` (relative asset paths)                 |
| `npm test`          | Backend and frontend unit tests (Vitest)                                 |
| `npm run e2e`       | Playwright tests (same as `npx playwright test`)                         |
| `npm run typecheck` | TypeScript strict-mode check of the whole repository                     |
| `npm run lint`      | ESLint + Prettier check; `npm run format` fixes formatting               |

## Run locally

```sh
npm install
npm start            # http://localhost:3000   (PORT=8080 npm start to change the port)
```

End-to-end tests need Playwright's browser once: `npx playwright install chromium`. Then
`npx playwright test` starts the site itself; set `BASE_URL` (e.g.
`BASE_URL=https://shyamsinh7.github.io/ai-saas-test/ npx playwright test`) to smoke-test an
already deployed site instead.

## Deployment

The site is published as static files to GitHub Pages at
https://shyamsinh7.github.io/ai-saas-test/. The deploy workflows run `npm run build` and publish
`dist/`. There is no backend on GitHub Pages; the page uses the profile data bundled at build time.
