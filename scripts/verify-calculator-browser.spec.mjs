import { expect, test } from "@playwright/test";
import { calculatePoolish } from "../src/lib/poolishCalculator.ts";

const baseUrl =
  process.env.CALCULATOR_BASE_URL ?? "http://127.0.0.1:4323/recipe-grams/";
const defaults = {
  desiredDough: "1700",
  hydration: "0.7",
  poolishShare: "0.667",
  poolishHydration: "1",
  poolishYeast: "0.013",
  restYeast: "0",
  salt: "0.027",
  pizzaCount: "3",
};

test("rejects nonfinite inputs, overflow, and impossible rounded splits", () => {
  for (const field of Object.keys(defaults).filter(
    (field) => field !== "pizzaCount",
  )) {
    for (const value of [
      "",
      " ",
      "NaN",
      "Infinity",
      "-Infinity",
      "1e309",
      "-0.01",
    ]) {
      expect(
        calculatePoolish("generic", { ...defaults, [field]: value }).ok,
        `${field}=${value}`,
      ).toBe(false);
    }
  }
  expect(
    calculatePoolish("generic", {
      ...defaults,
      desiredDough: "1e308",
      salt: "1e308",
    }).ok,
  ).toBe(false);
  expect(
    calculatePoolish("generic", {
      ...defaults,
      desiredDough: "1",
      hydration: "0.5",
      poolishShare: "0.5",
    }).ok,
  ).toBe(false);
});

