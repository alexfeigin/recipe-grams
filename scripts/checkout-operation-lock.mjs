import { randomUUID } from "node:crypto";
import { mkdir, open, readFile, unlink } from "node:fs/promises";
import path from "node:path";

const lockFilename = "checkout-operation.lock";

function lockError(lockPath, owner) {
  const detail = owner?.purpose
    ? ` (${owner.purpose}, pid ${owner.pid ?? "unknown"})`
    : "";
  return new Error(
    `Another verification or publication owns this checkout${detail}. ` +
      `Wait for it to finish. If it was interrupted, confirm no such process is running, then remove ${lockPath}.`,
  );
}

async function readOwner(lockPath) {
  try {
    return JSON.parse(await readFile(lockPath, "utf8"));
  } catch {
    return undefined;
  }
}

export async function acquireCheckoutOperationLock(
  checkoutRoot,
  {
    purpose,
    inheritedToken,
    lockDirectory = path.join(checkoutRoot, ".astro"),
  } = {},
) {
  const lockPath = path.join(lockDirectory, lockFilename);
  await mkdir(lockDirectory, { recursive: true });

  if (inheritedToken) {
    const owner = await readOwner(lockPath);
    if (owner?.token !== inheritedToken) throw lockError(lockPath, owner);
    return { token: inheritedToken, release: async () => {} };
  }

  const token = randomUUID();
  let handle;
  try {
    handle = await open(lockPath, "wx");
  } catch (error) {
    if (error.code === "EEXIST")
      throw lockError(lockPath, await readOwner(lockPath));
    throw error;
  }

  try {
    await handle.writeFile(
      `${JSON.stringify({ purpose, pid: process.pid, startedAt: new Date().toISOString(), token })}\n`,
    );
  } finally {
    await handle.close();
  }

  let released = false;
  return {
    token,
    async release() {
      if (released) return;
      released = true;
      const owner = await readOwner(lockPath);
      if (owner?.token === token) await unlink(lockPath);
    },
  };
}
