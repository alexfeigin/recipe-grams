# Retain published images unless evidence supports removal

`images/` has three audiences at once. [0024 — Serve site images directly from the root image directory](0024-serve-site-images-directly-from-the-root-image-directory.md) makes the whole directory the site's public directory, so every file in it is published under `https://alexfeigin.github.io/recipe-grams/`, and every file has also been readable through GitHub since it was committed. The generated site links only the images the catalog and recipe Markdown name; [`index.MD`](../../index.MD) links the title icons under `images/titles_for_index/` for the Markdown readers that [0025 — Keep the legacy index for Markdown readers and the catalog for generated browsing](0025-keep-the-legacy-index-for-markdown-readers-and-the-catalog-for-generated-browsing.md) keeps serving; and a contribution may leave a working reference image behind that neither one links.

An image that no tracked text references is therefore not a leftover by that fact alone. Its published and raw GitHub URLs are still live and still linkable, and this project has no analytics on either host, so nothing in the repository can show whether a URL is in use elsewhere. Absence of a reference is absence of evidence, not evidence that removal is safe.

So an unreferenced image is retained by default. Removing one needs positive evidence — a superseded file whose replacement is committed, a duplicate, or an owner saying it is unwanted — and not merely a search that found no links. Retention is the cheap side of the trade: the three files this rule was written for are about 143 KB together, while a wrong removal breaks a public URL that cannot be audited. When a file's purpose is unclear, record the uncertainty rather than resolving it by deleting.

The dispositions resolved under this rule, all **retained in place**:

- `images/titles_for_index/cookie.png` and `images/titles_for_index/doughnut.png` — two of the nine emoji title icons added together in `ef2f0a7` for the legacy index's category headers. Seven are in use; these two are the unused spares of a coherent set, and they stay with their siblings as the palette for a future index category.
- `images/leopard_expm.jpeg` — a leopard-spot pattern reference committed in `c638897` beside the leopard cookies recipe and its photographs. It is a pattern reference rather than a photograph of the food, which is why no recipe links it, and it is kept as part of that contribution's material.

None of the three has ever been referenced from tracked text. See [the issue 22 record](../verification/issue-22-unreferenced-assets.md) for the evidence behind these dispositions.
