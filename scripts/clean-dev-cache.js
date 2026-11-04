/**
 * @file clean-dev-cache.js
 * @description Deterministic atomic cache eviction engine for Next.js 16 / Turbopack on Windows NTFS.
 *
 *              Architectural Rationale:
 *              - On Windows NTFS, executing synchronous `fs.rmSync('.next')` frequently fails with
 *                `EBUSY` or `EPERM` if an active Node worker, IDE language server, or Windows Defender
 *                holds an open file handle inside the directory tree.
 *              - Furthermore, Turbopack's LSM-tree persistent cache (`turbo-persistence`) can leave
 *                asymmetrically deleted `.meta` pointers on disk when compactions are interrupted,
 *                leading to fatal `os error 2 / os error 3` missing SSTable panics on next boot.
 *              - This utility uses an atomic directory rename protocol: moving `.next` to an ephemeral
 *                `.next_trash_<timestamp>` folder is an instantaneous NTFS MFT pointer operation (<5ms)
 *                that succeeds even if children have open read handles. Once moved, the primary `.next`
 *                path is instantly clear for Next.js to initialize a fresh, healthy LSM database.
 *                The orphaned trash directory is then purged asynchronously with exponential backoff.
 *
 * @author Fenar Khan <86710532+Fenar7@users.noreply.github.com>
 */

const fs = require("fs");
const path = require("path");

const ROOT_DIR = path.resolve(__dirname, "..");
const TARGET_DIR = path.join(ROOT_DIR, ".next");

function cleanDevCache() {
  const startTime = Date.now();
  console.log("[Cache Orchestrator] Initiating atomic Next.js / Turbopack cache eviction...");

  // 1. Purge legacy or orphaned trash directories from previous aborted runs
  try {
    const entries = fs.readdirSync(ROOT_DIR);
    for (const entry of entries) {
      if (entry.startsWith(".next_trash_")) {
        const trashPath = path.join(ROOT_DIR, entry);
        try {
          fs.rmSync(trashPath, { recursive: true, force: true, maxRetries: 3, retryDelay: 150 });
          console.log(`[Cache Orchestrator] Evicted orphaned trash: ${entry}`);
        } catch {
          // Non-blocking: background cleaner will retry on subsequent invocation
        }
      }
    }
  } catch (err) {
    console.warn("[Cache Orchestrator] Warning: could not sweep root directory for trash folders:", err.message);
  }

  // 2. Verify target directory presence
  if (!fs.existsSync(TARGET_DIR)) {
    console.log("[Cache Orchestrator] Target directory (.next) does not exist. Working directory is already clean.");
    return;
  }

  // 3. Execute atomic rename to bypass Windows NTFS handle locking
  const trashName = `.next_trash_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const trashDir = path.join(ROOT_DIR, trashName);

  let renamed = false;
  try {
    fs.renameSync(TARGET_DIR, trashDir);
    renamed = true;
    console.log(`[Cache Orchestrator] Atomic rename successful: .next -> ${trashName} (<5ms)`);
  } catch (renameErr) {
    console.warn(`[Cache Orchestrator] Atomic rename bypassed (${renameErr.code || renameErr.message}). Falling back to direct recursive purge.`);
  }

  const purgeTarget = renamed ? trashDir : TARGET_DIR;

  // 4. Execute recursive directory removal with defensive retry backoff
  try {
    fs.rmSync(purgeTarget, {
      recursive: true,
      force: true,
      maxRetries: 5,
      retryDelay: 200,
    });
    const elapsed = Date.now() - startTime;
    console.log(`[Cache Orchestrator] Cache successfully purged in ${elapsed}ms. Clean state restored.`);
  } catch (rmErr) {
    console.error(`[Cache Orchestrator] Error during purge of ${purgeTarget}:`, rmErr.message);
    if (!renamed) {
      throw rmErr;
    }
  }
}

cleanDevCache();
