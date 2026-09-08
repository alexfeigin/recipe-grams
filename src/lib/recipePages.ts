import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { createSatteriMarkdownProcessor } from "@astrojs/markdown-satteri";
import {
  collectCatalogDiagnostics,
  selectFeaturedRecipes,
} from "./recipeCatalog";
import { createSiteDestinationPlugin } from "./recipeLinks";
import { uiLabels } from "../i18n/ui";
import {
  isRecipeLanguage,
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
  const labels = uiLabels[language];
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
