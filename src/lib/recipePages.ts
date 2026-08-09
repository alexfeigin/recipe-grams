import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { createSatteriMarkdownProcessor } from "@astrojs/markdown-satteri";

export const languages = ["en", "he"] as const;
export type RecipeLanguage = (typeof languages)[number];

export type LocalizedRecipe = {
  language: RecipeLanguage;
  slug: string;
  sourcePath: string;
};

export type RecipeCategoryId =
  | "basics"
  | "doughs_starches"
  | "mains"
  | "salads_pickles"
  | "sweets"
  | "snacks";

export type RecipeMarkerId = "favorite" | "vegan";

export type LocalizedRecipeMetadata = {
  title: string;
  description: string;
  image?: string;
  socialImage?: string;
};

export type RecipeCatalogEntry = {
  categoryId?: RecipeCategoryId;
  markerIds: RecipeMarkerId[];
  featuredOrder?: number;
  localizations: Partial<Record<RecipeLanguage, LocalizedRecipeMetadata>>;
};

export type RecipeCard = {
  slug: string;
  title: string;
  description: string;
  href: string;
  categoryId: RecipeCategoryId;
  markerIds: RecipeMarkerId[];
  image?: string;
  featuredOrder: number;
};

export type CategorySection = {
  id: RecipeCategoryId;
  label: string;
  description: string;
  recipes: RecipeCard[];
};

type LocalizedLabels = {
  brandLine: string;
  pageTitle: string;
  pageDescription: string;
  home: string;
  languageSwitch: string;
  markdownSource: string;
  accessibility: {
    browseSummary: string;
    home: string;
    openRecipe: string;
    recipePhoto: string;
    toggleNavigation: string;
  };
  nav: {
    categories: string;
    sourceIndex: string;
  };
  hero: {
    title: string;
    description: string;
    recipeCount: string;
    categoryCount: string;
    gramFirst: string;
  };
  sections: {
    title: string;
    description: string;
  };
  categoryLabels: Record<RecipeCategoryId, string>;
  categoryDescriptions: Record<RecipeCategoryId, string>;
  markerLabels: Record<RecipeMarkerId, string>;
};

const repoRoot = process.cwd();

