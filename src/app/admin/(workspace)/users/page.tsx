/**
 * @file page.tsx
 * @description Canonical User Management route alias (/admin/users).
 *              Redirects cleanly to /admin/team which houses the User Governance & Access Control workspace.
 * @module app/admin/users/page
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import { redirect } from 'next/navigation';

export default function AdminUsersRedirectPage(): never {
  redirect('/admin/team');
}
