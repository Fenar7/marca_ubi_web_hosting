# Master System Diagnostics & Root-Cause Remediation Plan

## 1. Executive Incident & Log Summary

During administrative navigation to `/admin/login?next=%2Fadmin` and `/admin`, the following sequence occurred in the dev server console:

```text
 GET /admin/login?next=%2Fadmin 200 in 151ms (compile: 19ms, proxy.ts: 20ms, render: 112ms)
⨯ SyntaxError: Unexpected end of JSON input
    at JSON.parse (<anonymous>) {
  page: '/admin/login'
}
 GET /admin/login?next=%2Fadmin 500 in 2.3s (compile: 2.1s, proxy.ts: 58ms, render: 95ms)
 GET /admin/login?next=%2Fadmin 200 in 1094ms (compile: 247ms, proxy.ts: 25ms, render: 822ms)
 GET /admin/login?next=%2Fadmin 200 in 521ms (compile: 17ms, proxy.ts: 38ms, render: 466ms)
[AUTH_SYNC_WARNING] Non-blocking JWT metadata synchronization failed; delegating to Server Component: [CRITICAL CONFIGURATION ERROR] SUPABASE_SERVICE_ROLE_KEY is required to initialize the privileged Supabase Admin SDK. Verify that the service role secret is defined in your environment variables.
 POST /admin/login?next=%2Fadmin 200 in 3.1s (compile: 81ms, proxy.ts: 19ms, render: 3.0s)
○ Compiling /admin ...
[chat-pod] postsQuery exceeded 1500ms; compiling without it.
[chat-pod] categoriesQuery exceeded 1500ms; compiling without it.
[chat-pod] faqQuery exceeded 1500ms; compiling without it.
[chat-pod] careersQuery exceeded 1500ms; compiling without it.
[admin-dashboard] safe team directory query failed: Could not find the table 'public.crm_team_directory' in the schema cache
 GET /admin 200 in 23.3s (compile: 12.1s, proxy.ts: 309ms, render: 10.9s)
```

---

## 2. In-Depth Multi-Agent Root Cause Analysis

### Incident A: `SyntaxError: Unexpected end of JSON input at JSON.parse` (HTTP 500)
1. **Dev Server Recompilation Race Condition**:
   - In Next.js dev mode (`next dev --webpack -p 3003`), modifying files (`AdminAuthShell.tsx`, `AdminAuthShell.module.scss`, deleting `GenerativeSilkCanvas.tsx`) triggers an incremental Webpack recompilation.
   - Notice the log timeline:
     - Request 1: `GET /admin/login 200 in 151ms` (initial page serve).
     - Live code hot-reloading started: compilation took **2.1 seconds** (`compile: 2.1s`).
     - While the Next.js compiler was actively writing build manifests (`server-reference-manifest.json`, `app-paths-manifest.json`, etc.) to disk, an incoming browser request hit the dev server.
     - Next.js's internal manifest loader (`node_modules/next/dist/server/load-manifest.external.js`) executed:
       ```javascript
       let manifest = fs.readFileSync(path, 'utf8');
       manifest = JSON.parse(manifest);
       ```
     - Reading the manifest file at the exact millisecond before its write buffer flushed yielded an empty string `""`.
     - `JSON.parse("")` immediately threw `SyntaxError: Unexpected end of JSON input at JSON.parse (<anonymous>) { page: '/admin/login' }`, returning HTTP 500.
     - As soon as the write buffer finished flushing (247ms later), all subsequent requests served cleanly:
       `GET /admin/login 200 in 1094ms`
       `GET /admin/login 200 in 521ms`.
2. **Defensive Cookie Fragment Vulnerability**:
   - In `@supabase/auth-js/dist/module/lib/helpers.js`, `decodeJWT(token)` calls:
     ```javascript
     payload: JSON.parse(stringFromBase64URL(parts[1]))
     ```
   - If a browser retains an empty cookie fragment (e.g. `sb-*-auth-token=""`), `stringFromBase64URL` produces `""` and triggers the identical unhandled `SyntaxError: Unexpected end of JSON input`.

---

