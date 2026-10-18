/**
 * @file 20261015000014_harden_on_hold_rpc_privileges.sql
 * @description Hardens stored procedure execution privileges for reactivate_expired_on_hold_leads().
 *              Revokes direct public/anon RPC execution to prevent unauthenticated client-side triggering,
 *              and restricts execution exclusively to privileged service_role and authenticated administrators.
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

-- 1. Revoke public and anon execution privileges on the reactivation stored procedure
REVOKE ALL ON FUNCTION public.reactivate_expired_on_hold_leads() FROM PUBLIC, anon;

-- 2. Explicitly grant execution privileges to service_role and authenticated callers
GRANT EXECUTE ON FUNCTION public.reactivate_expired_on_hold_leads() TO service_role, authenticated;

-- 3. Document the hardened privilege model
COMMENT ON FUNCTION public.reactivate_expired_on_hold_leads() IS
  'Automated daily reactivation routine transitioning expired On Hold deals to Contacted stage. Restricted to service_role and authenticated callers.';
