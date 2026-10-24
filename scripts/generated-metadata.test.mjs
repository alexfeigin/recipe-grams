import assert from "node:assert/strict";
import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { verifyGeneratedMetadata } from "./generated-metadata.mjs";

const site = new URL("https://example.test/recipes/");

function fixture(t) {
  const root = mkdtempSync(join(os.tmpdir(), "generated-metadata-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  for (const [route, english, hebrew, noindex] of [
    ["", "", "he/", false],
    ["he/", "", "he/", false],
    ["en/poolish/", "en/poolish/", "he/poolish/", true],
    ["he/poolish/", "en/poolish/", "he/poolish/", true],
    ["en/soup/", "en/soup/", "he/soup/", false],
    ["he/soup/", "en/soup/", "he/soup/", false],
    ["en/only/", undefined, undefined, false],
  ]) {
    mkdirSync(join(root, route), { recursive: true });
    const alternates =
      english === undefined
        ? ""
        : `
      <link rel="alternate" hreflang="en" href="${new URL(english, site)}">
      <link rel="alternate" hreflang="he" href="${new URL(hebrew, site)}">`;
    writeFileSync(
      join(root, route, "index.html"),
      `<!doctype html><html><head>
      ${alternates}
      ${noindex ? '<meta name="robots" content="noindex">' : `<link rel="canonical" href="${new URL(route, site)}">`}
      </head><body>Fixture</body></html>`,
    );
  }
  writeFileSync(
    join(root, "robots.txt"),
    "User-agent: *\nAllow: /\nSitemap: https://example.test/recipes/sitemap-index.xml\n",
  );
  return root;
}

function edit(root, route, transform) {
  const file = join(root, route, "index.html");
  writeFileSync(file, transform(readFileSync(file, "utf8")));
}

test("accepts reciprocal language sets regardless of link order, including an unpaired recipe", (t) => {
  const root = fixture(t);
  // Static verification files have no document metadata contract.
  writeFileSync(join(root, "google-verification.html"), "verification");
  assert.deepEqual(verifyGeneratedMetadata(root, site), {
    paired: 6,
    unpaired: 1,
  });
});

for (const route of ["", "he/"]) {
  test(`rejects a noindex home without a canonical: ${route || "/"}`, (t) => {
    const root = fixture(t);
    edit(root, route, (html) =>
      html.replace(
        /<link rel="canonical"[^>]*>/,
        '<meta name="robots" content="noindex">',
      ),
    );
    assert.throws(() => verifyGeneratedMetadata(root, site), /indexing policy/);
  });

  test(`requires a home canonical: ${route || "/"}`, (t) => {
    const root = fixture(t);
    edit(root, route, (html) =>
      html.replace(/<link rel="canonical"[^>]*>/, ""),
    );
    assert.throws(() => verifyGeneratedMetadata(root, site), /canonical/);
  });
}

for (const route of ["en/poolish/", "he/poolish/"]) {
  test(`rejects an indexable canonical calculator: ${route}`, (t) => {
    const root = fixture(t);
    edit(root, route, (html) =>
      html.replace(
        '<meta name="robots" content="noindex">',
        `<link rel="canonical" href="${new URL(route, site)}">`,
      ),
    );
    assert.throws(() => verifyGeneratedMetadata(root, site), /indexing policy/);
  });

  test(`rejects a canonical on the noindex calculator: ${route}`, (t) => {
    const root = fixture(t);
    edit(root, route, (html) =>
      html.replace(
        "</head>",
        `<link rel="canonical" href="${new URL(route, site)}"></head>`,
      ),
    );
    assert.throws(() => verifyGeneratedMetadata(root, site), /canonical/);
  });
}

test("rejects an incorrect return alternate", (t) => {
  const root = fixture(t);
  edit(root, "he/soup/", (html) =>
    html.replace(
      'href="https://example.test/recipes/en/soup/"',
      'href="https://example.test/recipes/"',
    ),
  );
  assert.throws(
    () => verifyGeneratedMetadata(root, site),
    /hreflang alternates/,
  );
});

test("rejects an unpaired recipe claiming the fallback home as a counterpart", (t) => {
  const root = fixture(t);
  edit(root, "en/only/", (html) =>
    html.replace(
      "</head>",
      '<link rel="alternate" hreflang="he" href="https://example.test/recipes/he/"></head>',
    ),
  );
  assert.throws(
    () => verifyGeneratedMetadata(root, site),
    /claims a counterpart/,
  );
});

test("requires metadata in the document head", (t) => {
  const root = fixture(t);
  edit(root, "", (html) =>
    html
      .replace(/(<link rel="canonical"[^>]*>)/, "")
      .replace(
        "</body>",
        '<link rel="canonical" href="https://example.test/recipes/"></body>',
      ),
  );
  assert.throws(() => verifyGeneratedMetadata(root, site), /canonical/);
});

test("requires both localized calculators to exist", (t) => {
  const root = fixture(t);
  rmSync(join(root, "he/poolish/"), { recursive: true });
  assert.throws(
    () => verifyGeneratedMetadata(root, site),
    /Missing metadata page: he\/poolish/,
  );
});

test("rejects a sitemap declaration for the wrong site base", (t) => {
  const root = fixture(t);
  writeFileSync(
    join(root, "robots.txt"),
    "Sitemap: https://example.test/sitemap-index.xml\n",
  );
  assert.throws(
    () => verifyGeneratedMetadata(root, site),
    /robots.txt must point at the sitemap index/,
  );
});