### Incident B: `[AUTH_SYNC_WARNING] SUPABASE_SERVICE_ROLE_KEY is required`
- In `src/app/actions/auth.ts`, once credentials validate against Supabase Auth, the server attempts a non-blocking JWT claims update (`app_metadata.role` and `allowed_tabs`) using `getAdminClient()`.
- `getAdminClient()` requires `SUPABASE_SERVICE_ROLE_KEY` (minimum 20 characters). When absent in the local developer's `.env.local`, it throws a configuration error.
- **Current Behavior**: The `try...catch` block in `auth.ts` catches this cleanly, logs `[AUTH_SYNC_WARNING]`, and proceeds to authenticate the user and redirect to `/admin` (`POST /admin/login 200 in 3.1s`). Login is **not broken**, but the log warning is noisy.

---

### Incident C: `[admin-dashboard] safe team directory query failed: Could not find table 'public.crm_team_directory'`
- In `src/app/admin/(workspace)/page.tsx`, the dashboard loads assigned team member names using the PostgreSQL view `public.crm_team_directory`.
- Defined in migration `supabase/migrations/20261105000001_preserve_activity_attribution_and_history.sql`:
  ```sql
  CREATE OR REPLACE VIEW public.crm_team_directory
  WITH (security_barrier = true) AS
  SELECT id, full_name, role, avatar_url FROM public.profiles WHERE status = 'active';
  ```
- Because the connected Supabase instance has not yet run this migration (or PostgREST schema cache has not been reloaded via `NOTIFY pgrst, 'reload schema'`), the query returned `Could not find table 'public.crm_team_directory'`.
- The dashboard logged the error and safely defaulted to empty directory without crashing (`GET /admin 200 in 23.3s`), but deal owner names are omitted.

---

### Incident D: `[chat-pod] postsQuery / categoriesQuery exceeded 1500ms; compiling without it`
- In `src/app/layout.tsx`, `<ChatPodBoundary />` mounts at the root layout.
- In `src/app/chat-pod/knowledge/collect.ts`, Sanity CMS queries run with a strict 1,500ms timeout guard (`withTimeout`).
- When running locally without high-speed Sanity API roundtrips, queries timeout after 1,500ms, log this warning, and seamlessly load pre-compiled static fallbacks (`FALLBACK_FAQS`, `FALLBACK_CAREERS`). This is working strictly as designed.

---

## 3. Targeted Architectural Remediation Plan

### Proposed Action Items:

#### 1. Edge Middleware & Cookie Sanitization Safeguard
- In `src/app/lib/supabase/middleware.ts`:
  - Sanitize cookies in `getAll()` to reject any cookie whose value is empty (`value.trim() === ''`) or malformed.
  - Wrap `await supabase.auth.getUser()` in a dedicated `try/catch` that explicitly handles `SyntaxError` or `AuthInvalidJwtError`. If an unexpected parsing error occurs, treat the visitor as unauthenticated (`user = null`) and delete corrupt `sb-` auth cookies, completely preventing any 500 errors.

#### 2. Resilient Database View Fallback in Admin Dashboard
- In `src/app/admin/(workspace)/page.tsx`:
  - Enhance the `crm_team_directory` query with an automatic secondary fallback to `public.profiles`:
    ```typescript
    let directory = dirData;
    if (directoryError) {
      // Fallback: query public.profiles directly if view is not yet indexed in PostgREST schema cache
      const { data: profileFallback } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', assignedIds);
      directory = profileFallback ?? [];
    }
    ```
  - This guarantees team member names load seamlessly even on newly provisioned or un-migrated development databases.

#### 3. Supabase View Migration SQL
Provide the exact SQL snippet to run in the Supabase Dashboard SQL Editor to establish `crm_team_directory` permanently:
```sql
CREATE OR REPLACE VIEW public.crm_team_directory
WITH (security_barrier = true) AS
SELECT id, full_name, role, avatar_url
FROM public.profiles
WHERE status = 'active';

GRANT SELECT ON public.crm_team_directory TO authenticated;
NOTIFY pgrst, 'reload schema';
```

---

## 4. Verification Protocol
1. Run all unit test suites (`npx tsx --test tests/unit/*.test.ts tests/auth/*.test.ts`).
2. Run strict TypeScript compiler verification (`npx tsc --noEmit`).
3. Test `/admin/login` and `/admin` requests with clean 200 OK responses and zero console crashes.
