import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { createSatteriMarkdownProcessor } from "@astrojs/markdown-satteri";
import { listRecipePairs, selectFeaturedRecipes } from "./recipeCatalog";
import { createSiteDestinationPlugin } from "./recipeLinks";
import { uiLabels } from "../i18n/ui";
import {
  sitePath,
  type RecipeCategoryId,
  type RecipeLanguage,
  type RecipeMarkerId,
} from "./site";
import {
  findLocalizedRecipeSource,
  listLocalizedRecipeSources,
  type LocalizedRecipe,
} from "./recipeSources.ts";

export type { LocalizedRecipe } from "./recipeSources.ts";

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

// One renderer per language and base path: the destination plugin is fixed at
// creation, and building a renderer loads a syntax highlighter.
const markdownRenderers = new Map<
  string,
  ReturnType<typeof createSatteriMarkdownProcessor>
>();

export function listLocalizedRecipes(): LocalizedRecipe[] {
  return listLocalizedRecipeSources(repoRoot);
}

export function findLocalizedRecipe(
  language: string | undefined,
  slug: string | undefined,
): LocalizedRecipe | undefined {
  return findLocalizedRecipeSource(language, slug, repoRoot);
}

export function getLandingPageData(language: RecipeLanguage, basePath: string) {
  const labels = uiLabels[language];
  const localizedRecipes = listLocalizedRecipes();
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
    recipePairCount: listRecipePairs(localizedRecipes).length,
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
