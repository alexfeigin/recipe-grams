import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { verifyGeneratedLinks } from "./generated-links.mjs";

const repoRoot = process.cwd();
const basePath = "/recipe-grams";

function readBuiltPage(...segments) {
  const filePath = path.join(repoRoot, "dist", ...segments, "index.html");
  assert.ok(
    existsSync(filePath),
    `Expected generated page at ${path.relative(repoRoot, filePath)}`,
  );
  return readFileSync(filePath, "utf8");
}

function builtAssetExists(assetPath) {
  assert.ok(
    existsSync(path.join(repoRoot, "dist", assetPath)),
    `Expected generated asset at dist/${assetPath}`,
  );
}

function assertNoBrokenGeneratedImages(html, pageName) {
  const imageSources = Array.from(
    html.matchAll(/<img\b[^>]*src="([^"]+)"/g),
    ([, src]) => src,
  );
  const generatedImages = imageSources.filter((src) =>
    src.startsWith(basePath),
  );

  assert.ok(
    generatedImages.length > 0,
    `Expected ${pageName} to include generated image assets`,
  );

  for (const src of generatedImages) {
    const relativePath = src.replace(new RegExp(`^${basePath}/?`), "");
    builtAssetExists(relativePath);
  }
}

function listBuiltPages(directory = path.join(repoRoot, "dist")) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      return listBuiltPages(entryPath);
    }

    return entry.name === "index.html" ? [entryPath] : [];
  });
}

function pageNameFor(filePath) {
  return path.relative(path.join(repoRoot, "dist"), filePath);
}

const englishHome = readBuiltPage();
const hebrewHome = readBuiltPage("he");
const englishRicePilaf = readBuiltPage("en", "rice_pilaf");
const hebrewRicePilaf = readBuiltPage("he", "rice_pilaf");
const englishGrilledChicken = readBuiltPage("en", "grilled_chicken_thighs");
const hebrewGrilledChicken = readBuiltPage("he", "grilled_chicken_thighs");
const englishPizza = readBuiltPage("en", "pizza_dough");

assert.match(englishHome, /href="\/recipe-grams\/en\/rice_pilaf\/"/);
assert.match(hebrewHome, /href="\/recipe-grams\/he\/rice_pilaf\/"/);
assert.match(englishHome, /href="\/recipe-grams\/he\/"/);
assert.match(hebrewHome, /href="\/recipe-grams\/"/);

assert.match(englishRicePilaf, /href="\/recipe-grams\/he\/rice_pilaf\/"/);
assert.match(hebrewRicePilaf, /href="\/recipe-grams\/en\/rice_pilaf\/"/);

assert.match(
  englishRicePilaf,
  /href="\/recipe-grams\/en\/grilled_chicken_thighs\/"/,
);
assert.match(
  hebrewRicePilaf,
  /href="\/recipe-grams\/he\/grilled_chicken_thighs\/"/,
);
assert.match(englishGrilledChicken, /href="\/recipe-grams\/en\/grill_rub\/"/);
assert.match(hebrewGrilledChicken, /href="\/recipe-grams\/he\/grill_rub\/"/);

for (const [pageName, html] of [
  ["English home", englishHome],
  ["Hebrew home", hebrewHome],
  ["English rice pilaf", englishRicePilaf],
  ["Hebrew rice pilaf", hebrewRicePilaf],
  ["English grilled chicken", englishGrilledChicken],
  ["Hebrew grilled chicken", hebrewGrilledChicken],
]) {
  assert.doesNotMatch(
    html,
    /href="[^"]+\.MD(?:#[^"]*)?"/,
    `Expected no Markdown recipe hrefs in ${pageName}`,
  );
  assertNoBrokenGeneratedImages(html, pageName);
}

for (const pagePath of listBuiltPages()) {
  const pageName = pageNameFor(pagePath);
  const html = readFileSync(pagePath, "utf8");

  assert.doesNotMatch(
    html,
    /href="[^"]+\.MD(?:#[^"]*)?"/,
    `Expected no Markdown recipe hrefs in ${pageName}`,
  );
  assertNoBrokenGeneratedImages(html, pageName);
}

verifyGeneratedLinks(path.join(repoRoot, "dist"));

assert.match(englishPizza, /src="\/recipe-grams\/pizza\.jpg"/);
builtAssetExists("pizza.jpg");
builtAssetExists("grilledchicken.jpeg");

console.log("Navigation verification passed.");