export const labelsByLanguage: Record<RecipeLanguage, LocalizedLabels> = {
  en: {
    brandLine: "Measured family recipes",
    pageTitle: "Recipe-Grams",
    pageDescription:
      "Recipe-Grams is a bilingual gram-based recipe collection.",
    home: "Home",
    languageSwitch: "עברית",
    markdownSource: "Markdown Source",
    accessibility: {
      browseSummary: "Browse summary",
      home: "Recipe-Grams home",
      openRecipe: "Open",
      recipePhoto: "recipe photo",
      toggleNavigation: "Toggle navigation",
    },
    nav: {
      categories: "Categories",
      sourceIndex: "Legacy Index",
    },
    hero: {
      title: "Recipe-Grams",
      description:
        "A bilingual recipe collection for cooks who want ingredient weights, stable links, and a faster way to choose what to make.",
      recipeCount: "Recipe pairs",
      categoryCount: "Categories",
      gramFirst: "Gram-first",
    },
    sections: {
      title: "Browse Recipes",
      description:
        "Real recipes from the Markdown source tree, grouped by stable catalog metadata.",
    },
    categoryLabels: {
      basics: "Basics",
      doughs_starches: "Doughs & Starches",
      mains: "Mains",
      salads_pickles: "Salads & Pickles",
      sweets: "Sweets",
      snacks: "Snacks",
    },
    categoryDescriptions: {
      basics: "Repeatable bases, seasonings, and everyday building blocks.",
      doughs_starches:
        "Doughs, grains, and starches measured for reliable batches.",
      mains: "Dinner anchors built for family cooking.",
      salads_pickles: "Bright sides, pickles, and vinaigrettes.",
      sweets: "Cookies, cakes, pastries, and freezer treats.",
      snacks: "Crunchy small bites and make-ahead extras.",
    },
    markerLabels: {
      favorite: "Favorite",
      vegan: "Vegan",
    },
  },
  he: {
    brandLine: "מתכונים משפחתיים בגרמים",
    pageTitle: "Recipe-Grams",
    pageDescription: "Recipe-Grams הוא אוסף מתכונים דו-לשוני המבוסס על גרמים.",
    home: "עמוד הבית",
    languageSwitch: "English",
    markdownSource: "מקור Markdown",
    accessibility: {
      browseSummary: "סיכום עיון",
      home: "עמוד הבית של Recipe-Grams",
      openRecipe: "פתיחת",
      recipePhoto: "תמונת מתכון",
      toggleNavigation: "פתיחת ניווט",
    },
    nav: {
      categories: "קטגוריות",
      sourceIndex: "אינדקס ישן",
    },
    hero: {
      title: "Recipe-Grams",
      description:
        "אוסף מתכונים דו-לשוני לטבחים שרוצים כמויות בגרמים, קישורים יציבים ודרך מהירה לבחור מה להכין.",
      recipeCount: "זוגות מתכונים",
      categoryCount: "קטגוריות",
      gramFirst: "מבוסס גרמים",
    },
    sections: {
      title: "עיון במתכונים",
      description:
        "מתכונים אמיתיים מעץ קבצי ה-Markdown, מסודרים לפי מטא-דאטה יציב.",
    },
    categoryLabels: {
      basics: "בסיסים",
      doughs_starches: "בצקים ותוספות",
      mains: "עיקריות",
      salads_pickles: "סלטים וחמוצים",
      sweets: "מתוקים",
      snacks: "נשנושים",
    },
    categoryDescriptions: {
      basics: "בסיסים, תיבולים ומתכוני עזר שחוזרים אליהם.",
      doughs_starches: "בצקים, דגנים ותוספות עם כמויות יציבות.",
      mains: "מנות עיקריות לבישול משפחתי.",
      salads_pickles: "סלטים, חמוצים ורטבים מרעננים.",
      sweets: "עוגיות, עוגות, מאפים וקינוחים קפואים.",
      snacks: "נשנושים פריכים ותוספות שאפשר להכין מראש.",
    },
    markerLabels: {
      favorite: "אהוב",
      vegan: "טבעוני",
    },
  },
};

