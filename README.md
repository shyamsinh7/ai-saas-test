# ai-saas-test
## Usage

Run the hello script with Node.js:

```
node hello.js
```

It prints `Hello from AI agents` and exits with code 0.

## Greeting page

`index.html` is a static page with a name field and a **Greet** button. Entering a name shows `Hello, <name>!`; an empty or whitespace-only name shows an inline error. The name field accepts at most 50 characters, and a line under it shows the current count (for example `3 / 50 characters`), updating as you type. The page loads `greeting.js` as an ES module (`<script type="module">`), so no build step is needed. A modern browser with ES module support is required.

### Serve and open

ES modules are blocked when a page is opened via `file://`, so double-clicking `index.html` is not supported. Serve the repo root with any static server, for example:

```
python3 -m http.server 8000
```

Then open <http://localhost:8000/>.

## Tests

Requires Node.js 18 or newer (tested on v24). No dependencies to install. From the repo root run:

```
node --test
```

(or `npm test`). It discovers `greeting.test.js` and exits 0 when all tests pass.

## End-to-end tests

Playwright (Chromium only) drives `index.html` in a real browser. The config starts `python3 -m http.server 4173` itself. Install dependencies once with `npm install`, then run:

```
npx playwright install chromium && npx playwright test
```

The specs live in `e2e/*.spec.js`, so `npm test` (`node --test`) still runs only the unit tests.

## Files

- `index.html` – the greeting page
- `greeting.js` – greeting logic (ES module shared by the page and tests)
- `greeting.test.js` – tests for `greeting.js`
- `package.json` – sets `"type": "module"`, the `test` script and the Node engine range
- `e2e/greeting.spec.js` – Playwright end-to-end tests for the page
- `playwright.config.js` – Playwright configuration
- `hello.js` – the Node.js hello script (see Usage)

## Hello Dev (TypeScript)

`src/index.ts` prints `Hello Dev`. Requires Node.js 18+ and `npm install` (installs TypeScript).

```
npm install
npm run build   # compiles src/ to dist/ using tsconfig.json
npm start       # runs dist/index.js -> prints "Hello Dev"
```

`npm run dev` builds and runs in one step.
