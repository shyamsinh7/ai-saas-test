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
- The frontend fetches `api/profile` when a backend serves it and otherwise falls back to the copy
  of `profile.json` bundled at build time, so the same build works on static hosting.

- Each email (`mailto:`) contact in the header has a "Copy" button that copies the address to the
  clipboard and shows "Copied" for about 2 seconds (in an `aria-live` region), or "Copy failed"
  if the clipboard is unavailable.

To change the content, edit `data/profile.json`.

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
