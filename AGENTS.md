# Recipe-Grams

Bilingual Markdown recipes with a static Astro site. Preserve the readable
recipe sources and their existing paths.

## Workflows

Load every applicable repository skill before acting:

- Any file change: `$recipe-grams-safety` protects and synchronizes the shared checkout.
- Recipe text, translations, measurements, images, catalog, markers, or index: `$recipe-grams-authoring`.
- Recipe/site verification, release commits, pushes, or deployment: `$recipe-grams-publishing`.
- ADR or glossary changes: `$domain-modeling`; follow the numbering and routing rules in the [decision index](docs/adr/README.md#maintaining-decisions).

Name tracked repository skills `recipe-grams-*`; other locally installed skills remain private.

## Context by task

[README.md](README.md) is the entry point and setup guide. For recipe or site work,
use the [decision index](docs/adr/README.md) to select the topic files that apply.
Load every matching topic, rather than the whole decision collection.

Load [PRODUCT.md](PRODUCT.md) for product behavior, [DESIGN.md](DESIGN.md) for UI
work, and [docs/development.md](docs/development.md) for checks. Consult
[CONTEXT.md](CONTEXT.md) when a domain term needs explaining.

Read [history](docs/history/README.md) only to investigate an earlier choice;
archived ADRs and verification notes are not instructions. Accepted UI behavior
takes precedence over older guidance.