for (const language of ["en", "he"]) {
  test.describe(language, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${baseUrl}${language === "he" ? "he/" : ""}poolish/`);
      await expect(page.locator('[data-output="totalFlour"]')).toContainText(
        "1000",
      );
    });

    for (const [field, value] of [
      ["salt", "-0.027"],
      ["restYeast", "-0.01"],
      ["desiredDough", "0"],
      ["poolishShare", "1.01"],
      ...Object.keys(defaults)
        .filter((field) => field !== "pizzaCount")
        .map((field) => [field, ""]),
    ]) {
      test(`rejects ${field}=${value} and recovers`, async ({ page }) => {
        const input = page.locator(`[data-field="${field}"]`);
        const original = await input.inputValue();
        await input.fill(value);
        await expect(page.locator("[data-validation-message]")).not.toBeEmpty();
        await expect(page.locator("[data-copy-button]")).toBeDisabled();
        await expect(page.locator('[data-output="totalFlour"]')).toHaveText(
          "—",
        );
        await input.fill(original);
        await expect(page.locator("[data-validation-message]")).toBeEmpty();
        await expect(page.locator("[data-copy-button]")).toBeEnabled();
        await expect(page.locator('[data-output="totalFlour"]')).toContainText(
          "1000",
        );
      });
    }

    test("rejects impossible water splits and restores valid quantities", async ({
      page,
    }) => {
      await page.locator('[data-field="hydration"]').fill("0.5");
      await page.locator('[data-field="poolishShare"]').fill("1");
      await expect(page.locator("[data-validation-message]")).toContainText(
        language === "en" ? "Poolish water exceeds" : "כמות המים בפוליש גדולה",
      );
      await expect(page.locator("[data-copy-button]")).toBeDisabled();
      await expect(page.locator('[data-output="restWater"]')).toHaveText("—");
      await page.locator('[data-field="poolishShare"]').fill("0.5");
      await expect(page.locator("[data-validation-message]")).toBeEmpty();
      await expect(page.locator("[data-copy-button]")).toBeEnabled();
      await expect(page.locator('[data-output="restWater"]')).toHaveText(
        language === "en" ? "0g" : "0 גרם",
      );
    });

    test("preserves default and pizza quantities, zero ratios, and minimum yeast", async ({
      page,
    }) => {
      const unit = language === "en" ? "g" : " גרם";
      const expectOutputs = async (values) => {
        for (const [name, value] of Object.entries(values)) {
          await expect(page.locator(`[data-output="${name}"]`)).toHaveText(
            `${value}${unit}`,
          );
        }
      };
      await expectOutputs({
        totalFlour: 1000,
        totalWater: 700,
        targetDough: 1700,
        poolishFlour: 667,
        poolishWater: 667,
        poolishYeast: 9,
        restFlour: 333,
        restWater: 33,
        restYeast: 0,
        salt: "27.0",
      });
      expect(
        await page
          .locator('[data-field="poolishShare"]')
          .evaluate((input) => input.validity.stepMismatch),
      ).toBe(false);
      await page.locator('[data-field="poolishYeast"]').fill("0");
      await page.locator('[data-field="salt"]').fill("0");
      await expectOutputs({ poolishYeast: 3, salt: "0.0" });
      await page
        .locator(".mode-switch label")
        .filter({ hasText: language === "en" ? "Pizza preset" : "פריסט פיצה" })
        .click();
      await expectOutputs({
        totalFlour: 500,
        totalWater: 350,
        targetDough: 850,
        poolishFlour: 333,
        poolishWater: 333,
        poolishYeast: 4,
        restFlour: 167,
        restWater: 17,
        restYeast: 0,
        salt: "13.5",
      });
      for (const value of ["", "0", "-1", "1.5"]) {
        await page.locator('[data-field="pizzaCount"]').fill(value);
        await expect(page.locator("[data-copy-button]")).toBeDisabled();
        await expect(page.locator("[data-validation-message]")).not.toBeEmpty();
      }
      await page.locator('[data-field="pizzaCount"]').fill("1");
      await expect(page.locator("[data-copy-button]")).toBeEnabled();
      await expectOutputs({ targetDough: 283, poolishYeast: 3 });
    });

    test("copies current localized weights and cannot copy invalid results", async ({
      page,
      context,
    }) => {
      await context.grantPermissions(["clipboard-read", "clipboard-write"]);
      const copy = page.locator("[data-copy-button]");
      await copy.click();
      const original = await page.evaluate(() =>
        navigator.clipboard.readText(),
      );
      expect(original).toBe(
        language === "en"
          ? "Poolish:\nFlour: 667g\nWater: 667g\nYeast: 9g\n\nFinal dough:\nFlour: 333g\nWater: 33g\nYeast: 0g\nSalt: 27.0g"
          : "פוליש:\nקמח: 667 גרם\nמים: 667 גרם\nשמרים: 9 גרם\n\nבצק סופי:\nקמח: 333 גרם\nמים: 33 גרם\nשמרים: 0 גרם\nמלח: 27.0 גרם",
      );
      await page.locator('[data-field="desiredDough"]').fill("0");
      await expect(copy).toBeDisabled();
      await expect(page.locator("[data-copy-status]")).toBeEmpty();
      await copy.dispatchEvent("click");
      expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
        original,
      );
      await page.locator('[data-field="desiredDough"]').fill("850");
      await copy.click();
      await expect(page.locator("[data-copy-status]")).toHaveText(
        language === "en" ? "Copied" : "הועתק",
      );
      const updated = await page.evaluate(() => navigator.clipboard.readText());
      expect(updated).not.toBe(original);
      expect(updated).toContain(
        language === "en" ? "Salt: 13.5g" : "מלח: 13.5 גרם",
      );
    });

    test("clears delayed copy feedback after an invalid edit", async ({
      page,
    }) => {
      await page.evaluate(() => {
        window.finishCalculatorCopy = null;
        Object.defineProperty(navigator, "clipboard", {
          configurable: true,
          value: {
            writeText: () =>
              new Promise((resolve) => {
                window.finishCalculatorCopy = resolve;
              }),
          },
        });
      });
      await page.locator("[data-copy-button]").click();
      await page.locator('[data-field="salt"]').fill("-0.027");
      await page.evaluate(() => window.finishCalculatorCopy());
      await expect(page.locator("[data-copy-status]")).toBeEmpty();
      await expect(page.locator("[data-copy-button]")).toBeDisabled();
    });

    test("shows copy failure and keeps validation usable on desktop and mobile", async ({
      page,
    }, testInfo) => {
      await page.evaluate(() =>
        Object.defineProperty(navigator, "clipboard", {
          configurable: true,
          value: undefined,
        }),
      );
      await page.locator("[data-copy-button]").click();
      await expect(page.locator("[data-copy-status]")).toHaveText(
        language === "en" ? "Copy failed" : "ההעתקה נכשלה",
      );
      for (const width of [1280, 390]) {
        await page.setViewportSize({ width, height: 900 });
        await page.screenshot({
          path: testInfo.outputPath(`${language}-${width}-valid.png`),
          fullPage: true,
        });
        await page.locator('[data-field="salt"]').fill("-0.027");
        await expect(page.locator("[data-validation-message]")).toBeVisible();
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= window.innerWidth,
          ),
        ).toBe(true);
        await page.screenshot({
          path: testInfo.outputPath(`${language}-${width}-invalid.png`),
          fullPage: true,
        });
        await page.locator('[data-field="salt"]').fill("0.027");
      }
    });
  });
}
