import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { parse } from "parse5";
import {
  listUnlistedRecipes,
  selectFeaturedRecipes,
} from "../src/lib/recipeCatalog.ts";
import { listLocalizedRecipeSources } from "../src/lib/recipeSources.ts";
import { uiLabels } from "../src/i18n/ui.ts";
import { languages } from "../src/lib/site.ts";

const repoRoot = process.cwd();

function elements(node) {
  return [
    ...(node.tagName ? [node] : []),
    ...(node.childNodes ?? []).flatMap(elements),
  ];
}

function attribute(element, name) {
  return element.attrs?.find((attr) => attr.name === name)?.value;
}

function landingCardHrefs(html) {
  return elements(parse(html))
    .filter(
      (element) =>
        element.tagName === "article" &&
        attribute(element, "class")?.split(/\s+/).includes("recipe-card"),
    )
    .flatMap((card) =>
      elements(card)
        .filter((element) => element.tagName === "a")
        .slice(0, 1)
        .map((link) => attribute(link, "href")),
    );
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

const localizedRecipes = listLocalizedRecipeSources(repoRoot);

const homesByLanguage = { en: englishHome, he: hebrewHome };

for (const language of languages) {
  const featured = selectFeaturedRecipes(language, localizedRecipes);
  const expected = Object.keys(uiLabels[language].categoryLabels)
    .flatMap((categoryId) =>
      featured.filter((recipe) => recipe.categoryId === categoryId),
    )
    .map((recipe) => `/recipe-grams/${language}/${recipe.slug}/`);

  assert.ok(expected.length > 0, `Expected ${language} landing page cards`);
  assert.deepEqual(
    landingCardHrefs(homesByLanguage[language]),
    expected,
    `${language} landing page cards must match the catalog's featured recipes`,
  );
}

for (const recipe of listUnlistedRecipes(localizedRecipes)) {
  readBuiltPage(recipe.language, recipe.slug);
  assert.doesNotMatch(
    homesByLanguage[recipe.language],
    new RegExp(`href="/recipe-grams/${recipe.language}/${recipe.slug}/"`),
    `Did not expect a landing page card for the unlisted recipe ${recipe.slug}`,
  );
}

console.log("Catalog landing page verification passed.");
