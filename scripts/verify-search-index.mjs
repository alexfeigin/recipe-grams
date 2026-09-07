// The Pagefind index is a build artifact of the generated pages, so its files
// are checked here rather than from a browser suite that may be aimed at an
// already published site.
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
