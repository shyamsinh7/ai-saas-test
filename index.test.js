import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { join } from "node:path";

const root = import.meta.dirname;
const tsc = join(root, "node_modules", "typescript", "bin", "tsc");

test("src/index.ts builds and prints Hello Dev", () => {
  execFileSync(process.execPath, [tsc], { cwd: root });
  const stdout = execFileSync(process.execPath, [join(root, "dist", "index.js")], {
    encoding: "utf8",
  });
  assert.equal(stdout.trim(), "Hello Dev");
});
