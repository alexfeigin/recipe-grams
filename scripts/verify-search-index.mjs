import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const entryPath = "dist/pagefind/pagefind-entry.json";

for (const artifact of ["dist/pagefind/pagefind.js", entryPath]) {
  assert.ok(
    existsSync(path.join(repoRoot, artifact)),
    `Expected the search index artifact ${artifact}`,
  );
}

// Pagefind searches only the index matching the page's language, so a second
// index would hide the other language's recipes from every page.
const entry = JSON.parse(readFileSync(path.join(repoRoot, entryPath), "utf8"));
assert.equal(
  Object.keys(entry.languages).length,
  1,
  `Expected ${entryPath} to list one index shared by every recipe language`,
);

console.log("Search index verification passed.");
