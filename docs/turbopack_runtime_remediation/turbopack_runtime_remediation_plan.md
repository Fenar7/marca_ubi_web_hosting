# Architectural Remediation Plan: Turbopack Windows IPC Crash & Tailwind v4 / Sass Compilation Failure

> **Document Identity**: Comprehensive Architectural PRD & Remediation Blueprint  
> **Location**: `docs/turbopack_runtime_remediation/turbopack_runtime_remediation_plan.md`  
> **Status**: Ready for Executive Review & User Approval (STOP Gate Active)  
> **Author**: `Fenar7 <86710532+Fenar7@users.noreply.github.com>`  
> **Target Branch**: `brand-upgrade-phase-8/inbound-leads-triage-and-dossier-remediation`  
> **PR Reference**: GitHub PR #71 (Strictly OPEN)

---

## 1. Executive Summary & Problem Formulation

When running `next dev` under Next.js 16 with Turbopack on Windows (`http://localhost:3003`), requests to `/` (`page.tsx`) or `/_not-found` trigger an internal compilation crash:

```
TurbopackInternalError: Failed to write app endpoint /page (and /_not-found/page)

Caused by:
- [project]/src/app/globals.scss.css [app-client] (css)
- failed to receive message
- reading packet length
- An existing connection was forcibly closed by the remote host. (os error 10054)

Debug info:
- Execution of get_written_endpoint_with_issues_operation failed
- Execution of endpoint_write_to_disk failed
- Execution of <AppEndpoint as Endpoint>::output failed
- Failed to write app endpoint /page
- Execution of AppEndpoint::output failed
- Execution of AppProject::app_module_graphs failed
- Execution of *<AppEndpoint as Endpoint>::additional_entries failed
- Execution of *ModuleGraph::from_graphs failed
- Execution of SingleModuleGraph::new_with_entries_visited_intern failed
- [project]/src/app/globals.scss.css [app-client] (css)
- Execution of primary_chunkable_referenced_modules failed
- Execution of <CssModuleAsset as Module>::references failed
- Execution of parse_css failed
- Execution of <PostCssTransformedAsset as Asset>::content failed
- Execution of PostCssTransformedAsset::process failed
- Execution of evaluate_webpack_loader failed
- failed to receive message
- reading packet length
- An existing connection was forcibly closed by the remote host. (os error 10054)
    at throwTurbopackInternalError (node_modules/next/dist/shared/lib/turbopack/internal-error.js:43:17)
```

In the browser client, this surfaces as an unhandled Turbopack error:
```
An unexpected Turbopack error occurred. Please see the output of `next dev` for more details.
Call Stack
  getServerError (node_modules/next/dist/b3fb3b5f._.js:2050:62)
  <unknown> (node_modules/next/dist/client/5a8a528e._.js:3611:27)
```

---

## 2. Root Cause Analysis (Isolated by Expert Build Engineering Team)

Our multi-agent build engineering team conducted deep-dive AST tracing, PostCSS pipeline isolation, and Dart Sass compilation benchmarks. Three interlocking architectural defects were uncovered:

### Root Cause 1: Missing `.scss` Extension on Component `@import`s in `globals.scss`
In `src/app/globals.scss`:
```scss
156: @import "./components/StepSectionContainer/style.scss";
157: @import "./components/WorksSection/style";
158: @import "./components/OurValuesSection/style";
159: @import "./components/ContactCtaSection/style";
160: @import "./components/Footer/style";
```
* Line 156 includes the explicit `.scss` extension.
* Lines 157–160 omit the extension, relying on Sass's automatic resolver (`style.scss`).
* However, when `@tailwindcss/postcss` processes the file, its internal bundler uses `enhanced-resolve`, which defaults exclusively to `.css`.
* When querying `./components/WorksSection/style`, it searches for `style` and `style.css` (neither exists; the file is `style.scss`).
* `@tailwindcss/postcss` throws `CssSyntaxError: tailwindcss: Can't resolve './components/WorksSection/style' in 'src/app'`.

### Root Cause 2: Architectural Incompatibility between Tailwind CSS v4 and Sass
* **Official Tailwind v4 Specification**: Tailwind CSS v4 completely dropped support for preprocessors like Sass, Less, and Stylus. Tailwind v4 is a standalone, CSS-first build engine powered by Lightning CSS.
* In `src/app/globals.scss`:
  * Line 1 uses `@use "tailwindcss";`, which forces Dart Sass to locate `node_modules/tailwindcss/index.css` and emit 30KB of static CSS `@layer` rules into Sass intermediate output.
  * Line 31 uses `@theme inline { ... }` with Sass interpolation (`#{$white}`, `#{$black}`, etc.).
* Even when file extensions are added, PostCSS inlining of `.scss` files results in **raw, uncompiled Sass variables** (`background: $black;`) leaking directly into client CSS because PostCSS does not evaluate Sass variables.

### Root Cause 3: Windows IPC Socket Crash (`WSAECONNRESET` / `os error 10054`)
* Next.js 16 Turbopack evaluates PostCSS loaders (`evaluate_webpack_loader`) inside a Node.js worker subprocess over an IPC stream.
* When `@tailwindcss/postcss` throws the resolution failure `CssSyntaxError` or encounters serialization overhead from bloated AST payloads, the Node worker on Windows abruptly closes the IPC socket.
* Rust's Turbopack reader receives `os error 10054` (`WSAECONNRESET`), crashing the entire endpoint asset generation (`/page` and `/_not-found/page`).

---

## 3. Decoupled Remediation Architecture

