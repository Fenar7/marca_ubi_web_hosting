# Leads directory and dossier diagnosis

## Why the directory error repeats

The Leads page issues a fresh directory lookup on each render. A read-only request to the configured Data API returned HTTP 404 with `PGRST205`. A catalog check on the configured PostgreSQL connection returned no `public.crm_team_directory` relation. It confirmed that PostgreSQL supports the view options, that `current_user_role()` exists, and that all five profile fields needed by the view are present. The Supabase migration ledger was absent on that connection, so the exact deployment history could not be established.

The view is defined in repository migration `20261105000001`. Since the inspected database lacks the relation, a cache reload alone cannot create it. The observed 200 is the page response. Its optional owner query can fail while the page renders leads and tries the RLS-scoped profile lookup. That fallback adds a round trip and may return fewer owner names under the caller's direct profile visibility. The logs alone cannot quantify that round trip or isolate the rest of the list render time.

The repair migration `20261123000001` recreates the existing active-staff projection, grants only SELECT to authenticated callers, preserves the active CRM role gate, and requests a PostgREST schema reload after commit. It leaves profile policies and activity records alone. The normal database migration workflow must apply it to the database behind the affected environment. The investigation used read-only probes.

[Supabase error codes](https://supabase.com/docs/guides/api/rest/postgrest-error-codes) · [Schema refresh instructions](https://supabase.com/kb/troubleshooting/refresh-postgrest-schema)

## Where the dossier time went

| From the supplied log | Interpretation |
| --- | --- |
| First dossier requests took 23.4–23.8 seconds, including 18.4–18.9 seconds of compilation | The requests arrived during an on-demand development compile. Each reported compile time can include waiting for the same route compilation. Production should be assessed separately. |
| Dossier render took 4.8–4.9 seconds | The page and metadata requested the same dossier. Inside that read, activities, stage options, and staff were fetched in sequence even though they were independent. |
| Warm Leads list renders took 1.6–3.4 seconds | The owner lookup and fallback explain one avoidable part of the path. Session checks, exact count, database and network work remain in this timing. |

Both dossier routes now share the authorized data read within a single React render request. The three independent lookups run concurrently after the portfolio check. Their errors are logged by source. The routes import the dossier component directly, and the leads list no longer selects unused notes and brief payloads for all 100 rows. No cross-user dossier cache was introduced.

Verify warm, signed-in navigation after applying the migration, including a leadership account and a restricted role. Check the directory's four-column projection and confirm the log no longer reports `PGRST205`. Compare route compile and render timings separately. This work did not measure a post-migration, authenticated round trip.

[Next.js development performance](https://nextjs.org/docs/app/guides/local-development) · [Metadata memoization](https://nextjs.org/docs/app/api-reference/functions/generate-metadata)

## Verification

TypeScript, 41 focused dossier and interaction tests, and the 50 Server Action boundary checks passed. An isolated PostgreSQL fixture applied the migration twice and verified its four-column projection, active staff and caller gating, authenticated read-only access, and anonymous denial.
