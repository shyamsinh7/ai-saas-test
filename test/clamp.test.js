'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { clamp } = require('../clamp.js');

test('clamps above max', () => assert.strictEqual(clamp(5, 0, 3), 3));
test('clamps below min', () => assert.strictEqual(clamp(-1, 0, 3), 0));
test('returns value within range', () => assert.strictEqual(clamp(2, 0, 3), 2));
test('allows min === max', () => assert.strictEqual(clamp(9, 4, 4), 4));

test('throws RangeError when min > max', () => {
  assert.throws(() => clamp(1, 3, 0), RangeError);
});

test('throws TypeError for non-finite or non-number arguments', () => {
  for (const args of [
    ['1', 0, 3], [1, '0', 3], [1, 0, '3'],
    [NaN, 0, 3], [1, Infinity, 3], [1, 0, -Infinity],
    [undefined, 0, 3], [null, 0, 3],
  ]) {
    assert.throws(() => clamp(...args), TypeError);
  }
});
