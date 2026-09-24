import { spawn } from "node:child_process";

export function runCommand(
  command,
  args,
  { cwd, env, signal, label = command, stdin = "inherit" } = {},
) {
  signal?.throwIfAborted();
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      stdio: [stdin, "inherit", "inherit"],
      env: { ...process.env, ...env },
      detached: process.platform !== "win32",
    });
    const stop = () => {
      if (!child.pid) return;
      try {
        if (process.platform === "win32") child.kill("SIGTERM");
        else process.kill(-child.pid, "SIGTERM");
      } catch (error) {
        if (error.code !== "ESRCH") throw error;
      }
    };
    const forget = () => signal?.removeEventListener("abort", stop);
    signal?.addEventListener("abort", stop, { once: true });
    child.once("error", (error) => {
      forget();
      reject(error);
    });
    child.once("close", (code, closingSignal) => {
      forget();
      if (code === 0) resolve();
      else reject(new Error(`${label} failed (${closingSignal ?? code})`));
    });
  });
}

export async function runInterruptible(task) {
  const controller = new AbortController();
  const interrupt = () => controller.abort();
  process.once("SIGINT", interrupt);
  process.once("SIGTERM", interrupt);
  try {
    await task(controller.signal);
  } catch (error) {
    console.error(error.message);
    process.exitCode = controller.signal.aborted ? 130 : 1;
  } finally {
    process.removeListener("SIGINT", interrupt);
    process.removeListener("SIGTERM", interrupt);
  }
}
