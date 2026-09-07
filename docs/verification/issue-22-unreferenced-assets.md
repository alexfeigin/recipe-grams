# Issue 22: disposition of three unreferenced published images

> Historical record. See [the evidence index](README.md) for what this directory is; run `npm run verify` for current verification.

Verified 2026-09-07 against `master` at `134e624` and a local production build.

## The candidates

The 2026-09-05 review named three published images with no tracked-text
references, about 143 KB together:

| File                                   | Size     | Dimensions | Added in                          |
| -------------------------------------- | -------- | ---------- | --------------------------------- |
| `images/leopard_expm.jpeg`             | 73,434 B | 700x700    | `c638897` (2024-10-12), as `.jpg` |
| `images/titles_for_index/cookie.png`   | 30,486 B | 160x160    | `ef2f0a7` (2024-10-12)            |
| `images/titles_for_index/doughnut.png` | 39,416 B | 160x160    | `ef2f0a7` (2024-10-12)            |

## Reference recheck

- Tracked text: `git grep -I` for each basename across the working tree
  (excluding `dist/` and `node_modules/`) returns nothing.
- Whole history: `git log --full-history -S` for `leopard_expm` finds no commit
  that ever added or removed the string in any tracked file, on any branch. The
  same search for `cookie.png` finds nothing, and for `doughnut` finds only
  `3dcbb4e` and `b8bed0a`, which are the pancake batter recipe's "18 doughnuts"
  yield line, not the icon. A control search for `leopardcookie` finds the three
  commits that do reference that image, so the search itself works.
- Generated output: a fresh `dist/` contains no page, script, or Pagefind file
  that references any of the three. They reach `dist/` only because
  `publicDir: "./images"` copies the whole directory, as
  [ADR 0024](../adr/0024-serve-site-images-directly-from-the-root-image-directory.md)
  established.
- Legacy index: `index.MD` links seven of the nine title icons —
  `spaghetti`, `rice`, `meat_on_bone`, `green_salad`, `chestnut`, `cake`, and
  `pretzel`. `cookie.png` and `doughnut.png` are the two it does not link.

## History

`ef2f0a7`, "text to see if the emojis in photo work", added all nine title
icons in one commit and converted a single `index.MD` section header from a
`🥨🌰` emoji span to `pretzel.png`. `f5ec1b4` the same day converted five more
headers, and `f796c16` later brought the total to the seven in use today. The
nine icons are one set of emoji renderings prepared for index categories; seven
found a header and two did not.

`c638897`, "leopard cookies", added the leopard cookies recipe pair together
with `leopardcookie.jpeg`, `print.jpg`, and `leopard_expm.jpg`. The recipe links
the first two. The third is a framed reproduction of a leopard-spot pattern
rather than a photograph of the cookies or of a step, which is consistent with
its being collected as a pattern reference for step 4 and never placed in the
recipe body.

`4eca8d9`, "Optimize recipe images for web viewing" (2026-08-04), re-encoded
`leopard_expm.jpg` to `leopard_expm.jpeg`, 67,512 B to 73,434 B. That sweep
converted and shrank recipe images across `images/` and dropped two oversized
PNG originals, so the file was reviewed then and kept.

## Evidence of external or archival use

None is available, in either direction.

- All three are live on the published site and have been since the first Pages
  publication, `52eaca5` (2026-08-09) in `alexfeigin.github.io`. `curl` returns
  `200` and the exact byte counts above for
  `/recipe-grams/leopard_expm.jpeg`, `/recipe-grams/titles_for_index/cookie.png`,
  and `/recipe-grams/titles_for_index/doughnut.png`.
- All three have also been readable through GitHub's raw and blob URLs since
  October 2024.
- Neither GitHub Pages nor raw GitHub reports referrers or request counts for
  this project, and a web search for the filenames and for `titles_for_index`
  surfaced nothing. So no observation available here can show whether any of
  these URLs is embedded elsewhere.

## Dispositions

All three are **retained in place**, and no published file changed. The reasons
are recorded as current guidance in
[ADR 0028](../adr/0028-retain-published-images-unless-evidence-supports-removal.md):

- `cookie.png` and `doughnut.png` — retained as the unused spares of the
  nine-icon title set, kept with their siblings for a future `index.MD`
  category.
- `leopard_expm.jpeg` — retained as reference material belonging to the leopard
  cookies contribution.

Removal was not supported for any of them: nothing shows the files are
superseded or duplicated, and the absence of repository references cannot show
that the public URLs are unused. That uncertainty is stated rather than resolved
by deleting.

The referenced title icons and every recipe image were left untouched.

## Site checks

Documentation-only change; publication contents are unchanged.

- `npm run format:check`: passed.
- `npm run check`: 0 errors, 0 warnings, 0 hints across 35 files.
- `npm run typecheck`: passed.
- `npm run verify`: passed end to end — clean rebuild with the Pagefind index,
  the generated recipe, catalog, image and link checks, and 74 browser tests
  passed across every maintained suite.
- `npm run verify:links`: 975 local references across 86 pages.
- `dist/` after the rebuild still contains all nine title icons and
  `leopard_expm.jpeg`, byte-identical to their `images/` sources.

## Reproducing

```sh
git grep -I -i leopard_expm
git log --full-history --oneline -S 'leopard_expm' --all
grep -rIl 'titles_for_index/cookie.png' dist/
curl -sI https://alexfeigin.github.io/recipe-grams/titles_for_index/cookie.png
```
