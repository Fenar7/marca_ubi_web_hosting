# Research and verification record

## Official references checked

- [Next.js 16.1.6 server/client components](https://raw.githubusercontent.com/vercel/next.js/v16.1.6/docs/01-app/01-getting-started/05-server-and-client-components.mdx): keep authenticated reads and secrets on the server; pass only permitted serializable data into interactive clients.
- [Next.js 16.1.6 loading convention](https://raw.githubusercontent.com/vercel/next.js/v16.1.6/docs/01-app/03-api-reference/03-file-conventions/loading.mdx) and [error convention](https://raw.githubusercontent.com/vercel/next.js/v16.1.6/docs/01-app/03-api-reference/03-file-conventions/error.mdx): implementation guidance is pinned to the installed package version, not an assumed current API.
- [W3C modal dialog pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/): launcher and mobile drawer require contained keyboard focus, Escape dismissal, focus restoration and an inert background.
- [Supabase row-level security](https://supabase.com/docs/guides/database/postgres/row-level-security): authenticated reads retain RLS. UI visibility alone is not an authorization boundary.

The installed `node_modules/next/dist/docs/` directory is absent. Matching official tagged guides were downloaded to the OS temporary directory `marca-next-16.1.6-guides` and their paths supplied to implementation agents before framework changes.

## Verification environment

- Existing loopback dev server detected at port 3003; no user process stopped.
- Browser CLI: `npx agent-browser`, isolated session `dashboard-qa-c58bea535d3e`.
- Read-only unauthenticated `/admin` navigation redirects to `/admin/login?next=%2Fadmin` and renders the sign-in page.
- No `CRM_E2E_*` credentials or isolated-database flag are configured in the process environment or `.env.local`. No secret values were printed.
- Authenticated database journeys are therefore not certified. Existing E2E authentication helper explicitly requires both credentials and an isolated test database; no fixture-mutating live-database suites were run.
- Visual verification will use actual production components with explicitly labeled fixtures in a separate loopback harness, outside production routes. This checks rendering and interaction, not live authorization/RLS behavior.

## Results

Browser fixture checks and screenshots pending implementation completion. No approval-ready claim is made by this preparation record.
