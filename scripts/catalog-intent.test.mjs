import assert from "node:assert/strict";
import { test } from "node:test";
import astroConfig from "../astro.config.mjs";
import {
  collectCatalogDiagnostics,
  getRecipeMetadata,
  listUnlistedRecipes,
  recipeCatalog,
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

function featured(categoryId, title = "Featured") {
  return {
    listing: { intent: "featured", categoryId },
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

test("featured recipes become cards in catalog order", () => {
  const recipes = [...pair("first"), ...pair("second")];
  const catalog = {
    second: featured("mains", "Second"),
    first: featured("sweets", "First"),
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
    featured_dish: featured("mains"),
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
      listing: { intent: "featured", categoryId: "sweets" },
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
      listing: { intent: "featured", categoryId: "mains" },
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
    featured_dish: featured("mains"),
    helper: unlisted("Component recipe other recipes link to."),
    removed: unlisted("Kept for a recipe that no longer exists."),
  };

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
  const catalog = { featured_dish: featured("mains") };

  assert.deepEqual(listUnlistedRecipes(recipes, catalog), []);
  assert.deepEqual(collectCatalogDiagnostics(recipes, catalog), []);
});

test("a recipe missing one language keeps its card off every landing page", () => {
  const recipes = [{ language: "en", slug: "english_only" }];
  const catalog = { english_only: featured("mains") };

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
      real: featured("mains"),
      removed: featured("sweets"),
    }),
    "warning",
  );

  assert.equal(warnings.length, 1);
  assert.match(warnings[0], /removed is an orphan catalog entry/);
});

function catalogBuildHook() {
  const integrations = astroConfig.integrations.filter(
    ({ name }) => name === "recipe-catalog-check",
  );
  assert.equal(
    integrations.length,
    1,
    "register the catalog check exactly once",
  );
  const hook = integrations[0].hooks["astro:build:start"];
  assert.equal(typeof hook, "function");
  return hook;
}

test("the configured build hook accepts a complete catalog quietly", (t) => {
  const warnings = t.mock.method(console, "warn", () => {});

  assert.doesNotThrow(() => catalogBuildHook()());
  assert.equal(warnings.mock.callCount(), 0);
});

test("the configured build hook preserves errors and checks each build afresh", (t) => {
  const entry = recipeCatalog.grill_rub;
  t.after(() => {
    recipeCatalog.grill_rub = entry;
  });
  const warnings = t.mock.method(console, "warn", () => {});
  const hook = catalogBuildHook();
  recipeCatalog.grill_rub = {
    ...entry,
    localizations: {
      ...entry.localizations,
      en: { ...entry.localizations.en, title: "" },
    },
  };

  assert.throws(() => hook(), {
    message:
      "Incomplete recipe catalog metadata:\n  - en/grill_rub.MD is featured but its catalog entry has no title, so the landing page would drop its card.",
  });

  recipeCatalog.grill_rub = entry;
  assert.doesNotThrow(() => hook());
  assert.equal(warnings.mock.callCount(), 0);
});

test("the configured build hook emits warnings once per build without failing", (t) => {
  const entry = recipeCatalog.grill_rub;
  t.after(() => {
    recipeCatalog.grill_rub = entry;
  });
  recipeCatalog.grill_rub = {
    ...entry,
    listing: { intent: "unlisted", reason: "Build warning fixture." },
    localizations: {
      ...entry.localizations,
      en: { ...entry.localizations.en, description: "" },
    },
  };
  const warnings = t.mock.method(console, "warn", () => {});
  const hook = catalogBuildHook();
  const expected =
    "[recipe catalog] en/grill_rub.MD is unlisted and its catalog entry has no description, so its page falls back to the generic title and description.";

  assert.doesNotThrow(() => hook());
  assert.deepEqual(
    warnings.mock.calls.map(({ arguments: args }) => args),
    [[expected]],
  );
  assert.doesNotThrow(() => hook());
  assert.deepEqual(
    warnings.mock.calls.map(({ arguments: args }) => args),
    [[expected], [expected]],
  );
});
