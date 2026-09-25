import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import {
  chmod,
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  realpath,
  rename,
  rm,
  readdir,
  symlink,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { promisify } from "node:util";
import { test } from "node:test";
import {
  managedDestinationPath,
  pagesCloneUrls,
  publishSite,
  replacePublishedSubtree,
} from "./publish-site.mjs";

const exec = promisify(execFile);

async function git(root, ...args) {
  return exec("git", ["-C", root, ...args], { encoding: "utf8" });
}

async function initializeRepository(root) {
  await mkdir(root, { recursive: true });
  await git(root, "init", "--initial-branch=master");
  await git(root, "config", "user.name", "Recipe-Grams Test");
  await git(root, "config", "user.email", "recipe-grams@example.test");
}

async function commitAll(root, message) {
  await git(root, "add", "--all");
  await git(root, "commit", "-m", message);
}

async function setupRepositories(t, { published = "old\n" } = {}) {
  // Spaces exercise arbitrary checkout paths.
  const base = await mkdtemp(path.join(os.tmpdir(), "publish site test "));
  t.after(() => rm(base, { recursive: true, force: true }));
  const source = path.join(base, "source");
  const sourceRemote = path.join(base, "source-remote.git");
  const destination = path.join(base, "destination");
  const destinationRemote = path.join(base, "destination-remote.git");

  await exec("git", [
    "init",
    "--bare",
    "--initial-branch=master",
    sourceRemote,
  ]);
  await initializeRepository(source);
  await writeFile(path.join(source, ".gitignore"), ".astro/\ndist/\n/.pages\n");
  await writeFile(path.join(source, "source.txt"), "committed source\n");
  await commitAll(source, "Initial source");
  await git(source, "remote", "add", "origin", sourceRemote);
  await git(source, "push", "--set-upstream", "origin", "master");

  await exec("git", [
    "init",
    "--bare",
    "--initial-branch=master",
    destinationRemote,
  ]);
  await initializeRepository(destination);
  await mkdir(path.join(destination, "recipe-grams"));
  await writeFile(
    path.join(destination, "recipe-grams", "index.html"),
    published,
  );
  await writeFile(
    path.join(destination, "recipe-grams", "obsolete.txt"),
    "remove me\n",
  );
  await writeFile(path.join(destination, "unrelated.txt"), "preserve me\n");
  await commitAll(destination, "Initial publication");
  await git(destination, "remote", "add", "origin", destinationRemote);
  await git(destination, "push", "--set-upstream", "origin", "master");

  return { base, source, sourceRemote, destination, destinationRemote };
}

function publicationOptions(repositories, overrides = {}) {
  return {
    sourceRoot: repositories.source,
    destination: repositories.destination,
    expectedRemote: repositories.destinationRemote,
    message: "Publish test output",
    log: () => {},
    verify: async ({ sourceRoot }) => {
      await rm(path.join(sourceRoot, "dist"), { recursive: true, force: true });
      await mkdir(path.join(sourceRoot, "dist"));
      await writeFile(path.join(sourceRoot, "dist", "index.html"), "new\n");
    },
    ...overrides,
  };
}

test("publishes the verified active checkout and replaces only the site subtree", async (t) => {
  const repositories = await setupRepositories(t);
  const beforeUnrelated = await readFile(
    path.join(repositories.destination, "unrelated.txt"),
  );

  const result = await publishSite(publicationOptions(repositories));

  assert.equal(result.status, "published");
  assert.equal(
    await readFile(
      path.join(repositories.destination, "recipe-grams", "index.html"),
      "utf8",
    ),
    "new\n",
  );
  await assert.rejects(
    readFile(
      path.join(repositories.destination, "recipe-grams", "obsolete.txt"),
    ),
    { code: "ENOENT" },
  );
  assert.deepEqual(
    await readFile(path.join(repositories.destination, "unrelated.txt")),
    beforeUnrelated,
  );
  assert.equal(
    (await git(repositories.destination, "rev-parse", "HEAD")).stdout.trim(),
    (
      await git(repositories.destinationRemote, "rev-parse", "master")
    ).stdout.trim(),
  );
});

test("does not commit or push when published content already matches", async (t) => {
  const repositories = await setupRepositories(t, { published: "new\n" });
  await rm(path.join(repositories.destination, "recipe-grams", "obsolete.txt"));
  await commitAll(repositories.destination, "Remove obsolete output");
  await git(repositories.destination, "push");
  const before = (
    await git(repositories.destination, "rev-parse", "HEAD")
  ).stdout.trim();

  const result = await publishSite(publicationOptions(repositories));

  assert.equal(result.status, "unchanged");
  assert.equal(
    (await git(repositories.destination, "rev-parse", "HEAD")).stdout.trim(),
    before,
  );
});

test("rejects a destination with the wrong repository identity", async (t) => {
  const repositories = await setupRepositories(t);
  let verified = false;
  await assert.rejects(
    publishSite(
      publicationOptions(repositories, {
        expectedRemote: path.join(repositories.base, "not-the-remote.git"),
        verify: async () => (verified = true),
      }),
    ),
    /Destination origin .* expected/,
  );
  assert.equal(verified, false);
});

test("rejects a destination on the wrong branch", async (t) => {
  const repositories = await setupRepositories(t);
  await git(repositories.destination, "switch", "-c", "preview");
  await assert.rejects(
    publishSite(publicationOptions(repositories)),
    /Destination must be on master; found preview/,
  );
});

test("rejects an unexpected effective push destination before verification", async (t) => {
  const repositories = await setupRepositories(t);
  await git(
    repositories.destination,
    "config",
    "remote.origin.pushurl",
    repositories.sourceRemote,
  );
  let verified = false;
  await assert.rejects(
    publishSite(
      publicationOptions(repositories, {
        verify: async () => {
          verified = true;
        },
      }),
    ),
    /Destination .*push.*expected/,
  );
  assert.equal(verified, false);
});

test("preserves ignored local work inside the published subtree", async (t) => {
  const repositories = await setupRepositories(t);
  await writeFile(
    path.join(repositories.destination, ".git", "info", "exclude"),
    "recipe-grams/local.txt\n",
  );
  await writeFile(
    path.join(repositories.destination, "recipe-grams", "local.txt"),
    "keep my work\n",
  );
  await assert.rejects(
    publishSite(publicationOptions(repositories)),
    /ignored.*recipe-grams\/local.txt/s,
  );
  assert.equal(
    await readFile(
      path.join(repositories.destination, "recipe-grams", "local.txt"),
      "utf8",
    ),
    "keep my work\n",
  );
});

test("includes verified output even when destination ignore rules match it", async (t) => {
  const repositories = await setupRepositories(t);
  await writeFile(
    path.join(repositories.destination, ".git", "info", "exclude"),
    "recipe-grams/new.html\n",
  );
  await publishSite(
    publicationOptions(repositories, {
      verify: async ({ sourceRoot }) => {
        await mkdir(path.join(sourceRoot, "dist"));
        await writeFile(
          path.join(sourceRoot, "dist", "new.html"),
          "verified\n",
        );
      },
    }),
  );
  assert.equal(
    (
      await git(
        repositories.destinationRemote,
        "show",
        "master:recipe-grams/new.html",
      )
    ).stdout,
    "verified\n",
  );
});

test("rejects Git filters that change the verified bytes during staging", async (t) => {
  const repositories = await setupRepositories(t, { published: "OLD\n" });
  await writeFile(
    path.join(repositories.destination, ".gitattributes"),
    "recipe-grams/index.html filter=alter\n",
  );
  await commitAll(repositories.destination, "Configure publication attributes");
  await git(repositories.destination, "push");
  await git(
    repositories.destination,
    "config",
    "filter.alter.clean",
    "tr a-z A-Z",
  );
  const initial = (
    await git(repositories.destinationRemote, "rev-parse", "master")
  ).stdout.trim();
  await assert.rejects(
    publishSite(publicationOptions(repositories)),
    /Staged site does not exactly match/,
  );
  assert.equal(
    (
      await git(repositories.destinationRemote, "rev-parse", "master")
    ).stdout.trim(),
    initial,
  );
});

test("publishes a linked source worktree with binary files and executable modes intact", async (t) => {
  const repositories = await setupRepositories(t);
  const worktree = path.join(repositories.base, "linked-source");
  await git(repositories.source, "worktree", "add", "-b", "release", worktree);
  await git(worktree, "push", "--set-upstream", "origin", "release");
  await mkdir(path.join(repositories.source, "dist"));
  await writeFile(
    path.join(repositories.source, "dist", "index.html"),
    "primary checkout\n",
  );
  const binary = Buffer.from([0, 255, 128, 10]);
  const result = await publishSite(
    publicationOptions(repositories, {
      sourceRoot: worktree,
      verify: async ({ sourceRoot }) => {
        assert.equal(sourceRoot, await realpath(worktree));
        await mkdir(path.join(sourceRoot, "dist", "nested"), {
          recursive: true,
        });
        await writeFile(
          path.join(sourceRoot, "dist", "nested", "image.bin"),
          binary,
        );
        await writeFile(
          path.join(sourceRoot, "dist", "run me.sh"),
          "#!/bin/sh\nexit 0\n",
          { mode: 0o755 },
        );
      },
    }),
  );
  assert.equal(result.status, "published");
  assert.equal(
    await readFile(
      path.join(repositories.source, "dist", "index.html"),
      "utf8",
    ),
    "primary checkout\n",
  );
  const committed = await exec(
    "git",
    [
      "-C",
      repositories.destinationRemote,
      "show",
      "master:recipe-grams/nested/image.bin",
    ],
    { encoding: "buffer" },
  );
  assert.deepEqual(committed.stdout, binary);
  assert.match(
    (
      await git(
        repositories.destinationRemote,
        "ls-tree",
        "master",
        "recipe-grams/run me.sh",
      )
    ).stdout,
    /^100755 blob/,
  );
});

test("does not push output changed by a commit hook", async (t) => {
  const repositories = await setupRepositories(t);
  const hook = path.join(
    repositories.destination,
    ".git",
    "hooks",
    "pre-commit",
  );
  await writeFile(
    hook,
    "#!/bin/sh\nprintf 'hook changed output\\n' > recipe-grams/index.html\ngit add recipe-grams/index.html\n",
  );
  await chmod(hook, 0o755);
  const initial = (
    await git(repositories.destinationRemote, "rev-parse", "master")
  ).stdout.trim();
  await assert.rejects(
    publishSite(publicationOptions(repositories)),
    /Publication commit differs from the verified staged tree/,
  );
  assert.equal(
    (
      await git(repositories.destinationRemote, "rev-parse", "master")
    ).stdout.trim(),
    initial,
  );
  assert.notEqual(
    (await git(repositories.destination, "rev-parse", "HEAD")).stdout.trim(),
    initial,
  );
});

test("rejects a deleted source upstream despite its cached tracking reference", async (t) => {
  const repositories = await setupRepositories(t);
  await git(repositories.sourceRemote, "update-ref", "-d", "refs/heads/master");
  let verified = false;
  await assert.rejects(
    publishSite(
      publicationOptions(repositories, {
        verify: async () => {
          verified = true;
        },
      }),
    ),
    /fetch .*failed/,
  );
  assert.equal(verified, false);
});

test("rejects a staged rename that deletes a file outside the site subtree", async (t) => {
  const repositories = await setupRepositories(t);
  const initial = (
    await git(repositories.destination, "rev-parse", "HEAD")
  ).stdout.trim();
  await assert.rejects(
    publishSite(
      publicationOptions(repositories, {
        verify: async ({ sourceRoot }) => {
          await mkdir(path.join(sourceRoot, "dist"));
          await writeFile(
            path.join(sourceRoot, "dist", "index.html"),
            "preserve me\n",
          );
        },
        copy: async (options) => {
          await replacePublishedSubtree(options);
          await rename(
            path.join(repositories.destination, "unrelated.txt"),
            path.join(repositories.destination, "recipe-grams", "index.html"),
          );
          await git(repositories.destination, "add", "--all");
        },
      }),
    ),
    /outside recipe-grams\/.*unrelated.txt/s,
  );
  assert.equal(
    (await git(repositories.destination, "rev-parse", "HEAD")).stdout.trim(),
    initial,
  );
});

test("serializes publication from different source checkouts into one destination", async (t) => {
  const repositories = await setupRepositories(t);
  const otherSource = path.join(repositories.base, "other-source");
  await exec("git", ["clone", repositories.sourceRemote, otherSource]);
  let release;
  const held = new Promise((resolve) => {
    release = resolve;
  });
  let started;
  const ready = new Promise((resolve) => {
    started = resolve;
  });
  const options = publicationOptions(repositories);
  const first = publishSite({
    ...options,
    verify: async (context) => {
      started();
      await held;
      await options.verify(context);
    },
  });
  await ready;
  try {
    await assert.rejects(
      publishSite({ ...options, sourceRoot: otherSource }),
      /Another .*owns this checkout/,
    );
  } finally {
    release();
    await first;
  }
});

for (const staged of [false, true]) {
  test(`preserves ${staged ? "staged" : "unstaged"} destination work`, async (t) => {
    const repositories = await setupRepositories(t);
    await writeFile(
      path.join(repositories.destination, "unrelated.txt"),
      "unfinished\n",
    );
    if (staged) await git(repositories.destination, "add", "unrelated.txt");

    await assert.rejects(
      publishSite(publicationOptions(repositories)),
      /Destination checkout has uncommitted or staged work/,
    );
    assert.equal(
      await readFile(
        path.join(repositories.destination, "unrelated.txt"),
        "utf8",
      ),
      "unfinished\n",
    );
  });
}

test("stops when the destination cannot fast-forward", async (t) => {
  const repositories = await setupRepositories(t);
  await writeFile(path.join(repositories.destination, "local.txt"), "local\n");
  await commitAll(repositories.destination, "Local destination commit");

  const other = path.join(repositories.base, "other-destination");
  await exec("git", ["clone", repositories.destinationRemote, other]);
  await git(other, "config", "user.name", "Recipe-Grams Test");
  await git(other, "config", "user.email", "recipe-grams@example.test");
  await writeFile(path.join(other, "remote.txt"), "remote\n");
  await commitAll(other, "Remote destination commit");
  await git(other, "push");

  await assert.rejects(
    publishSite(publicationOptions(repositories)),
    /could not fast-forward/,
  );
  assert.equal(
    await readFile(path.join(repositories.destination, "local.txt"), "utf8"),
    "local\n",
  );
});

test("requires clean, pushed source state", async (t) => {
  const repositories = await setupRepositories(t);
  await writeFile(path.join(repositories.source, "source.txt"), "dirty\n");
  await assert.rejects(
    publishSite(publicationOptions(repositories)),
    /Source checkout has uncommitted or staged work/,
  );

  await git(repositories.source, "restore", "source.txt");
  await writeFile(path.join(repositories.source, "source.txt"), "unpushed\n");
  await commitAll(repositories.source, "Unpushed source");
  await assert.rejects(
    publishSite(publicationOptions(repositories)),
    /not exactly at its upstream revision/,
  );
});

test("source changes during verification prevent copying", async (t) => {
  const repositories = await setupRepositories(t);
  await assert.rejects(
    publishSite(
      publicationOptions(repositories, {
        verify: async ({ sourceRoot }) => {
          await mkdir(path.join(sourceRoot, "dist"));
          await writeFile(path.join(sourceRoot, "dist", "index.html"), "new\n");
          await writeFile(path.join(sourceRoot, "source.txt"), "changed\n");
        },
      }),
    ),
    /Source checkout has uncommitted or staged work/,
  );
  assert.equal(
    await readFile(
      path.join(repositories.destination, "recipe-grams", "index.html"),
      "utf8",
    ),
    "old\n",
  );
});

test("overlapping publication cannot take ownership of one checkout", async (t) => {
  const repositories = await setupRepositories(t);
  let verificationStarted;
  const started = new Promise((resolve) => (verificationStarted = resolve));
  let finishVerification;
  const finish = new Promise((resolve) => (finishVerification = resolve));
  const first = publishSite(
    publicationOptions(repositories, {
      verify: async ({ sourceRoot }) => {
        verificationStarted();
        await finish;
        await mkdir(path.join(sourceRoot, "dist"));
        await writeFile(path.join(sourceRoot, "dist", "index.html"), "new\n");
      },
    }),
  );
  await started;

  await assert.rejects(
    publishSite(publicationOptions(repositories)),
    /Another verification or publication owns this checkout/,
  );
  finishVerification();
  assert.equal((await first).status, "published");
});

test("rejects staging outside the published subtree", async (t) => {
  const repositories = await setupRepositories(t);
  await assert.rejects(
    publishSite(
      publicationOptions(repositories, {
        copy: async (options) => {
          await replacePublishedSubtree(options);
          await writeFile(
            path.join(repositories.destination, "unrelated.txt"),
            "intruding change\n",
          );
          await git(repositories.destination, "add", "unrelated.txt");
        },
      }),
    ),
    /changes outside recipe-grams\/.*unrelated\.txt/s,
  );
  assert.match(
    (await git(repositories.destination, "status", "--short")).stdout,
    /unrelated\.txt/,
  );
});

test("verification and copy failures stop before commit", async (t) => {
  const repositories = await setupRepositories(t);
  const initial = (
    await git(repositories.destination, "rev-parse", "HEAD")
  ).stdout.trim();
  await assert.rejects(
    publishSite(
      publicationOptions(repositories, {
        verify: async () => {
          throw new Error("verification exploded");
        },
      }),
    ),
    /verification exploded/,
  );
  assert.equal(
    (await git(repositories.destination, "rev-parse", "HEAD")).stdout.trim(),
    initial,
  );

  await assert.rejects(
    publishSite(
      publicationOptions(repositories, {
        copy: async () => {
          throw new Error("copy exploded");
        },
      }),
    ),
    /copy exploded/,
  );
  assert.equal(
    (await git(repositories.destination, "rev-parse", "HEAD")).stdout.trim(),
    initial,
  );
});

test("a failed commit leaves recoverable staged site work", async (t) => {
  const repositories = await setupRepositories(t);
  const hook = path.join(
    repositories.destination,
    ".git",
    "hooks",
    "pre-commit",
  );
  await writeFile(hook, "#!/bin/sh\nexit 1\n");
  await chmod(hook, 0o755);

  await assert.rejects(
    publishSite(publicationOptions(repositories)),
    /git .* commit .* failed/,
  );
  assert.match(
    (await git(repositories.destination, "diff", "--cached", "--name-only"))
      .stdout,
    /recipe-grams\/index\.html/,
  );
});

test("a rejected push leaves the publication commit visible and does not retry", async (t) => {
  const repositories = await setupRepositories(t);
  const hook = path.join(
    repositories.destinationRemote,
    "hooks",
    "pre-receive",
  );
  await writeFile(hook, "#!/bin/sh\nexit 1\n");
  await chmod(hook, 0o755);
  const remoteBefore = (
    await git(repositories.destinationRemote, "rev-parse", "master")
  ).stdout.trim();

  await assert.rejects(
    publishSite(publicationOptions(repositories)),
    /git .* push .* failed/,
  );
  const localAfter = (
    await git(repositories.destination, "rev-parse", "HEAD")
  ).stdout.trim();
  assert.notEqual(localAfter, remoteBefore);
  assert.equal(
    (
      await git(repositories.destinationRemote, "rev-parse", "master")
    ).stdout.trim(),
    remoteBefore,
  );
});

test("rejects source/destination overlap and a symlinked published subtree", async (t) => {
  const repositories = await setupRepositories(t);
  await assert.rejects(
    publishSite(
      publicationOptions(repositories, { destination: repositories.source }),
    ),
    /Source and destination repositories must be separate paths/,
  );

  await rm(path.join(repositories.destination, "recipe-grams"), {
    recursive: true,
  });
  await symlink(
    "unrelated.txt",
    path.join(repositories.destination, "recipe-grams"),
  );
  await commitAll(repositories.destination, "Malformed subtree");
  await git(repositories.destination, "push");
  await assert.rejects(
    publishSite(publicationOptions(repositories)),
    /Published subtree must be a real directory/,
  );
});

// The managed checkout is cloned from a file:// URL: Git's local-path clone
// optimization would otherwise ignore --depth.
async function setupManagedRepositories(t, options) {
  const repositories = await setupRepositories(t, options);
  // Give the remote history to truncate and a branch the clone should skip.
  await writeFile(
    path.join(repositories.destination, "history.txt"),
    "later\n",
  );
  await commitAll(repositories.destination, "Later destination commit");
  await git(repositories.destination, "push");
  await git(repositories.destination, "push", "origin", "master:preview");
  return {
    ...repositories,
    managed: managedDestinationPath(await realpath(repositories.source)),
  };
}

function managedOptions(repositories, overrides = {}) {
  const options = publicationOptions(repositories, {
    expectedRemote: pathToFileURL(repositories.destinationRemote).href,
    ...overrides,
  });
  delete options.destination;
  return options;
}

function writesSite(content) {
  return async ({ sourceRoot }) => {
    await rm(path.join(sourceRoot, "dist"), { recursive: true, force: true });
    await mkdir(path.join(sourceRoot, "dist"));
    await writeFile(path.join(sourceRoot, "dist", "index.html"), content);
  };
}

async function exists(candidate) {
  try {
    await lstat(candidate);
    return true;
  } catch (error) {
    if (error.code === "ENOENT") return false;
    throw error;
  }
}

async function revision(root, ref = "HEAD") {
  return (await git(root, "rev-parse", ref)).stdout.trim();
}

async function cloneWithIdentity(remote, target) {
  await exec("git", ["clone", "--quiet", remote, target]);
  await git(target, "config", "user.name", "Recipe-Grams Test");
  await git(target, "config", "user.email", "recipe-grams@example.test");
}

async function pushRemoteCommit(repositories, name) {
  const other = path.join(repositories.base, `remote writer ${name}`);
  await cloneWithIdentity(repositories.destinationRemote, other);
  await writeFile(path.join(other, `${name}.txt`), `${name}\n`);
  await commitAll(other, `Remote ${name} commit`);
  await git(other, "push");
  return revision(other);
}

test("creates a shallow single-branch managed clone on first use and reuses it", async (t) => {
  const repositories = await setupManagedRepositories(t);
  assert.equal(await exists(repositories.managed), false);

  const first = await publishSite(managedOptions(repositories));

  assert.equal(first.status, "published");
  assert.equal(
    (
      await git(repositories.managed, "rev-parse", "--is-shallow-repository")
    ).stdout.trim(),
    "true",
  );
  assert.equal(
    (
      await git(repositories.managed, "for-each-ref", "--format=%(refname)")
    ).stdout.trim(),
    "refs/heads/master\nrefs/remotes/origin/master",
  );
  assert.equal(
    (
      await git(
        repositories.managed,
        "rev-parse",
        "--abbrev-ref",
        "@{upstream}",
      )
    ).stdout.trim(),
    "origin/master",
  );
  assert.equal(
    await revision(repositories.destinationRemote, "master"),
    await revision(repositories.managed),
  );
  assert.equal(
    (
      await git(
        repositories.destinationRemote,
        "show",
        "master:recipe-grams/index.html",
      )
    ).stdout,
    "new\n",
  );
  assert.equal(
    (await git(repositories.source, "status", "--porcelain")).stdout,
    "",
  );
  assert.deepEqual(await readdir(path.dirname(repositories.managed)), [
    "alexfeigin.github.io",
  ]);

  await git(repositories.managed, "config", "recipe-grams.reused", "yes");
  const second = await publishSite(
    managedOptions(repositories, { verify: writesSite("newer\n") }),
  );
  assert.equal(second.status, "published");
  assert.equal(
    (
      await git(repositories.managed, "config", "recipe-grams.reused")
    ).stdout.trim(),
    "yes",
  );
  assert.equal(
    await revision(repositories.destinationRemote, "master"),
    second.publicationRevision,
  );
});

test("recreates the managed clone after a clean removes ignored files", async (t) => {
  const repositories = await setupManagedRepositories(t);
  await publishSite(managedOptions(repositories));
  await git(repositories.source, "clean", "-ffdx");
  assert.equal(await exists(repositories.managed), false);

  const result = await publishSite(
    managedOptions(repositories, { verify: writesSite("after clean\n") }),
  );

  assert.equal(result.status, "published");
  assert.equal(
    await revision(repositories.managed),
    await revision(repositories.destinationRemote, "master"),
  );
});

test("publishes each source checkout through its own managed clone", async (t) => {
  const repositories = await setupManagedRepositories(t);
  const otherSource = path.join(repositories.base, "another place", "recipes");
  await mkdir(path.dirname(otherSource));
  await cloneWithIdentity(repositories.sourceRemote, otherSource);
  const otherManaged = managedDestinationPath(await realpath(otherSource));

  await publishSite(
    managedOptions(repositories, { verify: writesSite("first\n") }),
  );
  const firstCheckoutHead = await revision(repositories.managed);
  const second = await publishSite(
    managedOptions(repositories, {
      sourceRoot: otherSource,
      verify: async (context) => {
        assert.equal(context.sourceRoot, await realpath(otherSource));
        await writesSite("second\n")(context);
      },
    }),
  );

  assert.equal(second.status, "published");
  assert.notEqual(otherManaged, repositories.managed);
  assert.equal(await revision(otherManaged), second.publicationRevision);
  assert.equal(await revision(repositories.managed), firstCheckoutHead);
  assert.equal(
    (
      await git(
        repositories.destinationRemote,
        "show",
        "master:recipe-grams/index.html",
      )
    ).stdout,
    "second\n",
  );
});

const invalidOccupants = [
  {
    name: "a file",
    error: /must be a real directory/,
    async create({ managed }) {
      await mkdir(path.dirname(managed));
      await writeFile(managed, "not a checkout\n");
    },
    async snapshot({ managed }) {
      return readFile(managed, "utf8");
    },
  },
  {
    name: "a symbolic link to a valid checkout",
    error: /must be a real directory/,
    async create({ managed, base, destinationRemote }) {
      const elsewhere = path.join(base, "elsewhere");
      await cloneWithIdentity(pathToFileURL(destinationRemote).href, elsewhere);
      await mkdir(path.dirname(managed));
      await symlink(elsewhere, managed);
    },
    async snapshot({ managed }) {
      return (await lstat(managed)).isSymbolicLink();
    },
  },
  {
    name: "a symbolic link in place of the managed directory",
    error: /Managed Pages directory must be a real directory/,
    async create({ managed, base }) {
      await mkdir(path.join(base, "linked pages"));
      await symlink(path.join(base, "linked pages"), path.dirname(managed));
    },
    async snapshot({ managed }) {
      return (await lstat(path.dirname(managed))).isSymbolicLink();
    },
  },
  {
    name: "a partial clone",
    error: /not a complete Pages checkout/,
    async create({ managed }) {
      await mkdir(managed, { recursive: true });
      await writeFile(path.join(managed, "index.html"), "partial\n");
    },
    async snapshot({ managed }) {
      return readFile(path.join(managed, "index.html"), "utf8");
    },
  },
  {
    name: "the wrong repository",
    error: /Destination origin fetch URL .* expected/,
    async create({ managed, sourceRemote }) {
      await mkdir(path.dirname(managed));
      await cloneWithIdentity(pathToFileURL(sourceRemote).href, managed);
    },
  },
  {
    name: "the wrong branch",
    error: /Destination must be on master; found preview/,
    async create({ managed, destinationRemote }) {
      await mkdir(path.dirname(managed));
      await cloneWithIdentity(pathToFileURL(destinationRemote).href, managed);
      await git(managed, "switch", "--quiet", "preview");
    },
  },
  {
    name: "a dirty checkout",
    error: /Destination checkout has uncommitted or staged work/,
    async create({ managed, destinationRemote }) {
      await mkdir(path.dirname(managed));
      await cloneWithIdentity(pathToFileURL(destinationRemote).href, managed);
      await writeFile(path.join(managed, "unrelated.txt"), "unfinished\n");
    },
  },
  {
    name: "a divergent checkout",
    error: /could not fast-forward/,
    async create(repositories) {
      const { managed, destinationRemote } = repositories;
      await mkdir(path.dirname(managed));
      await cloneWithIdentity(pathToFileURL(destinationRemote).href, managed);
      await writeFile(path.join(managed, "local.txt"), "local\n");
      await commitAll(managed, "Local destination commit");
      await pushRemoteCommit(repositories, "divergent");
    },
  },
];

for (const occupant of invalidOccupants) {
  test(`refuses a managed path occupied by ${occupant.name} without changing it`, async (t) => {
    const repositories = await setupManagedRepositories(t);
    await occupant.create(repositories);
    const snapshot = async () =>
      occupant.snapshot
        ? occupant.snapshot(repositories)
        : [
            await revision(repositories.managed),
            (await git(repositories.managed, "status", "--porcelain")).stdout,
            (await git(repositories.managed, "branch", "--show-current"))
              .stdout,
          ];
    const before = await snapshot();
    const remoteBefore = await revision(
      repositories.destinationRemote,
      "master",
    );
    let verified = false;

    await assert.rejects(
      publishSite(
        managedOptions(repositories, { verify: async () => (verified = true) }),
      ),
      occupant.error,
    );

    assert.equal(verified, false);
    assert.deepEqual(await snapshot(), before);
    assert.equal(
      await revision(repositories.destinationRemote, "master"),
      remoteBefore,
    );
  });
}

test("a failed clone creates no managed checkout", async (t) => {
  const repositories = await setupManagedRepositories(t);
  let verified = false;
  await assert.rejects(
    publishSite(
      managedOptions(repositories, {
        expectedRemote: pathToFileURL(
          path.join(repositories.base, "missing-remote.git"),
        ).href,
        verify: async () => (verified = true),
      }),
    ),
    /Could not clone the Pages repository; no managed checkout was created/,
  );
  assert.equal(verified, false);
  assert.deepEqual(await readdir(path.dirname(repositories.managed)), []);
});

test("an interrupted clone's staging is discarded and the checkout is recreated", async (t) => {
  const repositories = await setupManagedRepositories(t);
  const staging = path.join(
    path.dirname(repositories.managed),
    ".clone-interrupted",
  );
  const stale = path.join(staging, "alexfeigin.github.io");
  await mkdir(stale, { recursive: true });
  await writeFile(
    path.join(staging, ".recipe-grams-publish-site-staging"),
    "recipe-grams publish-site staging\n",
  );
  await writeFile(path.join(stale, "partial.txt"), "partial\n");

  const result = await publishSite(managedOptions(repositories));

  assert.equal(result.status, "published");
  assert.deepEqual(await readdir(path.dirname(repositories.managed)), [
    "alexfeigin.github.io",
  ]);
});

test("preserves unrelated ignored directories while removing owned clone staging", async (t) => {
  const repositories = await setupManagedRepositories(t);
  const parent = path.dirname(repositories.managed);
  const unrelated = path.join(parent, ".clone-notes");
  await mkdir(unrelated, { recursive: true });
  await writeFile(path.join(unrelated, "work.txt"), "keep this\n");

  const result = await publishSite(managedOptions(repositories));

  assert.equal(result.status, "published");
  assert.equal(
    await readFile(path.join(unrelated, "work.txt"), "utf8"),
    "keep this\n",
  );
});

test("source preflight failures do not create a managed checkout", async (t) => {
  const repositories = await setupManagedRepositories(t);
  await writeFile(path.join(repositories.source, "source.txt"), "dirty\n");
  await assert.rejects(
    publishSite(managedOptions(repositories)),
    /Source checkout has uncommitted or staged work/,
  );
  assert.equal(await exists(path.dirname(repositories.managed)), false);

  await git(repositories.source, "restore", "source.txt");
  await writeFile(
    path.join(repositories.source, ".gitignore"),
    ".astro/\ndist/\n",
  );
  await commitAll(repositories.source, "Stop ignoring the Pages checkout");
  await git(repositories.source, "push");
  await assert.rejects(
    publishSite(managedOptions(repositories)),
    /does not ignore \.pages\/alexfeigin\.github\.io\//,
  );
  assert.equal(await exists(path.dirname(repositories.managed)), false);
});

test("concurrent first publications from one checkout initialize one clone", async (t) => {
  const repositories = await setupManagedRepositories(t);
  let started;
  const verifying = new Promise((resolve) => (started = resolve));
  let release;
  const held = new Promise((resolve) => (release = resolve));
  const first = publishSite(
    managedOptions(repositories, {
      verify: async (context) => {
        started();
        await held;
        await writesSite("new\n")(context);
      },
    }),
  );
  const second = publishSite(managedOptions(repositories));
  try {
    await assert.rejects(second, /Another verification or publication owns/);
  } finally {
    await verifying;
    release();
  }
  assert.equal((await first).status, "published");
  assert.deepEqual(await readdir(path.dirname(repositories.managed)), [
    "alexfeigin.github.io",
  ]);
});

test("stops instead of reporting unchanged when the remote advances during verification", async (t) => {
  const repositories = await setupManagedRepositories(t, {
    published: "new\n",
  });
  await rm(path.join(repositories.destination, "recipe-grams", "obsolete.txt"));
  await commitAll(repositories.destination, "Remove obsolete output");
  await git(repositories.destination, "push");
  let raced;

  await assert.rejects(
    publishSite(
      managedOptions(repositories, {
        verify: async (context) => {
          raced = await pushRemoteCommit(repositories, "concurrent");
          await writesSite("new\n")(context);
        },
      }),
    ),
    /origin\/master advanced from .* during verification.*Rerun publication/s,
  );

  assert.equal(await revision(repositories.destinationRemote, "master"), raced);
  assert.notEqual(await revision(repositories.managed), raced);
  assert.equal(
    (await git(repositories.managed, "status", "--porcelain")).stdout,
    "",
  );
});

test("stops instead of reporting unchanged when the remote advances during copy", async (t) => {
  const repositories = await setupManagedRepositories(t, {
    published: "new\n",
  });
  await rm(path.join(repositories.destination, "recipe-grams", "obsolete.txt"));
  await commitAll(repositories.destination, "Remove obsolete output");
  await git(repositories.destination, "push");
  let raced;

  await assert.rejects(
    publishSite(
      managedOptions(repositories, {
        copy: async (options) => {
          raced = await pushRemoteCommit(repositories, "during-copy");
          await replacePublishedSubtree(options);
        },
      }),
    ),
    /origin\/master advanced from .*Rerun publication/s,
  );

  assert.equal(await revision(repositories.destinationRemote, "master"), raced);
  assert.notEqual(await revision(repositories.managed), raced);
});

test("a new managed clone commits as the source's repository-local identity", async (t) => {
  const repositories = await setupManagedRepositories(t);
  const globalConfig = path.join(repositories.base, "global.gitconfig");
  // Without a configured identity, Git must refuse rather than guess one.
  await writeFile(globalConfig, "[user]\n\tuseConfigOnly = true\n");
  const saved = {
    GIT_CONFIG_GLOBAL: process.env.GIT_CONFIG_GLOBAL,
    GIT_CONFIG_NOSYSTEM: process.env.GIT_CONFIG_NOSYSTEM,
  };
  process.env.GIT_CONFIG_GLOBAL = globalConfig;
  process.env.GIT_CONFIG_NOSYSTEM = "1";
  t.after(() => {
    for (const [key, value] of Object.entries(saved)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });

  const result = await publishSite(managedOptions(repositories));

  assert.equal(result.status, "published");
  assert.equal(
    (
      await git(
        repositories.destinationRemote,
        "log",
        "-1",
        "--format=%an <%ae>",
        "master",
      )
    ).stdout.trim(),
    "Recipe-Grams Test <recipe-grams@example.test>",
  );
  assert.equal(
    await readFile(globalConfig, "utf8"),
    "[user]\n\tuseConfigOnly = true\n",
  );
});

test("clones through the source checkout's transport first", () => {
  const ssh = "git@github.com:alexfeigin/alexfeigin.github.io.git";
  const https = "https://github.com/alexfeigin/alexfeigin.github.io.git";
  assert.deepEqual(
    pagesCloneUrls(ssh, "git@github.com:alexfeigin/recipe-grams.git"),
    [ssh, https],
  );
  assert.deepEqual(
    pagesCloneUrls(ssh, "https://github.com/alexfeigin/recipe-grams"),
    [https, ssh],
  );
  assert.deepEqual(pagesCloneUrls(https, "ssh://git@github.com/a/b.git"), [
    ssh,
    https,
  ]);
  assert.deepEqual(pagesCloneUrls("/srv/pages.git", "https://x/y"), [
    "/srv/pages.git",
  ]);
});

test("an explicit destination is never created", async (t) => {
  const repositories = await setupRepositories(t);
  const missing = path.join(repositories.base, "missing pages");
  await assert.rejects(
    publishSite(publicationOptions(repositories, { destination: missing })),
    /Destination checkout does not exist/,
  );
  assert.equal(await exists(missing), false);
});

test("rejects a nested explicit destination other than the managed checkout", async (t) => {
  const repositories = await setupManagedRepositories(t);
  const nested = path.join(repositories.source, ".pages", "other");
  await mkdir(path.dirname(nested));
  await cloneWithIdentity(
    pathToFileURL(repositories.destinationRemote).href,
    nested,
  );
  await assert.rejects(
    publishSite(
      publicationOptions(repositories, {
        destination: nested,
        expectedRemote: pathToFileURL(repositories.destinationRemote).href,
      }),
    ),
    /Source and destination repositories must be separate paths/,
  );

  await publishSite(managedOptions(repositories));
  const explicit = await publishSite(
    publicationOptions(repositories, {
      destination: repositories.managed,
      expectedRemote: pathToFileURL(repositories.destinationRemote).href,
      verify: writesSite("explicit\n"),
    }),
  );
  assert.equal(explicit.status, "published");
});
