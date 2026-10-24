// @ts-check
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import { recipeCatalogCheck } from "./src/lib/catalogBuildCheck.ts";

export default defineConfig({
  site: "https://alexfeigin.github.io",
  base: "/recipe-grams",
  output: "static",
  integrations: [recipeCatalogCheck(), sitemap()],
});
