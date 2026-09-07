# Design

Recipe-Grams uses a practical recipe-browse interface rather than a marketing page. The visual system should feel like a clean kitchen work surface: bright, readable, tactile, and direct.

## Current Surface

Landing pages lead with a browse header and category sections of compact recipe cards carrying real food photos, metadata, and direct recipe links. The site header carries the brand, the search field, and the language toggle at every width; below the header breakpoint the category links collapse into a hamburger drawer. Recipe pages render the Markdown body in a single readable column. The hidden poolish calculator reuses the same header and palette over a two-column form-and-results layout.

## Palette and Type

The accepted implementation in `src/styles/design-tokens.css` is the authority. This guidance describes it; it does not ask for it to be changed back to anything earlier.

- Light only. `color-scheme: light` over warm paper `#f8f4ec` and card surface `#fffdf8`, with ink `#25211c` for text and muted `#70685e` for secondary text.
- Tomato `#b43e2f`, olive `#687449`, and steel `#d8d0c3` are content and edge accents.
- Interactive controls — selected toggles and primary utility buttons — use the shared control accent `#487889` through the semantic `--control-*` tokens; its white labels measure 4.86:1, and hover is darker still. Controls were deliberately moved off the per-page tomato and olive fills to one accent, and that accent was then darkened to clear normal-text contrast. Do not paint controls in tomato or olive again.
- One system sans stack, declared once in `design-tokens.css`. No web fonts. Headings scale fluidly with `clamp()` per surface and lean on heavy weights; sizes are page-local, the stack is not.
- Pages declare only the theme values they genuinely vary: their own `--shadow` depth, the landing page's per-category chip colors, and the calculator's page-only accent shades.

## Durable Rules

- Lead with browsing controls and recipe content in the first viewport.
- Use real recipe imagery from `images/` whenever a card shows food.
- Keep cards shallow and scannable; avoid marketing sections.
- Keep interactive targets stable and readable on small phones.
- Keep the shared base palette, `color-scheme`, font stack, and `--control-*` tokens in `src/styles/design-tokens.css`; consumers use the semantic tokens instead of hard-coded color copies.
- Keep search and language switching in the header bar itself at every width. The drawer holds category navigation only, so a phone reader can search or switch language without opening it.

## Supported Viewports

Each surface owns its own breakpoint; they are independent and should not be collapsed into one number.

- `880px` — header. At and below this width the header switches to brand, search, language toggle, and a hamburger trigger, and the category links become the drawer.
- `820px` — calculator. At and below this width the calculator and phase grids stack into one column.
- `640px` — cards and content width. At and below this width the landing hero, its recipe grid, and the calculator's field and results grids become single-column, and the landing and recipe columns take the narrow phone margin.
- `1080px` and `380px` tighten header spacing and control sizes; they change no layout structure.
- Do not add tablet-only visual modes unless real content or controls break in the shared desktop/tablet layout.
