import { expect, test } from "@playwright/test";

const baseUrl = "http://127.0.0.1:4321/recipe-grams/";
const screenshotDir = "docs/verification/issue-7-screenshots";

test("English landing card opens a generated recipe page", async ({ page }) => {
  await page.goto(baseUrl);
  await page.getByRole("link", { name: "Open Rice Pilaf" }).click();

  await expect(page).toHaveURL(`${baseUrl}en/rice_pilaf/`);
  await expect(page.getByRole("heading", { name: "Rice Pilaf" })).toBeVisible();
  await page.screenshot({
    path: `${screenshotDir}/en-card-to-recipe.png`,
    fullPage: true,
  });
});

test("Recipe language switch opens the matching localized recipe", async ({
  page,
}) => {
  await page.goto(`${baseUrl}en/rice_pilaf/`);
  await page.getByLabel("Language").getByRole("link", { name: "עב" }).click();

  await expect(page).toHaveURL(`${baseUrl}he/rice_pilaf/`);
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.getByRole("heading", { name: "פילאף אורז" })).toBeVisible();
  await page.screenshot({
    path: `${screenshotDir}/recipe-language-switch.png`,
    fullPage: true,
  });
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
  await page.screenshot({
    path: `${screenshotDir}/internal-link-flow.png`,
    fullPage: true,
  });
});

test("Mobile drawer navigation and image assets work", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${baseUrl}he/`);
  await page.getByLabel("פתיחת ניווט").click();
  await page.getByRole("link", { name: "עיקריות" }).click();

  await expect(page).toHaveURL(`${baseUrl}he/#mains`);
  await page.goto(`${baseUrl}en/pizza_dough/`);

  const pizzaImage = page.getByRole("img", { name: "Pizza" }).first();
  await expect(pizzaImage).toBeVisible();
  await expect(pizzaImage).toHaveJSProperty("complete", true);
  expect(
    await pizzaImage.evaluate((image) => image.naturalWidth),
  ).toBeGreaterThan(0);

  await page.screenshot({
    path: `${screenshotDir}/mobile-drawer-and-image.png`,
    fullPage: true,
  });
});
