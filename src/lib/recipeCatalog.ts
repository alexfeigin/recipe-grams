// Recipe catalog: the metadata that does not belong in the readable Markdown
// recipe body — browsing intent, markers, and localized titles, descriptions,
// and images. Adding or editing a recipe's site metadata happens here and
// nowhere else. This module reads no files and renders nothing: the functions
// that check the catalog against the recipe source tree are given the
// discovered recipes by ./recipePages.
import {
  labelsByLanguage,
  languages,
  type RecipeCategoryId,
  type RecipeIdentity,
  type RecipeLanguage,
  type RecipeMarkerId,
} from "./site.ts";

export type LocalizedRecipeMetadata = {
  title: string;
  description: string;
  image?: string;
  socialImage?: string;
};

// Where a published recipe belongs in generated browsing. A featured recipe
// carries the category and order its card needs; an unlisted one records why it
// is deliberately absent. There is no third state, so a forgotten category can
// never read as a decision to leave a recipe off the landing page.
export type FeaturedListing = {
  intent: "featured";
  categoryId: RecipeCategoryId;
  featuredOrder: number;
};

export type UnlistedListing = {
  intent: "unlisted";
  reason: string;
};

export type RecipeListing = FeaturedListing | UnlistedListing;

export type RecipeCatalogEntry = {
  listing: RecipeListing;
  markerIds: RecipeMarkerId[];
  localizations: Partial<Record<RecipeLanguage, LocalizedRecipeMetadata>>;
};

export type RecipeCatalog = Record<string, RecipeCatalogEntry>;

// A featured recipe of one language, ready for a landing page card.
export type FeaturedRecipe = {
  slug: string;
  language: RecipeLanguage;
  categoryId: RecipeCategoryId;
  featuredOrder: number;
  markerIds: RecipeMarkerId[];
  metadata: LocalizedRecipeMetadata;
};

// What a catalog check found. An error means the site would publish something
// wrong — a featured recipe whose card has no title or description — and fails
// the build. A warning means the site is correct but a maintainer probably
// wants to know: an uncataloged recipe, an orphan entry, a localization the
// source tree does not have, or two cards competing for one position.
export type CatalogDiagnostic = {
  severity: "error" | "warning";
  slug: string;
  language?: RecipeLanguage;
  message: string;
};

