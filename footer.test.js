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
