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
