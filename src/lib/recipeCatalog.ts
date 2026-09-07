// Recipe catalog: the metadata that does not belong in the readable Markdown
// recipe body — category, markers, featured order, and localized titles,
// descriptions, and images. Adding or editing a recipe's site metadata happens
// here and nowhere else. This module reads no files and renders nothing.
import {
  labelsByLanguage,
  type RecipeCategoryId,
  type RecipeIdentity,
  type RecipeLanguage,
  type RecipeMarkerId,
} from "./site";

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
      "borscht.jpg",
    ),
    he: localizedMetadata(
      "בורשט",
      "מרק סלק מנחם עם צבע וטעם עמוקים.",
      "borscht.jpg",
    ),
  }),
  carrot_salad: defineCatalogEntry(
    "salads_pickles",
    ["favorite", "vegan"],
    17,
    {
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
      "chicken_soup.jpg",
    ),
    he: localizedMetadata(
      "מרק עוף וירקות",
      "מרק עוף וירקות ביתי ומנחם.",
      "chicken_soup.jpg",
    ),
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
  grill_rub: defineCatalogEntry("basics", ["favorite", "vegan"], 1, {
    en: localizedMetadata(
      "Grill Rub",
      "A vegan spice blend for seasoning grilled food.",
    ),
    he: localizedMetadata(
      "תערובת תיבול לגריל",
      "תערובת תבלינים טבעונית לגריל.",
    ),
  }),
  ground_beef_on_sweet_potato: defineCatalogEntry("mains", [], 16.5, {
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
      "purple_cabbage_salad.jpg",
    ),
    he: localizedMetadata(
      "סלט כרוב סגול",
      "סלט כרוב סגול פריך עם רוטב סויה.",
      "purple_cabbage_salad.jpg",
    ),
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
      "shnitzel.jpg",
    ),
    he: localizedMetadata(
      "שניצל פשוט אפוי בתנור",
      "שניצל אפוי בתנור בשיטת בלילה.",
      "shnitzel.jpg",
    ),
  }),
  simple_vinaigrette: defineCatalogEntry(undefined, ["vegan"], undefined, {
    en: localizedMetadata(
      "Simple Vinaigrette",
      "A basic vinaigrette helper recipe.",
    ),
    he: localizedMetadata("ויניגרט פשוט", "מתכון עזר לויניגרט בסיסי."),
  }),
  sweet_potato_bake: defineCatalogEntry("mains", [], 16, {
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
  super_easy_banana_cake: defineCatalogEntry("sweets", [], 28.25, {
    en: localizedMetadata(
      "Super-Easy Banana Cake",
      "A quick, tender blender banana cake with dark chocolate.",
    ),
    he: localizedMetadata(
      "עוגת בננה סופר קלה",
      "עוגת בננה מהירה ורכה שמכינים בבלנדר עם שוקולד מריר.",
    ),
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

export function getCatalogEntry(slug: string): RecipeCatalogEntry | undefined {
  return recipeCatalog[slug];
}

export function getRecipeMetadata(
  recipe: RecipeIdentity,
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

export function getRecipeSearchMetadata(recipe: RecipeIdentity) {
  const labels = labelsByLanguage[recipe.language];
  const entry = recipeCatalog[recipe.slug];

  return {
    category: entry?.categoryId ? labels.categoryLabels[entry.categoryId] : "",
    markers: entry?.markerIds
      .map((markerId) => labels.markerLabels[markerId])
      .join(", "),
  };
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
  recipe: RecipeIdentity,
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
