# Dev Infrastructure Isolation & Editorial Light 404 Boundaries

> Implements the prevention & recovery plan resolving recurring `localhost:3003` cache collisions and broken dark-orange 404 screens on `redesign/core-tabs-conversion-engine` (**PR #132**).

## Root-Cause Controls Implemented
1. **Isolated Build / E2E / Dev Directories**:
   - `next.config.ts` supports validated relative `NEXT_DIST_DIR` outside Vercel.
   - `playwright.config.ts` isolates E2E runs into `.next-e2e` (`NEXT_DIST_DIR: '.next-e2e'`).
   - `tsconfig.typecheck.json` (`npm run typecheck`) excludes `.next/dev` and `next-env.d.ts` so background dev route-type churn cannot break CI/typecheck runs.
2. **Active Dev-Server Guard on Cache Cleanup**:
   - `scripts/clean-dev-cache.js` defaults to `.next/dev` and refuses cache eviction when TCP port `3003` has a listener or `.next/dev/lock` is active (unless `--force` is passed).
   - `package.json` aligns `"dev:clean"` to `--turbopack`.
3. **Editorial Light 404 Boundary Hierarchy**:
   - `src/app/not-found.tsx` (`RootNotFound`): Editorial Light UI with inline flex centering fallback.
   - `src/app/admin/not-found.tsx`: Scoped `/admin/*` 404 boundary.
   - `src/app/admin/(workspace)/not-found.tsx`: Scoped shell-safe (`min-height: 60vh`, `<section>`) workspace 404 boundary.
   - `src/app/admin/(workspace)/ingestion/[id]/not-found.tsx`: Scoped inquiry 404 recovery page.