const recipeCatalog: Record<string, RecipeCatalogEntry> = {
  banana_bread: defineCatalogEntry("sweets", ["favorite"], 28, {
    en: localizedMetadata(
      "Banana Bread",
      "A soft banana cake for using ripe bananas.",
      "bananaBread1.jpg",
    ),
    he: localizedMetadata(
      "עוגת בננות",
      "עוגת בננות רכה לבננות בשלות.",
      "bananaBread1.jpg",
    ),
  }),
  borscht: defineCatalogEntry("mains", [], 15, {
    en: localizedMetadata(
      "Borscht",
      "A comforting beet soup with a deep red broth.",
    ),
    he: localizedMetadata("בורשט", "מרק סלק מנחם עם צבע וטעם עמוקים."),
  }),
  carrot_salad: defineCatalogEntry(
    "salads_pickles",
    ["favorite", "vegan"],
    17,
    {
      en: localizedMetadata(
        "Sweet and Sour Carrot Salad",
        "Dina's bright carrot salad with a sweet-sour dressing.",
      ),
      he: localizedMetadata(
        "סלט גזר חמוץ מתוק",
        "סלט הגזר של דינה עם רוטב חמוץ-מתוק.",
      ),
    },
  ),
  chicken_meatballs: defineCatalogEntry("mains", ["favorite"], 12, {
    en: localizedMetadata(
      "Quick Chicken Meatballs",
      "Sash's quick chicken meatballs for a simple family dinner.",
      "meatballsc.jpeg",
    ),
    he: localizedMetadata(
      "קציצות עוף מהירות",
      "קציצות העוף המהירות של סש לארוחת ערב.",
      "meatballsc.jpeg",
    ),
  }),
  chicken_soup: defineCatalogEntry("mains", ["favorite"], 14, {
    en: localizedMetadata(
      "Chicken and Vegetable Soup",
      "A homestyle chicken soup with vegetables.",
    ),
    he: localizedMetadata("מרק עוף וירקות", "מרק עוף וירקות ביתי ומנחם."),
  }),
  choclatechip_vegan: defineCatalogEntry("sweets", ["vegan"], 22, {
    en: localizedMetadata(
      "Vegan Chocolate Chip Cookies",
      "Plant-based cookies with crisp edges and soft centers.",
      "Veganchoc.jpeg",
    ),
    he: localizedMetadata(
      "עוגיות שוקולד צ'יפס טבעוניות",
      "עוגיות טבעוניות עם קצוות פריכים ומרכז רך.",
      "Veganchoc.jpeg",
    ),
  }),
  chocolate_cake: defineCatalogEntry("sweets", [], 27, {
    en: localizedMetadata(
      "Chocolate Cake",
      "A straightforward chocolate cake for celebrations.",
      "chocake.jpg",
    ),
    he: localizedMetadata(
      "עוגת שוקולד",
      "עוגת שוקולד פשוטה לאירועים וליומיום.",
      "chocake.jpg",
    ),
  }),
  chocolatechip_cookies: defineCatalogEntry("sweets", ["favorite"], 20, {
    en: localizedMetadata(
      "Chocolate Chip Cookies",
      "Classic chocolate chip cookies measured by weight.",
      "chocookies.jpeg",
    ),
    he: localizedMetadata(
      "עוגיות שוקולד צ'יפס",
      "עוגיות שוקולד צ'יפס קלאסיות בגרמים.",
      "chocookies.jpeg",
    ),
  }),
  chouquettes: defineCatalogEntry("sweets", ["favorite"], 24, {
    en: localizedMetadata(
      "Chouquettes",
      "Light choux pastry puffs finished with pearl sugar.",
      "chouquettes.jpeg",
    ),
    he: localizedMetadata(
      "שוקטים",
      "פחזניות קלילות מבצק רבוך עם סוכר פנינים.",
      "chouquettes.jpeg",
    ),
  }),
  coconut_almond_choclate_cookies: defineCatalogEntry("sweets", ["vegan"], 21, {
    en: localizedMetadata(
      "Coconut Almond Chocolate Cookies",
      "Coconut and almond cookies with chocolate in a vegan dough.",
      "almondcoconut.jpeg",
    ),
    he: localizedMetadata(
      "עוגיות קוקוס, שוקולד ושקדים",
      "עוגיות קוקוס ושקדים עם שוקולד בבצק טבעוני.",
      "almondcoconut.jpeg",
    ),
  }),
  colslaw_vinaigrette: defineCatalogEntry("salads_pickles", ["vegan"], 19, {
    en: localizedMetadata(
      "Coleslaw with Simple Vinaigrette",
      "Crisp coleslaw dressed with a simple vinaigrette.",
      "coleslaw.jpg",
    ),
    he: localizedMetadata(
      "סלט קולסלאו עם ויניגרט פשוט",
      "קולסלאו פריך עם ויניגרט פשוט.",
      "coleslaw.jpg",
    ),
  }),
  cookie_cutter_cookies: defineCatalogEntry("sweets", [], 23, {
    en: localizedMetadata(
      "Cookie Cutter Butter Cookies",
      "Butter cookies built to hold clean cutter shapes.",
      "cookiecutter.jpeg",
    ),
    he: localizedMetadata(
      "עוגיות בצורות",
      "עוגיות חמאה שנשארות יציבות בחיתוך צורות.",
      "cookiecutter.jpeg",
    ),
  }),
  crackers: defineCatalogEntry("snacks", ["favorite", "vegan"], 32, {
    en: localizedMetadata(
      "Seed and Nut Crackers",
      "Crunchy seed and nut crackers for snacking.",
      "crackers.jpeg",
    ),
    he: localizedMetadata(
      "קרקרים מגרעינים וזרעים",
      "קרקרים פריכים מגרעינים ואגוזים.",
      "crackers.jpeg",
    ),
  }),
  crepe: defineCatalogEntry("sweets", [], 31, {
    en: localizedMetadata("Crepe", "Thin crepes for sweet or savory fillings."),
    he: localizedMetadata("קרפ", "קרפים דקים למילוי מתוק או מלוח."),
  }),
  frozen_banana: defineCatalogEntry("sweets", ["favorite", "vegan"], 29, {
    en: localizedMetadata(
      "Banana Chocolate Popsicles",
      "Frozen banana and chocolate treats on a stick.",
      "frozen_banana.jpeg",
    ),
    he: localizedMetadata(
      "ארטיק בננה שוקולד",
      "בננה קפואה עם שוקולד על מקל.",
      "frozen_banana.jpeg",
    ),
  }),
  gluten_free_chocolate_banana_brownies: defineCatalogEntry("sweets", [], 30, {
    en: localizedMetadata(
      "Gluten-Free Chocolate Banana Brownies",
      "Chocolate banana brownies without gluten.",
    ),
    he: localizedMetadata(
      "בראוניז בננה-שוקולד ללא גלוטן",
      "בראוניז בננה ושוקולד ללא גלוטן.",
    ),
  }),
  grill_rub: defineCatalogEntry("doughs_starches", ["favorite", "vegan"], 5, {
    en: localizedMetadata(
      "Grill Rub",
      "A vegan spice blend for seasoning grilled food.",
    ),
    he: localizedMetadata(
      "תערובת תיבול לגריל",
      "תערובת תבלינים טבעונית לגריל.",
    ),
  }),
  grilled_chicken_thighs: defineCatalogEntry("mains", [], 9, {
    en: localizedMetadata(
      "Grilled Chicken Thighs",
      "High-heat chicken thighs with repeatable seasoning and juicy results.",
      "grilledchicken.jpeg",
    ),
    he: localizedMetadata(
      "ירכי עוף על הגריל",
      "ירכי עוף בחום גבוה עם תיבול מדויק ותוצאה עסיסית.",
      "grilledchicken.jpeg",
    ),
  }),
  honey_sugar_cookies: defineCatalogEntry("sweets", [], 28.5, {
    en: localizedMetadata(
      "Honey Sugar Cookies",
      "Tender sugar cookies sweetened with honey.",
      "honeycookies.jpeg",
    ),
    he: localizedMetadata(
      "עוגיות סוכר עם דבש",
      "עוגיות סוכר עדינות עם דבש.",
      "honeycookies.jpeg",
    ),
  }),
  leopard_cookies: defineCatalogEntry("sweets", [], 23.5, {
    en: localizedMetadata(
      "Leopard Print Cookies",
      "Patterned cookies with a playful leopard look.",
      "leopardcookie.jpeg",
    ),
    he: localizedMetadata(
      "עוגיות מנומרות",
      "עוגיות מעוצבות במראה מנומר.",
      "leopardcookie.jpeg",
    ),
  }),
  pankcakebatter: defineCatalogEntry("sweets", [], 26, {
    en: localizedMetadata(
      "Pancake Batter",
      "A reliable gram-based pancake batter.",
      "pancake1.jpeg",
    ),
    he: localizedMetadata(
      "בצק פנקייק",
      "בלילת פנקייק אמינה לפי גרמים.",
      "pancake1.jpeg",
    ),
  }),
  paodequeijo: defineCatalogEntry("doughs_starches", [], 3, {
    en: localizedMetadata(
      "Pao de Queijo",
      "Brazilian cheese bread with a chewy center.",
      "paude.jpeg",
    ),
    he: localizedMetadata(
      "פאו דה קיישו",
      "לחמניות גבינה ברזילאיות עם מרכז נמתח.",
      "paude.jpeg",
    ),
  }),
  paprikesh_pasta: defineCatalogEntry(
    "doughs_starches",
    ["favorite", "vegan"],
    7,
    {
      en: localizedMetadata(
        "Pasta Paprikash",
        "A vegan paprika pasta for a quick savory meal.",
        "paprikesh.jpeg",
      ),
      he: localizedMetadata(
        "פסטה פפריקש",
        "פסטה פפריקה טבעונית לארוחה מהירה.",
        "paprikesh.jpeg",
      ),
    },
  ),
  pastry_cream: defineCatalogEntry(undefined, [], undefined, {
    en: localizedMetadata(
      "Pastry Cream",
      "A smooth pastry cream helper recipe.",
    ),
    he: localizedMetadata("קרם פטיסייר", "מתכון עזר לקרם פטיסייר חלק."),
  }),
  pateachoux: defineCatalogEntry("sweets", [], 25, {
    en: localizedMetadata(
      "Pate a Choux",
      "Classic choux pastry dough for puffs and related pastries.",
      "peta.jpeg",
    ),
    he: localizedMetadata(
      "בצק רבוך",
      "בצק רבוך קלאסי לפחזניות ומאפים.",
      "peta.jpeg",
    ),
  }),
  pilmeni_dough: defineCatalogEntry("doughs_starches", [], 8, {
    en: localizedMetadata(
      "Pelmeni Dough",
      "A sturdy dough for rolling and filling pelmeni.",
      "pilmeni1.jpg",
    ),
    he: localizedMetadata(
      "בצק פלמני",
      "בצק יציב לרידוד ומילוי פלמני.",
      "pilmeni1.jpg",
    ),
  }),
  pizza_dough: defineCatalogEntry("doughs_starches", [], 4, {
    en: localizedMetadata(
      "Pizza Dough Recipe",
      "A gram-based overnight poolish dough for two pizzas.",
      "pizza.jpg",
    ),
    he: localizedMetadata(
      "מתכון לבצק פיצה",
      "בצק פיצה בשיטת פוליש לילה לשתי פיצות.",
      "pizza.jpg",
    ),
  }),
  purple_cabbage_salad: defineCatalogEntry("salads_pickles", ["vegan"], 16, {
    en: localizedMetadata(
      "Purple Cabbage Salad",
      "A crunchy purple cabbage salad with soy dressing.",
    ),
    he: localizedMetadata("סלט כרוב סגול", "סלט כרוב סגול פריך עם רוטב סויה."),
  }),
  quick_pickle_carrot: defineCatalogEntry("salads_pickles", ["vegan"], 18, {
    en: localizedMetadata(
      "Quick Vinegar-Pickled Carrots",
      "Fast vinegar-pickled carrots for a bright side.",
    ),
    he: localizedMetadata(
      "גזר כבוש מהיר בחומץ",
      "גזר כבוש מהיר בחומץ כתוספת מרעננת.",
    ),
  }),
  quinoa: defineCatalogEntry("doughs_starches", ["vegan"], 1, {
    en: localizedMetadata(
      "Delicious Quinoa with Sweet Potato",
      "A simple quinoa and sweet potato base measured in grams.",
      "quinoa.jpg",
    ),
    he: localizedMetadata(
      "קינואה טעימה עם בטטה",
      "קינואה פשוטה עם בטטה, מדודה בגרמים.",
      "quinoa.jpg",
    ),
  }),
  rice_pilaf: defineCatalogEntry("doughs_starches", [], 2, {
    en: localizedMetadata(
      "Rice Pilaf",
      "A reliable rice pilaf side with clear weights.",
    ),
    he: localizedMetadata(
      "פילאף אורז",
      "תוספת אורז פילאף אמינה עם כמויות ברורות.",
    ),
  }),
  salt: defineCatalogEntry(undefined, [], undefined, {
    en: localizedMetadata("Salt", "A small helper note for salt measurements."),
    he: localizedMetadata("מלח", "הערת עזר קצרה למדידות מלח."),
  }),
  shnitzel: defineCatalogEntry("mains", [], 13, {
    en: localizedMetadata(
      "Simple Oven-Baked Schnitzel",
      "Oven-baked schnitzel using the slurry method.",
    ),
    he: localizedMetadata(
      "שניצל פשוט אפוי בתנור",
      "שניצל אפוי בתנור בשיטת בלילה.",
    ),
  }),
  simple_vinaigrette: defineCatalogEntry(undefined, ["vegan"], undefined, {
    en: localizedMetadata(
      "Simple Vinaigrette",
      "A basic vinaigrette helper recipe.",
    ),
    he: localizedMetadata("ויניגרט פשוט", "מתכון עזר לויניגרט בסיסי."),
  }),
  teriyaki_salmon_air_fryer: defineCatalogEntry("mains", [], 10, {
    en: localizedMetadata(
      "Air Fryer Teriyaki Salmon",
      "Teriyaki salmon cooked quickly in the air fryer.",
      "teriyaki_salmon_air_fryer.jpg",
    ),
    he: localizedMetadata(
      "סלמון טריאקי באייר פרייר",
      "סלמון טריאקי מהיר באייר פרייר.",
      "teriyaki_salmon_air_fryer.jpg",
    ),
  }),
  tortillas: defineCatalogEntry("doughs_starches", ["vegan"], 6, {
    en: localizedMetadata(
      "Tortillas",
      "Flexible tortillas measured by weight.",
      "tortila.jpeg",
    ),
    he: localizedMetadata(
      "טורטיות",
      "טורטיות גמישות לפי גרמים.",
      "tortila.jpeg",
    ),
  }),
  vanila_cupcakes: defineCatalogEntry("sweets", ["favorite"], 24.5, {
    en: localizedMetadata(
      "Vanilla Cupcakes",
      "A white-cake style vanilla cupcake recipe.",
      "cupcake.jpg",
    ),
    he: localizedMetadata(
      "קאפקייקס וניל",
      "קאפקייקס וניל בסגנון עוגה לבנה.",
      "cupcake.jpg",
    ),
  }),
  yozhiki: defineCatalogEntry("mains", [], 11, {
    en: localizedMetadata(
      "Yozhiki",
      "Rice-studded meatballs in a simple sauce.",
    ),
    he: localizedMetadata("יוז'יקי", "קציצות עם אורז ברוטב פשוט."),
  }),
};

