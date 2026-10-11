import { expect, test } from "@playwright/test";

import { baseUrl } from "./browser-target.mjs";

test("English search finds a body term and opens the recipe", async ({
  page,
}) => {
  await page.goto(baseUrl);
  await page.getByRole("searchbox", { name: "Search" }).fill("onion");

  const result = page.getByRole("link", { name: /Rice Pilaf/ }).first();
  await expect(result).toBeVisible();
  await expect(result).toContainText("Doughs & Starches");
  await expect(result).toContainText("onion");

  await result.click();
  await expect(page).toHaveURL(`${baseUrl}en/rice_pilaf/`);
  await expect(page.getByRole("heading", { name: "Rice Pilaf" })).toBeVisible();
});

test("Hebrew search finds a body term and opens the Hebrew recipe", async ({
  page,
}) => {
  await page.goto(`${baseUrl}he/`);
  await page.getByRole("searchbox", { name: "חיפוש" }).fill("בצל");

  const result = page.getByRole("link", { name: /פילאף אורז/ }).first();
  await expect(result).toBeVisible();
  await expect(result).toContainText("בצקים ותוספות");
  await expect(result).toContainText("בצל");

  await result.click();
  await expect(page).toHaveURL(`${baseUrl}he/rice_pilaf/`);
  await expect(page.getByRole("heading", { name: "פילאף אורז" })).toBeVisible();
});

test("Hebrew search on an English page opens the Hebrew recipe", async ({
  page,
}) => {
  await page.goto(baseUrl);
  await page.getByRole("searchbox", { name: "Search" }).fill("בצל");

  const result = page.getByRole("link", { name: /פילאף אורז/ }).first();
  await expect(result).toBeVisible();
  await expect(result).toHaveAttribute("lang", "he");
  await expect(result).toHaveAttribute("dir", "rtl");

  await result.click();
  await expect(page).toHaveURL(`${baseUrl}he/rice_pilaf/`);
  await expect(page.locator("html")).toHaveAttribute("lang", "he");
  await expect(page.getByRole("searchbox", { name: "חיפוש" })).toBeVisible();
});

test("English search on a Hebrew page opens the English recipe", async ({
  page,
}) => {
  await page.goto(`${baseUrl}he/`);
  await page.getByRole("searchbox", { name: "חיפוש" }).fill("onion");

  const result = page.getByRole("link", { name: /Rice Pilaf/ }).first();
  await expect(result).toBeVisible();
  await expect(result).toHaveAttribute("lang", "en");
  await expect(result).toHaveAttribute("dir", "ltr");

  await result.click();
  await expect(page).toHaveURL(`${baseUrl}en/rice_pilaf/`);
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByRole("searchbox", { name: "Search" })).toBeVisible();
});

for (const [language, other] of [
  ["en", "he"],
  ["he", "en"],
]) {
  test(`${language}: a term in both languages lists this page's language first`, async ({
    page,
  }) => {
    await page.goto(`${baseUrl}${language === "he" ? "he/" : ""}`);
    // Both versions of one recipe carry this name in their title.
    await page.getByRole("searchbox").fill("choux");

    const results = page.locator(".search-result");
    await expect(results.first()).toBeVisible();
    const found = await results.evaluateAll((links) =>
      links.map((link) => link.lang),
    );

    expect(found[0]).toBe(language);
    expect(found).toContain(other);
    expect(found.lastIndexOf(language)).toBeLessThan(found.indexOf(other));
  });
}
