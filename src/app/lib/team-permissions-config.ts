/**
 * @file team-permissions-config.ts
 * @description Canonical taxonomy, enclave groupings, and role-baseline derivation helpers
 *              for the Marca Ubi CRM Granular Tab Permissions Engine.
 *              Clean TypeScript module with zero SCSS or browser DOM dependencies for safe unit test consumption.
 * @module lib/team-permissions-config
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import type { CrmTabKey, CrmUserRole } from '@/types/crm';
import { ROLE_DEFAULT_TABS } from '@/types/crm';

export interface EnclaveTabItem {
  key: CrmTabKey;
  label: string;
  route: string;
  hint: string;
}

export interface PermissionEnclave {
  enclaveTitle: string;
  description: string;
  tabs: EnclaveTabItem[];
}

/**
 * 3 Canonical Enclaves grouping all 9 CRM workspace tabs.
 */
export const PERMISSION_ENCLAVES: PermissionEnclave[] = [
  {
    enclaveTitle: 'Commercial Pipeline',
    description: 'Lead acquisition, deals velocity, deliverables and scheduling.',
    tabs: [
      { key: 'command_center', label: 'Command Center', route: '/admin', hint: 'Overview & KPI velocity' },
      { key: 'leads', label: 'Inbound Leads', route: '/admin/leads', hint: 'Raw lead triage & qualification' },
      { key: 'deals', label: 'Pipeline Deals', route: '/admin/deals', hint: 'Proposals & deal stages' },
      { key: 'works', label: 'Client Works', route: '/admin/works', hint: 'Deliverables & milestone tracking' },
      { key: 'tasks', label: 'Follow-up Tasks', route: '/admin/tasks', hint: 'Overdue reminders & scheduling' },
    ],
  },
  {
    enclaveTitle: 'Agency Operations',
    description: 'Personnel administration, analytics dashboards, and web hooks.',
    tabs: [
      { key: 'users', label: 'User Governance', route: '/admin/team', hint: 'Directory, roles & permissions' },
      { key: 'analytics', label: 'Commercial Analytics', route: '/admin/analytics', hint: 'Financial reporting & conversion metrics' },
      { key: 'ingestion', label: 'Website Inquiries', route: '/admin/ingestion', hint: 'Form webhooks & live payload inspection' },
    ],
  },
  {
    enclaveTitle: 'System & Governance',
    description: 'Security configurations, SLA thresholds, and audit trails.',
    tabs: [
      { key: 'settings', label: 'Security & Settings', route: '/admin/settings', hint: 'System configuration & audit logs' },
    ],
  },
];

/**
 * Derives default authorized tabs from role baseline matrix.
 *
 * @param {CrmUserRole} role User role.
 * @returns {CrmTabKey[]} Array of default authorized tab keys.
 */
export function getInitialAllowedTabs(role: CrmUserRole): CrmTabKey[] {
  const defaults = ROLE_DEFAULT_TABS[role];
  if (!defaults) return ['command_center', 'leads', 'deals', 'works', 'tasks'];
  return (Object.keys(defaults) as CrmTabKey[]).filter((k) => defaults[k]);
}

/**
 * Evaluates whether a user role and optional custom allowed_tabs grant access
 * to the Commercial Personnel Directory & Governance Workspace (/admin/team).
 *
 * Canonical Architectural Invariants:
 * 1. Administrators ALWAYS have access to user management and personnel governance.
 * 2. If allowedTabs is explicitly defined with non-empty items, check whether it includes 'users'.
 * 3. Otherwise fall back to role default baseline (sales_manager has access, sales_executive and viewer do not).
 *
 * @param {CrmUserRole} role User operational role.
 * @param {string[] | null | undefined} allowedTabs Optional custom allowed tab overrides.
 * @returns {boolean} True if the user is authorized to inspect the team roster/workspace.
 */
export function hasPersonnelDirectoryAccess(
  role: CrmUserRole,
  allowedTabs?: string[] | null
): boolean {
  return (
    role === 'admin' ||
    (Array.isArray(allowedTabs) && allowedTabs.length > 0
      ? allowedTabs.includes('users')
      : role === 'sales_manager')
  );
}
