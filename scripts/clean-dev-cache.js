/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * @file clean-dev-cache.js
 * @description Deterministic atomic cache eviction engine for Next.js 16 / Turbopack on Windows NTFS.
 *
 *              Architectural Rationale:
 *              - Defaults to evicting `.next/dev` only, preserving production `.next` artifacts unless
 *                `--all` is explicitly passed.
 *              - Enforces a pre-flight active-server guard (TCP port 3003 listener or `.next/dev/lock`)
 *                so cache eviction never yanks `.next/dev` out from under a running `next dev` process.
 *              - Uses an atomic NTFS MFT rename (`fs.renameSync`) to an ephemeral `.next_dev_trash_*`
 *                or `.next_trash_*` folder in `ROOT_DIR` before recursive removal with backoff retries.
 *
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const ROOT_DIR = path.resolve(__dirname, "..");
const DEFAULT_DEV_PORT = 3003;

/**
 * Parses supported CLI flags for cache eviction.
 * @param {string[]} argv
 * @returns {{ all: boolean, force: boolean }}
 */
function parseArgs(argv) {
  return {
    all: argv.includes("--all"),
    force: argv.includes("--force"),
  };
}

/**
 * Inspects OS TCP socket tables for processes actively listening on the Next.js dev port.
 * Uses `netstat -ano -p TCP` on Windows and `lsof` on POSIX hosts.
 * @param {number} port
 * @returns {string[]}
 */
