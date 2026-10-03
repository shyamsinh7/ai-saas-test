'use strict';

function clamp(value, min, max) {
  for (const n of [value, min, max]) {
    if (typeof n !== 'number' || !Number.isFinite(n)) {
      throw new TypeError('clamp: all arguments must be finite numbers');
    }
  }
  if (min > max) {
    throw new RangeError('clamp: min must not be greater than max');
  }
  return Math.min(Math.max(value, min), max);
}

module.exports = { clamp };
