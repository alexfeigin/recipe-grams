// Destination fixtures for generated recipe pages. These run the real Markdown
// AST plugin and the real renderer, so they need no build, preview server,
// browser, or SITE_BASE_URL.
import assert from "node:assert/strict";
import { test } from "node:test";
import { createSatteriMarkdownProcessor } from "@astrojs/markdown-satteri";
import {
  createSiteDestinationPlugin,
  resolveSiteDestination,
} from "../src/lib/recipeLinks.ts";

const basePath = "/recipe-grams/";

for (const [label, language, destination, expected] of [
  // Recipe links, as written in a localized recipe under `en/` or `he/`.
  ["bare recipe link", "en", "grill_rub.MD", "/recipe-grams/en/grill_rub/"],
  ["dot-slash recipe link", "en", "./salt.MD", "/recipe-grams/en/salt/"],
  ["Hebrew recipe link", "he", "salt.MD", "/recipe-grams/he/salt/"],
  ["cross-language link", "en", "../he/salt.MD", "/recipe-grams/he/salt/"],
  ["reverse cross-language", "he", "../en/salt.MD", "/recipe-grams/en/salt/"],
  [
    "recipe fragment",
    "en",
    "salt.MD#for-nerds",
    "/recipe-grams/en/salt/#for-nerds",
  ],
  ["encoded fragment", "he", "salt.MD#%D7%9C", "/recipe-grams/he/salt/#%D7%9C"],
  ["recipe query", "en", "salt.MD?print=1", "/recipe-grams/en/salt/?print=1"],
  // Images, published from the recipe source tree at the site root.
  ["image", "en", "../images/pizza.jpg", "/recipe-grams/pizza.jpg"],
  ["Hebrew image", "he", "../images/peta.jpeg", "/recipe-grams/peta.jpeg"],
  [
    "nested image",
    "en",
    "../images/steps/one.png",
    "/recipe-grams/steps/one.png",
  ],
  // Destinations that must survive untouched.
  ["external .MD", "en", "https://example.com/SPEC.MD", undefined],
  ["uppercase scheme", "en", "HTTPS://example.com/SPEC.MD", undefined],
  ["protocol relative", "en", "//example.com/SPEC.MD", undefined],
  ["mailto", "en", "mailto:cook@example.com", undefined],
  ["same-page fragment", "en", "#for-nerds", undefined],
  ["site-absolute path", "en", "/recipe-grams/en/salt/", undefined],
  ["legacy index link", "en", "../index.MD", undefined],
  ["repo file link", "en", "../poolish_calc.sh", undefined],
  ["outside the repo", "en", "../../elsewhere/salt.MD", undefined],
  ["lowercase extension", "en", "salt.md", undefined],
  ["non-recipe directory", "en", "notes/salt.MD", undefined],
]) {
  test(`resolves ${label}`, () => {
    assert.equal(
      resolveSiteDestination(destination, language, basePath),
      expected,
    );
  });
}

const renderers = new Map();

async function render(markdown, language) {
  if (!renderers.has(language)) {
    renderers.set(
      language,
      createSatteriMarkdownProcessor({
        mdastPlugins: [createSiteDestinationPlugin(language, basePath)],
      }),
    );
  }
  const renderer = await renderers.get(language);
  const rendered = await renderer.render(markdown, {
    fileURL: new URL(`file:///repo/${language}/fixture.MD`),
    frontmatter: {},
  });
  return rendered.code;
}

test("rewrites inline link and image destinations", async () => {
  const html = await render(
    "[Rub](./grill_rub.MD) and [salt](../he/salt.MD#for-nerds)\n\n" +
      "![Pizza](../images/pizza.jpg)\n",
    "en",
  );
  assert.match(html, /<a href="\/recipe-grams\/en\/grill_rub\/">Rub<\/a>/);
  assert.match(
    html,
    /<a href="\/recipe-grams\/he\/salt\/#for-nerds">salt<\/a>/,
  );
  assert.match(html, /<img src="\/recipe-grams\/pizza\.jpg" alt="Pizza">/);
  assert.doesNotMatch(html, /__ASTRO_IMAGE_/);
});

test("rewrites reference-style link and image destinations", async () => {
  const html = await render(
    "[Rub][rub] and ![Pizza][pizza]\n\n[rub]: ./grill_rub.MD\n[pizza]: ../images/pizza.jpg\n",
    "en",
  );
  assert.match(html, /<a href="\/recipe-grams\/en\/grill_rub\/">Rub<\/a>/);
  assert.match(html, /<img src="\/recipe-grams\/pizza\.jpg" alt="Pizza">/);
});

test("leaves external destinations external", async () => {
  const html = await render(
    "[Spec](https://example.com/SPEC.MD) and [ref][spec]\n\n[spec]: https://example.com/OTHER.MD\n",
    "en",
  );
  assert.match(html, /href="https:\/\/example\.com\/SPEC\.MD"/);
  assert.match(html, /href="https:\/\/example\.com\/OTHER\.MD"/);
});

test("leaves link-shaped text in code untouched", async () => {
  const html = await render(
    "Write `[Rub](grill_rub.MD)` first.\n\n```\n[Rub](grill_rub.MD)\n![P](../images/pizza.jpg)\n```\n",
    "en",
  );
  assert.match(html, /<code>\[Rub\]\(grill_rub\.MD\)<\/code>/);
  assert.equal(html.match(/grill_rub\.MD/g)?.length, 2);
  assert.match(html, /\.\.\/images\/pizza\.jpg/);
  assert.doesNotMatch(html, /<a href/);
});

test("leaves labels, titles, and prose untouched", async () => {
  const html = await render(
    '[grill_rub.MD](./grill_rub.MD "The rub")\n\nSee grill_rub.MD in the repo.\n',
    "en",
  );
  assert.match(
    html,
    /<a href="\/recipe-grams\/en\/grill_rub\/" title="The rub">grill_rub\.MD<\/a>/,
  );
  assert.match(html, /See grill_rub\.MD in the repo\./);
});
