import { expect, test } from "@playwright/test";

const baseUrl =
  process.env.CONTRAST_BASE_URL ?? "http://127.0.0.1:4324/recipe-grams/";

async function contrast(locator) {
  return locator.evaluate((element) => {
    const context = document.createElement("canvas").getContext("2d");
    function rgba(color) {
      context.clearRect(0, 0, 1, 1);
      context.fillStyle = color;
      context.fillRect(0, 0, 1, 1);
      return [...context.getImageData(0, 0, 1, 1).data];
    }
    function composite(front, back) {
      return front
        .slice(0, 3)
        .map((v, i) => v * (front[3] / 255) + back[i] * (1 - front[3] / 255));
    }
    const ancestors = [];
    for (let node = element; node; node = node.parentElement) {
      ancestors.unshift(node);
    }
    let background = [255, 255, 255];
    for (const node of ancestors) {
      background = composite(
        rgba(getComputedStyle(node).backgroundColor),
        background,
      );
    }
    const style = getComputedStyle(element);
    const foreground = composite(rgba(style.color), background);
    function luminance(rgb) {
      return rgb
        .map((value) => {
          const channel = value / 255;
          return channel <= 0.04045
            ? channel / 12.92
            : ((channel + 0.055) / 1.055) ** 2.4;
        })
        .reduce(
          (sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index],
          0,
        );
    }
    const values = [luminance(foreground), luminance(background)];
    return {
      foreground: style.color,
      background: style.backgroundColor,
      ratio: (Math.max(...values) + 0.05) / (Math.min(...values) + 0.05),
    };
  });
}

for (const language of ["en", "he"]) {
  for (const width of [390, 1280]) {
    for (const surface of ["home", "recipe", "calculator"]) {
      test(`${language} ${width} ${surface}: control text contrast`, async ({
        page,
      }, testInfo) => {
        await page.setViewportSize({ width, height: 844 });
        const prefix = language === "he" ? "he/" : "";
        const path =
          surface === "home"
            ? prefix
            : surface === "recipe"
              ? `${language}/pizza_dough/`
              : `${prefix}poolish/`;
        await page.goto(`${baseUrl}${path}`);
        const measurements = [];
        async function check(locator, state) {
          await expect(locator).toBeVisible();
          const result = await contrast(locator);
          measurements.push({ state, ...result });
          expect
            .soft(result.ratio, `${state}: ${JSON.stringify(result)}`)
            .toBeGreaterThanOrEqual(4.5);
        }
        if (width < 881) await page.locator(".menu-button").click();
        const picker = page.locator(
          width < 881
            ? ".mobile-actions .language-picker"
            : ".desktop-language-picker",
        );
        await check(
          picker.locator('[aria-current="page"]'),
          "selected language",
        );
        const alternate = picker.locator("a");
        await check(alternate, "alternate language default");
        await alternate.hover();
        await check(alternate, "alternate language hover");
        await page.mouse.move(0, 0);
        await page.keyboard.press("Shift");
        await alternate.focus();
        await check(alternate, "alternate language focus");
        await page.screenshot({
          path: testInfo.outputPath("language-controls.png"),
        });
        if (width < 881) await page.keyboard.press("Escape");

        if (surface === "calculator") {
          for (const mode of ["generic", "pizza"]) {
            const radio = page.locator(`input[name="mode"][value="${mode}"]`);
            await radio.focus();
            await page.keyboard.press("Space");
            await expect(radio).toBeChecked();
            const selected = page.locator(".mode-switch input:checked + span");
            await check(selected, `${mode} selected focus`);
            await page.keyboard.press("Tab");
            await check(selected, `${mode} selected default`);
            await selected.locator("..").hover();
            await check(selected, `${mode} selected hover`);
          }
          const copy = page.locator(".copy-button");
          await expect(copy).toBeEnabled();
          await page.mouse.move(0, 0);
          await check(copy, "copy default");
          await copy.hover();
          await check(copy, "copy hover");
          await page.mouse.move(0, 0);
          await page.keyboard.press("Shift");
          await copy.focus();
          await check(copy, "copy focus");
          await copy.screenshot({
            path: testInfo.outputPath("copy-focus.png"),
          });
          await page
            .locator(".mode-switch")
            .screenshot({ path: testInfo.outputPath("calculator-modes.png") });
        }

        // The short desktop calculator may never scroll far enough to show it.
        if (surface !== "calculator") {
          const backToTop = page.locator(".back-to-top");
          await page.evaluate(() =>
            window.scrollTo(0, document.documentElement.scrollHeight),
          );
          await expect(backToTop).toBeVisible();
          await page.keyboard.press("Shift");
          await backToTop.focus();
          await expect(backToTop).toHaveCSS("opacity", "1");
          await check(backToTop, "back-to-top focus (icon)");
          await backToTop.hover();
          await expect(backToTop).toHaveCSS(
            "transform",
            "matrix(1, 0, 0, 1, 0, -2)",
          );
          await check(backToTop, "back-to-top hover (icon)");
        }
        await testInfo.attach("contrast-measurements", {
          body: JSON.stringify(measurements, null, 2),
          contentType: "application/json",
        });
      });
    }
  }
}
