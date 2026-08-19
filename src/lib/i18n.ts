import type { RecipeLanguage } from "./recipePages";

export type PoolishCalculatorLabels = {
  brandLine: string;
  pageTitle: string;
  pageDescription: string;
  imageAlt: string;
  homeLabel: string;
  intro: string;
  calculatorLabel: string;
  modeLegend: string;
  genericMode: string;
  pizzaMode: string;
  pizzaCount: string;
  pizzaHelperPrefix: string;
  pizzaHelperStrong: string;
  pizzaHelperSuffix: string;
  fields: {
    desiredDough: string;
    hydration: string;
    poolishShare: string;
    poolishHydration: string;
    poolishYeast: string;
    restYeast: string;
    salt: string;
  };
  preset: {
    hydration: string;
    poolishShare: string;
    poolishYeast: string;
    salt: string;
  };
  summaries: {
    totalFlour: string;
    totalWater: string;
    targetDough: string;
  };
  phases: {
    poolish: string;
    finalDough: string;
    flour: string;
    water: string;
    yeast: string;
    salt: string;
  };
  copyButton: string;
  copied: string;
  copyFailed: string;
  validationMessage: string;
  gramUnit: string;
  copyText: {
    poolish: string;
    finalDough: string;
    flour: string;
    water: string;
    yeast: string;
    salt: string;
  };
};

export const poolishCalculatorLabels: Record<
  RecipeLanguage,
  PoolishCalculatorLabels
> = {
  en: {
    brandLine: "Poolish Calculator",
    pageTitle: "Poolish Calculator",
    pageDescription:
      "A hidden Recipe-Grams poolish calculator for generic dough and the house pizza preset.",
    imageAlt: "Pizza dough",
    homeLabel: "Home",
    intro:
      "Scale a poolish dough formula in grams, then switch to the pizza preset when you want the house poolish ratio.",
    calculatorLabel: "Poolish calculator",
    modeLegend: "Calculator mode",
    genericMode: "Generic",
    pizzaMode: "Pizza preset",
    pizzaCount: "Pizza count",
    pizzaHelperPrefix: "Pizza mode uses about",
    pizzaHelperStrong: "283g of dough per pizza",
    pizzaHelperSuffix: "Three pizzas make an 850g batch.",
    fields: {
      desiredDough: "Desired dough",
      hydration: "Hydration",
      poolishShare: "Poolish share",
      poolishHydration: "Poolish hydration",
      poolishYeast: "Poolish yeast",
      restYeast: "Final yeast",
      salt: "Salt",
    },
    preset: {
      hydration: "70%",
      poolishShare: "2/3 of flour",
      poolishYeast: "1.3% of poolish flour, minimum 3g",
      salt: "2.7% of total flour",
    },
    summaries: {
      totalFlour: "Total flour",
      totalWater: "Total water",
      targetDough: "Target base",
    },
    phases: {
      poolish: "Poolish",
      finalDough: "Final Dough",
      flour: "Flour",
      water: "Water",
      yeast: "Yeast",
      salt: "Salt",
    },
    copyButton: "Copy weights",
    copied: "Copied",
    copyFailed: "Copy failed",
    validationMessage:
      "Use positive numbers. Poolish share must stay between 0 and 1.",
    gramUnit: "g",
    copyText: {
      poolish: "Poolish:",
      finalDough: "Final dough:",
      flour: "Flour",
      water: "Water",
      yeast: "Yeast",
      salt: "Salt",
    },
  },
  he: {
    brandLine: "מחשבון פוליש",
    pageTitle: "מחשבון פוליש",
    pageDescription:
      "מחשבון פוליש נסתר של Recipe-Grams לבצק כללי ולפריסט פיצה ביתי.",
    imageAlt: "בצק פיצה",
    homeLabel: "עמוד הבית",
    intro:
      "התאימו נוסחת בצק פוליש בגרמים, או עברו לפריסט הפיצה כשצריך את יחס הפוליש הביתי.",
    calculatorLabel: "מחשבון פוליש",
    modeLegend: "מצב מחשבון",
    genericMode: "כללי",
    pizzaMode: "פריסט פיצה",
    pizzaCount: "מספר פיצות",
    pizzaHelperPrefix: "מצב פיצה משתמש בערך ב-",
    pizzaHelperStrong: "283 גרם בצק לכל פיצה",
    pizzaHelperSuffix: "שלוש פיצות הן מנה של 850 גרם.",
    fields: {
      desiredDough: "כמות בצק רצויה",
      hydration: "הידרציה",
      poolishShare: "חלק הפוליש",
      poolishHydration: "הידרציית פוליש",
      poolishYeast: "שמרים בפוליש",
      restYeast: "שמרים בבצק הסופי",
      salt: "מלח",
    },
    preset: {
      hydration: "70%",
      poolishShare: "2/3 מהקמח",
      poolishYeast: "1.3% מקמח הפוליש, מינימום 3 גרם",
      salt: "2.7% מסך הקמח",
    },
    summaries: {
      totalFlour: "סך הקמח",
      totalWater: "סך המים",
      targetDough: "בסיס הבצק",
    },
    phases: {
      poolish: "פוליש",
      finalDough: "בצק סופי",
      flour: "קמח",
      water: "מים",
      yeast: "שמרים",
      salt: "מלח",
    },
    copyButton: "העתקת כמויות",
    copied: "הועתק",
    copyFailed: "ההעתקה נכשלה",
    validationMessage:
      "השתמשו במספרים חיוביים. חלק הפוליש חייב להיות בין 0 ל-1.",
    gramUnit: " גרם",
    copyText: {
      poolish: "פוליש:",
      finalDough: "בצק סופי:",
      flour: "קמח",
      water: "מים",
      yeast: "שמרים",
      salt: "מלח",
    },
  },
};
