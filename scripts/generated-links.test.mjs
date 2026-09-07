import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { verifyGeneratedLinks } from "./generated-links.mjs";

function fixture(t, html) {
  const root = mkdtempSync(path.join(os.tmpdir(), "recipe-grams-links-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  for (const [file, content] of Object.entries({
    "index.html": '<h1 id="home">Home</h1>',
    "en/pizza_dough/index.html": html,
    "he/pizza_dough/index.html": '<h1 id="לחנונים">Pizza</h1>',
    "assets/pizza photo.jpg": "image fixture",
    "assets/icon.svg": '<svg><g id="pizza" /></svg>',
    "assets/recipe.pdf": "pdf fixture",
    "assets/site.css": "body {}",
    "assets/site.js": "export {};",
  })) {
    const target = path.join(root, file);
    mkdirSync(path.dirname(target), { recursive: true });
    writeFileSync(target, content);
  }
  return root;
}

test("resolves page-relative, base-prefixed, absolute local, asset and fragment URLs", (t) => {
  const root = fixture(
    t,
    `
    <h2 id="for-nerds">Details</h2><a name="legacy"></a>
    <a href="#for-nerds">same page</a><a href="#legacy">named anchor</a>
    <a href="?a=1&amp;b=2#for-nerds">query</a><a href="">self</a>
    <a href="../../#home">home</a><a href="/recipe-grams">base root</a>
    <a href="../../he/pizza_dough/#%D7%9C%D7%97%D7%A0%D7%95%D7%A0%D7%99%D7%9D">Hebrew</a>
    <a href="/recipe-grams/he/pizza_dough/index.html#לחנונים">explicit HTML</a>
    <a href="https://alexfeigin.github.io/recipe-grams/#home">absolute local</a>
    <a href="../../assets/pizza%20photo.jpg?download=1">image</a>
    <a href="../../assets/recipe.pdf#page=2">PDF</a>
    <img src='../../assets/pizza%20photo.jpg'>
    <img src=/recipe-grams/assets/icon.svg#pizza>
    <link rel="stylesheet" href="../../assets/site.css">
    <script src="../../assets/site.js"></script>
    <a href="https://example.com/missing">external</a>
    <a href="//example.com/missing">protocol-relative external</a>
    <a href="mailto:test@example.com">email</a><a href="tel:123">phone</a>
    <img src="data:image/png;base64,AAAA">
    <!-- <a href="missing">comment</a> -->
    <script>const example = '<a href="missing">';</script>
  `,
  );
  assert.equal(verifyGeneratedLinks(root).pages, 3);
});

for (const [label, html, error] of [
  [
    "original shell link",
    '<a href="../poolish_calc.sh">shell</a>',
    /missing en\/poolish_calc\.sh/,
  ],
  ["relative page", '<a href="../missing/">broken</a>', /missing en\/missing/],
  [
    "base-prefixed page",
    '<a href="/recipe-grams/missing/">broken</a>',
    /missing missing/,
  ],
  [
    "relative image",
    '<img src="../../assets/missing.jpg">',
    /missing assets\/missing\.jpg/,
  ],
  [
    "page fragment",
    '<a href="../../#missing">broken</a>',
    /missing fragment #missing/,
  ],
  [
    "SVG fragment",
    '<img src="../../assets/icon.svg#missing">',
    /missing fragment #missing/,
  ],
  [
    "base boundary",
    '<a href="/recipe-grams-other/">broken</a>',
    /escapes the published base/,
  ],
  [
    "root outside base",
    '<a href="/en/pizza_dough/">broken</a>',
    /escapes the published base/,
  ],
]) {
  test(`rejects broken ${label}`, (t) => {
    assert.throws(() => verifyGeneratedLinks(fixture(t, html)), error);
  });
}

test("honors the document base URL", (t) => {
  const root = fixture(
    t,
    '<base href="/recipe-grams/"><a href="he/pizza_dough/#לחנונים">Hebrew</a>',
  );
  assert.equal(verifyGeneratedLinks(root).pages, 3);
});