const warnedMissingMetadata = new Set<string>();
let markdownRenderer:
  Awaited<ReturnType<typeof createSatteriMarkdownProcessor>> | undefined;

export function listLocalizedRecipes(): LocalizedRecipe[] {
  return languages.flatMap((language) => {
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
}

export function listRecipePairs(): string[] {
  const localizedRecipes = listLocalizedRecipes();
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

export function getRecipeMetadata(
  recipe: LocalizedRecipe,
): LocalizedRecipeMetadata {
  const metadata = recipeCatalog[recipe.slug]?.localizations[recipe.language];
  const entry = recipeCatalog[recipe.slug];

  warnForIncompleteMetadata(recipe, entry, metadata);

  if (metadata) {
    return metadata;
  }

  return {
    title: "Recipe-Grams Recipe",
    description:
      "A Recipe-Grams page rendered from the localized Markdown recipe source.",
  };
}

export function getLandingPageData(language: RecipeLanguage, basePath: string) {
  const labels = labelsByLanguage[language];
  const pairedSlugs = new Set(listRecipePairs());
  const cards = listLocalizedRecipes()
    .filter((recipe) => recipe.language === language)
    .filter((recipe) => pairedSlugs.has(recipe.slug))
    .flatMap((recipe) => {
      const entry = recipeCatalog[recipe.slug];
      const metadata = getRecipeMetadata(recipe);

      if (!entry?.categoryId || entry.featuredOrder === undefined) {
        return [];
      }

      return [
        {
          slug: recipe.slug,
          title: metadata.title,
          description: metadata.description,
          href: sitePath(basePath, `${language}/${recipe.slug}/`),
          categoryId: entry.categoryId,
          markerIds: entry.markerIds,
          image: metadata.image,
          featuredOrder: entry.featuredOrder,
        },
      ];
    })
    .sort((a, b) => a.featuredOrder - b.featuredOrder);

  return {
    labels,
    direction: language === "he" ? "rtl" : "ltr",
    language,
    alternateLanguage: language === "he" ? "en" : "he",
    alternateHref:
      language === "he" ? sitePath(basePath, "") : sitePath(basePath, "he/"),
    sourceIndexHref:
      "https://github.com/alexfeigin/recipe-grams/blob/astro-recipe-blog/index.MD",
    recipePairCount: pairedSlugs.size,
    categoryCount: Object.keys(labels.categoryLabels).length,
    categorySections: (Object.keys(labels.categoryLabels) as RecipeCategoryId[])
      .map((categoryId) => ({
        id: categoryId,
        label: labels.categoryLabels[categoryId],
        description: labels.categoryDescriptions[categoryId],
        recipes: cards.filter((recipe) => recipe.categoryId === categoryId),
      }))
      .filter((section) => section.recipes.length > 0),
  };
}

export async function renderRecipeBody(
  recipe: LocalizedRecipe,
  basePath: string,
): Promise<string> {
  markdownRenderer ??= await createSatteriMarkdownProcessor();

  const rawMarkdown = stripLegacyBackLink(
    readFileSync(recipe.sourcePath, "utf8"),
  );
  const siteMarkdown = rewriteMarkdownAssetLinks(rawMarkdown, basePath);
  const rendered = await markdownRenderer.render(siteMarkdown, {
    fileURL: new URL(`file://${recipe.sourcePath}`),
    frontmatter: {},
  });

  return rendered.code;
}

export function sitePath(basePath: string, pathName: string): string {
  const normalizedBase = basePath.endsWith("/") ? basePath : `${basePath}/`;
  return `${normalizedBase}${pathName.replace(/^\/+/, "")}`;
}

function defineCatalogEntry(
  categoryId: RecipeCategoryId | undefined,
  markerIds: RecipeMarkerId[],
  featuredOrder: number | undefined,
  localizations: Partial<Record<RecipeLanguage, LocalizedRecipeMetadata>>,
): RecipeCatalogEntry {
  return {
    categoryId,
    markerIds,
    featuredOrder,
    localizations,
  };
}

function localizedMetadata(
  title: string,
  description: string,
  image?: string,
): LocalizedRecipeMetadata {
  return {
    title,
    description,
    image,
    socialImage: image,
  };
}

function warnForIncompleteMetadata(
  recipe: LocalizedRecipe,
  entry: RecipeCatalogEntry | undefined,
  metadata: LocalizedRecipeMetadata | undefined,
) {
  const missing: string[] = [];

  if (!entry) {
    missing.push("catalog entry");
  }

  if (!entry?.categoryId) {
    missing.push("category");
  }

  if (entry?.categoryId && entry.featuredOrder === undefined) {
    missing.push("featured order");
  }

  if (!metadata?.title) {
    missing.push("localized title");
  }

  if (!metadata?.description) {
    missing.push("localized description");
  }

  if (missing.length === 0) {
    return;
  }

  const warningKey = `${recipe.language}/${recipe.slug}`;
  if (warnedMissingMetadata.has(warningKey)) {
    return;
  }

  warnedMissingMetadata.add(warningKey);
  console.warn(
    `[recipe metadata] Missing ${missing.join(", ")} for ${warningKey}.MD`,
  );
}

function rewriteMarkdownAssetLinks(markdown: string, basePath: string): string {
  return markdown.replace(
    /(!\[[^\]]*\]\()\.\.\/images\/([^)]+)(\))/g,
    (_match, prefix: string, imagePath: string, suffix: string) =>
      `${prefix}${sitePath(basePath, imagePath)}${suffix}`,
  );
}

function stripLegacyBackLink(markdown: string): string {
  return markdown.replace(
    /^\[(?:Back to (?:Menu|index)|חזרה לתפריט)\]\(\.\.\/index\.MD\)\r?\n+/,
    "",
  );
}

function isRecipeLanguage(
  language: string | undefined,
): language is RecipeLanguage {
  return languages.includes(language as RecipeLanguage);
}
