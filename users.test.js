import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { findUserQuery, isAdult, welcome } from './users.js';
import { greet } from './greeting.js';

test('findUserQuery binds the name as a parameter', () => {
  assert.deepEqual(findUserQuery('Ada'), {
    text: 'SELECT * FROM users WHERE name = $1',
    values: ['Ada'],
  });
});

test('findUserQuery does not interpolate injection payloads', () => {
  const evil = "' OR '1'='1";
  const q = findUserQuery(evil);
  assert.ok(!q.text.includes(evil));
  assert.deepEqual(q.values, [evil]);
});

test('isAdult boundary', () => {
  assert.equal(isAdult(18), true);
  assert.equal(isAdult(17), false);
  assert.equal(isAdult(40), true);
});

test('welcome is greet', () => {
  process.env.VISIT_LOG = join(mkdtempSync(join(tmpdir(), 'v-')), 'log');
  assert.deepEqual(welcome('Ada'), greet('Ada'));
  assert.deepEqual(welcome(''), greet(''));
});
