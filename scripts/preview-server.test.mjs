import assert from "node:assert/strict";
import { createServer } from "node:http";
import { test } from "node:test";
import { withPreview } from "./preview-server.mjs";

test("an occupied port fails without using or stopping its server", async () => {
  let requests = 0;
  const unrelated = createServer((_request, response) => {
    requests++;
    response.end("unrelated preview");
  });
  await new Promise((resolve) => unrelated.listen(0, "127.0.0.1", resolve));
  const port = unrelated.address().port;
  try {
    await assert.rejects(
      withPreview(() => assert.fail("Must not run checks"), { port }),
      /already in use|EADDRINUSE/,
    );
    assert.equal(requests, 0);
    const response = await fetch(`http://127.0.0.1:${port}`);
    assert.equal(await response.text(), "unrelated preview");
  } finally {
    await new Promise((resolve) => unrelated.close(resolve));
  }
});

for (const fail of [false, true]) {
  test(`owns a fresh preview and closes it after ${fail ? "failure" : "success"}`, async () => {
    let baseUrl;
    const run = withPreview(async (url) => {
      baseUrl = url;
      const response = await fetch(`${url}pagefind/pagefind-entry.json`);
      assert.equal(response.status, 200);
      assert.ok(await response.json());
      if (fail) throw new Error("browser check failed");
    });
    if (fail) await assert.rejects(run, /browser check failed/);
    else await run;
    await assert.rejects(
      fetch(baseUrl, { signal: AbortSignal.timeout(1_000) }),
    );
  });
}
