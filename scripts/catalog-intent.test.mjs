// Catalog intent fixtures: which recipes earn a landing page card, and what the
// catalog reports when it disagrees with the recipe source tree. Every case is
// a small hand-written catalog, so these checks describe the rules rather than
// re-deriving them from the published catalog. They need no build, preview
// server, browser, or SITE_BASE_URL.
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  collectCatalogDiagnostics,
  getRecipeMetadata,
  listUnlistedRecipes,
  selectFeaturedRecipes,
} from "../src/lib/recipeCatalog.ts";

function pair(slug) {
  return [
    { language: "en", slug },
    { language: "he", slug },
  ];
}

function localizations(title, description) {
  return {
    en: { title: `${title}`, description },
    he: { title: `${title} (he)`, description: `${description} (he)` },
  };
}

function featured(categoryId, featuredOrder, title = "Featured") {
  return {
    listing: { intent: "featured", categoryId, featuredOrder },
    markerIds: [],
    localizations: localizations(title, "A featured recipe."),
  };
}

function unlisted(reason, title = "Unlisted") {
  return {
    listing: { intent: "unlisted", reason },
    markerIds: [],
    localizations: localizations(title, "A deliberately unfeatured recipe."),
  };
}

// The fallback a page shows when the catalog gives it no usable text.
const generic = {
  title: "Recipe-Grams Recipe",
  description:
    "A Recipe-Grams page rendered from the localized Markdown recipe source.",
};

function messagesFor(diagnostics, severity) {
  return diagnostics
    .filter((diagnostic) => diagnostic.severity === severity)
    .map((diagnostic) => diagnostic.message);
}

test("featured recipes become cards in featured order", () => {
  const recipes = [...pair("second"), ...pair("first")];
  const catalog = {
    first: featured("sweets", 2, "First"),
    second: featured("mains", 1, "Second"),
  };

  assert.deepEqual(
    selectFeaturedRecipes("en", recipes, catalog).map((recipe) => recipe.slug),
    ["second", "first"],
  );
  assert.deepEqual(
    selectFeaturedRecipes("he", recipes, catalog).map(
      (recipe) => recipe.metadata.title,
    ),
    ["Second (he)", "First (he)"],
  );
  assert.deepEqual(collectCatalogDiagnostics(recipes, catalog), []);
});

test("an intentionally unfeatured recipe stays off the landing page quietly", () => {
  const recipes = [...pair("featured_dish"), ...pair("helper")];
  const catalog = {
    featured_dish: featured("mains", 1),
    helper: unlisted("Component recipe other recipes link to."),
  };

  assert.deepEqual(
    selectFeaturedRecipes("en", recipes, catalog).map((recipe) => recipe.slug),
    ["featured_dish"],
  );
  assert.deepEqual(collectCatalogDiagnostics(recipes, catalog), []);
});

test("an uncataloged recipe publishes with a warning and no card", () => {
  const recipes = pair("new_recipe");

  assert.deepEqual(selectFeaturedRecipes("en", recipes, {}), []);

  const diagnostics = collectCatalogDiagnostics(recipes, {});
  assert.deepEqual(messagesFor(diagnostics, "error"), []);
  assert.equal(messagesFor(diagnostics, "warning").length, 1);
  assert.match(diagnostics[0].message, /new_recipe has no catalog entry/);
  assert.equal(diagnostics[0].slug, "new_recipe");
});

test("incomplete featured metadata is an error, not a silent exclusion", () => {
  const recipes = pair("half_written");
  const catalog = {
    half_written: {
      listing: { intent: "featured", categoryId: "sweets", featuredOrder: 1 },
      markerIds: [],
      localizations: { en: { title: "Half Written", description: "" } },
    },
  };

  assert.deepEqual(selectFeaturedRecipes("en", recipes, catalog), []);

  const errors = collectCatalogDiagnostics(recipes, catalog).filter(
    (diagnostic) => diagnostic.severity === "error",
  );
  assert.deepEqual(
    errors.map((error) => error.language),
    ["en", "he"],
  );
  assert.match(errors[0].message, /featured but its catalog entry has no/);
  assert.match(errors[1].message, /no title or description/);
});

test("an unlisted recipe with missing metadata warns instead of failing", () => {
  const recipes = pair("helper");
  const catalog = {
    helper: {
      listing: { intent: "unlisted", reason: "Helper note." },
      markerIds: [],
      localizations: { en: { title: "Helper", description: "A helper." } },
    },
  };

  const diagnostics = collectCatalogDiagnostics(recipes, catalog);
  assert.deepEqual(messagesFor(diagnostics, "error"), []);
  assert.equal(messagesFor(diagnostics, "warning").length, 1);
  assert.match(diagnostics[0].message, /he\/helper\.MD is unlisted/);

  // The warning says the page falls back to the generic title and description,
  // so the page it describes has to actually get them.
  assert.deepEqual(
    getRecipeMetadata({ language: "he", slug: "helper" }, catalog),
    {
      title: generic.title,
      description: generic.description,
    },
  );
  assert.deepEqual(
    getRecipeMetadata({ language: "en", slug: "helper" }, catalog),
    {
      title: "Helper",
      description: "A helper.",
    },
  );
});

