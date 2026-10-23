# Dev Server Startup & Turbopack Optimization Plan

**Target Module**: Next.js 16.1.6 Turbopack Dev Runtime & Perimeter Proxy  
**Repository**: `Fenar7/marca_ubi_web_hosting`  
**Author**: Fenar7 <86710532+Fenar7@users.noreply.github.com>  
**Status**: DRAFT (Awaiting User "Proceed" Authorization)

---

## 1. Root Cause Analysis

### A. The 266.7-Second Startup Freeze (`✓ Ready in 266.7s`)
- **Direct Cause**: **Fragmented & Bloated Turbopack Dev Cache (`.next/dev/cache`)**.
- **Diagnostic Evidence**:
  - Total `.next` size: **517.09 MB** across **2,729 files**.
  - `.next/dev/cache` alone contains **421.67 MB** across **2,065 small serialized graph files**.
  - Drive `F:` is an NTFS fixed disk. On Windows, traversing and verifying 2,065 serialized Turbopack graph nodes during cold start causes severe disk I/O contention and Windows Defender real-time scanning overhead.
  - The existing `npm run dev:clean` script in `package.json` was:
    ```json
    "dev:clean": "node -e \"const fs=require('fs'); fs.rmSync('.next/cache', { recursive: true, force: true });\" && next dev"
    ```
    This script only removed `.next/cache` (0.69 MB). In Next.js 16 with Turbopack, dev caches are written to `.next/dev/cache`, which was **never cleared**! The cache grew uncontrollably across builds, causing the 4.4-minute startup freeze.

### B. Port 3000 Collision (`⚠ Port 3000 is in use by process 10640`)
- **Direct Cause**: Process ID `10640` is an active Node.js server running a separate repository on the machine:
  `"C:\Program Files\nodejs\node.exe" C:\Fenar\Zenxvio\Product-Works\Stayee_Anywhere_Product...`
- **Impact**: Next.js dev server attempts to bind to `3000`, receives `EADDRINUSE`, sequentially scans ports `3001`, `3002`, and finally binds to `3003`. This adds port probe latency on every startup.

### C. Deprecated Middleware Warning (`⚠ The "middleware" file convention is deprecated. Please use "proxy" instead`)
- **Direct Cause**: Next.js 16.1.6 officially introduces the `proxy.ts` convention, deprecating `middleware.ts`.
- **Diagnostic Evidence**:
  ```javascript
  // node_modules/next/dist/build/index.js:611
  _log.warnOnce(`The "${_constants.MIDDLEWARE_FILENAME}" file convention is deprecated. Please use "${_constants.PROXY_FILENAME}" instead. Learn more: https://nextjs.org/docs/messages/middleware-to-proxy`);
  ```
- **Impact**: Turbopack must wrap `src/middleware.ts` in a legacy adapter layer, emitting warnings and slowing initial middleware compilation.

### D. Sass `@import` Deprecations
- **Direct Cause**: `src/app/globals.scss` imports multiple section stylesheets using `@import "./components/.../style.scss"`.
- **Impact**: Dart Sass emits repeated deprecation warnings and re-evaluates the global SCSS AST on initial page loads.

---

## 2. Step-by-Step Remediation Plan

### Step 1: Fix `package.json` Cache Cleanup & Pin Dev Port
- Update `package.json` scripts:
  ```json
  "dev": "next dev -p 3003",
  "dev:clean": "node -e \"const fs=require('fs'); fs.rmSync('.next', { recursive: true, force: true });\" && next dev -p 3003"
  ```
- **Benefit**:
  1. Purges the entire 517 MB `.next` directory (including `.next/dev/cache`), resetting startup time from **266.7s down to ~2–4s**.
  2. Directly pins port `3003`, eliminating port collision probing and warnings.

### Step 2: Migrate `src/middleware.ts` to `src/proxy.ts`
- Rename `src/middleware.ts` to `src/proxy.ts`.
- Update export signature in `src/proxy.ts`:
  ```typescript
  export async function proxy(request: NextRequest): Promise<NextResponse> { ... }
  // Retain legacy alias for backward compatibility
  export const middleware = proxy;
  ```
- Update any test suites or scripts referencing `middleware.ts` (e.g. `tests/unit/middleware.test.ts`, boundary verifiers).
- **Benefit**: Eliminates Next.js 16 deprecation warning and removes Turbopack's legacy adapter overhead.

### Step 3: Handle Port 3000 Orphaned Process (Optional User Choice)
- Provide user with command to terminate process 10640 if that project is inactive:
  `taskkill /F /PID 10640`
- If the other project needs to remain running, pinning port 3003 in Step 1 permanently prevents conflicts.

### Step 4: Modernize `src/app/globals.scss` Imports
- Migrate `@import` statements to `@use` in `globals.scss` to eliminate Dart Sass 3.0 deprecation warnings and speed up CSS compilation.

### Step 5: Verification & Benchmark
- Run `npm run dev:clean` and measure cold start time.
- Verify `✓ Ready in < 5s`.
- Verify zero deprecation warnings and clean route compilation on `/admin`.

---

## 3. Strict PR & Execution Governance
- **No execution without user permission**: We will NOT touch any code or delete any cache until the user explicitly says "proceed" or "do it".
- **Git Identity**: `Fenar7 <86710532+Fenar7@users.noreply.github.com>`.
- **No `feat`**: Zero `feat` in commit messages, branch names, or PR titles.
- **Strict PR Merging Rule**: PR #76 remains strictly OPEN on GitHub. Any new performance branch will also remain OPEN.
