# Issue 14: pizza calculator resources and generated links

Verified 2026-09-07 against the production build.

Both pizza recipes previously emitted `../poolish_calc.sh`, resolving to
nonexistent `en/poolish_calc.sh` and `he/poolish_calc.sh` in the build. The old
navigation check passed because it only checked base-prefixed anchor URLs.
Before repairing the recipes, `node scripts/verify-generated-links.mjs` failed
on that exact English link; an independent URL-resolution check confirmed both
missing targets.

The paired Markdown recipes now link to the existing localized web calculators
and the shell source on GitHub. These absolute URLs also work in direct GitHub
Markdown views. The legacy menu backlinks and all six body image references
were checked and remain valid. Catalog metadata and the legacy index need no
changes for this resource-link repair.

## Link verification

`npm run verify:links` checks the complete build. `npm run verify:issue7` also
uses the same checker. It parses HTML with the explicitly declared `parse5`
dependency and resolves URLs against each containing page, including a document
base when present. It checks relative, base-prefixed, and same-origin absolute
URLs; directory indexes and explicit HTML files; asset files; query strings;
and HTML/SVG fragment IDs, including percent-encoded Hebrew IDs and legacy named
anchors. Same-origin references outside the published base fail.

Supported references are `href` on anchors, areas, and links; `src` on images,
scripts, iframes, sources, audio, and video; video posters; and object data.
Other asset formats have their file existence checked, but their format-specific
fragments (such as PDF page numbers) are not interpreted. External resources,
CSS URLs, and `srcset` candidates are outside this local checker’s scope.

- `npm run test:links`: 10 tests passed, including deliberately broken relative
  shell/page/image references, base-prefixed references, HTML/SVG fragments, and
  base-path escapes. Fixtures use temporary directories and clean up afterward.
- `npm run verify:links`: 975 local references passed across all 86 HTML pages.
- Existing `verify:issue5`, `verify:issue6`, and `verify:issue7` checks passed.
- `npm run check`: zero errors, warnings, or hints.
- TypeScript, build, touched-file Prettier, and `git diff --check` passed.
- The build retains six pre-existing missing-category notices for pastry cream,
  salt, and simple vinaigrette in both languages.

## Browser verification

Run with a production preview serving the current build on port 4324:

```sh
npx playwright test scripts/verify-pizza-links-browser.spec.mjs --reporter=line --output=.astro/pizza-links-test-results
```

Both language cases passed. The browser follows the recipe's calculator link,
checks a successful navigation and the matching language, and verifies the
calculator form, `noindex`, absence of a Pagefind body, and absence from global
navigation. The calculator's existing language picker is preserved.
The GitHub contents API also confirmed the shell-source URL exists.

Set `PIZZA_LINKS_BASE_URL=https://alexfeigin.github.io/recipe-grams/` to repeat
these browser checks on the published site without local URL interception.
