import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdtempSync,
  mkdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { verifyCatalogSource } from "./catalog-source-verifier.mjs";
import { listLocalizedRecipeSources } from "../src/lib/recipeSources.ts";

const verifierCommand = fileURLToPath(
  new URL("./verify-catalog-source.mjs", import.meta.url),
);

function fixture(t, files) {
  const root = mkdtempSync(path.join(os.tmpdir(), "recipe-catalog-source-"));
  mkdirSync(path.join(root, "en"));
  mkdirSync(path.join(root, "he"));

  for (const file of files) {
    writeFileSync(path.join(root, file), "# Fixture\n");
  }

  t.after(() => rmSync(root, { recursive: true, force: true }));
  return root;
}

function localizations(title = "Dish", description = "A dish.") {
  return {
    en: { title, description },
    he: { title: `${title} (he)`, description: `${description} (he)` },
  };
}

function featured(localizedMetadata = localizations()) {
  return {
    listing: { intent: "featured", categoryId: "mains", featuredOrder: 1 },
    markerIds: [],
    localizations: localizedMetadata,
  };
}

function run(root, catalog) {
  const output = [];
  const errors = [];
  const exitCode = verifyCatalogSource({
    root,
    catalog,
    write: (message) => output.push(message),
    writeError: (message) => errors.push(message),
  });
  return { exitCode, output, errors };
}

function runCommand(root) {
  return spawnSync(process.execPath, [verifierCommand], {
    cwd: root,
    encoding: "utf8",
  });
}

test("discovers only supported languages and uppercase recipe sources", (t) => {
  const root = fixture(t, [
    "en/dish.MD",
    "en/ignored.md",
    "he/dish.MD",
    "he/ignored.md",
  ]);

  assert.deepEqual(
    listLocalizedRecipeSources(root).map(({ language, slug }) => ({
      language,
      slug,
    })),
    [
      { language: "en", slug: "dish" },
      { language: "he", slug: "dish" },
    ],
  );
});

test("the command accepts warning-only results without generated output", (t) => {
  const root = fixture(t, []);
  const result = runCommand(root);

  assert.equal(existsSync(path.join(root, "dist")), false);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stderr, "");
  assert.match(result.stdout, /^\[recipe catalog warning\]/);
  assert.match(
    result.stdout,
    /Catalog source verification: 0 error\(s\), [1-9]\d* warning\(s\), 0 localized source\(s\)\./,
  );
});

test("returns nonzero and identifies incomplete featured metadata", (t) => {
  const root = fixture(t, ["en/dish.MD", "he/dish.MD"]);
  const result = run(root, {
    dish: featured({
      en: { title: "Dish", description: "" },
      he: { title: "מנה", description: "מנה." },
    }),
  });

  assert.equal(result.exitCode, 1);
  assert.match(
    result.output[0],
    /^\[recipe catalog error\] en\/dish: .*no description/,
  );
  assert.match(result.output.at(-1), /1 error\(s\), 0 warning\(s\)/);
});

test("returns zero for an uncataloged source warning", (t) => {
  const root = fixture(t, ["en/new_recipe.MD", "he/new_recipe.MD"]);
  const result = run(root, {});

  assert.equal(result.exitCode, 0);
  assert.match(
    result.output[0],
    /^\[recipe catalog warning\] new_recipe: .*has no catalog entry/,
  );
  assert.match(result.output.at(-1), /0 error\(s\), 1 warning\(s\)/);
});

test("keeps a complete intentionally unlisted recipe quiet", (t) => {
  const root = fixture(t, ["en/helper.MD", "he/helper.MD"]);
  const result = run(root, {
    helper: {
      listing: { intent: "unlisted", reason: "Component recipe." },
      markerIds: [],
      localizations: localizations("Helper", "A helper."),
    },
  });

  assert.equal(result.exitCode, 0);
  assert.deepEqual(result.output, [
    "Catalog source verification: 0 error(s), 0 warning(s), 2 localized source(s).",
  ]);
});

test("the command returns nonzero for source discovery failures", (t) => {
  const root = mkdtempSync(path.join(os.tmpdir(), "recipe-catalog-source-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));

  const result = runCommand(root);

  assert.equal(result.status, 1);
  assert.equal(result.stdout, "");
  assert.match(
    result.stderr,
    /^\[recipe catalog error\] Source verification failed:/,
  );
});