test("an unlisted recipe with an empty field falls back field by field", () => {
  const recipes = pair("helper");
  const catalog = {
    helper: {
      listing: { intent: "unlisted", reason: "Helper note." },
      markerIds: [],
      localizations: {
        en: { title: "", description: "A helper.", image: "helper.jpg" },
        he: { title: "עוזר", description: "", image: "helper.jpg" },
      },
    },
  };

  const diagnostics = collectCatalogDiagnostics(recipes, catalog);
  assert.deepEqual(messagesFor(diagnostics, "error"), []);
  assert.equal(messagesFor(diagnostics, "warning").length, 2);
  assert.match(
    diagnostics[0].message,
    /en\/helper\.MD is unlisted.*no title,/s,
  );
  assert.match(
    diagnostics[1].message,
    /he\/helper\.MD is unlisted.*no description,/s,
  );

  assert.deepEqual(
    getRecipeMetadata({ language: "en", slug: "helper" }, catalog),
    {
      title: generic.title,
      description: "A helper.",
      image: "helper.jpg",
    },
  );
  assert.deepEqual(
    getRecipeMetadata({ language: "he", slug: "helper" }, catalog),
    {
      title: "עוזר",
      description: generic.description,
      image: "helper.jpg",
    },
  );
});

test("an empty localization is no better than a missing one", () => {
  const catalog = {
    helper: {
      listing: { intent: "unlisted", reason: "Helper note." },
      markerIds: [],
      localizations: { en: { title: "", description: "" } },
    },
  };

  assert.deepEqual(
    getRecipeMetadata({ language: "en", slug: "helper" }, catalog),
    {
      title: generic.title,
      description: generic.description,
    },
  );
  assert.deepEqual(
    getRecipeMetadata({ language: "en", slug: "uncataloged" }, catalog),
    getRecipeMetadata({ language: "en", slug: "helper" }, catalog),
  );
});

test("complete metadata reaches the page untouched, social override included", () => {
  const catalog = {
    dish: {
      listing: { intent: "featured", categoryId: "mains", featuredOrder: 1 },
      markerIds: [],
      localizations: {
        en: {
          title: "Dish",
          description: "A dish.",
          image: "dish.jpg",
          socialImage: "dish-card.png",
        },
      },
    },
  };

  assert.deepEqual(
    getRecipeMetadata({ language: "en", slug: "dish" }, catalog),
    {
      title: "Dish",
      description: "A dish.",
      image: "dish.jpg",
      socialImage: "dish-card.png",
    },
  );
});

test("verification checks the unlisted pages the source tree actually has", () => {
  const recipes = [
    ...pair("featured_dish"),
    { language: "en", slug: "helper" },
  ];
  const catalog = {
    featured_dish: featured("mains", 1),
    helper: unlisted("Component recipe other recipes link to."),
    removed: unlisted("Kept for a recipe that no longer exists."),
  };

  // One localized source means one page to require: the missing Hebrew
  // counterpart is a warning, not a page verification may demand. An orphan
  // entry names no page at all.
  assert.deepEqual(listUnlistedRecipes(recipes, catalog), [
    { language: "en", slug: "helper" },
  ]);
  assert.deepEqual(
    messagesFor(collectCatalogDiagnostics(recipes, catalog), "error"),
    [],
  );
});

test("a catalog with nothing unlisted asks verification for nothing", () => {
  const recipes = pair("featured_dish");
  const catalog = { featured_dish: featured("mains", 1) };

  assert.deepEqual(listUnlistedRecipes(recipes, catalog), []);
  assert.deepEqual(collectCatalogDiagnostics(recipes, catalog), []);
});

test("a recipe missing one language keeps its card off every landing page", () => {
  const recipes = [{ language: "en", slug: "english_only" }];
  const catalog = { english_only: featured("mains", 1) };

  assert.deepEqual(selectFeaturedRecipes("en", recipes, catalog), []);

  const warnings = messagesFor(
    collectCatalogDiagnostics(recipes, catalog),
    "warning",
  );
  assert.equal(warnings.length, 2);
  assert.match(
    warnings[0],
    /has he catalog metadata, but he\/english_only\.MD/,
  );
  assert.match(warnings[1], /is not a complete Recipe Pair/);
});

test("a catalog entry without any recipe source is an orphan", () => {
  const warnings = messagesFor(
    collectCatalogDiagnostics(pair("real"), {
      real: featured("mains", 1),
      removed: featured("sweets", 2),
    }),
    "warning",
  );

  assert.equal(warnings.length, 1);
  assert.match(warnings[0], /removed is an orphan catalog entry/);
});

test("one featured position per category, and orders may repeat across categories", () => {
  const recipes = [...pair("one"), ...pair("two"), ...pair("three")];
  const warnings = messagesFor(
    collectCatalogDiagnostics(recipes, {
      one: featured("mains", 1),
      two: featured("mains", 1),
      three: featured("sweets", 1),
    }),
    "warning",
  );

  assert.equal(warnings.length, 1);
  assert.match(warnings[0], /one, two share featured order 1 in mains/);
});
