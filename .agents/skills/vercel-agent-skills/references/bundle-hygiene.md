# Vercel Agent Skills — Bundle Hygiene & Tree-Shaking

Keep client bundles lean and prevent compilation slowdowns.

---

## 1. Barrel File Elimination
Barrel files (`index.ts` exporting hundreds of symbols) force bundlers to parse and evaluate modules that are never rendered.

```typescript
// ❌ Avoid importing from gigantic barrel index
import { ArrowRight, Check, Search } from "lucide-react";

// ✅ Import targeted sub-paths or verify Next.js optimizePackageImports is configured
import ArrowRight from "lucide-react/dist/esm/icons/arrow-right";
```

In `next.config.ts`, verify package optimization:
```typescript
experimental: {
  optimizePackageImports: ['lucide-react', '@supabase/supabase-js'],
}
```

---

## 2. Dynamic Component Splitting (`next/dynamic`)
Split heavy non-critical client visualizers:
```tsx
import dynamic from "next/dynamic";

const ConyestCashflowCard = dynamic(
  () => import("./ConyestCashflowCard").then((mod) => mod.ConyestCashflowCard),
  {
    ssr: false,
    loading: () => <div className={styles.chartSkeleton} />,
  }
);
```

---

## 3. Server-Only Code Isolation
Protect server database utilities from client bundle leakage:
```typescript
import "server-only";
import { createServerClient } from "@supabase/ssr";
```
