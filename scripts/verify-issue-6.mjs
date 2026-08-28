import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const languages = ["en", "he"];
const uncategorizedSlugs = ["pastry_cream", "salt", "simple_vinaigrette"];

function markdownRecipes(language) {
  return readdirSync(path.join(repoRoot, language))
    .filter((file) => file.endsWith(".MD"))
    .map((file) => file.replace(/\.MD$/, ""))
    .sort();
}

function readBuiltPage(...segments) {
  const filePath = path.join(repoRoot, "dist", ...segments, "index.html");
  assert.ok(
    existsSync(filePath),
    `Expected generated page at ${path.relative(repoRoot, filePath)}`,
  );
  return readFileSync(filePath, "utf8");
}

const englishHome = readBuiltPage();
const hebrewHome = readBuiltPage("he");
const englishSlugs = markdownRecipes("en");
const hebrewSlugs = new Set(markdownRecipes("he"));
const pairedSlugs = englishSlugs.filter((slug) => hebrewSlugs.has(slug));
const categorizedSlugs = pairedSlugs.filter(
  (slug) => !uncategorizedSlugs.includes(slug),
);

assert.match(englishHome, /<html[^>]+lang="en"[^>]+dir="ltr"/);
assert.match(hebrewHome, /<html[^>]+lang="he"[^>]+dir="rtl"/);
assert.match(englishHome, /href="\/recipe-grams\/he\/"/);
assert.match(hebrewHome, /href="\/recipe-grams\/"/);
assert.match(englishHome, /What do you feel like cooking\?/);
assert.match(hebrewHome, /מה בא לך לבשל\?/);
assert.match(englishHome, /aria-label="Back to top"[^>]+data-back-to-top/);
assert.match(hebrewHome, /aria-label="חזרה למעלה"[^>]+data-back-to-top/);
assert.match(englishHome, /Doughs &amp; Starches/);
assert.match(hebrewHome, /בצקים ותוספות/);
assert.match(englishHome, /Vegan/);
assert.match(hebrewHome, /טבעוני/);
assert.match(englishHome, /Favorite/);
assert.match(hebrewHome, /אהוב/);

for (const categoryId of [
  "doughs_starches",
  "mains",
  "salads_pickles",
  "basics",
  "sweets",
  "snacks",
]) {
  assert.match(
    englishHome,
    new RegExp(`href="#${categoryId}"`),
    `Expected English category jump link for ${categoryId}`,
  );
  assert.match(
    hebrewHome,
    new RegExp(`href="#${categoryId}"`),
    `Expected Hebrew category jump link for ${categoryId}`,
  );
}

for (const slug of categorizedSlugs) {
  assert.match(
    englishHome,
    new RegExp(`href="/recipe-grams/en/${slug}/"`),
    `Expected English landing page card for ${slug}`,
  );
  assert.match(
    hebrewHome,
    new RegExp(`href="/recipe-grams/he/${slug}/"`),
    `Expected Hebrew landing page card for ${slug}`,
  );
}

for (const slug of uncategorizedSlugs) {
  assert.doesNotMatch(
    englishHome,
    new RegExp(`href="/recipe-grams/en/${slug}/"`),
    `Did not expect uncategorized English landing page card for ${slug}`,
  );
  assert.doesNotMatch(
    hebrewHome,
    new RegExp(`href="/recipe-grams/he/${slug}/"`),
    `Did not expect uncategorized Hebrew landing page card for ${slug}`,
  );
}

for (const language of languages) {
  for (const slug of markdownRecipes(language)) {
    readBuiltPage(language, slug);
  }
}

assert.doesNotMatch(
  englishHome,
  /github\.com\/alexfeigin\/recipe-grams\/blob\/astro-recipe-blog\/en\/[^"]+\.MD/,
);
assert.doesNotMatch(
  hebrewHome,
  /github\.com\/alexfeigin\/recipe-grams\/blob\/astro-recipe-blog\/he\/[^"]+\.MD/,
);

console.log("Issue #6 catalog landing page verification passed.");
