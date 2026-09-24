# Recipe-Grams

English and Hebrew recipes adapted from experience and the internet, with gram
measurements for reproducible cooking. Get a kitchen scale and start cooking.

[Browse the website](https://alexfeigin.github.io/recipe-grams/) or use the
[Markdown recipe index](index.MD).

## Work locally

You do not need a terminal: open this folder with a coding agent and ask for
what you want, such as a new recipe with a photo. If something is missing on a
new Apple Silicon Mac, the agent installs it. macOS may ask for your password
when Apple's developer tools or Homebrew are needed. GitHub authentication is
handled when a later GitHub action needs it.

Behind that, one command prepares a clean clone and then confirms that it is
ready to work:

```bash
./scripts/init.sh            # install missing requirements; keep installed versions
./scripts/init.sh --check    # fast, offline presence check before each task
./scripts/init.sh --audit    # optional comparison with pinned Impeccable files
./scripts/init.sh --upgrade  # explicitly update managed versions
npm run dev
```

Run `--check` at the start of every task. Setup accepts any installed version
of the required tools and skills, installs only missing pieces, and exits
quickly when everything is present. It does not test push permissions or
change the Git remote. Only `--upgrade` updates installed versions.
[dev-environment.json](dev-environment.json) declares the first-install pins;
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
