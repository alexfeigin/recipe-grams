// @ts-check
import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://alexfeigin.github.io",
  base: "/recipe-grams",
  output: "static",
  publicDir: "./images",
});
