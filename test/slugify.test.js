const test = require('node:test');
const assert = require('node:assert');
const { slugify } = require('../slugify');

test('lowercases the result', () => {
  assert.strictEqual(slugify('ABC'), 'abc');
});

test('keeps letters and digits', () => {
  assert.strictEqual(slugify('abc123'), 'abc123');
});

test('replaces runs of other characters with a single hyphen', () => {
  assert.strictEqual(slugify('a  --  b!!c'), 'a-b-c');
  assert.strictEqual(slugify('café'), 'caf');
});

test('has no leading or trailing hyphens', () => {
  assert.strictEqual(slugify('  Hello, World!  '), 'hello-world');
});

test('throws TypeError for non-string input', () => {
  for (const v of [null, undefined, 42, {}, []]) {
    assert.throws(() => slugify(v), TypeError);
  }
});

test('returns empty string when no letters or digits', () => {
  assert.strictEqual(slugify(''), '');
  assert.strictEqual(slugify('!!! ---'), '');
});
