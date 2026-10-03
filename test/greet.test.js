const test = require("node:test");
const assert = require("node:assert");
const { greet } = require("../greet");

test("greets by name", () => {
  assert.strictEqual(greet("Ada"), "Hello, Ada!");
});

test("throws TypeError for empty or non-string", () => {
  for (const bad of ["", undefined, null, 42, {}]) {
    assert.throws(() => greet(bad), TypeError);
  }
});
