import type {
  RecipeCategoryId,
  RecipeLanguage,
  RecipeMarkerId,
} from "../lib/site";

export const languageNames: Record<RecipeLanguage, string> = {
  en: "EN",
  he: "עב",
};

export type UiLabels = {
  brandLine: string;
  pageTitle: string;
  pageDescription: string;
  home: string;
  accessibility: {
    backToTop: string;
    browseSummary: string;
    home: string;
    languagePicker: string;
    mainNavigation: string;
    openRecipe: string;
    recipePhoto: string;
    toggleNavigation: string;
  };
  nav: {
    categories: string;
  };
  search: {
    close: string;
    empty: string;
    error: string;
    retry: string;
    found: string;
    loading: string;
    placeholder: string;
    resultsLabel: string;
    title: string;
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
  };
  categoryLabels: Record<RecipeCategoryId, string>;
  categoryDescriptions: Record<RecipeCategoryId, string>;
  markerLabels: Record<RecipeMarkerId, string>;
};

export const uiLabels: Record<RecipeLanguage, UiLabels> = {
  en: {
    brandLine: "Measured family recipes",
    pageTitle: "Recipe-Grams",
    pageDescription: "Recipe-Grams is a gram-based family recipe collection.",
    home: "Home",
    accessibility: {
      backToTop: "Back to top",
      browseSummary: "Browse summary",
      home: "Recipe-Grams home",
      languagePicker: "Language",
      mainNavigation: "Main navigation",
      openRecipe: "Open",
      recipePhoto: "recipe photo",
      toggleNavigation: "Toggle navigation",
    },
    nav: {
      categories: "Categories",
    },
    search: {
      close: "Close search",
      empty: "No recipes found",
      error: "Search could not load. Please try again.",
      retry: "Try again",
      found: "Recipes found: {count}",
      loading: "Searching",
      placeholder: "Search",
      resultsLabel: "Search results",
      title: "Search recipes",
    },
    hero: {
      title: "Recipe-Grams",
      description:
        "Practical family recipes measured in grams, built for repeatable everyday cooking.",
      recipeCount: "Recipes",
      categoryCount: "Categories",
      gramFirst: "Gram-first",
    },
    sections: {
      title: "What do you feel like cooking?",
    },
    categoryLabels: {
      doughs_starches: "Doughs & Starches",
      mains: "Mains",
      salads_pickles: "Salads & Pickles",
      basics: "Basics",
      sweets: "Sweets",
      snacks: "Snacks",
    },
    categoryDescriptions: {
      doughs_starches:
        "Doughs, grains, and starches measured for reliable batches.",
      mains: "Dinner anchors built for family cooking.",
      salads_pickles: "Bright sides, pickles, and vinaigrettes.",
      basics: "Repeatable bases, seasonings, and everyday building blocks.",
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
    pageDescription: "Recipe-Grams הוא אוסף מתכונים משפחתיים המבוסס על גרמים.",
    home: "עמוד הבית",
    accessibility: {
      backToTop: "חזרה למעלה",
      browseSummary: "סיכום עיון",
      home: "עמוד הבית של Recipe-Grams",
      languagePicker: "בחירת שפה",
      mainNavigation: "ניווט ראשי",
      openRecipe: "פתיחת",
      recipePhoto: "תמונת מתכון",
      toggleNavigation: "פתיחת ניווט",
    },
    nav: {
      categories: "קטגוריות",
    },
    search: {
      close: "סגירת חיפוש",
      empty: "לא נמצאו מתכונים",
      error: "לא ניתן לטעון את החיפוש. נסו שוב.",
      retry: "נסו שוב",
      found: "מתכונים שנמצאו: {count}",
      loading: "מחפש",
      placeholder: "חיפוש",
      resultsLabel: "תוצאות חיפוש",
      title: "חיפוש מתכונים",
    },
    hero: {
      title: "Recipe-Grams",
      description:
        "מתכונים משפחתיים פרקטיים בגרמים, לבישול יומיומי שאפשר לחזור עליו.",
      recipeCount: "מתכונים",
      categoryCount: "קטגוריות",
      gramFirst: "מבוסס גרמים",
    },
    sections: {
      title: "מה בא לך לבשל?",
    },
    categoryLabels: {
      doughs_starches: "בצקים ותוספות",
      mains: "עיקריות",
      salads_pickles: "סלטים וחמוצים",
      basics: "בסיסים",
      sweets: "מתוקים",
      snacks: "נשנושים",
    },
    categoryDescriptions: {
      doughs_starches: "בצקים, דגנים ותוספות עם כמויות יציבות.",
      mains: "מנות עיקריות לבישול משפחתי.",
      salads_pickles: "סלטים, חמוצים ורטבים מרעננים.",
      basics: "בסיסים, תיבולים ומתכוני עזר שחוזרים אליהם.",
      sweets: "עוגיות, עוגות, מאפים וקינוחים קפואים.",
      snacks: "נשנושים פריכים ותוספות שאפשר להכין מראש.",
    },
    markerLabels: {
      favorite: "אהוב",
      vegan: "טבעוני",
    },
  },
};
