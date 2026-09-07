import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import { preview } from "astro";

export async function withPreview(check, { port = 0 } = {}) {
  const token = randomUUID();
  const server = await preview({
    root: fileURLToPath(new URL("../", import.meta.url)),
    logLevel: "silent",
    server: {
      host: "127.0.0.1",
      port,
      open: false,
      headers: { "X-Recipe-Grams-Verification": token },
    },
    vite: { preview: { strictPort: true } },
  });

  try {
    const baseUrl = `http://127.0.0.1:${server.port}/recipe-grams/`;
    const response = await fetch(baseUrl, {
      signal: AbortSignal.timeout(10_000),
    });
    if (
      !response.ok ||
      response.headers.get("X-Recipe-Grams-Verification") !== token
    ) {
      throw new Error(`Verification preview is unavailable at ${baseUrl}`);
    }
    await response.arrayBuffer();
    return await check(baseUrl);
  } finally {
    await server.stop();
  }
}
