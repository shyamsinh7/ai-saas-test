// Pure greeting logic; works in Node and in browsers via ES module import.
// Returns plain text (no HTML escaping); callers should render with textContent.
export function greet(name) {
  if (typeof name !== 'string') return { ok: false, error: 'empty' };
  const trimmed = name.trim();
  if (trimmed === '') return { ok: false, error: 'empty' };
  return { ok: true, message: `Hello, ${trimmed}!` };
}
