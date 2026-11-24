# Master Architectural Remediation Plan: CRM Follow-Up Queue & Directory Schema Resilience

> **Task ID**: `crm-tasks-directory-schema-resilience`  
> **Status**: DRAFT FOR USER REVIEW & APPROVAL  
> **Author Identity**: `Fenar7 <86710532+Fenar7@users.noreply.github.com>`  
> **Base Branch**: `redesign/commercial-desk-notion-linear`  
> **Target Sub-Branch**: `fix/crm-tasks-directory-schema-resilience`  
> **Target Child PR**: PR targeting `redesign/commercial-desk-notion-linear` (Strictly **OPEN** — Zero agent merges)  

---

## 1. Executive Summary & Forensic Root Cause Analysis

When navigating to `/admin/tasks` (Follow-up queue), the application halts with a fatal workspace error:
```
Follow-ups could not be loaded.
Your queue could not be verified for this request. Use the reference below if you contact support.
Reference 959E5C11
```

Terminal log analysis reveals three interrelated errors:
```
[dashboard] Directory view unavailable, using profiles Could not find the table 'public.crm_team_directory' in the schema cache
 GET /admin 200 in 14.3s (compile: 5.3s, proxy.ts: 4.0s, render: 5.0s)
[tasks] Follow-up query failed {
  reference: '0AA82217',
  code: 'PGRST200',
  message: "Could not find a relationship between 'leads' and 'crm_team_directory' in the schema cache"
}
 GET /admin/tasks 200 in 7.2s (compile: 3.2s, proxy.ts: 1598ms, render: 2.4s)
○ Compiling /admin/leads ...
[leads-workspace] Owner directory unavailable: {
  code: 'PGRST205',
  message: "Could not find the table 'public.crm_team_directory' in the schema cache"
}
```

### Forensic Root Cause Breakdown:
1. **PGRST200 (Foreign Key to View Mismatch)**:
   - In `src/app/admin/(workspace)/tasks/page.tsx` line 154:
     ```tsx
     profiles:crm_team_directory!leads_assigned_to_fkey(full_name)
     ```
   - In PostgreSQL, foreign key constraints (such as `leads_assigned_to_fkey`) belong exclusively to physical tables (`public.profiles`), NOT views.
   - PostgREST evaluates `leads_assigned_to_fkey` against `crm_team_directory` and fails immediately with `PGRST200`: `"Could not find a relationship between 'leads' and 'crm_team_directory' in the schema cache"`.
   - Because this join is directly inside the primary `.select(...)` for `leads`, PostgREST rejects the entire query. Line 174 catches `leadsError` and immediately aborts the page, rendering `<WorkspaceError ... message="Follow-ups could not be loaded." />`.

2. **PGRST205 (Missing View in Schema Cache)**:
   - The view `public.crm_team_directory` was declared in migration `20261105000001_preserve_activity_attribution_and_history.sql`.
   - In environments where this migration has not yet been applied or where PostgREST has not reloaded its schema cache, querying `supabase.from('crm_team_directory')` returns `PGRST205` ("Could not find the table 'public.crm_team_directory' in the schema cache").

3. **Why `/admin` and `/admin/leads` Did NOT Crash**:
   - In `src/app/admin/(workspace)/page.tsx` (the main dashboard), the query is resilient:
     ```tsx
     const primary = await supabase.from("crm_team_directory").select("id, full_name").in("id", ownerIds);
     if (!primary.error && primary.data) directory = primary.data;
     else {
       console.warn("[dashboard] Directory view unavailable, using profiles", primary.error?.message);
       const fallback = await supabase.from("profiles").select("id, full_name").in("id", ownerIds);
       if (!fallback.error && fallback.data) directory = fallback.data;
     }
     ```
   - In `src/app/admin/(workspace)/leads/page.tsx` and `deals/page.tsx`, the primary `leads` query has **zero foreign key join** to `crm_team_directory`. It queries `assigned_to` and resolves owner names separately using an in-memory map. When `crm_team_directory` fails, it simply logs `Owner directory unavailable` and defaults to `'Unassigned'` without crashing!
   - This architectural resilience pattern was codified in `tests/unit/crm-workspace-resilience.test.ts`:
     ```ts
     it('keeps primary lead queries independent from owner-directory view relationships', () => {
       assert.ok(!leads.includes('crm_team_directory!leads_assigned_to_fkey'));
       assert.ok(!deals.includes('crm_team_directory!leads_assigned_to_fkey'));
     });
     ```
   - **`tasks/page.tsx` was the lone violation of this project architectural rule.**

---

## 2. Architectural Solution & Engineering Specification

We will implement an enterprise-grade, dual-layer resilience architecture:

