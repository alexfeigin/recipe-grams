# Serve site images directly from the root image directory

Supersedes [0016 — Link public images to root images](0016-link-public-images-to-root-images.md).

Astro points its public asset directory at the existing root `images/` directory through `publicDir: "./images"` in `astro.config.mjs`, instead of maintaining a `public/` directory that links to it. The configured directory is the implementation of the single-source image principle: Markdown recipes on GitHub and the generated site read the same files, no image is duplicated or copied by hand, and there is no link for a checkout, a fresh clone, or a non-POSIX workstation to lose. Images stay at the repository root, as [0001 — Preserve Markdown recipes as the source of truth](0001-preserve-markdown-recipes-as-source.md) requires.
