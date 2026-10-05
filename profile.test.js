import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const html = readFileSync(join(import.meta.dirname, "profile.html"), "utf8");

test("profile page shows name and title", () => {
  assert.match(html, /<h1>Shyamsinh Parmar<\/h1>/);
  assert.match(html, /Principal Engineer &amp; Enterprise Architect/);
});

test("profile page has contact links", () => {
  assert.match(html, /href="mailto:parmarshyamsingh8@gmail\.com"/);
  assert.match(html, /href="tel:\+918866060908"/);
  assert.match(html, /href="https:\/\/github\.com\/ssparmar8"/);
});

test("profile page has about, skills, portfolio and why sections", () => {
  for (const id of ["about", "skills", "portfolio", "why"]) {
    assert.match(html, new RegExp(`<section id="${id}"`));
  }
});

test("external links open safely and portfolio lists projects", () => {
  const links = html.match(/<a href="https:[^>]*>/g) ?? [];
  assert.ok(links.length > 10);
  for (const a of links) assert.match(a, /rel="noopener"/);
  assert.equal((html.match(/<article class="card project"/g) ?? []).length, 19);
});

test("page is responsive and footer year uses the visitor's clock", () => {
  assert.match(html, /<meta name="viewport"/);
  assert.ok(html.includes("new Date().getFullYear()"));
});
