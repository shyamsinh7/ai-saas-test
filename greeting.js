// Node's fs is loaded only when running under Node, so this module still
// imports cleanly in browsers (index.html).
const isNode = typeof process !== 'undefined' && process.versions?.node;
const fs = isNode ? await import('node:fs') : null;
const os = isNode ? await import('node:os') : null;
const path = isNode ? await import('node:path') : null;

// Log location: VISIT_LOG env var, else visits.log in the OS temp directory.
const visitLog = () =>
  process.env.VISIT_LOG || path.join(os.tmpdir(), 'visits.log');

// Pure greeting logic; works in Node and in browsers via ES module import.
// Returns plain text (no HTML escaping); callers should render with textContent.
// In Node, each successful greeting is also appended to the visit log.
export function greet(name) {
  if (typeof name !== 'string') return { ok: false, error: 'empty' };
  const trimmed = name.trim();
  if (trimmed === '') return { ok: false, error: 'empty' };
  if (fs) {
    try {
      // Collapse line breaks so one visit is always exactly one log line.
      fs.appendFileSync(visitLog(), trimmed.replace(/[\r\n]+/g, ' ') + '\n');
    } catch {
      // Logging must never break greeting.
    }
  }
  return { ok: true, message: `Hello, ${trimmed}!` };
}
