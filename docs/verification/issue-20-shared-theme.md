# Issue 20: shared theme ownership

Verified 2026-09-07 against a local production build.

## What changed

`src/components/LandingPage.astro`, `src/pages/[language]/[slug].astro`, and
`src/components/PoolishCalculatorPage.astro` each declared the same `:root`
block: `color-scheme: light`, the `--paper`, `--surface`, `--ink`, `--muted`,
`--tomato`, `--olive`, and `--steel` palette, and a byte-identical
`font-family` stack. `src/styles/design-tokens.css`, already imported by all
three pages, now owns those declarations. `SiteHeader.astro` keeps resolving
them because every page that embeds the header imports the shared sheet.

Each page keeps the theme values it genuinely varies:

- Landing keeps `--shadow: 0 18px 48px rgba(61, 43, 28, 0.16)`.
- Recipe and calculator pages keep the lighter
  `--shadow: 0 18px 48px rgba(61, 43, 28, 0.14)`.
- The calculator keeps its page-only `--tomato-dark`, `--olive-dark`, and
  `--blue` accents, which stay undefined on the other pages exactly as before.

Page-specific backgrounds, `main` widths, spacing, and per-panel shadows were
not touched. No variable was removed: every declaration still exists, and a
static check confirmed that every `var(--x)` reference in `src/` resolves to a
declaration, apart from the pre-existing script-set `--back-to-top-opacity`
that already carries an inline fallback. `DESIGN.md` records the new ownership
rule beside the existing `--control-*` rule.

## Equivalence to the pre-change baseline

The baseline was rebuilt from `HEAD` (25fdd1c) in a throwaway `git worktree`
and served alongside the changed build, so both were compared as production
builds rather than against stale output.

- Computed styles: 12 page/viewport combinations (English and Hebrew landing,
  recipe, and calculator pages at 1280x900 and 390x844) were probed for the
  full token set on `:root` plus 24 CSS properties across the header, brand,
  navigation, search control, language picker, back-to-top, recipe shell,
  landing hero, browse tools, and calculator panels. The two builds produced
  **identical** computed values.
- Interactive states: the active search overlay with results, the open mobile
  navigation drawer, and the hovered and focused back-to-top control were
  probed on all six pages. Computed values were **identical**.
- Screenshots: 12 viewport screenshots (the six pages at desktop and phone
  widths) were **byte-identical** between the two builds. They are stored in
  `issue-20-screenshots/`.
- Full-page screenshots of the same 12 combinations were also compared. Eleven
  matched byte-for-byte; the English desktop landing page differed by 49 pixels
  (max channel delta 11) at one recipe card's top corners. Two builds of the
  unchanged baseline code reproduce that same 49-pixel difference, so it is
  build render noise, not an effect of this change. Back-to-top state
  screenshots differ by a similar margin for the same reason: they are captured
  mid-transition, and repeated runs of the unchanged build differ by as much.

## Site checks

- `npm run check`: 0 errors, 0 warnings, 0 hints across 28 files.
- `npm run typecheck`, `npm run format:check`, `npm run build`: passed.
- `npm run test:links`: 10 tests passed.
- `npm run verify:links`: 975 local references passed across 86 pages.
- `npm run verify:issue5`, `verify:issue6`, `verify:issue7`: passed.
- Browser specs against the changed build: calculator 33 passed, search 6
  passed, navigation 12 passed, control contrast 12 passed, pizza links 2
  passed.
- `verify-issue-7-browser` and `verify-issue-8-browser` each have one failing
  case. Both fail identically against the rebuilt baseline, so they are
  pre-existing and unrelated: the issue-7 case hits a strict-mode locator
  clash between the navigation drawer link and the category rail link, and the
  issue-8 case asserts a search overlay alignment that the current header
  layout no longer satisfies.

## Reproducing

```sh
npm run build
npx astro preview --port 4325
```

Then compare against a baseline build served from a worktree of the previous
revision. The comparison harness lived in the ignored `.astro/` directory and
is not tracked.
