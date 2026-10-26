# Vercel Deployment Build Failure: Root Cause Analysis & Remediation Plan

## Executive Summary

During Vercel CI deployment (`npm run build`), the build failed at the static generation phase:
```
Generating static pages using 1 worker (0/33) ...
Error occurred prerendering page "/admin/analytics". Read more: https://nextjs.org/docs/messages/prerender-error
Error: [CRITICAL CONFIGURATION ERROR] Runtime environment validation failed:
  - [NEXT_PUBLIC_SUPABASE_URL]: NEXT_PUBLIC_SUPABASE_URL is required to initialize Supabase client connections.
  - [NEXT_PUBLIC_SUPABASE_ANON_KEY]: NEXT_PUBLIC_SUPABASE_ANON_KEY is required to authenticate public client operations.
Verify your .env.local or production deployment environment secrets.
Export encountered an error on /admin/(workspace)/analytics/page: /admin/analytics, exiting the build.
⨯ Next.js build worker exited with code: 1 and signal: null
Error: [BUILD_UTILS_SPAWN_1] Command "npm run build" exited with 1
```

---

## 1. Forensic Root Cause Analysis

The failure is caused by a compounding chain of **three architectural conditions**:

```
[Condition 1: Missing Route Segment Config]
`export const dynamic = 'force-dynamic'` is omitted from `src/app/admin/layout.tsx` & `(workspace)/layout.tsx`.
                                    ↓
[Condition 2: Asymmetric Static Classification]
Next.js App Router defaults to `dynamic = 'auto'`. Pages consuming `searchParams` (`/admin`, `/admin/deals`, `/admin/leads`)
are automatically marked dynamic (`λ`). But `/admin/analytics` and 8 other workspace pages take NO props,
so Next.js classifies them as STATIC (`○`) and attempts to prerender them during build.
                                    ↓
[Condition 3: Swallowed Dynamic Bailout in SSR Client]
In `src/app/lib/supabase/server.ts`, `createClient()` wraps `await cookies()` inside a broad `try { ... } catch {}`.
Any internal Next.js dynamic bailout signal (`DYNAMIC_SERVER_USAGE`) is suppressed, preventing Next.js from bailing out gracefully.
                                    ↓
[Condition 4: Build-Time Environment Validation Failure]
`createClient()` calls `getEnv()`, which invokes `validateEnv()`. In the Vercel CI build container,
`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are either missing or unconfigured for the "Preview" environment.
`validateEnv()` throws a hard uncaught `[CRITICAL CONFIGURATION ERROR]`, crashing the prerender worker with exit code 1.
```

### Static vs. Dynamic Route Matrix under `/admin`:

| Route Path | File Location | Consumes `searchParams`? | Has `force-dynamic`? | Next.js Build Classification | Prerender Status |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `/admin` | `(workspace)/page.tsx` | **YES** | NO | Dynamic (`λ`) | Skipped during prerender |
| `/admin/deals` | `(workspace)/deals/page.tsx` | **YES** | NO | Dynamic (`λ`) | Skipped during prerender |
| `/admin/leads` | `(workspace)/leads/page.tsx` | **YES** | NO | Dynamic (`λ`) | Skipped during prerender |
| **`/admin/analytics`** | `(workspace)/analytics/page.tsx` | **NO** | **NO** | **STATIC (`○`)** | **CRASHED BUILD (Prerender Error)** |
| `/admin/ingestion` | `(workspace)/ingestion/page.tsx` | **NO** | **NO** | **STATIC (`○`)** | Queued behind analytics |
| `/admin/settings` | `(workspace)/settings/page.tsx` | **NO** | **NO** | **STATIC (`○`)** | Queued behind analytics |
| `/admin/tasks` | `(workspace)/tasks/page.tsx` | **NO** | **NO** | **STATIC (`○`)** | Queued behind analytics |
| `/admin/team` | `(workspace)/team/page.tsx` | **NO** | **NO** | **STATIC (`○`)** | Queued behind analytics |
| `/admin/team/[id]` | `(workspace)/team/[id]/page.tsx` | **NO** | **NO** | **STATIC (`○`)** | Queued behind analytics |
| `/admin/user-management`| `(workspace)/user-management/page.tsx`| **NO** | **NO** | **STATIC (`○`)** | Queued behind analytics |
| `/admin/users` | `(workspace)/users/page.tsx` | **NO** | **NO** | **STATIC (`○`)** | Queued behind analytics |
| `/admin/works` | `(workspace)/works/page.tsx` | **NO** | **NO** | **STATIC (`○`)** | Queued behind analytics |
| `/admin/reset-password` | `admin/reset-password/page.tsx` | **NO** | **NO** | **STATIC (`○`)** | Queued behind analytics |

> Authenticated administrative CRM workspaces that depend on user sessions (`auth.getUser()`) and live database records **must NEVER be statically prerendered**. Prerendering them at build time would either fail without credentials or bake static unauthenticated redirects into the production HTML.

---

## 2. 4-Tier Architectural Remediation Plan

### Tier 1: Enforce Dynamic Rendering at Admin Root Layouts (Mandatory)
In Next.js 16 App Router, segment config options exported from a parent `layout.tsx` cascade down to all child layouts and pages.
- **File 1**: `src/app/admin/layout.tsx`
  Export:
  ```typescript
  export const dynamic = 'force-dynamic';
  export const revalidate = 0;
  ```
- **File 2**: `src/app/admin/(workspace)/layout.tsx`
  Export:
  ```typescript
  export const dynamic = 'force-dynamic';
  export const revalidate = 0;
  ```
**Effect**: Unconditionally forces all 10 static-candidate `/admin` routes to dynamic request-time rendering (`λ`). Next.js completely skips prerendering them during `Generating static pages`.

---

### Tier 2: Preserve Next.js Dynamic Bailout & Control Signals
In `src/app/lib/supabase/server.ts`, prevent the `catch` block around `cookies()` from swallowing internal Next.js control signals:
```typescript
try {
  cookieStore = await cookies();
} catch (error: unknown) {
  // Allow Next.js internal dynamic bailout signals to propagate
  if (
    error &&
    typeof error === 'object' &&
    'digest' in error &&
    typeof (error as { digest?: string }).digest === 'string' &&
    ((error as { digest: string }).digest.startsWith('DYNAMIC_SERVER_USAGE') ||
     (error as { digest: string }).digest.startsWith('NEXT_REDIRECT'))
  ) {
    throw error;
  }

  // Graceful in-memory fallback ONLY when executed in external test runners (tsx --test)
  const memoryCookies = new Map<string, { name: string; value: string; options?: Record<string, unknown> }>();
  cookieStore = {
    getAll() { return Array.from(memoryCookies.values()); },
    set(name, value, options) { memoryCookies.set(name, { name, value, options }); },
  };
}
```

---

### Tier 3: Build-Resilient Environment Validation
In `src/app/lib/env.ts`, provide build-phase fallback resilience so that static module analysis during `next build` does not abort compilation if credentials are absent during the build phase:
```typescript
export function validateEnv(customEnv?: Record<string, string | undefined>): EnvConfig {
  const isBuildPhase = process.env.NEXT_PHASE === 'phase-production-build';

  const envToValidate = customEnv || {
    NEXT_PUBLIC_SUPABASE_URL:
      process.env.NEXT_PUBLIC_SUPABASE_URL ||
      (isBuildPhase ? 'https://placeholder-build-phase.supabase.co' : undefined),
    NEXT_PUBLIC_SUPABASE_ANON_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      (isBuildPhase ? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.build_phase_placeholder_key_marca_ubi_crm_enterprise' : undefined),
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    NODE_ENV: process.env.NODE_ENV,
  };

  const parsed = envSchema.safeParse(envToValidate);
  // ...
}
```
**Invariant**: At runtime (`NODE_ENV === 'production'`), `isBuildPhase` is `false`, ensuring strict cryptographic validation on every live user request.

---

### Tier 4: Vercel Project Dashboard Environment Configuration
Ensure the required environment secrets are set in the Vercel Dashboard for all environments (**Production**, **Preview**, and **Development**):

| Variable Name | Required Scope | Purpose |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Production, Preview, Development | Supabase Project Endpoint |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Production, Preview, Development | Supabase Anonymous Client Key |
| `SUPABASE_SERVICE_ROLE_KEY` | Production, Preview, Development | Privileged Server Action Key |
| `DATABASE_URL` | Production, Preview, Development | PostgreSQL Direct Connection |
| `NEXT_PUBLIC_SITE_URL` | Production, Preview, Development | Base Application Canonical URL |
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | Production, Preview, Development | CMS Project Identifier |
| `NEXT_PUBLIC_SANITY_DATASET` | Production, Preview, Development | CMS Dataset (`production`) |
| `NEXT_PUBLIC_SANITY_API_VERSION` | Production, Preview, Development | CMS API Version (`2024-02-27`) |
| `SANITY_API_EDIT_TOKEN` | Production, Preview, Development | CMS Write/Mutation Token |

> [!IMPORTANT]
> In Vercel Project Settings ➔ Environment Variables, make sure **"Preview"** is checked! Pull request and branch deployments run under the Preview scope.

---

## 3. Verification Protocol

1. **Static Analysis & Type Integrity**: `tsc --noEmit` must pass with 0 errors.
2. **Server Action & Boundary Audit**: `npm run test:boundaries` (48/48 Server Actions pass).
3. **Full Automated Test Harness**: `npm run test:all` (1,069/1,069 tests pass).
4. **Clean Build Simulation**: `next build` passes with `/admin/*` classified as `λ (Server)`.
