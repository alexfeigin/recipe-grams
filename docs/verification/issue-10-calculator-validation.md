# Issue 10: calculator validation

Scope: English `/poolish/` and Hebrew `/he/poolish/` calculators, under the site's `/recipe-grams/` base path.

The baseline browser regression failed in both languages: negative salt and final yeast produced no validation error, and setting desired dough to zero left copying enabled. Invalid inputs now clear every displayed quantity and disable copying. Restoring valid inputs restores calculation and copying.

`src/lib/poolishCalculator.ts` owns parsing, validation, and calculation. It rejects missing or nonfinite numbers, negative ratios, invalid pizza counts, poolish shares outside 0–1, and impossible water splits before and after rounding. The existing flour-and-water base convention, formula rounding, pizza preset, and minimum 3g poolish yeast are preserved. Poolish share now has a native input step of 0.001 to accept the existing 0.667 default.

## Reproduce the verification

After installing dependencies and Playwright Chromium, build and start a preview:

```bash
npm run check
npm run typecheck
npm run build
npx astro preview --host 127.0.0.1 --port 4324
```

Run the calculator regression suite against that build:

```bash
CALCULATOR_BASE_URL=http://127.0.0.1:4324/recipe-grams/ npm run verify:calculator:browser
```

The suite contains 33 checks covering both languages, all blank fields, the reported negative ratios, impossible water splits, valid recovery, original default and pizza weights, zero ratios, minimum yeast, real localized clipboard contents, disabled-copy guards, delayed clipboard feedback, clipboard failure, and desktop/mobile error layouts. A direct calculation check also covers nonfinite values, overflow, and a split made impossible by gram rounding.

Current screenshots and failure artifacts go to ignored `.astro/calculator-test-results/`. Set `CALCULATOR_BASE_URL` to `https://alexfeigin.github.io/recipe-grams/` to repeat the browser checks against the published site.

The existing generated-site checks are `npm run verify:issue5`, `npm run verify:issue6`, and `npm run verify:issue7`. The build retains the six pre-existing missing-category diagnostics for the English/Hebrew pastry cream, salt, and simple vinaigrette recipes.