### Layer 1: Resilient Directory Lookup Utility (`src/app/admin/lib/directoryUtils.ts`)
Create a single, authoritative helper function used by `tasks`, `leads`, `deals`, and `dashboard`:
```typescript
/**
 * Authoritative CRM Team Directory Resolver with automatic fallback to public.profiles.
 * Completely immune to PGRST205/PGRST200 errors when views are not in the schema cache.
 */
export async function getCrmOwnerDirectoryMap(
  supabase: SupabaseClient,
  ownerIds?: string[]
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  
  // 1. Attempt safe directory projection
  let query = supabase.from('crm_team_directory').select('id, full_name');
  if (ownerIds && ownerIds.length > 0) {
    query = query.in('id', ownerIds);
  }
  const primary = await query;
  
  if (!primary.error && primary.data) {
    primary.data.forEach((p) => {
      if (p.id && p.full_name) map.set(p.id, p.full_name);
    });
    return map;
  }

  // 2. Fallback to public.profiles (respecting RLS)
  let fallbackQuery = supabase.from('profiles').select('id, full_name');
  if (ownerIds && ownerIds.length > 0) {
    fallbackQuery = fallbackQuery.in('id', ownerIds);
  }
  const fallback = await fallbackQuery;
  
  if (!fallback.error && fallback.data) {
    fallback.data.forEach((p) => {
      if (p.id && p.full_name) map.set(p.id, p.full_name);
    });
  }

  return map;
}
```

### Layer 2: Decouple Primary Query in `src/app/admin/(workspace)/tasks/page.tsx`
1. **Clean `baseRows` Query**:
   ```typescript
   const baseRows = supabase.from('leads').select(`
       id, lead_id, name, company, phone, email, preferred_channel, priority,
       expected_value, next_follow_up, revisit_date, assigned_to, created_at,
       funnel_statuses!inner(name, bucket)
     `)
     .in('funnel_statuses.bucket', ['open', 'potential'])
     .or(`and(or(revisit_date.is.null,revisit_date.lte.${today}),or(${SYNTHETIC_EXCLUSION}))`);
   ```
2. **Collect and Resolve Assignees**:
   ```typescript
   const ownerIds = [
     ...new Set(rawLeads.flatMap((lead) => (lead.assigned_to ? [lead.assigned_to] : []))),
   ];
   const ownerNameById = await getCrmOwnerDirectoryMap(supabase, ownerIds);
   ```
3. **Map Task Lead Items**:
   ```typescript
   const leads: TaskLeadItem[] = rawLeads.map((lead) => ({
     id: lead.id,
     lead_id: lead.lead_id,
     name: lead.name,
     company: lead.company,
     phone: lead.phone,
     email: lead.email,
     preferred_channel: lead.preferred_channel || 'Email',
     priority: (lead.priority as LeadPriority) || 'Medium',
     expected_value: Number(lead.expected_value) || 0,
     next_follow_up: lead.next_follow_up,
     revisit_date: lead.revisit_date,
     assigned_to: lead.assigned_to,
     assignee_name: lead.assigned_to ? (ownerNameById.get(lead.assigned_to) || 'Active Staff') : 'Unassigned',
     status_name: (lead.funnel_statuses as { name?: string } | null)?.name || 'Active',
   }));
   ```

### Layer 3: Enforce Invariant in `tests/unit/crm-workspace-resilience.test.ts`
Add assertion to prevent regression:
```typescript
it('keeps tasks follow-up queries independent from owner-directory view relationships', () => {
  const tasks = read('src/app/admin/(workspace)/tasks/page.tsx');
  assert.ok(!tasks.includes('crm_team_directory!leads_assigned_to_fkey'));
  assert.ok(tasks.includes('ownerNameById'));
});
```

---

## 3. Git Branch & Sub-Branch Hierarchy

Following user instructions and strict PR rules:
1. **Base Branch**: `redesign/commercial-desk-notion-linear` (Current active branch, PR #122 OPEN).
2. **New Sub-Branch**: `fix/crm-tasks-directory-schema-resilience` branched directly off `redesign/commercial-desk-notion-linear`.
3. **Target Pull Request**: PR targets `redesign/commercial-desk-notion-linear`.
4. **Author Identity**: `Fenar7 <86710532+Fenar7@users.noreply.github.com>`.
5. **PR Title**: `Fix: CRM Follow-Up Queue Schema Resilience & Directory Fallback Engine` (Strictly NO 'feat' prefix!).
6. **PR Merge Rule**: Strictly **OPEN** awaiting human review. Zero auto-merges by agent.

---

## 4. Verification & Delivery Gates

1. **Gate 1: TypeScript Zero-Error Verification**:
   - Execute `npx tsc --noEmit` with `NODE_OPTIONS=--max-old-space-size=4096`.
   - Pass with 0 type errors.
2. **Gate 2: Unit & Boundary Test Suite**:
   - Execute `npm run test:boundaries`.
   - Execute `node --test tests/unit/crm-workspace-resilience.test.ts`.
   - 100% pass rate.
3. **Gate 3: Multi-Route Live Verification**:
   - Verify `/admin/tasks` loads 200 OK and renders all 37 follow-up tasks cleanly.
   - Verify `/admin/leads`, `/admin/deals`, and `/admin` continue operating with zero breaking changes.
4. **Gate 4: Context Registers**:
   - Update `docs/context/context.md` and create `docs/context/2026-11-17_14-00-00.md`.
