'use strict';

const UNITS = { h: 3600, m: 60, s: 1 };
const ORDER = ['h', 'm', 's'];
const MAX_SECONDS = 7 * 24 * 3600;

function fail(input, reason) {
  const shown = typeof input === 'string' ? JSON.stringify(input) : String(input);
  return new RangeError(`Invalid duration ${shown}: ${reason}`);
}

// Parses "45", "1.5" into tenths (integer) to avoid floating point error.
function toTenths(text) {
  const [whole, frac = ''] = text.split('.');
  return Number(whole) * 10 + Number(frac || 0);
}

function parseDuration(input) {
  if (typeof input !== 'string') throw fail(input, 'input must be a string');
  const text = input.trim();
  if (text === '') throw fail(input, 'input is empty');

  let tenthsTotal = 0; // total in tenths of a second
  if (/^\d+(\.\d)?$/.test(text)) {
    tenthsTotal = toTenths(text);
  } else {
    const part = /(\d+(?:\.\d)?)([A-Za-z])/y;
    const ws = /\s*/y;
    let pos = 0;
    let lastIdx = -1;
    let count = 0;
    while (pos < text.length) {
      part.lastIndex = pos;
      const m = part.exec(text);
      if (!m) throw fail(input, `cannot parse at position ${pos}`);
      const [, num, rawUnit] = m;
      const unit = rawUnit.toLowerCase();
      if (!(unit in UNITS)) throw fail(input, `unknown unit "${rawUnit}"`);
      const idx = ORDER.indexOf(unit);
      if (idx === lastIdx) throw fail(input, `repeated unit "${unit}"`);
      if (idx < lastIdx) throw fail(input, 'units out of order');
      if (count > 0 && num.includes('.')) {
        throw fail(input, 'only the first part may have a decimal');
      }
      lastIdx = idx;
      count++;
      tenthsTotal += toTenths(num) * UNITS[unit];
      pos = part.lastIndex;
      ws.lastIndex = pos;
      ws.exec(text);
      pos = ws.lastIndex;
    }
  }

  if (tenthsTotal % 10 !== 0) throw fail(input, 'not a whole number of seconds');
  const seconds = tenthsTotal / 10;
  if (seconds > MAX_SECONDS) throw fail(input, 'exceeds 7 days');
  return seconds;
}

module.exports = { parseDuration };
