# Development and verification

[README](../README.md#work-locally) covers installation and dev/build/preview.
[package.json](../package.json) lists every command; use `npm run` to list them locally.

## Development environment

`./scripts/init.sh` is the one entry point, and
[dev-environment.json](../dev-environment.json) is the baseline it reads. It is
written for an agent working on behalf of someone who does not use a terminal:
starting from a new Mac, the only human steps are macOS's own password window
and, rarely, Apple's Install window. **Ready** means the required programs,
packages, browser cache, and Codex Impeccable skill are present on a supported
host, regardless of their installed versions. It is a fast, offline presence
check. Neither readiness nor the optional pin audit means that `npm run verify`
has passed or that publication is authorized.

| Requirement             | Ready when                                                                                      | Setup installs with                                                                                                           |
| ----------------------- | ----------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Host                    | Apple Silicon macOS (`darwin-arm64`). Other hosts fail before anything is installed.            | —                                                                                                                             |
| Git and GitHub CLI      | Usable `git` and `gh` executables are available.                                                | Apple's Command Line Tools for Git when needed; `brew install gh` when `gh` is missing.                                       |
| Node and npm            | Both executables are available, at any installed version.                                       | `brew install node` (or `nvm install` where nvm exists) when Node is missing; repair the Node installation if npm is missing. |
| JavaScript dependencies | Required installed package directories are present in `node_modules`.                           | `npm ci`                                                                                                                      |
| Chromium                | Completed `chromium` and `chromium-headless-shell` browser caches are present, at any revision. | `npx playwright install chromium`                                                                                             |
| Impeccable (UI design)  | `.agents/skills/impeccable/SKILL.md` exists, at any version.                                    | The declared release bundle through Impeccable's installer when absent.                                                       |

The named Matt Pocock skills are optional: their absence is reported but does
not fail `--check`. Setup installs missing ones at the declared revision and
leaves installed copies alone, whatever their version. Homebrew and Apple's
Command Line Tools are installation helpers only when needed. GitHub login,
repository permissions, the Git remote's protocol, personal skills, and the
Pages deployment checkout are outside readiness.

### On a new Mac

Setup installs only what is missing, in dependency order:

1. If Homebrew is needed and missing, it downloads the latest `Homebrew.pkg` and
   refuses it unless `pkgutil` reports an Apple-notarized Developer ID Installer
   signature from the team in dev-environment.json.
2. If Git is missing, it installs the Command Line Tools through Software
   Update. If Homebrew is needed to install another missing tool, it installs
   the Command Line Tools first if absent, then the package. These steps run in
   a macOS password window through
   [scripts/install-system-tools.sh](../scripts/install-system-tools.sh). Apple's
   Install window is the fallback when Software Update does not offer the tools.
3. It installs missing Node, npm, and `gh` as needed, then the remaining items
   in the table. If every item is present, it exits without installing or
   contacting a remote service.

Homebrew's package adds `/opt/homebrew/bin` to the PATH of new sessions. An
agent session that started earlier may not see it; the check then notes the
`eval "$(/opt/homebrew/bin/brew shellenv)"` prefix to use.

Setup does not contact GitHub to test credentials or push permissions, edit the
remote, or configure SSH host keys. The GitHub operation that actually needs
access reports any authentication or permission failure at that time.

### Check, setup, and upgrade

- `--check` is read-only, offline, and well under a second. It checks presence
  before every task. It never builds, runs verification, publishes, or contacts
  GitHub. Only missing required items produce a nonzero exit status.
- `--audit` is an optional offline comparison of the installed Impeccable files
  and project route against the declared pin. Its drift report does not affect
  ordinary setup or `--check`.
- Setup (no option) installs missing requirements, then checks presence again.
  Existing versions are accepted. Homebrew runs with `HOMEBREW_NO_AUTO_UPDATE`
  and an install that would upgrade an installed Homebrew dependency is refused
  with a pointer to `--upgrade`.
  Installers run in a temporary staging project; a checkout copy is replaced
  only after the staged files match the declaration. Replacements are copied
  beside their targets, and a failed swap restores the previous entries.
  Downloaded Impeccable bundles are cached in
  `~/Library/Caches/recipe-grams/` (`RECIPE_GRAMS_CACHE` overrides it).
  When a step fails, setup reports what remains missing.
- `--upgrade` is the only mode that moves versions forward. It upgrades an
  installed Node (`brew upgrade node`, or `nvm install` from `.nvmrc`) or npm
  (`npm install --global npm@<major>`) that no longer satisfies `engines`,
  resolves the newest upstream skill releases, proves them in staging, records
  them in dev-environment.json in one write, and then runs setup. When no skill
  is newer it says so, reinstalls nothing, and runs setup. If staging or final
  setup fails, the declaration retains or returns to its previous pins; run
  `./scripts/init.sh --upgrade` again after resolving the failure. Commit a
  successful updated declaration like any other change.

### External skill sources

Researched September 2026; the pins in dev-environment.json are authoritative.

- **Impeccable** comes from [pbakaus/impeccable](https://github.com/pbakaus/impeccable).
  `skill-vX.Y.Z` releases publish `universal.zip` with a
  `universal.zip.sig.json` record. The `impeccable` npm package only installs
  it; its engine binary comes from `engine-v*` releases with a SHA-256 sidecar.
  The silent form is `npx --yes impeccable@<installer> install -y
--providers=claude,codex,gemini,opencode --scope=project --no-hooks`, which
  writes `.claude`, `.agents` (Codex), `.gemini`, and `.opencode` copies plus
  Claude agents and an OpenCode command. `--no-hooks` keeps the design detector
  from running after routine edits.
- The installer has no version flag: on its own it verifies the latest
  release's signature and installs it, as does upstream `npx impeccable update`.
  Setup points `IMPECCABLE_BUNDLE_PATH` at the pinned release zip instead. The
  installer does not verify a local bundle, so setup first checks the zip's
  SHA-256 against the declaration. Upgrade runs the normal signed install of
  the newest release, downloads that release's zip, checks it against the
  signature record's SHA-256, and requires both to install identical files.
- **Matt Pocock skills** come from [mattpocock/skills](https://github.com/mattpocock/skills)
  through the Vercel Labs [`skills` CLI](https://github.com/vercel-labs/skills),
  as that README documents. Upgrade takes the latest GitHub release (or the
  default branch if there are no releases) and pins its commit. The silent form
  is `npx --yes skills@<installer> add https://github.com/mattpocock/skills/tree/<commit>
--skill <names…> --agent codex --copy --yes` with `DISABLE_TELEMETRY=1`,
  which writes `.agents/skills/<name>`. Upstream `npx skills update` floats to
  the latest revision instead. The CLI's `skills-lock.json` stays in staging.
- Setup needs the network only for missing items (Apple's Software Update, the
  npm registry, Homebrew, GitHub releases and archives, and Playwright's browser
  CDN). Upgrade also queries
  `api.github.com` and `registry.npmjs.org`. Those APIs need no login; set
  `GH_TOKEN` or `GITHUB_TOKEN` if the unauthenticated GitHub API limit of 60
  requests an hour runs out. Installing Homebrew asks for an administrator
  password; nvm does not.

### Impeccable project route

Setup inserts [scripts/impeccable-project-route.md](../scripts/impeccable-project-route.md)
after the frontmatter of each installed Impeccable SKILL.md and sends Setup's
context step through `node scripts/impeccable-context.mjs`:

- **Focused maintenance**, such as "Change the search button label" or "Fix an
  existing drawer focus regression", stops at the route and follows this guide's
  [task table](#choose-a-focused-check): no interviews, concept selection,
  screenshots, detector passes, subagents, or design-document rewrites.
  `--route maintenance` prints the route without running the context loader.
- **Design work**, such as "Redesign the landing page" or comparing visual
  directions, continues in Impeccable. `--route design` runs the loader and
  withholds `AUTONOMY_DIRECTIVE_CHECK`, `SUBAGENT_AUTHORIZATION`, and any
  directive this project has not reviewed.

Upgrade fails when the Setup text the route replaces has moved or the new loader
emits an unreviewed directive; classify it in `scripts/dev-environment.mjs` and
retry. After editing the route file, `--audit` reports installed copies as
stale; ordinary setup keeps the installed version.

## Select verification

- **Documentation or reports only:** review content, source, links, and the diff;
  check touched-document formatting where useful. Disposable HTML reports need
  no application tests, site build, browser, screenshots, or implementation of
  their recommendations. Recipe Markdown is site source and belongs in the next
  category.
- **Application logic, interaction, and recipe/site-source changes covered by the
  gate:** use the narrowest relevant existing check from the table below during
  implementation, then run `npm run verify` on the finished work. Preserve
  meaningful existing coverage; add assertions for behavior contracts worth
  protecting, not tests that merely mirror implementation.
- **Release:** invoke the publication helper from committed, pushed source. It
  runs and owns one final gate, then publishes that invocation's exact output.
  Do not run a separate final gate immediately before it. An earlier verification
  remains evidence for unchanged source, but its output cannot establish the
  helper's exclusive ownership and is not reused for publication.
  Verification alone does not authorize a release;
  follow the [publishing workflow](../.agents/skills/recipe-grams-publishing/SKILL.md)
  within the user's delivery scope and publication exclusions.

A successful final gate already checks, builds, verifies generated output, and
runs browser tests. Do not manually replay its stages immediately before or
after it without a specific reason. Stop when the applicable evidence passes.
A failure or subsequent relevant change invalidates the affected evidence;
resolve it and reverify before completion. A specific uncovered concern can
justify an additional check; record what it addresses.

Routine UI maintenance uses existing interaction assertions, including keyboard
focus tests, without a mandatory visual audit. Substantial new UI with unsettled
coverage can warrant visual exploration; capture testable expectations in
automated assertions and end the visual loop once the behavior is satisfactory.

## Full verification

```bash
npm run verify
```

The runner performs Astro checks and TypeScript checking, source/fixture tests,
a clean rebuild including Pagefind, generated-output checks, preview-server tests,
and all maintained Chromium suites, in that order. Source failures stop the run
before spending time on a build. Each kind of assertion has one owner.

The runner starts and identifies its own preview on an OS-assigned loopback port.
It closes that preview after success, failure, or interruption and never reuses or
stops another server. Startup and check failures exit nonzero. Run one full
verification at a time per checkout because builds share `dist/`.

Verification does not format or edit tracked files. Failure screenshots, traces,
and output go to ignored `.astro/verification/browser/`; historical screenshots
are never overwritten. Passing screenshots are not assertions and are not saved
as routine evidence. Check touched-file formatting separately with
`npx prettier --check <files>`; use `--write` when needed.

## Choose a focused check

This is the task-to-source/check map. Read the matching topics in the
[decision index](adr/README.md) for ownership rules. The checks below provide
focused feedback; they do not replace the completion policy above. Generated
checks need a current build. `verify:focused` builds and owns a preview for one
browser suite; the per-suite `verify:*:browser` commands need an explicit target
instead (see below).

| Changed concern                                               | Source owners and companion obligations                                                                                                                                                                                                                                                                                 | Focused feedback                                                                                                                                                                                                                                 |
| ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Documentation or disposable reports                           | Use the [README map](../README.md#read-only-what-your-task-needs) to find relevant guidance; edit only the requested artifact.                                                                                                                                                                                          | Content/source/diff review only; formatting where useful.                                                                                                                                                                                        |
| Recipes, catalog, index, or images                            | `en/*.MD`, `he/*.MD`, `src/lib/recipeCatalog.ts`, `index.MD`, `public/images/`; `recipeSources.ts` discovers and `recipePages.ts` renders. Follow [authoring](../.agents/skills/recipe-grams-authoring/SKILL.md) for paired sources and companion updates.                                                              | Review affected companions and image paths; `npm run test:catalog-intent` and `npm run test:recipe-links` test rules with fixtures. `verify:recipes` and `verify:catalog` check actual built pages and cards.                                    |
| Catalog eligibility and diagnostics                           | `src/lib/recipeSources.ts`, `src/lib/recipeCatalog.ts`, `scripts/catalog-source-verifier.mjs`, `scripts/catalog-source-verifier.test.mjs`, `scripts/catalog-intent.test.mjs`; preserve uppercase `.MD` discovery, intentional featured/unlisted status, and localized metadata.                                         | `npm run verify:catalog-source` checks the real sources and catalog without a build; `npm run test:catalog-intent` covers diagnostic rules with fixtures.                                                                                        |
| Markdown destinations and images                              | `src/lib/recipeLinks.ts`, consumed by `src/lib/recipePages.ts`; fixtures in `scripts/recipe-links.test.mjs`. Preserve readable `.MD` source links while transforming site destinations.                                                                                                                                 | `npm run test:recipe-links`; `verify:pizza-links:browser` covers the existing pizza link regression.                                                                                                                                             |
| Header, drawer, or search                                     | `src/components/SiteHeader.astro`, `src/scripts/siteHeader.ts`, `src/i18n/ui.ts`, `src/scripts/languageSwitch.ts`; keep language/RTL copy and scoped header behavior aligned.                                                                                                                                           | `verify:navigation:browser` owns drawer keyboard focus; `verify:search:browser` owns search interactions, and `verify:search-content:browser` owns localized results. Assertions live in the matching `scripts/verify-*-browser.spec.mjs` files. |
| Landing scrolling and back to top                             | `src/components/LandingPage.astro`, `src/scripts/backToTop.ts`, `src/scripts/languageSwitch.ts`; preserve the focus destination and fragment/language behavior.                                                                                                                                                         | `verify:navigation:browser` includes back-to-top fragment clearing and language switching; `verify:recipe-flows:browser` covers browsing flows.                                                                                                  |
| Poolish formula and rejections                                | `src/lib/poolishCalculator.ts`; independent expected quantities and rejection cases in `scripts/poolish-calculation.test.mjs`. Keep arithmetic coverage here.                                                                                                                                                           | `npm run test:poolish-calculation`                                                                                                                                                                                                               |
| Calculator interaction and localized copy                     | `src/components/PoolishCalculatorPage.astro`, `src/scripts/poolishCalculatorPage.ts`, `src/i18n/calculator.ts`; keep modes, validation, clipboard output, and language/query state aligned.                                                                                                                             | `verify:calculator:browser` owns visible feedback and recovery, not arithmetic cases.                                                                                                                                                            |
| Shared shell, metadata, or theme                              | `src/layouts/SitePage.astro`, `src/lib/pageContext.ts`, `src/components/SocialMeta.astro`, `src/components/FaviconLinks.astro`, `src/styles/design-tokens.css`; pages retain their own content/styles. Follow [Design](../DESIGN.md) for visual changes and ADR 0039 for shell/context boundaries.                      | `verify:contrast:browser` for control contrast; existing navigation, recipe-flow, and calculator browser suites for affected surfaces.                                                                                                           |
| Generated link resolver                                       | `scripts/generated-links.mjs`, `scripts/generated-links.test.mjs`; keep destination existence separate from expected navigation.                                                                                                                                                                                        | `npm run test:links`                                                                                                                                                                                                                             |
| Preview lifecycle                                             | `scripts/preview-server.mjs`, `scripts/preview-server.test.mjs`; preserve preview ownership, identity, and cleanup.                                                                                                                                                                                                     | `npm run test:preview`                                                                                                                                                                                                                           |
| Focused browser dispatch and command lifecycle                | `scripts/focused-verification.mjs`, `scripts/verify-focused.mjs`, `scripts/command-lifecycle.mjs`; keep the suite allowlist aligned with the `verify:*:browser` commands, reuse `withPreview` instead of arranging a server, and keep interruption closing child work.                                                  | `npm run test:focused`                                                                                                                                                                                                                           |
| Development environment readiness, setup, and upgrades        | `scripts/init.sh`, `scripts/install-system-tools.sh`, `scripts/init-environment.mjs`, `scripts/dev-environment.mjs`, `scripts/dev-environment-setup.mjs`, `dev-environment.json`; keep the check offline and read-only, stage installs before replacing checkout copies, and record upgrades only after staging passes. | `npm run test:dev-environment`; `./scripts/init.sh --check` against the real checkout.                                                                                                                                                           |
| Impeccable project route and context wrapper                  | `scripts/impeccable-project-route.md`, `scripts/impeccable-context.mjs`, the adaptation in `scripts/dev-environment.mjs`; keep routine UI fixes on the focused-maintenance route.                                                                                                                                       | `npm run test:dev-environment`                                                                                                                                                                                                                   |
| Build/publication checkout exclusion and manual publication   | `scripts/build-site.mjs`, `scripts/publish-site.mjs`, `scripts/checkout-operation-lock.mjs`, `scripts/verify-site.mjs`; keep release authorization separate from verification and publish only the verified active checkout through the fixed deployment subtree.                                                       | `npm run test:publish-site`                                                                                                                                                                                                                      |
| All source/fixture checks in the pre-build group              | The pure suites selected by `package.json`.                                                                                                                                                                                                                                                                             | `npm run verify:pure`                                                                                                                                                                                                                            |
| Built pages, catalog, navigation, links, and search artifacts | `scripts/verify-*.mjs`; generated assertion responsibilities are listed below.                                                                                                                                                                                                                                          | `npm run verify:generated`                                                                                                                                                                                                                       |
| Images published only under `/images/`                        | `public/images/`, `scripts/verify-static-assets.mjs`; retain existing assets according to ADR 0043.                                                                                                                                                                                                                     | `npm run verify:static-assets`                                                                                                                                                                                                                   |
| Google Search Console verification file                       | `public/google*.html`, `scripts/verify-search-console.mjs`; preserve the exact verification content.                                                                                                                                                                                                                    | `npm run verify:search-console`                                                                                                                                                                                                                  |
| Generated sitemap and page coverage                           | `astro.config.mjs`, `src/layouts/SitePage.astro`, `scripts/verify-sitemap.mjs`; keep hosting/base URLs aligned.                                                                                                                                                                                                         | `npm run verify:sitemap`                                                                                                                                                                                                                         |
| Other reader interactions                                     | Existing `scripts/verify-*-browser.spec.mjs` assertions and their feature owners.                                                                                                                                                                                                                                       | `npm run verify:focused -- --suite <name>`, or the matching `verify:*:browser` command against an explicit target.                                                                                                                               |

Recipe sources use uppercase `.MD`; include them when searching, for example
`rg --files -g '*.md' -g '*.MD'`. Modules executed directly by Node need explicit
`.ts` extensions in TypeScript imports, including transitive imports (see the
pure calculation tests); Astro's extensionless imports are not a Node template.

The pure checks need no build, browser, or `SITE_BASE_URL`. `test:preview` exercises
the preview lifecycle separately. Generated checks split responsibilities:
`verify:recipes` owns source-to-page coverage and landing card destinations;
`verify:catalog` owns card membership/order; `verify:navigation` owns expected
destinations; `verify:links` owns destination existence; `verify:static-assets`
owns image placement; `verify:search-index`
owns Pagefind artifacts; `verify:search-console` owns the exact verification file;
`verify:sitemap` checks that every built page except the static Search Console
verification file appears in the sitemap.

The build creates `sitemap-index.xml` and a numbered sitemap under `dist/`.
After publishing the build, submit
`https://alexfeigin.github.io/recipe-grams/sitemap-index.xml` in Google Search
Console. The page head also links to the sitemap index for crawlers.

The link checker resolves local references as a browser does, including the site
base, queries, and HTML/SVG fragments. External resources, CSS URLs, and `srcset`
candidates are outside its scope. The navigation check separately rejects local
`.MD` destinations while allowing external GitHub Markdown links.

Search browser tests separately own interaction (`verify:search:browser`) and
language-specific content (`verify:search-content:browser`). Calculator browser
tests own visible validation, recovery, clipboard behavior, localized units, and
mode switching; arithmetic cases belong to the pure suite.

### Run one browser suite

`npm run verify:focused` builds the current site, starts and identifies its own
preview, runs one suite against it, and closes that preview after success,
failure, or interruption:

```bash
npm run verify:focused -- --suite navigation
npm run verify:focused -- --suite navigation --grep 'keyboard opens'
```

`--suite` takes one maintained suite, listed in `package.json` as the
`verify:*:browser` commands; the optional `--grep` uses Playwright's test-name
matching. Unknown suites, unknown arguments, missing values, and invalid filters
fail with the usage before anything is built or started, and a filter matching
nothing fails instead of reporting success. Every run rebuilds from scratch
including Pagefind, and the owned preview replaces any `SITE_BASE_URL` already
in the environment. This is development feedback; it does not replace
`npm run verify`.

To check a running preview or published site, provide its URL with a trailing slash:

```bash
SITE_BASE_URL=https://alexfeigin.github.io/recipe-grams/ npm run verify:browser
```

The same variable works for focused browser commands. Retired `verify:issue*`
aliases and per-suite URL variables in historical notes are not current commands.

## Keep documentation current

Update the document that owns a changed rule, using the [README map](../README.md#read-only-what-your-task-needs).
For architectural choices, follow [decision maintenance](adr/README.md#maintaining-decisions):
clarify the relevant ADR, or record a qualifying changed decision with the next
number and an explicit supersession link.

Keep counts, command inventories, and literal theme values in their existing
source rather than copying them into prose.
