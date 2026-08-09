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
  return readFileSync(filePath, "utf8");
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

const landingPage = readFileSync(
  path.join(repoRoot, "dist", "index.html"),
  "utf8",
);
assert.match(landingPage, /href="\/recipe-grams\/en\/pizza_dough\/"/);
assert.doesNotMatch(
  landingPage,
  /github\.com\/alexfeigin\/recipe-grams\/blob\/astro-recipe-blog\/en\/(?:pizza_dough|grilled_chicken_thighs|choclatechip_vegan|quinoa)\.MD/,
);

console.log("Issue #5 recipe page verification passed.");
