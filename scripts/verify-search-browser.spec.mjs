import { expect, test } from "@playwright/test";

const baseUrl =
  process.env.SEARCH_BASE_URL ?? "http://127.0.0.1:4324/recipe-grams/";

const copy = {
  en: {
    query: "onion",
    replacement: "salmon",
    result: "Salmon",
    loading: "Searching",
    empty: "No recipes found",
    error: "Search could not load. Please try again.",
    found: "Recipes found:",
  },
  he: {
    query: "בצל",
    replacement: "סלמון",
    result: "סלמון",
    loading: "מחפש",
    empty: "לא נמצאו מתכונים",
    error: "לא ניתן לטעון את החיפוש. נסו שוב.",
    found: "מתכונים שנמצאו:",
  },
};

for (const language of ["en", "he"]) {
  for (const width of [1280, 390]) {
    test(`${language} ${width}: search expands between the brand and language toggle`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 844 });
      await page.goto(`${baseUrl}${language === "he" ? "he/" : ""}`);

      const header = page.locator(".site-header");
      const input = page.getByRole("searchbox");
      const dropdown = page.locator("[data-search-overlay]");
      const results = page.locator(".search-result");
      const brand = page.locator(".brand");
      const languagePicker = page.locator(".language-picker:visible");
      const searchControl = page.locator(".search-control");
      const initialSearchWidth = await searchControl.evaluate(
        (element) => element.getBoundingClientRect().width,
      );

      await expect(dropdown).toBeHidden();
      await input.click();
      const openingSearchWidth = await searchControl.evaluate(
        (element) => element.getBoundingClientRect().width,
      );
      await expect(header).toHaveClass(/search-active/);
      await expect(input).toBeFocused();
      await expect(dropdown).toBeHidden();
      await expect(brand).toBeVisible();
      await expect(languagePicker).toBeVisible();
      await expect
        .poll(() =>
          searchControl.evaluate(
            (element) => element.getBoundingClientRect().width,
          ),
        )
        .toBeGreaterThan(initialSearchWidth + 20);
      const expandedSearchWidth = await searchControl.evaluate(
        (element) => element.getBoundingClientRect().width,
      );
      expect(openingSearchWidth).toBeLessThan(expandedSearchWidth - 5);
      if (width > 880) {
        await expect(page.locator(".nav-panel")).toBeHidden();
      } else {
        await expect(page.locator(".menu-button")).toBeHidden();
      }

      await input.fill(copy[language].query.slice(0, 1));
      await expect(dropdown).toBeHidden();
      await input.fill(copy[language].query);
      await expect(results.first()).toBeVisible();
      await expect(dropdown).toBeVisible();

      const geometry = await page
        .locator("[data-search-area]")
        .evaluate((area) => {
          const areaBounds = area.getBoundingClientRect();
          const field = area
            .querySelector(".search-control")
            .getBoundingClientRect();
          const panel = area
            .querySelector("[data-search-overlay]")
            .getBoundingClientRect();
          return {
            aligned:
              Math.abs(areaBounds.left - panel.left) < 2 &&
              Math.abs(areaBounds.right - panel.right) < 2,
            gap: panel.top - field.bottom,
          };
        });
      expect(geometry.aligned).toBe(true);
      expect(geometry.gap).toBeLessThan(8);

      await input.fill(copy[language].replacement);
      await expect(results.first()).toContainText(copy[language].result);
      await page.screenshot({ path: `.astro/search-${language}-${width}.png` });

      for (const href of await results.evaluateAll((links) =>
        links.map((link) => link.href),
      )) {
        expect(new URL(href).pathname).toContain(`/${language}/`);
      }

      await input.press("ArrowDown");
      await expect(results.first()).toBeFocused();
      await page.keyboard.press("Escape");
      const closingSearchWidth = await searchControl.evaluate(
        (element) => element.getBoundingClientRect().width,
      );
      await expect(dropdown).toBeHidden();
      await expect(header).not.toHaveClass(/search-active/);
      await expect(input).toBeFocused();
      await expect
        .poll(() =>
          searchControl.evaluate(
            (element) => element.getBoundingClientRect().width,
          ),
        )
        .toBeLessThan(initialSearchWidth + 2);
      expect(closingSearchWidth).toBeGreaterThan(initialSearchWidth + 5);
      await expect(brand).toBeVisible();
      await expect(languagePicker).toBeVisible();
      if (width > 880) {
        await expect(page.locator(".nav-panel")).toBeVisible();
      } else {
        await expect(page.locator(".menu-button")).toBeVisible();
      }
    });
  }
}

for (const language of ["en", "he"]) {
  test(`${language}: loading stays quiet until a result state exists`, async ({
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

    const header = page.locator(".site-header");
    const input = page.getByRole("searchbox");
    const status = page.getByRole("status");
    const dropdown = page.locator("[data-search-overlay]");
    await input.click();
    await input.fill(copy[language].query);
    await expect(status).toHaveText(copy[language].loading);
    await expect(dropdown).toBeHidden();

    releaseLoad();
    await expect(status).toHaveText(copy[language].error);
    await expect(dropdown).toBeVisible();
    await page.locator("[data-search-retry]").click();
    await expect(page.locator(".search-result").first()).toBeVisible();
    await expect(status).toContainText(copy[language].found);

    await input.fill("zzzznomatchingrecipe");
    await expect(status).toHaveText(copy[language].empty);
    await expect(dropdown).toBeVisible();

    await page.locator("[data-search-close]").click();
    await expect(dropdown).toBeHidden();
    await expect(header).not.toHaveClass(/search-active/);
    await expect(input).toBeFocused();

    await input.click();
    await expect(header).toHaveClass(/search-active/);
    await expect(dropdown).toBeHidden();
    await page.locator("main").click({ position: { x: 10, y: 10 } });
    await expect(header).not.toHaveClass(/search-active/);

    await input.click();
    await input.fill(copy[language].query);
    await expect(page.locator(".search-result").first()).toBeVisible();
    await page.locator(".search-result").first().click();
    await expect(page).toHaveURL(new RegExp(`/${language}/[^/]+/$`));
  });
}
