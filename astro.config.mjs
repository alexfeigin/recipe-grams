// @ts-check
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  site: "https://alexfeigin.github.io",
  base: "/recipe-grams",
  output: "static",
  integrations: [sitemap()],
});
