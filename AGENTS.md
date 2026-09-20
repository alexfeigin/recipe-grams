# Recipe-Grams

Bilingual Markdown recipes with a static Astro site. Preserve the readable
recipe sources and their existing paths.

## Working agreement

Establish the requested outcome, source owner, and relevant existing checks using
the [task-to-source/check table](docs/development.md#choose-a-focused-check).
Read the guidance routed to that task; expand scope only for a dependency,
failure, or unresolved requirement. A report request ends with the report, not
implementation of its recommendations.

Use focused feedback during implementation and the
[verification selection policy](docs/development.md#select-verification) at
completion. Documentation/report-only work gets source/diff review; application
logic, interaction, and recipe/site-source changes covered by the gate finish
with `npm run verify`. Stop after sufficient evidence; repeat checks only for
changed inputs, failures, or a specific uncovered concern. Verification does not
authorize publication; preserve the user's requested delivery scope and exclusions.

## Workflows

Load every applicable repository skill before acting:

- Any file change: `$recipe-grams-safety` protects and synchronizes the shared checkout.
- Recipe text, translations, measurements, images, catalog, markers, or index: `$recipe-grams-authoring`.
- Recipe/site verification, release commits, pushes, or deployment: `$recipe-grams-publishing`.
- ADR or glossary changes: follow the tracked procedure in the [decision index](docs/adr/README.md#maintaining-decisions). The private `$domain-modeling` skill is optional.

Carry the safety skill's initial checkout record and disposition of existing
changes across authoring, verification, and publishing. Recheck status at
handoffs; known task edits do not restart preparation. Apply the safety process
to newly discovered, unaccounted-for work.

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
