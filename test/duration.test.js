'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { parseDuration } = require('../duration');

test('valid examples', () => {
  const cases = {
    '1h30m': 5400, '45s': 45, '2H 5m 10S': 7510, '90': 90, '1.5h': 5400,
    '0.5m': 30, '  10m  ': 600, '1h 30m 5s': 5405, '0': 0, '168h': 604800,
    '1h5s': 3605, '2.0s': 2, '1.5': undefined,
  };
  for (const [input, want] of Object.entries(cases)) {
    if (want === undefined) continue;
    assert.strictEqual(parseDuration(input), want, input);
  }
});

test('non-whole seconds throw', () => {
  for (const s of ['0.1s', '1.5', '0.05m']) assert.throws(() => parseDuration(s), RangeError, s);
});

test('empty, whitespace and non-string throw', () => {
  for (const v of ['', '   ', null, undefined, 90, {}, []]) {
    assert.throws(() => parseDuration(v), RangeError);
  }
});

test('unknown units throw', () => {
  for (const s of ['5x', '1d', '5ms', '1h 5w']) assert.throws(() => parseDuration(s), RangeError, s);
});

test('repeated and out-of-order units throw', () => {
  for (const s of ['1h2h', '5m1h', '1s1s', '30s 1m']) assert.throws(() => parseDuration(s), RangeError, s);
});

test('negative, plus sign and bad decimals throw', () => {
  for (const s of ['-5s', '-1h', '+5s', '+90', '1.25h', '1h 1.5m', '1.5.5s', '.5h', '5.h']) {
    assert.throws(() => parseDuration(s), RangeError, s);
  }
});

test('bare number only valid as whole input', () => {
  assert.throws(() => parseDuration('1h 30'), RangeError);
  assert.throws(() => parseDuration('30 1h'), RangeError);
});

test('over 7 days throws', () => {
  assert.strictEqual(parseDuration('7d'.length ? '604800' : ''), 604800);
  assert.throws(() => parseDuration('604801'), RangeError);
  assert.throws(() => parseDuration('168h 1s'), RangeError);
  assert.throws(() => parseDuration('169h'), RangeError);
});

test('error message names the input', () => {
  assert.throws(() => parseDuration('5x'), /5x/);
});
