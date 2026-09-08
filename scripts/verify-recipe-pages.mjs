import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const languages = ["en", "he"];

function markdownRecipes(language) {
  return readdirSync(path.join(repoRoot, language))
    .filter((file) => file.endsWith(".MD"))
    .map((file) => file.replace(/\.MD$/, ""))
    .sort();
}

function readBuiltPage(language, slug) {
  const filePath = path.join(repoRoot, "dist", language, slug, "index.html");
  assert.ok(
    existsSync(filePath),
    `Expected generated page for ${language}/${slug}.MD at ${path.relative(repoRoot, filePath)}`,
  );
  const page = readFileSync(filePath, "utf8");
  assert.match(
    page,
    /data-pagefind-body/,
    `Expected ${language}/${slug} to render the recipe body, not a side page sharing its URL`,
  );
  return page;
}

for (const language of languages) {
  for (const slug of markdownRecipes(language)) {
    readBuiltPage(language, slug);
  }
}

const englishPizza = readBuiltPage("en", "pizza_dough");
assert.match(englishPizza, /<html[^>]+lang="en"/);
assert.match(englishPizza, /Pizza Dough Recipe/);
assert.match(englishPizza, /Poolish Preparation/);
assert.match(englishPizza, /src="\/recipe-grams\/pizza\.jpg"/);
assert.doesNotMatch(englishPizza, /Back to index|Back to Menu/);

const hebrewPizza = readBuiltPage("he", "pizza_dough");
assert.match(hebrewPizza, /<html[^>]+lang="he"[^>]+dir="rtl"/);
assert.match(hebrewPizza, /מתכון לבצק פיצה/);
assert.match(hebrewPizza, /הכנת הפוליש/);
assert.match(hebrewPizza, /src="\/recipe-grams\/pizza\.jpg"/);
assert.doesNotMatch(hebrewPizza, /חזרה לתפריט/);

for (const [language, landingSegments] of [
  ["en", []],
  ["he", ["he"]],
]) {
  const landingPage = readFileSync(
    path.join(repoRoot, "dist", ...landingSegments, "index.html"),
    "utf8",
  );
  const cardDestinations = Array.from(
    landingPage.matchAll(
      /<article class="recipe-card"[^>]*>\s*<a href="([^"]+)"/g,
    ),
    ([, href]) => href,
  );
  assert.ok(
    cardDestinations.length > 0,
    `Expected recipe cards on the ${language} landing page`,
  );
  for (const href of cardDestinations) {
    assert.match(
      href,
      new RegExp(`^/recipe-grams/${language}/[^/]+/$`),
      `Expected a generated ${language} recipe page destination`,
    );
  }
  assert.ok(
    cardDestinations.includes(`/recipe-grams/${language}/pizza_dough/`),
    `Expected the ${language} pizza dough card to open its generated page`,
  );
}

console.log("Recipe page verification passed.");
