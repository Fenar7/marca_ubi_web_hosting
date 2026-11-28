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
 * Parses `netstat -ano` TCP/TCPv6 output lines for LISTENING sockets bound to `port`.
 * @param {string} output
 * @param {number} port
 * @returns {string[]}
 */
function parseNetstatPids(output, port) {
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

/**
 * Probes OS TCP/TCPv6 socket tables for active listeners on the Next.js dev port.
 * Fails closed (`error` set) on unexpected command failures so Windows/POSIX OS
 * restrictions never masquerade as a free port.
 * @param {number} port
 * @returns {{ pids: string[], error: string | null }}
 */
function probeListeningPidsOnPort(port = DEFAULT_DEV_PORT) {
  if (process.platform === "win32") {
    const pids = new Set();
    const errors = [];
    for (const protocol of ["TCP", "TCPv6"]) {
      try {
        const output = execFileSync("netstat", ["-ano", "-p", protocol], {
          encoding: "utf8",
          windowsHide: true,
        });
        for (const pid of parseNetstatPids(output, port)) {
          pids.add(pid);
        }
      } catch (err) {
        errors.push(`${protocol}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
    return {
      pids: Array.from(pids),
      // Only treat the probe as failed if both TCP and TCPv6 socket queries failed.
      error: errors.length === 2 ? errors.join("; ") : null,
    };
  }

  try {
    const output = execFileSync(
      "lsof",
      [`-iTCP:${port}`, "-sTCP:LISTEN", "-t"],
      { encoding: "utf8" }
    );
    return {
      pids: output
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean),
      error: null,
    };
  } catch (err) {
    // POSIX `lsof` exits with code 1 when zero sockets match the query.
    if (typeof err === "object" && err !== null && err.status === 1) {
      return { pids: [], error: null };
    }
    return {
      pids: [],
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Convenience helper returning active listener PIDs for the specified port.
 * @param {number} port
 * @returns {string[]}
 */
function findListeningPidsOnPort(port = DEFAULT_DEV_PORT) {
  return probeListeningPidsOnPort(port).pids;
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
 * Fails closed when port probing fails so unexpected OS errors never trigger unsafe purges.
 * @param {string} rootDir
 * @param {number} port
 * @returns {{ active: boolean, reasons: string[] }}
 */
function checkActiveDevServer(rootDir = ROOT_DIR, port = DEFAULT_DEV_PORT) {
  const reasons = [];
  const probe = probeListeningPidsOnPort(port);
  if (probe.pids.length > 0) {
    reasons.push(`Port ${port} has an active TCP LISTENING process (PID: ${probe.pids.join(", ")}).`);
  } else if (probe.error) {
    reasons.push(`Port ${port} status probe failed (${probe.error}); aborting to avoid corrupting a running dev server.`);
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
  const all = options.all ?? false;
  const force = options.force ?? false;
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
        } catch (sweepErr) {
          console.warn(
            `[Cache Orchestrator] Deferred cleanup of locked trash folder ${entry}:`,
            sweepErr instanceof Error ? sweepErr.message : String(sweepErr)
          );
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
  cleanDevCache(parseArgs(process.argv.slice(2)));
}

module.exports = {
  cleanDevCache,
  checkActiveDevServer,
  findListeningPidsOnPort,
  probeListeningPidsOnPort,
  hasActiveDevLock,
  parseArgs,
};