The official Next.js 16 and Tailwind CSS v4 standard requires **strict separation of concerns**:

```mermaid
flowchart TD
    subgraph Layout["src/app/layout.tsx"]
        L1["import './globals.css'"]
        L2["import './globals.scss'"]
    end

    subgraph TailwindPipeline["Tailwind CSS v4 Pipeline"]
        G_CSS["src/app/globals.css<br/>Pure CSS Engine"]
        G_CSS -->|@import 'tailwindcss'| TW_CORE["Tailwind v4 Core (Lightning CSS)"]
        G_CSS -->|@theme inline| TW_TOKENS["Native CSS Custom Properties"]
        G_CSS -->|CSS Resets & Utilities| TW_UTILS["Zero Sass Dependencies"]
    end

    subgraph SassPipeline["Dart Sass Studio Pipeline"]
        G_SCSS["src/app/globals.scss<br/>Pure Sass Stylesheet"]
        G_SCSS -->|Injects| SASS_DATA["sassOptions.additionalData ($white, $black)"]
        G_SCSS -->|@import explicit .scss| COMP_STYLES["Landing Components & Custom Animations"]
        G_SCSS -->|Emits| CLEAN_CSS["Fully Evaluated Studio CSS"]
    end

    L1 --> TailwindPipeline
    L2 --> SassPipeline
```

### Architectural Principles
1. **Clean Separation**:
   * `src/app/globals.css`: Holds pure CSS, Tailwind CSS v4 (`@import "tailwindcss";`), and native `@theme` design tokens. Turbopack processes this natively in milliseconds without invoking `sass-loader`.
   * `src/app/globals.scss`: Holds pure Sass styles, brand typography, animations, and component style imports with explicit `.scss` extensions. Turbopack processes this via `sass-loader` using `sassOptions.additionalData` without touching Tailwind's parser.
2. **Deterministic Resolution**:
   * All component `@import` rules in `globals.scss` use explicit `.scss` extensions (`./components/WorksSection/style.scss`), satisfying both Sass and any downstream CSS bundler.
3. **Dedicated Root `not-found.tsx`**:
   * Create `src/app/not-found.tsx` providing a dark luxury branded 404 page, preventing Turbopack from falling back to internal Next.js `/_not-found/page` compilation edge cases.

---

## 4. Step-by-Step Implementation Plan

### Step 1: Create Dedicated Standard CSS Entrypoint (`src/app/globals.css`)
- **File**: `src/app/globals.css` (NEW)
- **Contents**:
  - `@import "tailwindcss";`
  - Root CSS custom properties (`--background`, `--foreground`, typography clamp scale).
  - Native `@theme` tokens mapping `--font-graphik`, `--color-cta-orange`, etc.
  - Base body styles, Lenis smooth scrolling rules, custom cursor invariants, and typography utility classes (`.type-display`, `.type-h2`, `.type-stat-number`).

### Step 2: Purge Tailwind Directives & Fix Extensions in `src/app/globals.scss`
- **File**: `src/app/globals.scss` (MODIFY)
- **Modifications**:
  - Remove `@use "tailwindcss";` (line 1).
  - Remove `@theme inline { ... }` (lines 31–44) since theme tokens now live natively in `globals.css`.
  - Fix lines 157–160 to enforce explicit `.scss` file extensions:
    ```scss
    @import "./components/StepSectionContainer/style.scss";
    @import "./components/WorksSection/style.scss";
    @import "./components/OurValuesSection/style.scss";
    @import "./components/ContactCtaSection/style.scss";
    @import "./components/Footer/style.scss";
    ```

### Step 3: Update Root Layout Import Graph (`src/app/layout.tsx`)
- **File**: `src/app/layout.tsx` (MODIFY)
- **Modifications**:
  - Import both stylesheets in sequence:
    ```tsx
    import "./globals.css";   // Tailwind v4 utility engine & design tokens
    import "./globals.scss";  // Studio animations & legacy component Sass styles
    ```

### Step 4: Create Root Error & 404 Boundary (`src/app/not-found.tsx`)
- **File**: `src/app/not-found.tsx` (NEW)
- **Modifications**:
  - Implement a branded, dark luxury 404 screen adhering to Marca Ubi visual standards.
  - Eliminates Next.js internal `/_not-found` Turbopack compilation fallback.

### Step 5: Verification & Quality Gate
- Run TypeScript static analysis: `node --max-old-space-size=4096 ./node_modules/typescript/bin/tsc --noEmit`.
- Run unit test suites: `npx tsx --test tests/unit/*.test.ts`.
- Verify dev server on port 3003:
  - `curl -I http://localhost:3003/` -> 200 OK (Clean compilation, zero 500, zero TurbopackInternalError).
  - `curl -I http://localhost:3003/admin/user-management` -> 307 Redirect to `/admin/team`.
  - `curl -I "http://localhost:3003/admin/leads?id=c0000000-0000-0000-0000-000000000046"` -> 307 Redirect.
- Senior CTO PR Auditor Agent brutal review and official 4-Block Delivery Gate Report.
- Git commit authored strictly as `Fenar7 <86710532+Fenar7@users.noreply.github.com>` and pushed to branch `brand-upgrade-phase-8/inbound-leads-triage-and-dossier-remediation` (PR #71 strictly OPEN).

---

## 5. Explicit STOP Notice for User Confirmation

In accordance with strict project rules:
- **NO CODE EXECUTION HAS BEEN STARTED**.
- We are awaiting your explicit approval.
- Please review this plan and reply **"proceed"** or **\"do it\"** to begin implementation.
