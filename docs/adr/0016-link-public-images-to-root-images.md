# Link public images to root images

The Astro project should expose existing recipe images through the site without maintaining duplicate image copies. A link from Astro's public asset path to the root `images/` directory is preferred so Markdown compatibility and built site assets share the same source files.

Superseded by [0024 — Serve site images directly from the root image directory](0024-serve-site-images-directly-from-the-root-image-directory.md). No link is maintained; Astro's public asset directory is configured as the root `images/` directory itself.
