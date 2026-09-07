# Issue 13: shared control contrast

> Historical record. See [the evidence index](README.md) for what this directory is; run `npm run verify` for current verification.

Verified 2026-09-07 against the production build using Chromium.

The original shared accent, `#5a8fa0`, gave white labels **3.5767:1**
contrast. The browser regression reproduced this on the selected language,
both calculator modes, and enabled copy button before the fix.
Changing only `--control-accent` to `#487889` preserves the blue identity,
page structure, typography, and control dimensions.

## Computed results

Measurements use rendered foreground/background colors, alpha compositing,
and sRGB relative luminance. Hover colors are resolved by the browser.

| Consumer and state                                       |            Contrast |
| -------------------------------------------------------- | ------------------: |
| Selected language                                        |            4.8573:1 |
| Generic and pizza modes: selected, hover, keyboard focus |            4.8573:1 |
| Enabled copy: default                                    |            4.8573:1 |
| Enabled copy: hover and keyboard focus                   |            6.3614:1 |
| Alternate language: default                              |           15.3328:1 |
| Alternate language: hover and keyboard focus             |            4.5879:1 |
| Back-to-top icon: keyboard focus / hover                 | 4.8573:1 / 6.3614:1 |

All shared color consumers were inspected in `SiteHeader.astro` and
`PoolishCalculatorPage.astro`, including their derived shadow/focus tokens.
The back-to-top control has an icon rather than a normal-text label; its
existing scroll fade is retained. Its fully opaque focus/hover states are
covered on home and recipe pages. The short Hebrew desktop calculator does
not scroll far enough to display it. Disabled copy retains its existing
inactive appearance; calculator regression tests cover disabling and recovery.

## Coverage and checks

- 12 contrast cases passed: English/Hebrew × 390/1280px × home/pizza recipe/calculator.
- Inspected representative English/Hebrew desktop/mobile screenshots, selected
  calculator modes, and focused copy controls. Labels remain legible, with
  the existing geometry and RTL layout retained.
- All 45 existing calculator and navigation browser tests passed.
- `npm run check`: zero errors, warnings, or hints.
- `npm run typecheck`, clean `npm run build`, Prettier, and the UI detector passed.
- The build retains the six pre-existing missing-category notices for
  pastry cream, salt, and simple vinaigrette in both languages.

Run after building and serving the site at port 4324:

```sh
npx playwright test scripts/verify-control-contrast-browser.spec.mjs --reporter=line --output=.astro/contrast-test-results
```

Set `CONTRAST_BASE_URL` to check a deployed site. The test attaches computed
measurements and writes screenshots under the chosen ignored output directory;
use Playwright's JSON reporter to retain the measurement attachments.
