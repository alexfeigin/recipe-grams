import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();

for (const artifact of [
  "dist/pagefind/pagefind.js",
  "dist/pagefind/pagefind-entry.json",
]) {
  assert.ok(
    existsSync(path.join(repoRoot, artifact)),
    `Expected the search index artifact ${artifact}`,
  );
}

console.log("Search index verification passed.");
