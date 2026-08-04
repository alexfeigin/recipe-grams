# AGENTS.md — Recipe-Grams

## Repo Structure

- `en/*.MD` — English recipes, one file per recipe (`.MD` extension)
- `he/*.MD` — Hebrew translations of the same recipes
- `index.MD` — Root index, tables organized by category (headers with icons + emoji keys: ★ favorites, 🅥 vegan)
- `images/` — Recipe photos and icon PNGs for category headers

## Conventions

- First line in every recipe: `[חזרה לתפריט](../index.MD)` (same as English's `[Back to index](../index.MD)`)
- Use gram measurements exclusively, not volume cups
- Image paths are relative: `../images/…` from `he/` and `en/`
- Hebrew recipes have no `<div dir="rtl">`
- Do not assume every translated recipe should be linked from `index.MD`; only add index rows for recipes the user wants published.

## Before committing

- Run `npm run format` before staging Markdown changes so recipe diffs only include content changes, not incidental formatting.

## Agent skills

### Issue tracker

Issues live as local markdown files under `.scratch/`. See `docs/agents/issue-tracker.md`.

### Triage labels

Five canonical labels: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `CONTEXT.md` at the repo root + `docs/adr/` for ADRs. See `docs/agents/domain.md`.
