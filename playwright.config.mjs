import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./scripts",
  testMatch: "**/*-browser.spec.mjs",
  outputDir: ".astro/verification/browser",
  reporter: "line",
  workers: 2,
  use: {
    browserName: "chromium",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
});
