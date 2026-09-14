# Recipe-Grams

English and Hebrew recipes adapted from experience and the internet, with gram
measurements for reproducible cooking. Get a kitchen scale and start cooking.

[Browse the website](https://alexfeigin.github.io/recipe-grams/) or use the
[Markdown recipe index](index.MD).

## Work locally

Use the Node version in [`.nvmrc`](.nvmrc) (`nvm use`) and npm 11 or newer.
The minimum supported versions are declared in [package.json](package.json).
Node runs the TypeScript modules used by the checks directly.

```bash
npm ci
npx playwright install chromium    # once per machine
npm run dev
```

Linux may also need `npx playwright install-deps chromium`.
For search and production URLs, run `npm run build` then `npm run preview`:
Pagefind indexes built HTML, so search has no index in the dev server.

Run `npm run verify` for the full site check. See
[development and verification](docs/development.md) for focused checks and failure artifacts.

## Read only what your task needs

| Task                                               | Start here                                                                                                        |
| -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Understand what readers can do                     | [Product](PRODUCT.md)                                                                                             |
| Change layout, controls, or styling                | [Design](DESIGN.md)                                                                                               |
| Find decisions relevant to a recipe or site change | [Decision index](docs/adr/README.md)                                                                              |
| Look up a domain term                              | [Vocabulary](CONTEXT.md)                                                                                          |
| Add or edit a recipe                               | [Authoring workflow](.agents/skills/recipe-grams-authoring/SKILL.md) · [Hebrew guide](docs/adding-a-recipe.he.md) |
| Verify or publish changes                          | [Publishing workflow](.agents/skills/recipe-grams-publishing/SKILL.md)                                            |
| Work as an agent                                   | [Agent instructions](AGENTS.md)                                                                                   |
| Investigate an earlier decision or checkpoint      | [History](docs/history/README.md)                                                                                 |

Each current document owns the subject above. Historical records preserve what
was decided or observed then; they are optional background, not current instructions.
When older guidance disagrees with accepted UI behavior, correct the guidance.
