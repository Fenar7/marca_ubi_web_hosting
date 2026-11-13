---
name: vercel-agent-skills
description: >-
  Vercel React 19 & Next.js App Router performance engineering skill. Enforces waterfall
  elimination (Promise.all, Suspense streaming), bundle tree-shaking, server-action boundary
  security, and Web Vitals / CLS prevention. Use when building, refactoring, or reviewing
  React components, server actions, and App Router pages.
---

# 🚀 Vercel Agent Skills — React 19 & Next.js App Router Engineering

> **Core Philosophy**: A luxury design is only as good as its performance. Enforce cutting-edge Next.js App Router patterns, eliminate request waterfalls, prevent bundle bloat, guarantee atomic server actions, and ensure sub-second Core Web Vitals.

--------------------------------------------------------------------------------

## 1. Quick Navigation Matrix

| Topic | Focus | Location |
| :--- | :--- | :--- |
| **Waterfalls & Streaming** | `Promise.all`, React Suspense streaming, deferred awaits | [`references/waterfalls.md`](./references/waterfalls.md) |
| **Bundle & Tree-Shaking** | Barrel file avoidance, dynamic imports, code splitting | [`references/bundle-hygiene.md`](./references/bundle-hygiene.md) |
| **Server Actions & Security** | Boundary invariants, atomic mutations, input validation | [`references/server-actions.md`](./references/server-actions.md) |

--------------------------------------------------------------------------------

## 2. Priority 1: Eliminating Request Waterfalls (Critical)

Sequential blocking awaits are the #1 cause of slow page loads in App Router applications.

```typescript
// ❌ SLOW ANTI-PATTERN: Sequential Waterfall (Total time: t1 + t2 + t3)
const user = await getUser();
const pipeline = await getPipeline(user.id);
const metrics = await getMetrics();

// ✅ OPTIMAL PATTERN: Parallel Concurrency (Total time: max(t1, t2, t3))
const [user, metrics] = await Promise.all([
  getUser(),
  getMetrics(),
]);
const pipeline = await getPipeline(user.id);
```

### Suspense Streaming Architecture
For slow background queries or heavy charts, wrap secondary components in `<Suspense fallback={<Skeleton />}>` so the main layout renders immediately without waiting for long-tail calculations.

--------------------------------------------------------------------------------

## 3. Priority 2: Bundle Size & Tree-Shaking Hygiene

1. **Direct Sub-Module Imports (No Barrel Files)**:
   - Import icons, utility functions, and components directly from their specific paths rather than barrel `index.ts` files.
   - Example: `import LucideCheck from 'lucide-react/dist/esm/icons/check'` or optimized Next.js `optimizePackageImports`.
2. **Dynamic Client Imports (`next/dynamic`)**:
   - Heavy client-side interactive widgets (charts, complex data visualizers, modal drawers) should use `dynamic(() => import('./Widget'), { ssr: false })` when not immediately visible in the initial viewport.
3. **Server-Only Code Isolation**:
   - Files containing database credentials or Supabase service role keys must include `import 'server-only'` at the top to prevent accidental client bundling.

--------------------------------------------------------------------------------

## 4. Priority 3: Server Action Boundaries & Security

1. **Strict Boundary Compliance**:
   - Every file with `"use server"` must export **only async functions**. Never export constants, TypeScript types, or Zod schemas from `"use server"` files.
2. **Atomic Mutations & Error Resilience**:
   - All server mutations must validate input with Zod.
   - Database operations spanning multiple tables must execute within transactions or handle rollbacks.
   - Never swallow exceptions silently; always log with structured contextual tags.
3. **Cache Invalidation**:
   - After a state-modifying Server Action, call `revalidatePath('/admin')` or `revalidateTag(...)` to update server caches cleanly.

--------------------------------------------------------------------------------

## 5. Priority 4: Re-render Minimization & Rendering Health

1. **Collocate State Locally**:
   - Keep state as close as possible to the component that consumes it. Avoid lifting state to the page level when only a child modal needs it.
2. **Derive State During Render**:
   - Never use `useEffect` to synchronize derived state (`const [fullName, setFullName] = useState('')`). Compute derived values directly in the render function.
3. **Zero Cumulative Layout Shift (CLS)**:
   - Always specify explicit `width` and `height` (or aspect-ratio) on SVG charts, image containers, and skeleton placeholders to prevent layout jank during loading.
