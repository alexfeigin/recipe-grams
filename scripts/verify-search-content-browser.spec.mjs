// What search finds: indexed body terms, the category a result shows, and the
// recipe each result opens, in both languages. How search behaves — expansion,
// short queries, dismissal, keyboard focus, failure and retry — is owned by
// scripts/verify-search-browser.spec.mjs, and the Pagefind build artifacts by
// scripts/verify-search-index.mjs, so this suite also runs against a published
// site with no local build.
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
