# AGENTS.md — Recipe-Grams

Recipe-Grams is a bilingual Markdown recipe collection and Astro site. Recipe Markdown is the human-readable source; catalog metadata controls generated-site browsing and previews.

## Repo Skills

Load every skill whose branch applies before acting:

- Before any file-changing task, use `$recipe-grams-safety` to protect and synchronize the shared working tree.
- For recipe additions or edits—including translation, measurements, images, catalog metadata, markers, and the legacy index—use `$recipe-grams-authoring`.
- For recipe or site verification, release commits, pushes, and GitHub Pages deployment, use `$recipe-grams-publishing`.

Name future repo-specific skill folders `recipe-grams-*` so Git tracks them while locally installed skills remain private.

## Guidance

Read [PRODUCT.md](PRODUCT.md) for what the site does today, [DESIGN.md](DESIGN.md) for the visual rules and supported viewports, [CONTEXT.md](CONTEXT.md) for the vocabulary, and [docs/adr/](docs/adr/README.md) for the decisions behind the architecture. [README.md](README.md) has the local development and `npm run verify` commands. Accepted UI behavior is the authority whenever older written guidance disagrees; correct the guidance rather than the accepted behavior.
