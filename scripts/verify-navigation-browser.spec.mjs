import { expect, test } from "@playwright/test";

import { baseUrl } from "./browser-target.mjs";

async function tabTo(page, target) {
  for (let index = 0; index < 12; index++) {
    await page.keyboard.press("Tab");
    if (
      await target.evaluate((element) => element === document.activeElement)
    ) {
      return;
    }
  }
  await expect(target).toBeFocused();
}

for (const language of ["en", "he"]) {
  const homeUrl = `${baseUrl}${language === "he" ? "he/" : ""}`;
  const triggerName = language === "he" ? "פתיחת ניווט" : "Toggle navigation";

  for (const width of [360, 390, 880]) {
    test(`${language} ${width}: keyboard opens, follows links, and closes the drawer`, async ({
      page,
    }, testInfo) => {
      await page.setViewportSize({ width, height: 844 });
      await page.goto(homeUrl);
      const trigger = page.getByRole("button", { name: triggerName });
      const navigation = page.locator("#main-navigation");
      const links = navigation.getByRole("link");

      await expect(trigger).toHaveAttribute("aria-controls", "main-navigation");
      await expect(trigger).toHaveAttribute("aria-expanded", "false");
      await expect(navigation).toBeHidden();
      await page.locator(".brand").focus();
      await tabTo(page, trigger);
      await expect(trigger).toBeVisible();
      expect(
        await trigger.evaluate((element) => {
          const style = getComputedStyle(element);
          return (
            element.matches(":focus-visible") &&
            style.outlineStyle !== "none" &&
            parseFloat(style.outlineWidth) >= 2
          );
        }),
      ).toBe(true);
      await page.screenshot({ path: testInfo.outputPath("trigger-focus.png") });

      await page.keyboard.press("Enter");
      await expect(trigger).toHaveAttribute("aria-expanded", "true");
      await expect(navigation).toBeVisible();
      await expect(links.first()).toBeFocused();
      await page.keyboard.press("Tab");
      await expect(links.nth(1)).toBeFocused();
      await page.screenshot({ path: testInfo.outputPath("drawer-open.png") });
      await page.keyboard.press("Escape");
      await expect(navigation).toBeHidden();
      await expect(trigger).toBeFocused();
      await expect(trigger).toHaveAttribute("aria-expanded", "false");

      await page.keyboard.press("Space");
      await expect(links.first()).toBeFocused();
      const destination = await links.first().getAttribute("href");
      await page.keyboard.press("Enter");
      await expect(page).toHaveURL(new URL(destination, homeUrl).href);
      await expect(navigation).toBeHidden();
      await expect(trigger).toHaveAttribute("aria-expanded", "false");
      await expect(trigger).toBeFocused();
    });
  }

  test(`${language}: pointer, search, hash opening, and breakpoint focus remain usable`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(homeUrl);
    const trigger = page.getByRole("button", { name: triggerName });
    const navigation = page.locator("#main-navigation");
    const links = navigation.getByRole("link");
    const search = page.getByRole("searchbox");

    await trigger.click();
    await expect(navigation).toBeVisible();
    await expect(search).toBeVisible();
    await expect(
      page.locator(".mobile-actions .language-picker"),
    ).toBeVisible();
    await trigger.click();
    await expect(navigation).toBeHidden();
    await expect(trigger).toBeFocused();
    await trigger.click();
    const destination = await links.first().getAttribute("href");
    await links.first().click();
    await expect(page).toHaveURL(new URL(destination, homeUrl).href);
    await expect(navigation).toBeHidden();

    await trigger.click();
    await search.click();
    await expect(navigation).toBeHidden();
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await search.press("Escape");
    await expect(trigger).toBeVisible();

    await page.goto("about:blank");
    await page.goto(`${homeUrl}#nav-open`);
    await expect(navigation).toBeVisible();
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await page.keyboard.press("Escape");
    await expect(trigger).toBeFocused();
    await page.setViewportSize({ width: 881, height: 844 });
    await expect(trigger).toBeHidden();
    await expect(links.first()).toBeFocused();
    await expect(navigation).toBeVisible();
    await page.setViewportSize({ width: 880, height: 844 });
    await expect(navigation).toBeHidden();
    await expect(trigger).toBeFocused();

    await trigger.press("Enter");
    for (let index = 0; index < (await links.count()); index++) {
      await page.keyboard.press("Tab");
    }
    await expect(search).toBeFocused();
    await expect(navigation).toBeHidden();
  });

  for (const width of [881, 1280]) {
    test(`${language} ${width}: desktop Tab order has visible navigation and no mobile trigger`, async ({
      page,
    }, testInfo) => {
      await page.setViewportSize({ width, height: 844 });
      await page.goto(homeUrl);
      await expect(page.locator(".menu-button")).toBeHidden();
      await expect(page.getByRole("checkbox")).toHaveCount(0);
      await page.locator(".brand").focus();
      const links = page.locator("#main-navigation a");
      for (const link of await links.all()) {
        await page.keyboard.press("Tab");
        await expect(link).toBeFocused();
        await expect(link).toBeVisible();
      }
      await page.screenshot({
        path: testInfo.outputPath("desktop-navigation.png"),
      });
      await page.keyboard.press("Tab");
      await expect(page.getByRole("searchbox")).toBeFocused();
      const languageLink = page.locator(".desktop-language-picker a");
      await tabTo(page, languageLink);
      await page.keyboard.press("Tab");
      expect(
        await page
          .locator(".site-header")
          .evaluate((header) => header.contains(document.activeElement)),
      ).toBe(false);
    });
  }
}
