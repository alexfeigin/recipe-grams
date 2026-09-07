// Verification supplies the URL of its own preview. Focused/live runs must
// explicitly select a target; never silently use a developer's running server.
if (!process.env.SITE_BASE_URL) {
  throw new Error(
    "No browser target. Run npm run verify, or set SITE_BASE_URL for a focused browser check.",
  );
}

const target = new URL(process.env.SITE_BASE_URL);
if (!/^https?:$/.test(target.protocol) || !target.pathname.endsWith("/")) {
  throw new Error("SITE_BASE_URL must be an HTTP(S) URL ending in /.");
}
export const baseUrl = target.href;
