import { expect, test } from "@playwright/test";

const baseUrl =
  process.env.SEARCH_BASE_URL ?? "http://127.0.0.1:4324/recipe-grams/";

for (const language of ["en", "he"]) {
  for (const width of [1280, 390]) {
    test(`${language} ${width}: editable search and keyboard results`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 844 });
      await page.goto(`${baseUrl}${language === "he" ? "he/" : ""}`);
      const input = page.getByRole("searchbox");
      const close = page.locator("[data-search-close]");
      const results = page.locator(".search-result");
      await input.fill(language === "he" ? "בצל" : "onion");
      await expect(results.first()).toBeVisible();
      await input.click({ timeout: 2000 });
      await expect(input).toBeFocused();
      await input.fill(language === "he" ? "סלמון" : "salmon");
      await expect(results.first()).toContainText(
        language === "he" ? "סלמון" : "Salmon",
      );
      await page.screenshot({ path: `.astro/search-${language}-${width}.png` });
      await page.keyboard.press("Tab");
      await expect(close).toBeFocused();
      await page.keyboard.press("Tab");
      await expect(results.first()).toBeFocused();
      for (const href of await results.evaluateAll((links) =>
        links.map((link) => link.href),
      )) {
        expect(new URL(href).pathname).toContain(`/${language}/`);
      }
      await page.keyboard.press("Escape");
      await expect(page.locator("[data-search-overlay]")).toBeHidden();
      await expect(input).toBeFocused();
    });
  }
}

for (const language of ["en", "he"]) {
  test(`${language}: loading, failure, retry, empty, and dismissal`, async ({
    page,
  }) => {
    let releaseLoad;
    const loadGate = new Promise((resolve) => {
      releaseLoad = resolve;
    });
    let failed = false;
    await page.route("**/pagefind/pagefind.js*", async (route) => {
      if (!failed) {
        failed = true;
        await loadGate;
        await route.abort("failed");
      } else {
        await route.continue();
      }
    });
    await page.goto(`${baseUrl}${language === "he" ? "he/" : ""}`);
    const input = page.getByRole("searchbox");
    const status = page.getByRole("status");
    const overlay = page.locator("[data-search-overlay]");
    await input.fill(language === "he" ? "בצל" : "onion");
    await expect(status).toHaveText(language === "he" ? "מחפש" : "Searching");
    releaseLoad();
    await expect(status).toHaveText(
      language === "he"
        ? "לא ניתן לטעון את החיפוש. נסו שוב."
        : "Search could not load. Please try again.",
    );
    await page.locator("[data-search-retry]").click();
    await expect(page.locator(".search-result").first()).toBeVisible();
    await expect(status).toContainText(
      language === "he" ? "מתכונים שנמצאו:" : "Recipes found:",
    );
    await input.fill("zzzznomatchingrecipe");
    await expect(status).toHaveText(
      language === "he" ? "לא נמצאו מתכונים" : "No recipes found",
    );
    await page.locator("[data-search-close]").click();
    await expect(input).toBeFocused();
    await expect(overlay).toBeHidden();
    await input.press("Enter");
    await expect(overlay).toBeVisible();
    await page.mouse.click(5, 500);
    await expect(overlay).toBeHidden();
    await input.fill(language === "he" ? "בצל" : "onion");
    await expect(page.locator(".search-result").first()).toBeVisible();
    await input.press("Shift+Tab");
    await expect(overlay).toBeHidden();
    await input.fill(language === "he" ? "בצל" : "onion");
    await expect(page.locator(".search-result").first()).toBeVisible();
    await page.locator(".search-result").first().click();
    await expect(page).toHaveURL(new RegExp(`/${language}/[^/]+/$`));
  });
}
