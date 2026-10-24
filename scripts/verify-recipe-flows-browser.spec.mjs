import { expect, test } from "@playwright/test";

import { baseUrl } from "./browser-target.mjs";

test("English landing card opens a generated recipe page", async ({ page }) => {
  await page.goto(baseUrl);
  await page.getByRole("link", { name: "Open Rice Pilaf" }).click();

  await expect(page).toHaveURL(`${baseUrl}en/rice_pilaf/`);
  await expect(page.getByRole("heading", { name: "Rice Pilaf" })).toBeVisible();
});

for (const [language, path] of [
  ["en", ""],
  ["he", "he/"],
]) {
  for (const width of [390, 1280]) {
    test(`${language} ${width} landing cards keep their layout as images load`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 844 });
      let releaseImages;
      const imagesReady = new Promise((resolve) => {
        releaseImages = resolve;
      });
      await page.route("**/images/**", async (route) => {
        await imagesReady;
        await route.continue();
      });
      await page.goto(`${baseUrl}${path}`, { waitUntil: "domcontentloaded" });
      await expect(page.locator(".recipe-card").first()).toBeVisible();
      await expect(page.locator(".card-meta, .card-category")).toHaveCount(0);

      const images = page.locator(".recipe-card img");
      await images.evaluateAll((images) => {
        for (const image of images) image.loading = "eager";
      });
      const measureCards = () =>
        page.locator(".recipe-grid").evaluateAll((grids) =>
          grids.map((grid) => {
            const cards = [...grid.querySelectorAll(".recipe-card")];
            return {
              imageRatios: cards.map((card) => {
                const box = card.querySelector("a > img, .image-placeholder");
                const { width, height } = box.getBoundingClientRect();
                return width / height;
              }),
              titleTops: cards.map((card) =>
                Math.round(
                  card.querySelector("h4").getBoundingClientRect().top -
                    card.getBoundingClientRect().top,
                ),
              ),
              cardTops: cards.map((card) => card.getBoundingClientRect().top),
            };
          }),
        );
      const rows = await measureCards();
      releaseImages();
      await images.evaluateAll((images) =>
        Promise.all(images.map((image) => image.decode())),
      );
      for (const { imageRatios, titleTops } of rows) {
        for (const ratio of imageRatios) expect(ratio).toBeCloseTo(1.5, 1);
        expect(new Set(titleTops).size).toBe(1);
      }
      expect(await measureCards()).toEqual(rows);
    });
  }
}

test("Recipe language switch preserves a shared fragment", async ({ page }) => {
  await page.goto(`${baseUrl}en/pizza_dough/#nerd-stats`);
  await page.locator(".desktop-language-picker a").click();

  await expect(page).toHaveURL(`${baseUrl}he/pizza_dough/#nerd-stats`);
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.locator("#nerd-stats")).toHaveCount(1);
  await expect(page.getByRole("heading", { name: "לחנונים" })).toBeVisible();
});

test("Internal Markdown recipe links resolve to generated pages", async ({
  page,
}) => {
  await page.goto(`${baseUrl}en/rice_pilaf/`);
  await page
    .getByRole("link", { name: "Grilled Chicken Thighs" })
    .first()
    .click();

  await expect(page).toHaveURL(`${baseUrl}en/grilled_chicken_thighs/`);
  await expect(
    page.getByRole("heading", { name: "Grilled Chicken Thighs" }),
  ).toBeVisible();
});

test("Mobile drawer navigation and image assets work", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${baseUrl}he/`);
  await page.getByLabel("פתיחת ניווט").click();
  await page
    .getByRole("navigation", { name: "ניווט ראשי" })
    .getByRole("link", { name: "עיקריות", exact: true })
    .click();

  await expect(page).toHaveURL(`${baseUrl}he/#mains`);
  await page.goto(`${baseUrl}en/pizza_dough/`);

  const pizzaImage = page.getByRole("img", { name: "Pizza" }).first();
  await expect(pizzaImage).toBeVisible();
  await expect(pizzaImage).toHaveJSProperty("complete", true);
  expect(
    await pizzaImage.evaluate((image) => image.naturalWidth),
  ).toBeGreaterThan(0);
});
