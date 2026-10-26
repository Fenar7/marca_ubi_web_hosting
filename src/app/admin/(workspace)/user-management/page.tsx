/**
 * @file page.tsx
 * @description Canonical User Management route alias (/admin/user-management).
 *              Ensures deep links, external bookmarks, and direct navigation to /admin/user-management
 *              redirect cleanly to /admin/team which houses the Commercial Personnel Directory & Governance Workspace.
 * @module app/admin/user-management/page
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import { redirect } from 'next/navigation';

export default function AdminUserManagementRedirectPage(): never {
  redirect('/admin/team');
}
