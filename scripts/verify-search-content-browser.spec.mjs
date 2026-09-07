import { existsSync } from "node:fs";
import path from "node:path";
import { expect, test } from "@playwright/test";

import { baseUrl } from "./browser-target.mjs";

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
}, testInfo) => {
  await page.goto(baseUrl);
  await page.getByRole("searchbox", { name: "Search" }).fill("onion");

  const result = page.getByRole("link", { name: /Rice Pilaf/ }).first();
  await expect(result).toBeVisible();
  await expect(result).toContainText("Doughs & Starches");
  await expect(result).toContainText("onion");

  await page.screenshot({
    path: testInfo.outputPath("en-search-results.png"),
    fullPage: true,
  });

  await result.click();
  await expect(page).toHaveURL(`${baseUrl}en/rice_pilaf/`);
  await expect(page.getByRole("heading", { name: "Rice Pilaf" })).toBeVisible();
});

test("Hebrew search finds a body term and opens the Hebrew recipe", async ({
  page,
}, testInfo) => {
  await page.goto(`${baseUrl}he/`);
  await page.getByRole("searchbox", { name: "חיפוש" }).fill("בצל");

  const result = page.getByRole("link", { name: /פילאף אורז/ }).first();
  await expect(result).toBeVisible();
  await expect(result).toContainText("בצקים ותוספות");
  await expect(result).toContainText("בצל");

  await page.screenshot({
    path: testInfo.outputPath("he-search-results.png"),
    fullPage: true,
  });

  await result.click();
  await expect(page).toHaveURL(`${baseUrl}he/rice_pilaf/`);
  await expect(page.getByRole("heading", { name: "פילאף אורז" })).toBeVisible();
});

test("Search results attach to the original field and close outside", async ({
  page,
}) => {
  await page.goto(baseUrl);
  const input = page.getByRole("searchbox", { name: "Search" });
  await input.click();

  const overlay = page.locator("[data-search-overlay]");
  await expect(overlay).toBeHidden();
  await input.fill("o");
  await expect(overlay).toBeHidden();
  await input.fill("onion");
  await expect(overlay).toBeVisible();
  await expect(
    page.getByRole("link", { name: /Rice Pilaf/ }).first(),
  ).toBeVisible();

  const overlayState = await overlay.evaluate((element) => {
    const inputBounds = document
      .querySelector(".search-control")
      .getBoundingClientRect();
    const bounds = element.getBoundingClientRect();
    return {
      aligned:
        Math.abs(inputBounds.left - bounds.left) < 2 &&
        Math.abs(inputBounds.right - bounds.right) < 2,
      gap: bounds.top - inputBounds.bottom,
    };
  });

  expect(overlayState.aligned).toBe(true);
  expect(overlayState.gap).toBeLessThan(8);

  await page.mouse.click(24, 220);
  await expect(overlay).toBeHidden();
});

test("Mobile navbar exposes the same search popup", async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(baseUrl);
  await page.getByRole("searchbox", { name: "Search" }).fill("salmon");

  const result = page
    .getByRole("link", { name: /Air Fryer Teriyaki Salmon/ })
    .first();
  await expect(result).toBeVisible();

  await page.screenshot({
    path: testInfo.outputPath("mobile-search-results.png"),
    fullPage: true,
  });
});
