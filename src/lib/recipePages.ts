// Build-time recipe pages: discovering the localized recipes in the recipe
// source tree, assembling landing page data from the catalog, and rendering a
// recipe's Markdown body into site HTML. Everything here runs at build time and
// touches the filesystem; shared labels and URLs live in ./site, published link
// destinations in ./recipeLinks, and recipe metadata in ./recipeCatalog, which
// this module hands the discovered recipes so the two can be checked against
// each other.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { createSatteriMarkdownProcessor } from "@astrojs/markdown-satteri";
import {
  collectCatalogDiagnostics,
  selectFeaturedRecipes,
} from "./recipeCatalog";
import { createSiteDestinationPlugin } from "./recipeLinks";
import {
  isRecipeLanguage,
  labelsByLanguage,
  languages,
  sitePath,
  type RecipeCategoryId,
  type RecipeIdentity,
  type RecipeLanguage,
  type RecipeMarkerId,
} from "./site";

export type LocalizedRecipe = RecipeIdentity & {
  sourcePath: string;
};

export type RecipeCard = {
  slug: string;
  title: string;
  description: string;
  href: string;
  categoryId: RecipeCategoryId;
  markerIds: RecipeMarkerId[];
  image?: string;
};

export type CategorySection = {
  id: RecipeCategoryId;
  label: string;
  description: string;
  recipes: RecipeCard[];
};

const repoRoot = process.cwd();

// The recipe set the catalog was last checked against, so a build that renders
// hundreds of pages reports each disagreement once.
let lastCheckedRecipes = "";

// One renderer per language and base path: the destination plugin is fixed at
// creation, and building a renderer loads a syntax highlighter.
const markdownRenderers = new Map<
  string,
  ReturnType<typeof createSatteriMarkdownProcessor>
>();

export function listLocalizedRecipes(): LocalizedRecipe[] {
  const recipes = languages.flatMap((language) => {
    const directory = path.join(repoRoot, language);

    return readdirSync(directory)
      .filter((file) => file.endsWith(".MD"))
      .sort()
      .map((file) => ({
        language,
        slug: file.replace(/\.MD$/, ""),
        sourcePath: path.join(directory, file),
      }));
  });

  reportCatalogDiagnostics(recipes);

  return recipes;
}

// Discovery is where the catalog meets the recipe source tree, so it is where
// the two are checked against each other: once per set of discovered recipes,
// rather than once per generated page. Warnings are printed and the build goes
// on; errors stop it, because they describe a page the site should not publish.
function reportCatalogDiagnostics(recipes: LocalizedRecipe[]): void {
  const checked = recipes
    .map((recipe) => `${recipe.language}/${recipe.slug}`)
    .join("\n");

  if (checked === lastCheckedRecipes) {
    return;
  }

  const diagnostics = collectCatalogDiagnostics(recipes);

  for (const diagnostic of diagnostics) {
    if (diagnostic.severity === "warning") {
      console.warn(`[recipe catalog] ${diagnostic.message}`);
    }
  }

  const errors = diagnostics.filter(
    (diagnostic) => diagnostic.severity === "error",
  );

  if (errors.length > 0) {
    throw new Error(
      [
        "Incomplete recipe catalog metadata:",
        ...errors.map((error) => `  - ${error.message}`),
      ].join("\n"),
    );
  }

  lastCheckedRecipes = checked;
}

// The slugs that exist in both languages, counted from one already discovered
// recipe list so a caller never walks the recipe source tree twice.
function listRecipePairs(localizedRecipes: LocalizedRecipe[]): string[] {
  const slugsByLanguage = new Map<RecipeLanguage, Set<string>>();

  for (const language of languages) {
    slugsByLanguage.set(language, new Set());
  }

  for (const recipe of localizedRecipes) {
    slugsByLanguage.get(recipe.language)?.add(recipe.slug);
  }

  return Array.from(slugsByLanguage.get("en") ?? [])
    .filter((slug) => slugsByLanguage.get("he")?.has(slug))
    .sort();
}

export function findLocalizedRecipe(
  language: string | undefined,
  slug: string | undefined,
): LocalizedRecipe | undefined {
  if (!isRecipeLanguage(language) || !slug) {
    return undefined;
  }

  const sourcePath = path.join(repoRoot, language, `${slug}.MD`);
  if (!existsSync(sourcePath)) {
    return undefined;
  }

  return { language, slug, sourcePath };
}

export function getLandingPageData(language: RecipeLanguage, basePath: string) {
  const labels = labelsByLanguage[language];
  // One walk of the recipe source tree per call: the pair count and the
  // featured cards are two readings of the same discovered set.
  const localizedRecipes = listLocalizedRecipes();
  const pairedSlugs = listRecipePairs(localizedRecipes);
  const cards: RecipeCard[] = selectFeaturedRecipes(
    language,
    localizedRecipes,
  ).map((recipe) => ({
    slug: recipe.slug,
    title: recipe.metadata.title,
    description: recipe.metadata.description,
    href: sitePath(basePath, `${language}/${recipe.slug}/`),
    categoryId: recipe.categoryId,
    markerIds: recipe.markerIds,
    image: recipe.metadata.image,
  }));

  const categorySections: CategorySection[] = (
    Object.keys(labels.categoryLabels) as RecipeCategoryId[]
  )
    .map((categoryId) => ({
      id: categoryId,
      label: labels.categoryLabels[categoryId],
      description: labels.categoryDescriptions[categoryId],
      recipes: cards.filter((recipe) => recipe.categoryId === categoryId),
    }))
    .filter((section) => section.recipes.length > 0);

  // What the landing page lists. Direction, locale, labels, and home URLs are
  // language-derived page setup and belong to ./pageContext, not here.
  return {
    recipePairCount: pairedSlugs.length,
    categoryCount: categorySections.length,
    categorySections,
  };
}

export async function renderRecipeBody(
  recipe: LocalizedRecipe,
  basePath: string,
): Promise<string> {
  const renderer = await getMarkdownRenderer(recipe.language, basePath);
  const markdown = stripLegacyBackLink(readFileSync(recipe.sourcePath, "utf8"));
  const rendered = await renderer.render(markdown, {
    fileURL: pathToFileURL(recipe.sourcePath),
    frontmatter: {},
  });

  return rendered.code;
}

function getMarkdownRenderer(language: RecipeLanguage, basePath: string) {
  const key = `${language}\n${basePath}`;
  let renderer = markdownRenderers.get(key);

  if (!renderer) {
    renderer = createSatteriMarkdownProcessor({
      mdastPlugins: [createSiteDestinationPlugin(language, basePath)],
    });
    markdownRenderers.set(key, renderer);
  }

  return renderer;
}

function stripLegacyBackLink(markdown: string): string {
  return markdown.replace(
    /^\[(?:Back to (?:Menu|index)|חזרה לתפריט)\]\(\.\.\/index\.MD\)\r?\n+/,
    "",
  );
}
