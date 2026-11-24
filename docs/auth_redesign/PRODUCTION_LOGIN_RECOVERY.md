# Production login recovery

The production banner maps to the unexpected exception handler in the login server action. Production runtime logs were inaccessible, so the specific failing deployment variable remains unconfirmed.

Public Supabase client initialization now validates only the public connection settings. Missing or malformed privileged credentials still fail when the server constructs the privileged client. On Vercel production builds, Next.js configuration validates the public settings before compilation. Local and preview build placeholders remain available as before.

For production recovery, correlate the failed POST to the login route with the `AUTH_ACTION_FATAL` entry in Vercel Runtime Logs. Confirm the public Supabase URL and anonymous key are scoped to Production and correspond to the intended project. Configure the service-role key only in the server environment used by privileged operations.

After deployment, sign in with an approved account, reload the workspace, confirm the expected role and tab access, sign out, and verify the invalid-credential response. Record deployment ID and timestamp without including keys, passwords, cookies, or tokens.

## Server-side login diagnostics

In Vercel Runtime Logs, search for `[CRM_LOGIN]` after a login submission. Match the attempt and outcome using `attemptId`. A `provider_rejected` event identifies the Supabase hostname, HTTP status, and provider error code when available. An `AUTH_ACTION_FATAL` event with the same ID identifies an unexpected server failure and indicates whether the configuration validator rejected the environment.

These events are emitted by the server action. They carry no submitted email, password, API key, raw provider message, token, or cookie. The user-facing credentials error remains generic.
