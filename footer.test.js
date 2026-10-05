import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const html = readFileSync(join(import.meta.dirname, "index.html"), "utf8");

test("footer comes after the form", () => {
  assert.ok(html.indexOf("<footer") > html.indexOf("</form>"));
});

test("footer text uses the visitor's clock for the year", () => {
  assert.ok(html.includes("`© ${new Date().getFullYear()} Greeting`"));
  assert.doesNotMatch(html, /©\s*\d{4}/);
});

test("name field is limited to 50 characters and has a live counter", () => {
  assert.match(html, /<input id="name"[^>]*maxlength="50"/);
  assert.match(html, /<small id="name-count">0 \/ 50 characters<\/small>/);
  assert.ok(html.indexOf('id="name-count"') > html.indexOf('id="name"'));
  assert.ok(html.includes("addEventListener('input', updateCount)"));
});