export const recipeCatalog: RecipeCatalog = {
  banana_bread: featuredRecipe("sweets", ["favorite"], 28, {
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
  borscht: featuredRecipe("mains", [], 15, {
    en: localizedMetadata(
      "Borscht",
      "A comforting beet soup with a deep red broth.",
      "borscht.jpg",
    ),
    he: localizedMetadata(
      "בורשט",
      "מרק סלק מנחם עם צבע וטעם עמוקים.",
      "borscht.jpg",
    ),
  }),
  carrot_salad: featuredRecipe("salads_pickles", ["favorite", "vegan"], 17, {
    en: localizedMetadata(
      "Sweet and Sour Carrot Salad",
      "Dina's bright carrot salad with a sweet-sour dressing.",
      "carrot_salad.jpg",
    ),
    he: localizedMetadata(
      "סלט גזר חמוץ מתוק",
      "סלט הגזר של דינה עם רוטב חמוץ-מתוק.",
      "carrot_salad.jpg",
    ),
  }),
  chicken_meatballs: featuredRecipe("mains", ["favorite"], 12, {
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
  chicken_soup: featuredRecipe("mains", ["favorite"], 14, {
    en: localizedMetadata(
      "Chicken and Vegetable Soup",
      "A homestyle chicken soup with vegetables.",
      "chicken_soup.jpg",
    ),
    he: localizedMetadata(
      "מרק עוף וירקות",
      "מרק עוף וירקות ביתי ומנחם.",
      "chicken_soup.jpg",
    ),
  }),
  choclatechip_vegan: featuredRecipe("sweets", ["vegan"], 22, {
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
  chocolate_cake: featuredRecipe("sweets", [], 27, {
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
  chocolatechip_cookies: featuredRecipe("sweets", ["favorite"], 20, {
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
  chouquettes: featuredRecipe("sweets", ["favorite"], 24, {
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
  coconut_almond_choclate_cookies: featuredRecipe("sweets", ["vegan"], 21, {
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
  colslaw_vinaigrette: featuredRecipe("salads_pickles", ["vegan"], 19, {
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
  cookie_cutter_cookies: featuredRecipe("sweets", [], 23, {
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
  crackers: featuredRecipe("snacks", ["favorite", "vegan"], 32, {
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
  crepe: featuredRecipe("sweets", [], 31, {
    en: localizedMetadata(
      "Crepe",
      "Thin crepes for sweet or savory fillings.",
      "crepe.jpg",
    ),
    he: localizedMetadata(
      "קרפ",
      "קרפים דקים למילוי מתוק או מלוח.",
      "crepe.jpg",
    ),
  }),
  frozen_banana: featuredRecipe("sweets", ["favorite", "vegan"], 29, {
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
  gluten_free_chocolate_banana_brownies: featuredRecipe("sweets", [], 30, {
    en: localizedMetadata(
      "Gluten-Free Chocolate Banana Brownies",
      "Chocolate banana brownies without gluten.",
    ),
    he: localizedMetadata(
      "בראוניז בננה-שוקולד ללא גלוטן",
      "בראוניז בננה ושוקולד ללא גלוטן.",
    ),
  }),
  grill_rub: featuredRecipe("basics", ["favorite", "vegan"], 1, {
    en: localizedMetadata(
      "Grill Rub",
      "A vegan spice blend for seasoning grilled food.",
    ),
    he: localizedMetadata(
      "תערובת תיבול לגריל",
      "תערובת תבלינים טבעונית לגריל.",
    ),
  }),
  ground_beef_on_sweet_potato: featuredRecipe("mains", [], 16.5, {
    en: localizedMetadata(
      "Ground Beef over Roasted Sweet Potato",
      "Roasted sweet potato topped with browned beef, caramelized onions, tahini, silan, and toasted nuts.",
      "ground_beef_on_sweet_potato.jpg",
    ),
    he: localizedMetadata(
      "בשר טחון על מצע בטטה",
      "בטטה צלויה עם בשר שחום, בצל מקורמל, טחינה, סילאן וצנוברים קלויים.",
      "ground_beef_on_sweet_potato.jpg",
    ),
  }),
  grilled_chicken_thighs: featuredRecipe("mains", [], 9, {
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
  honey_sugar_cookies: featuredRecipe("sweets", [], 28.5, {
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
  leopard_cookies: featuredRecipe("sweets", [], 23.5, {
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
  pankcakebatter: featuredRecipe("sweets", [], 26, {
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
  paodequeijo: featuredRecipe("doughs_starches", [], 3, {
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
  paprikesh_pasta: featuredRecipe("doughs_starches", ["favorite", "vegan"], 7, {
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
  }),
  pastry_cream: unlistedRecipe(
    "Component recipe that filled pastries build on, not a dish to browse to.",
    [],
    {
      en: localizedMetadata(
        "Pastry Cream",
        "A smooth pastry cream helper recipe.",
      ),
      he: localizedMetadata("קרם פטיסייר", "מתכון עזר לקרם פטיסייר חלק."),
    },
  ),
  pateachoux: featuredRecipe("sweets", [], 25, {
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
  pilmeni_dough: featuredRecipe("doughs_starches", [], 8, {
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
  pizza_dough: featuredRecipe("doughs_starches", [], 4, {
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
  purple_cabbage_salad: featuredRecipe("salads_pickles", ["vegan"], 16, {
    en: localizedMetadata(
      "Purple Cabbage Salad",
      "A crunchy purple cabbage salad with soy dressing.",
      "purple_cabbage_salad.jpg",
    ),
    he: localizedMetadata(
      "סלט כרוב סגול",
      "סלט כרוב סגול פריך עם רוטב סויה.",
      "purple_cabbage_salad.jpg",
    ),
  }),
  quick_pickle_carrot: featuredRecipe("salads_pickles", ["vegan"], 18, {
    en: localizedMetadata(
      "Quick Vinegar-Pickled Carrots",
      "Fast vinegar-pickled carrots for a bright side.",
    ),
    he: localizedMetadata(
      "גזר כבוש מהיר בחומץ",
      "גזר כבוש מהיר בחומץ כתוספת מרעננת.",
    ),
  }),
  quinoa: featuredRecipe("doughs_starches", ["vegan"], 1, {
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
  rice_pilaf: featuredRecipe("doughs_starches", [], 2, {
    en: localizedMetadata(
      "Rice Pilaf",
      "A reliable rice pilaf side with clear weights.",
    ),
    he: localizedMetadata(
      "פילאף אורז",
      "תוספת אורז פילאף אמינה עם כמויות ברורות.",
    ),
  }),
  salt: unlistedRecipe("Seasoning reference note rather than a recipe.", [], {
    en: localizedMetadata("Salt", "A small helper note for salt measurements."),
    he: localizedMetadata("מלח", "הערת עזר קצרה למדידות מלח."),
  }),
  shnitzel: featuredRecipe("mains", [], 13, {
    en: localizedMetadata(
      "Simple Oven-Baked Schnitzel",
      "Oven-baked schnitzel using the slurry method.",
      "shnitzel.jpg",
    ),
    he: localizedMetadata(
      "שניצל פשוט אפוי בתנור",
      "שניצל אפוי בתנור בשיטת בלילה.",
      "shnitzel.jpg",
    ),
  }),
  simple_vinaigrette: unlistedRecipe(
    "Dressing helper the salads that use it link to.",
    ["vegan"],
    {
      en: localizedMetadata(
        "Simple Vinaigrette",
        "A basic vinaigrette helper recipe.",
      ),
      he: localizedMetadata("ויניגרט פשוט", "מתכון עזר לויניגרט בסיסי."),
    },
  ),
  sweet_potato_bake: featuredRecipe("mains", [], 16, {
    en: localizedMetadata(
      "Sweet Potato Bake",
      "A savory sweet potato and onion bake with eggs and warm spices.",
      "sweet_potato_bake.jpg",
    ),
    he: localizedMetadata(
      "פשטידת בטטה",
      "פשטידת בטטה ובצל מלוחה עם ביצים ותבלינים חמים.",
      "sweet_potato_bake.jpg",
    ),
  }),
  super_easy_banana_cake: featuredRecipe("sweets", [], 28.25, {
    en: localizedMetadata(
      "Super-Easy Banana Cake",
      "A quick, tender blender banana cake with dark chocolate.",
    ),
    he: localizedMetadata(
      "עוגת בננה סופר קלה",
      "עוגת בננה מהירה ורכה שמכינים בבלנדר עם שוקולד מריר.",
    ),
  }),
  teriyaki_salmon_air_fryer: featuredRecipe("mains", [], 10, {
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
  tortillas: featuredRecipe("doughs_starches", ["vegan"], 6, {
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
  vanila_cupcakes: featuredRecipe("sweets", ["favorite"], 24.5, {
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
  yozhiki: featuredRecipe("mains", [], 11, {
    en: localizedMetadata(
      "Yozhiki",
      "Rice-studded meatballs in a simple sauce.",
    ),
    he: localizedMetadata("יוז'יקי", "קציצות עם אורז ברוטב פשוט."),
  }),
};

export function getCatalogEntry(
  slug: string,
  catalog: RecipeCatalog = recipeCatalog,
): RecipeCatalogEntry | undefined {
  return catalog[slug];
}

export function getRecipeMetadata(
  recipe: RecipeIdentity,
  catalog: RecipeCatalog = recipeCatalog,
): LocalizedRecipeMetadata {
  const metadata = catalog[recipe.slug]?.localizations[recipe.language];

  if (metadata) {
    return metadata;
  }

  return {
    title: "Recipe-Grams Recipe",
    description:
      "A Recipe-Grams page rendered from the localized Markdown recipe source.",
  };
}

export function getRecipeSearchMetadata(
  recipe: RecipeIdentity,
  catalog: RecipeCatalog = recipeCatalog,
) {
  const labels = labelsByLanguage[recipe.language];
  const entry = catalog[recipe.slug];
  const listing = entry?.listing;

  return {
    category:
      listing?.intent === "featured"
        ? labels.categoryLabels[listing.categoryId]
        : "",
    markers: entry?.markerIds
      .map((markerId) => labels.markerLabels[markerId])
      .join(", "),
  };
}

// The cards one localized landing page shows, in featured order. A recipe earns
// a card when the catalog features it, the recipe exists in every published
// language, and this language has the title and description a card needs.
export function selectFeaturedRecipes(
  language: RecipeLanguage,
  recipes: readonly RecipeIdentity[],
  catalog: RecipeCatalog = recipeCatalog,
): FeaturedRecipe[] {
  const sourceLanguages = groupSourceLanguages(recipes);

  return Array.from(sourceLanguages)
    .filter(([, availableLanguages]) =>
      languages.every((candidate) => availableLanguages.has(candidate)),
    )
    .flatMap(([slug]) => {
      const entry = catalog[slug];
      const metadata = entry?.localizations[language];

      if (
        entry?.listing.intent !== "featured" ||
        !metadata?.title ||
        !metadata.description
      ) {
        return [];
      }

      return [
        {
          slug,
          language,
          categoryId: entry.listing.categoryId,
          featuredOrder: entry.listing.featuredOrder,
          markerIds: entry.markerIds,
          metadata,
        },
      ];
    })
    .sort((first, second) => first.featuredOrder - second.featuredOrder);
}

// Everything the catalog and the recipe source tree can disagree about, checked
// in one pass over the discovered recipes.
export function collectCatalogDiagnostics(
  recipes: readonly RecipeIdentity[],
  catalog: RecipeCatalog = recipeCatalog,
): CatalogDiagnostic[] {
  const sourceLanguages = groupSourceLanguages(recipes);
  const diagnostics: CatalogDiagnostic[] = [];

  for (const [slug, availableLanguages] of sourceLanguages) {
    const entry = catalog[slug];

    if (!entry) {
      diagnostics.push({
        severity: "warning",
        slug,
        message: `${slug} has no catalog entry: its pages publish and stay searchable, but it cannot appear in browsing. Add a featuredRecipe or unlistedRecipe entry.`,
      });
      continue;
    }

    for (const language of languages) {
      if (!availableLanguages.has(language)) {
        continue;
      }

      const missing = missingMetadataFields(entry.localizations[language]);
      if (missing.length === 0) {
        continue;
      }

      diagnostics.push({
        severity: entry.listing.intent === "featured" ? "error" : "warning",
        slug,
        language,
        message:
          entry.listing.intent === "featured"
            ? `${language}/${slug}.MD is featured but its catalog entry has no ${missing.join(" or ")}, so the landing page would drop its card.`
            : `${language}/${slug}.MD is unlisted and its catalog entry has no ${missing.join(" or ")}, so its page falls back to the generic title and description.`,
      });
    }

    for (const language of languages) {
      if (availableLanguages.has(language) || !entry.localizations[language]) {
        continue;
      }

      diagnostics.push({
        severity: "warning",
        slug,
        language,
        message: `${slug} has ${language} catalog metadata, but ${language}/${slug}.MD does not exist.`,
      });
    }

    if (
      entry.listing.intent === "featured" &&
      !languages.every((language) => availableLanguages.has(language))
    ) {
      diagnostics.push({
        severity: "warning",
        slug,
        message: `${slug} is featured but is not a complete Recipe Pair, and landing pages list only recipes available in every language.`,
      });
    }
  }

  for (const slug of Object.keys(catalog)) {
    if (sourceLanguages.has(slug)) {
      continue;
    }

    diagnostics.push({
      severity: "warning",
      slug,
      message: `${slug} is an orphan catalog entry: no localized Markdown recipe has that slug.`,
    });
  }

  return [...diagnostics, ...duplicateFeaturedOrders(catalog)];
}

function groupSourceLanguages(
  recipes: readonly RecipeIdentity[],
): Map<string, Set<RecipeLanguage>> {
  const sourceLanguages = new Map<string, Set<RecipeLanguage>>();

  for (const recipe of [...recipes].sort((first, second) =>
    first.slug.localeCompare(second.slug),
  )) {
    const availableLanguages =
      sourceLanguages.get(recipe.slug) ?? new Set<RecipeLanguage>();
    availableLanguages.add(recipe.language);
    sourceLanguages.set(recipe.slug, availableLanguages);
  }

  return sourceLanguages;
}

function missingMetadataFields(
  metadata: LocalizedRecipeMetadata | undefined,
): string[] {
  const missing: string[] = [];

  if (!metadata?.title) {
    missing.push("title");
  }

  if (!metadata?.description) {
    missing.push("description");
  }

  return missing;
}

// Two cards with the same order inside one category leave their sequence to
// chance, which is worth reporting. The same order in different categories is
// fine: each category sorts on its own.
function duplicateFeaturedOrders(catalog: RecipeCatalog): CatalogDiagnostic[] {
  const slugsByPosition = new Map<string, string[]>();

  for (const [slug, entry] of Object.entries(catalog)) {
    if (entry.listing.intent !== "featured") {
      continue;
    }

    const position = `${entry.listing.categoryId}\n${entry.listing.featuredOrder}`;
    slugsByPosition.set(position, [
      ...(slugsByPosition.get(position) ?? []),
      slug,
    ]);
  }

  return Array.from(slugsByPosition)
    .filter(([, slugs]) => slugs.length > 1)
    .map(([position, slugs]) => {
      const [categoryId, featuredOrder] = position.split("\n");
      return {
        severity: "warning" as const,
        slug: slugs[0]!,
        message: `${slugs.join(", ")} share featured order ${featuredOrder} in ${categoryId}, so their card sequence is undefined.`,
      };
    });
}

function featuredRecipe(
  categoryId: RecipeCategoryId,
  markerIds: RecipeMarkerId[],
  featuredOrder: number,
  localizations: Partial<Record<RecipeLanguage, LocalizedRecipeMetadata>>,
): RecipeCatalogEntry {
  return {
    listing: { intent: "featured", categoryId, featuredOrder },
    markerIds,
    localizations,
  };
}

// A published recipe kept off the landing page on purpose. The reason is for
// the next maintainer: it says the omission was a decision.
function unlistedRecipe(
  reason: string,
  markerIds: RecipeMarkerId[],
  localizations: Partial<Record<RecipeLanguage, LocalizedRecipeMetadata>>,
): RecipeCatalogEntry {
  return {
    listing: { intent: "unlisted", reason },
    markerIds,
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
