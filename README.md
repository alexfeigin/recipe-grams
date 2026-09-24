# Recipe-Grams

English and Hebrew recipes adapted from experience and the internet, with gram
measurements for reproducible cooking. Get a kitchen scale and start cooking.

[Browse the website](https://alexfeigin.github.io/recipe-grams/) or use the
[Markdown recipe index](index.MD).

## Work locally

On Apple Silicon macOS, one command prepares a clean clone and then confirms
that it is ready to work:

```bash
./scripts/init.sh            # install missing or stale requirements, then check
./scripts/init.sh --check    # read-only, offline; run before each task
./scripts/init.sh --upgrade  # only to move external skills to newer releases
npm run dev
```

Run `--check` at the start of every task and setup only when it reports
something missing or stale. Setup is idempotent: in a ready checkout it changes
nothing. [dev-environment.json](dev-environment.json) declares the baseline;
[Development](docs/development.md#development-environment) explains what
"ready" covers and how each requirement is installed and upgraded.
Node runs the TypeScript modules used by the checks directly.

For search and production URLs, run `npm run build` then `npm run preview`:
Pagefind indexes built HTML, so search has no index in the dev server.

Use the [verification selection policy](docs/development.md#select-verification)
to choose development feedback and the completion gate. The
[task-to-source/check table](docs/development.md#choose-a-focused-check) maps
changes to their owners, companion obligations, and focused checks.

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
