// @ts-check
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import robotsTxt from "astro-robots-txt";

export default defineConfig({
  site: "https://alexfeigin.github.io",
  base: "/recipe-grams",
  output: "static",
  publicDir: "./images",
  integrations: [
    sitemap({
      filter: (page) => !page.endsWith("/google897e637a154db3cd.html"),
    }),
    robotsTxt(),
  ],
});
