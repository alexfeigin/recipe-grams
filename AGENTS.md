# AGENTS.md — Recipe-Grams

## Repo Structure

- `en/*.MD` — English recipes, one file per recipe (`.MD` extension)
- `he/*.MD` — Hebrew translations of the same recipes
- `index.MD` — Root index, tables organized by category (headers with icons + emoji keys: ★ favorites, 🅥 vegan)
- `images/` — Recipe photos and icon PNGs for category headers

## Conventions

- First line in every Hebrew recipe: `[חזרה לתפריט](../index.MD)`
- First line in every English recipe: `[Back to Menu](../index.MD)`
- Use gram measurements exclusively, not volume cups
- Image paths are relative: `../images/…` from `he/` and `en/`
- Hebrew recipes have no `<div dir="rtl">`
- Do not assume every translated recipe should be linked from `index.MD`; only add index rows for recipes the user wants published.

## Shared repo safety and syncing

This repo is used from more than one Mac/account. Protect existing work automatically, and keep Git details away from non-technical users:

- At the start of any change request, check the current local state.
- If there are no active local changes, quietly sync with the current `origin` branch before editing. Do not explain routine syncing unless something goes wrong.
- If there are active local changes, pause before editing. In plain language, summarize what looks unfinished and ask whether to delete those changes forever, publish them to GitHub first, or continue the new work on top. Recommend the safest option.
- Do not use `git stash`; hidden saved changes are too easy to forget and effectively become lost work for this workflow.
- Automatically avoid overwriting unrelated edits. Never discard local changes with `git reset`, `git checkout`, or similar destructive commands unless the user explicitly asks for that exact action.
- If syncing or pushing finds remote changes, integrate them carefully and explain only if a decision or conflict resolution is needed.

## Adding a recipe from a user request

When the user supplies a new recipe in either English or Hebrew and asks to add it, treat that as a request to publish it end to end:

- Work with the user in the language they use. Ask a follow-up only if a missing detail blocks a usable recipe; otherwise make sensible assumptions and keep going.
- Create both localized files with the same snake-style basename under `he/` and `en/`, using `.MD`.
- Preserve the recipe, but normalize structure, grammar, and units. Convert volume measurements to grams when possible; if uncertain, note the assumption in the recipe text.
- Translate naturally into the missing language: English for `en/`, Hebrew for `he/`.
- Add the recipe to `index.MD` in the most appropriate existing category unless the user explicitly says not to publish it. Include both Hebrew and English links in the same row.
- Pick suitable existing emoji markers for the index row. Add `🅥` only when the recipe is vegan, and `★` only if the user says it is a favorite.
- If the user provides or references an image file, place it in `images/` with a clear filename and link it from both recipe files.
- After editing, run Prettier on the touched Markdown files, verify the links point to existing files/images, commit the recipe changes, and push the current branch so the recipe is visible on GitHub.
- Finish in the user's language, summarizing what was added and providing the GitHub links to the new Hebrew recipe, English recipe, and index.

## Before committing

- Run `npx prettier --check {files}` and if needed `npx prettier --write {files}` before staging Markdown changes so recipe diffs only include content changes, not incidental formatting.
