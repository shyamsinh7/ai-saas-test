# ai-saas-test
## Usage

Run the hello script with Node.js:

```
node hello.js
```

It prints `Hello from AI agents` and exits with code 0.

## Greeting page

`index.html` is a static page with a name field and a **Greet** button. Entering a name shows `Hello, <name>!`; an empty or whitespace-only name shows an inline error. The page loads `greeting.js` as an ES module (`<script type="module">`), so no build step is needed. A modern browser with ES module support is required.

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

## Files

- `index.html` – the greeting page
- `greeting.js` – greeting logic (ES module shared by the page and tests)
- `greeting.test.js` – tests for `greeting.js`
- `package.json` – sets `"type": "module"`, the `test` script and the Node engine range
- `hello.js` – the Node.js hello script (see Usage)
