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

### Portfolio projects

Each entry in `portfolio` has these fields (validated by `backend/src/schema.ts`; all text is trimmed
and must be non-empty):

- `name`, `description`: required.
- `summary`: required one-line text (aim for 100 characters or fewer).
- `category`: required free text, one primary category per project (e.g. `AI`, `Healthcare`,
  `Finance`, `Backend/Cloud`). Reuse existing spellings so categories do not split.
- `tags`: required array of at least one non-empty tech tag.
- `url`: optional http(s) link. `urlLabel`: optional link text.
- `image`: optional screenshot, a relative path to a `.jpg`, `.jpeg`, `.png` or `.webp` file in
  `frontend/public` (e.g. `projects/hws.jpg`). Absolute paths, `//host`, `../` and URLs are rejected.

To add a project, append an object with all the required fields to `portfolio`. If a required field
is missing the schema rejects the data, `GET /api/profile` returns 500 and the bundled page fails.

## Portfolio cards

Each `portfolio` entry renders as an `article.card.project` in the `#portfolio .grid`, built from
`data/profile.json` (see above):

- `image`, when set, adds an `img` at the top of the card (alt text "<name> screenshot", lazy
  loaded, cropped to the top 160px). A project without `image` shows no picture.
- `name` (h3), `summary`, a `category` badge and the `tags` as a `ul`/`li` list. The card also
  carries `data-category`.
- `url` adds a link with the `urlLabel` (or the url) as text; its accessible name also contains the
  project name. http(s) links get `rel="noopener"`.
- A project without `url` shows no link at all.
- Long text and many tags wrap inside the card, so there is no horizontal scroll at 360px. The
  tag and badge colours meet WCAG AA contrast (4.5:1).

## Last updated date

`updatedAt` in `data/profile.json` is an optional ISO date (e.g. `2026-10-06`). When present, the
footer shows a second line below the copyright, "Last updated: 6 October 2026", formatted in
English from that date (in UTC, so it does not shift with the visitor's time zone). Without the
field, or with an unparseable value on the frontend, the footer shows no date. The schema rejects
values that are not valid ISO dates, such as `2026-13-45`, so an invalid `updatedAt` makes
`/api/profile` return HTTP 500.

## Table of contents

A table of contents (`<nav aria-label="Table of contents">`) sits directly under the header with
three links in page order: About Me (`#about`), Core Skills (`#skills`) and My Portfolio
(`#portfolio`). The labels are fixed and do not follow the section headings. The sections always
render, so the links never dangle; "Why Work with Me?" and the contact links are not linked. The
links wrap onto several lines on narrow screens, and scrolling uses the page-wide smooth-scroll
rule (instant when the visitor prefers reduced motion).

## Back to top button

A "Back to top" button (`frontend/src/backToTop.ts`) is fixed to the bottom-right corner. It is
hidden until the visitor has scrolled down more than one screen height. Clicking it scrolls to the
top (instantly when the visitor prefers reduced motion, smoothly otherwise) and moves keyboard focus
to the page heading.

## Skills filter

A "Filter skills" search box (`frontend/src/skillsFilter.ts`) sits above the Core Skills grid.
Typing hides the skill items whose names do not contain the text (case-insensitive, surrounding
spaces ignored, matched literally so `C++` or `(` work), and hides cards left with no matching
items. Category names are not matched, only item names. If nothing matches, a "No skills match"
message is announced politely (`aria-live`). Clearing the box, or entering only spaces, shows
everything again. Items are hidden with the `hidden` attribute, never removed, and the filter runs
in the browser in both API and bundled-data modes.

## Portfolio category filter

A row of buttons (`frontend/src/portfolioFilter.ts`) above the portfolio cards shows "All" plus one
button per category found in the data (first-seen order, never an empty category). Clicking a button
(or pressing Enter/Space on it) shows only that category's projects; the others get the `hidden`
attribute and are never removed. The active button has `aria-pressed="true"` and a checkmark and
underline, so it is not shown by colour alone. A polite live region (`role="status"`) reports e.g.
"Showing 5 of 23 projects"; focus does not move. The section heading keeps the total. Without
JavaScript every card stays visible. No row is rendered when there are no projects.

### `?category=` URL parameter

The selected category is kept in the query string so a filtered view can be shared or bookmarked,
e.g. `/ai-saas-test/?category=AI#portfolio`. On load the value is matched **exactly and
case-sensitively** against the categories in the data (`?category=ai` does not match `AI`); a
missing, empty, unknown or malformed value falls back to All, and the value is never inserted as
HTML. With repeated params the first one wins; URL-encoded values (e.g. `Backend%2FCloud`) are
decoded first. Clicking a filter button updates the URL with `history.replaceState` (no new
history entries); All removes the parameter. Only the path's query string is rewritten: the current
pathname, the hash and any other params are preserved, so it works under a sub-path such as
`/ai-saas-test/`. The URL is written only on filter clicks, never on load or table-of-contents
clicks. The skills filter is not stored in the URL. Deep links need JavaScript (static hosting).

## Design tokens

All colours, type sizes, spacing, radii and shadows are named custom properties on `:root` in
`frontend/src/style.css`; rules use `var(--token)` instead of hardcoded values.

| Group      | Tokens                                                                                                  |
| ---------- | ------------------------------------------------------------------------------------------------------- |
| Colour     | `--bg`, `--surface`, `--surface-tint`, `--border`, `--text`, `--muted`, `--accent`, `--link`, badge/tag |
| Type scale | `--fs-sm` … `--fs-h1`, `--lh-body`, `--lh-tight`, `--measure` (paragraph line length, 68ch)             |
| Spacing    | `--space-1` … `--space-8` (4px base)                                                                    |
| Radius     | `--radius-sm`, `--radius-md`, `--radius-pill`                                                           |
| Shadow     | `--shadow-sm`, `--shadow-md`                                                                            |

The system font stack is kept; no web fonts, icon libraries or external assets are loaded, so the
site works under a GitHub Pages sub-path.

Rules kept when changing tokens (`frontend/src/tokens.test.ts` checks the colour pairs):

- Normal text is at least 4.5:1 against its background (badge `#0b3d63` on `#e3f0f9` is about 9:1,
  tag `#333` on `#eef1f4` about 11:1); large text and UI components are at least 3:1.
- The keyboard focus ring is a dark 3px outline (`--focus-ring`) with a white halo
  (`--focus-ring-halo`), at least 3:1 on light, tinted and dark surfaces.
- The selected filter state is not shown by colour alone (bold, underline, check mark).
- Interactive targets are at least 44px; there is no horizontal scroll at 360px.
- Under `prefers-reduced-motion: reduce`, smooth scrolling, transitions and animations are off.
  Any new transition must be covered by that block.
- Elements with the `hidden` attribute stay hidden (keep the `[hidden]` overrides).

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