function findListeningPidsOnPort(port = DEFAULT_DEV_PORT) {
  try {
    if (process.platform === "win32") {
      const output = execFileSync("netstat", ["-ano", "-p", "TCP"], {
        encoding: "utf8",
        windowsHide: true,
      });
      const pids = new Set();
      const pattern = new RegExp(
        `^\\s*TCP\\s+\\S+:${port}\\s+\\S+\\s+LISTENING\\s+(\\d+)\\s*$`,
        "i"
      );
      for (const line of output.split(/\r?\n/)) {
        const match = line.match(pattern);
        if (match && match[1]) {
          pids.add(match[1]);
        }
      }
      return Array.from(pids);
    }

    const output = execFileSync(
      "lsof",
      [`-iTCP:${port}`, "-sTCP:LISTEN", "-t"],
      { encoding: "utf8" }
    );
    return output
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

/**
 * Checks whether Next.js has an active dev lock marker inside `.next/dev`.
 * @param {string} rootDir
 * @returns {boolean}
 */
function hasActiveDevLock(rootDir = ROOT_DIR) {
  const lockPath = path.join(rootDir, ".next", "dev", "lock");
  return fs.existsSync(lockPath);
}

/**
 * Evaluates pre-flight safety conditions to avoid corrupting an active Next.js dev server.
 * @param {string} rootDir
 * @param {number} port
 * @returns {{ active: boolean, reasons: string[] }}
 */
function checkActiveDevServer(rootDir = ROOT_DIR, port = DEFAULT_DEV_PORT) {
  const reasons = [];
  const pids = findListeningPidsOnPort(port);
  if (pids.length > 0) {
    reasons.push(`Port ${port} has an active TCP LISTENING process (PID: ${pids.join(", ")}).`);
  }
  if (hasActiveDevLock(rootDir)) {
    reasons.push("Active Next.js dev lock detected at .next/dev/lock.");
  }
  return {
    active: reasons.length > 0,
    reasons,
  };
}

/**
 * Evicts `.next/dev` (or `.next` when `all` is true) using atomic directory rename and retry cleanup.
 * Aborts with exit code 1 if an active `next dev` process or lock is detected unless `force` is true.
 * @param {{ all?: boolean, force?: boolean, rootDir?: string, port?: number, exitOnActive?: boolean }} [options]
 * @returns {{ aborted: boolean, cleaned: boolean, target: string }}
 */
function cleanDevCache(options = {}) {
  const cliFlags = parseArgs(process.argv.slice(2));
  const all = options.all ?? cliFlags.all;
  const force = options.force ?? cliFlags.force;
  const rootDir = options.rootDir ?? ROOT_DIR;
  const port = options.port ?? DEFAULT_DEV_PORT;
  const exitOnActive = options.exitOnActive ?? true;

  const targetLabel = all ? ".next" : ".next/dev";
  const targetDir = all
    ? path.join(rootDir, ".next")
    : path.join(rootDir, ".next", "dev");
  const trashPrefix = all ? ".next_trash_" : ".next_dev_trash_";

  const guard = checkActiveDevServer(rootDir, port);
  if (guard.active) {
    if (!force) {
      console.error(
        `[Cache Orchestrator] Aborted cache purge for ${targetLabel} because Next.js dev appears active:`
      );
      for (const reason of guard.reasons) {
        console.error(`  - ${reason}`);
      }
      console.error(
        "[Cache Orchestrator] Stop the running `next dev` server first before purging cache (or pass --force only if recovering from a stale lock)."
      );
      if (exitOnActive) {
        process.exit(1);
      }
      return { aborted: true, cleaned: false, target: targetLabel };
    }
    console.warn(
      "[Cache Orchestrator] --force specified; bypassing active Next.js dev server pre-flight guard."
    );
  }

  const startTime = Date.now();
  console.log(
    `[Cache Orchestrator] Initiating atomic Next.js / Turbopack cache eviction (${targetLabel})...`
  );

  // Sweep orphaned trash directories from previous aborted runs before moving the current target.
  try {
    const entries = fs.readdirSync(rootDir);
    for (const entry of entries) {
      if (
        entry.startsWith(".next_dev_trash_") ||
        entry.startsWith(".next_trash_")
      ) {
        const trashPath = path.join(rootDir, entry);
        try {
          fs.rmSync(trashPath, {
            recursive: true,
            force: true,
            maxRetries: 3,
            retryDelay: 150,
          });
          console.log(`[Cache Orchestrator] Evicted orphaned trash: ${entry}`);
        } catch {
          // Non-blocking: subsequent runs retry cleanup if Windows still holds a handle.
        }
      }
    }
  } catch (err) {
    console.warn(
      "[Cache Orchestrator] Warning: could not sweep root directory for trash folders:",
      err.message
    );
  }

  if (!fs.existsSync(targetDir)) {
    console.log(
      `[Cache Orchestrator] Target directory (${targetLabel}) does not exist. Working directory is already clean.`
    );
    return { aborted: false, cleaned: false, target: targetLabel };
  }

  const trashName = `${trashPrefix}${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const trashDir = path.join(rootDir, trashName);

  let renamed = false;
  try {
    fs.renameSync(targetDir, trashDir);
    renamed = true;
    console.log(
      `[Cache Orchestrator] Atomic rename successful: ${targetLabel} -> ${trashName} (<5ms)`
    );
  } catch (renameErr) {
    console.warn(
      `[Cache Orchestrator] Atomic rename bypassed (${renameErr.code || renameErr.message}). Falling back to direct recursive purge.`
    );
  }

  const purgeTarget = renamed ? trashDir : targetDir;

  try {
    fs.rmSync(purgeTarget, {
      recursive: true,
      force: true,
      maxRetries: 5,
      retryDelay: 200,
    });
    const elapsed = Date.now() - startTime;
    console.log(
      `[Cache Orchestrator] Cache (${targetLabel}) successfully purged in ${elapsed}ms. Clean state restored.`
    );
    return { aborted: false, cleaned: true, target: targetLabel };
  } catch (rmErr) {
    console.error(
      `[Cache Orchestrator] Error during purge of ${purgeTarget}:`,
      rmErr.message
    );
    if (!renamed) {
      throw rmErr;
    }
    return { aborted: false, cleaned: true, target: targetLabel };
  }
}

if (require.main === module) {
  cleanDevCache();
}

module.exports = {
  cleanDevCache,
  checkActiveDevServer,
  findListeningPidsOnPort,
  hasActiveDevLock,
  parseArgs,
};
