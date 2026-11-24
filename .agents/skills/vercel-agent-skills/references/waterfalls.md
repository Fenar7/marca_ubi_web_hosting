# Vercel Agent Skills — Request Waterfall Elimination

Request waterfalls occur when async operations block each other unnecessarily.

---

## 1. Diagnostic Checklist

- [ ] Are multiple independent `await` calls executed sequentially in a Server Component or Server Action?
- [ ] Can queries with no dependencies on each other be combined into a single `Promise.all([q1, q2, q3])`?
- [ ] Is secondary data blocking the critical initial page render instead of streaming through `<Suspense>`?

---

## 2. Refactoring Patterns

### Pattern A: Parallelizing Server Queries
```typescript
// Before: 420ms total
const pipeline = await fetchPipeline();
const team = await fetchTeam();
const stages = await fetchStages();

// After: 150ms total
const [pipeline, team, stages] = await Promise.all([
  fetchPipeline(),
  fetchTeam(),
  fetchStages(),
]);
```

### Pattern B: Deferred Streaming via React Suspense
```tsx
import { Suspense } from "react";
import { OverviewQueueSkeleton } from "./OverviewQueueSkeleton";
import { OverviewQueueSection } from "./OverviewQueueSection";

export default async function AdminPage() {
  // Fast critical telemetry loaded upfront
  const headerData = await getCriticalHeaderData();

  return (
    <main>
      <HeaderSection data={headerData} />
      {/* Heavy historical records stream independently */}
      <Suspense fallback={<OverviewQueueSkeleton />}>
        <OverviewQueueSection />
      </Suspense>
    </main>
  );
}
```
