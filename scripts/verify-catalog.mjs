// Landing page verification: the built pages against the published catalog.
// The eligibility rules themselves are checked with fixtures in
// scripts/catalog-intent.test.mjs; this script checks that the pages the build
// produced show exactly the recipes the catalog features, in the catalog's
// order, and that nothing here needs a list of exceptions to stay green.
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { parse } from "parse5";
import {
  collectCatalogDiagnostics,
  recipeCatalog,
  selectFeaturedRecipes,
} from "../src/lib/recipeCatalog.ts";
import { labelsByLanguage, languages } from "../src/lib/site.ts";

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

/** The recipe card links of a landing page, in the order they are rendered. */
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

// The catalog and the recipe source tree must agree before the built pages can
// be judged against them. Warnings are reported and tolerated by policy;
// incomplete featured metadata is an error.
const localizedRecipes = languages.flatMap((language) =>
  markdownRecipes(language).map((slug) => ({ language, slug })),
);
const diagnostics = collectCatalogDiagnostics(localizedRecipes);

for (const diagnostic of diagnostics) {
  console.log(`[recipe catalog ${diagnostic.severity}] ${diagnostic.message}`);
}

assert.deepEqual(
  diagnostics
    .filter((diagnostic) => diagnostic.severity === "error")
    .map((diagnostic) => diagnostic.message),
  [],
  "The published catalog must not describe an incomplete featured recipe",
);

// Generated browsing coverage against the catalog: every featured recipe has a
// card, in its category section and in its featured order, and nothing else
// does.
const homesByLanguage = { en: englishHome, he: hebrewHome };

for (const language of languages) {
  const featured = selectFeaturedRecipes(language, localizedRecipes);
  const expected = Object.keys(labelsByLanguage[language].categoryLabels)
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

// A deliberately unfeatured recipe publishes its pages and stays off the
// landing pages, without any verification exception naming it.
const unlistedSlugs = Object.entries(recipeCatalog)
  .filter(([, entry]) => entry.listing.intent === "unlisted")
  .map(([slug]) => slug);

assert.ok(
  unlistedSlugs.length > 0,
  "Expected the catalog to record at least one intentionally unfeatured recipe",
);

for (const slug of unlistedSlugs) {
  for (const language of languages) {
    readBuiltPage(language, slug);
    assert.doesNotMatch(
      homesByLanguage[language],
      new RegExp(`href="/recipe-grams/${language}/${slug}/"`),
      `Did not expect a landing page card for the unlisted recipe ${slug}`,
    );
  }
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

console.log("Catalog landing page verification passed.");
