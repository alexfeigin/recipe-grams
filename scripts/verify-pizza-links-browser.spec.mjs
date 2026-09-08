import { expect, test } from "@playwright/test";

import { baseUrl } from "./browser-target.mjs";
const productionBase = "https://alexfeigin.github.io/recipe-grams/";
const shellUrl =
  "https://github.com/alexfeigin/recipe-grams/blob/master/poolish_calc.sh";

for (const language of ["en", "he"]) {
  test(`${language}: pizza resources work and calculator stays out of global navigation`, async ({
    page,
  }) => {
    // The recipe sends the reader straight to the pizza preset, so the link
    // carries the mode the calculator reads out of the query.
    const calculatorPath = language === "he" ? "he/poolish/" : "poolish/";
    const calculatorHref = `${productionBase}${calculatorPath}?mode=pizza`;
    // Keep the Markdown's production URL useful on GitHub, while clicking it
    // against the build under test when this runs locally.
    if (baseUrl !== productionBase) {
      await page.route(`${productionBase}**`, async (route) => {
        const target = route.request().url().replace(productionBase, baseUrl);
        const response = await route.fetch({ url: target });
        await route.fulfill({ response });
      });
    }
    const response = await page.goto(`${baseUrl}${language}/pizza_dough/`);
    expect(response.status()).toBe(200);
    const body = page.locator(".recipe-body");
    await expect(body.locator(`a[href="${shellUrl}"]`)).toBeVisible();
    const calculator = body.locator(`a[href="${calculatorHref}"]`);
    await expect(calculator).toBeVisible();
    await expect(page.locator('header a[href*="poolish"]')).toHaveCount(0);
    await expect(body.locator('a[href="../poolish_calc.sh"]')).toHaveCount(0);
    await expect(body.locator('a[href*="ggalmazor.com"]')).toHaveCount(0);

    const navigation = page.waitForResponse(
      (result) =>
        result.url() === calculatorHref &&
        result.request().isNavigationRequest(),
    );
    await calculator.click();
    expect((await navigation).status()).toBe(200);
    await expect(page.locator("html")).toHaveAttribute("lang", language);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      "content",
      "noindex",
    );
    await expect(page.locator("[data-pagefind-body]")).toHaveCount(0);
    await expect(page.locator('[data-field="pizzaCount"]')).toBeVisible();
    await expect(page.locator('[data-field="desiredDough"]')).toBeHidden();
    // The calculator's language picker links to its paired localization.
    await expect(
      page.locator('#main-navigation a[href*="poolish"]'),
    ).toHaveCount(0);

    await page.goto(`${baseUrl}${language === "he" ? "he/" : ""}`);
    await expect(page.locator('header a[href*="poolish"]')).toHaveCount(0);
  });
}
