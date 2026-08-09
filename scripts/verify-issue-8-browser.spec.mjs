import { existsSync } from "node:fs";
import path from "node:path";
import { expect, test } from "@playwright/test";

const baseUrl = "http://127.0.0.1:4321/recipe-grams/";
const screenshotDir = "docs/verification/issue-8-screenshots";

test("Pagefind indexes the generated static site", async () => {
  expect(
    existsSync(path.join(process.cwd(), "dist/pagefind/pagefind.js")),
  ).toBe(true);
  expect(
    existsSync(path.join(process.cwd(), "dist/pagefind/pagefind-entry.json")),
  ).toBe(true);
});

test("English search finds a body term and opens the recipe", async ({
  page,
}) => {
  await page.goto(baseUrl);
  await page.getByRole("searchbox", { name: "Search" }).fill("onion");

  const result = page.getByRole("link", { name: /Rice Pilaf/ }).first();
  await expect(result).toBeVisible();
  await expect(result).toContainText("Doughs & Starches");
  await expect(result).toContainText("onion");

  await page.screenshot({
    path: `${screenshotDir}/en-search-results.png`,
    fullPage: true,
  });

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

  await page.screenshot({
    path: `${screenshotDir}/he-search-results.png`,
    fullPage: true,
  });

  await result.click();
  await expect(page).toHaveURL(`${baseUrl}he/rice_pilaf/`);
  await expect(page.getByRole("heading", { name: "פילאף אורז" })).toBeVisible();
});

test("Mobile drawer exposes the same search popup", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(baseUrl);
  await page.getByLabel("Toggle navigation").click();
  await page.getByRole("searchbox", { name: "Search" }).fill("salmon");

  const result = page
    .getByRole("link", { name: /Air Fryer Teriyaki Salmon/ })
    .first();
  await expect(result).toBeVisible();

  await page.screenshot({
    path: `${screenshotDir}/mobile-search-results.png`,
    fullPage: true,
  });
});
