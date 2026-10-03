import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { greet } from './greeting.js';

const EMPTY = { ok: false, error: 'empty' };

test('greets a name', () => {
  assert.deepEqual(greet('Ada'), { ok: true, message: 'Hello, Ada!' });
});

test('trims surrounding whitespace', () => {
  assert.equal(greet('  Ada  ').message, 'Hello, Ada!');
  assert.equal(greet('\t\nAda\n').message, 'Hello, Ada!');
});

test('empty and whitespace-only are invalid', () => {
  for (const v of ['', '   ', '\t\n', ' ']) assert.deepEqual(greet(v), EMPTY);
});

test('non-string input is invalid and does not throw', () => {
  for (const v of [null, undefined, 42, {}, [], true]) {
    assert.deepEqual(greet(v), EMPTY);
  }
});

test('HTML characters are returned verbatim', () => {
  assert.equal(greet('<b>x</b>').message, 'Hello, <b>x</b>!');
});

test('internal spaces are preserved', () => {
  assert.equal(greet('Ada  Lovelace').message, 'Hello, Ada  Lovelace!');
});

test('very long and unicode names work', () => {
  const long = 'a'.repeat(10000);
  assert.equal(greet(long).message, `Hello, ${long}!`);
  assert.equal(greet('José 😀').message, 'Hello, José 😀!');
});

test('visit log gets trimmed names for successful greets only', () => {
  const file = join(mkdtempSync(join(tmpdir(), 'visits-')), 'visits.log');
  process.env.VISIT_LOG = file;
  greet('  Ada  ');
  greet('   ');
  greet(null);
  greet('Bob\nEve');
  assert.equal(readFileSync(file, 'utf8'), 'Ada\nBob Eve\n');
});

test('logging failure does not break greet', () => {
  process.env.VISIT_LOG = join(tmpdir(), 'no-such-dir-xyz', 'a', 'v.log');
  assert.deepEqual(greet('Ada'), { ok: true, message: 'Hello, Ada!' });
});
