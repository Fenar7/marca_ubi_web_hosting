# Workspace Settings recovery

Hosted Supabase was missing the settings relation. The original governance migration contained literal backslashes in the table definition and seed statement, which PostgreSQL rejects. The repaired migration creates the settings relation, seeds the default row and preserves the audit action types previously allowed by the database.

Settings updates now append their audit event inside the database transaction under the caller's existing row-level security policies. The event uses the existing audit schema. A failed audit insert rolls back the settings update.

Both migrations were applied to the configured hosted Supabase database. An authenticated administrator could read the settings and audit activity. A temporary update produced a matching audit event and was rolled back. An independent role check confirmed active non-admins could read settings but could not update them, and anonymous callers could not read them.

The rollout changes in this pull request should ship after the audit migration. A signed-in browser walkthrough was not performed.
