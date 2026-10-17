/**
 * @file verify-sprint-5-3.ts
 * @description Comprehensive automated delivery gate verification script for Sprint 5.3:
 *              - CRM Workspace Shell architecture and design token integrity
 *              - Persistent navigation components (Sidebar, Header, Breadcrumbs, Mobile Drawer, User Profile)
 *              - Route Grouping architecture isolating auth from authenticated workspace
 *              - Relocated Commercial Personnel Directory (/admin/team)
 *              - Non-404 dedicated workspaces (/admin/tasks, /admin/leads, /admin/analytics, /admin/ingestion, /admin/settings)
 *              - Manual Lead Creation Slide-out Drawer (NewLeadDrawer & Server Actions)
 *              - Zero generic blue (#2563eb), zero toy emojis, zero 'any' types
 *              - Role-based governance and security assertions
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 * @governance AGENTS.md, DESIGN.md & SPEC-MARCA-CRM-WORKSPACE-SHELL-01
 */

import * as fs from 'fs';
import * as path from 'path';
import assert from 'node:assert/strict';
import { createManualLeadSchema } from '../src/app/lib/lead-schemas';

const ROOT_DIR = process.cwd();

console.log('------------------------------------------------------------');
console.log('Marca Ubi CRM — Sprint 5.3 Automated Verification Gate');
console.log('Testing: Workspace Shell, Navigation Rails, Routes & Lead Drawer');
console.log('------------------------------------------------------------\n');

let totalChecks = 0;
let passedChecks = 0;

function check(label: string, assertionFn: () => void): void {
  totalChecks++;
  try {
    assertionFn();
    passedChecks++;
    console.log(`  [PASS] ${label}`);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`  [FAIL] ${label}: ${errorMsg}`);
    throw err;
  }
}

// ============================================================================
// Section 1: File Existence & Hierarchy Verification
// ============================================================================
console.log('Section 1: Workspace Shell Component & Route Hierarchy');

const REQUIRED_FILES = [
  // Layout tokens & components
  'src/app/admin/components/layout/admin-shell.module.scss',
  'src/app/admin/components/layout/AdminWorkspace.module.scss',
  'src/app/admin/components/layout/AdminWorkspaceShell.tsx',
  'src/app/admin/components/layout/AdminSidebar.tsx',
  'src/app/admin/components/layout/AdminSidebar.module.scss',
  'src/app/admin/components/layout/AdminHeader.tsx',
  'src/app/admin/components/layout/AdminHeader.module.scss',
  'src/app/admin/components/layout/AdminBreadcrumbs.tsx',
  'src/app/admin/components/layout/AdminBreadcrumbs.module.scss',
  'src/app/admin/components/layout/AdminMobileDrawer.tsx',
  'src/app/admin/components/layout/AdminMobileDrawer.module.scss',
  'src/app/admin/components/layout/UserProfileDropdown.tsx',
  'src/app/admin/components/layout/UserProfileDropdown.module.scss',
  'src/app/admin/components/layout/RoutePlaceholder.tsx',

  // Manual Lead Creation Engine
  'src/app/admin/components/layout/NewLeadDrawer.tsx',
  'src/app/admin/components/layout/NewLeadDrawer.module.scss',
  'src/app/actions/leads.ts',
  'src/app/lib/lead-schemas.ts',

  // Client 360 Lead Detail Drawer & Cross-Workspace Interactivity
  'src/app/admin/components/drawers/LeadDetailDrawer.tsx',
  'src/app/admin/components/drawers/LeadDetailDrawer.module.scss',
  'src/app/lib/lead-detail-types.ts',
  'src/app/admin/(workspace)/tasks/components/TaskCard.tsx',
  'src/app/admin/(workspace)/components/ActivityRowItem.tsx',

  // Route group layout & workspaces
  'src/app/admin/(workspace)/layout.tsx',
  'src/app/admin/(workspace)/page.tsx',
  'src/app/admin/(workspace)/page.module.scss',
  'src/app/admin/(workspace)/team/page.tsx',
  'src/app/admin/(workspace)/team/team.module.scss',
  'src/app/admin/(workspace)/team/components/CommercialDirectoryTable.tsx',
  'src/app/admin/(workspace)/team/components/AddTeamMemberDrawer.tsx',
  'src/app/admin/(workspace)/team/components/CredentialRevealModal.tsx',
  'src/app/admin/(workspace)/team/components/LeadReassignmentWizardModal.tsx',
  'src/app/admin/(workspace)/team/components/SuspendUserModal.tsx',
  'src/app/admin/(workspace)/team/components/TeamWorkspaceClient.tsx',

  // Dedicated non-404 workspaces
  'src/app/admin/(workspace)/tasks/page.tsx',
  'src/app/admin/(workspace)/tasks/tasks.module.scss',
  'src/app/admin/(workspace)/leads/page.tsx',
  'src/app/admin/(workspace)/leads/leads.module.scss',
  'src/app/admin/(workspace)/leads/LeadsWorkspaceClient.tsx',
  'src/app/admin/(workspace)/analytics/page.tsx',
  'src/app/admin/(workspace)/analytics/analytics.module.scss',
  'src/app/admin/(workspace)/ingestion/page.tsx',
  'src/app/admin/(workspace)/ingestion/ingestion.module.scss',
  'src/app/admin/(workspace)/settings/page.tsx',
  'src/app/admin/(workspace)/settings/settings.module.scss',
];

REQUIRED_FILES.forEach((relPath) => {
  check(`File exists on disk: ${relPath}`, () => {
    const fullPath = path.join(ROOT_DIR, relPath);
    assert.ok(fs.existsSync(fullPath), `Missing required file: ${relPath}`);
  });
});

// ============================================================================
// Section 2: Stale Duplicate Route Elimination
// ============================================================================
console.log('\nSection 2: Stale Duplicate Route Elimination');

check('Old standalone src/app/admin/page.tsx is eliminated', () => {
  const oldPath = path.join(ROOT_DIR, 'src/app/admin/page.tsx');
  assert.ok(!fs.existsSync(oldPath), 'Old src/app/admin/page.tsx still exists and must be removed');
});

check('Old unnested src/app/admin/team directory is eliminated', () => {
  const oldTeam = path.join(ROOT_DIR, 'src/app/admin/team');
  assert.ok(!fs.existsSync(oldTeam), 'Old src/app/admin/team directory still exists and must be removed');
});

// ============================================================================
// Section 3: Next.js App Router Route Group Isolation
// ============================================================================
console.log('\nSection 3: Route Grouping & Auth Boundary Isolation');

check('Auth routes (login, reset-password) remain isolated outside (workspace)', () => {
  assert.ok(fs.existsSync(path.join(ROOT_DIR, 'src/app/admin/login/page.tsx')));
  assert.ok(fs.existsSync(path.join(ROOT_DIR, 'src/app/admin/reset-password/page.tsx')));
  assert.ok(!fs.existsSync(path.join(ROOT_DIR, 'src/app/admin/(workspace)/login')));
  assert.ok(!fs.existsSync(path.join(ROOT_DIR, 'src/app/admin/(workspace)/reset-password')));
});

check('Root admin layout exists inside (workspace) route group', () => {
  const layoutPath = path.join(ROOT_DIR, 'src/app/admin/(workspace)/layout.tsx');
  const content = fs.readFileSync(layoutPath, 'utf8');
  assert.ok(content.includes('AdminWorkspaceShell'), 'Layout must render AdminWorkspaceShell');
  assert.ok(content.includes('createClient'), 'Layout must verify Supabase session');
  assert.ok(content.includes('profiles'), 'Layout must query user profile');
});

// ============================================================================
// Section 4: Brand Soul & Anti-AI-Slop Governance Checks
// ============================================================================
console.log('\nSection 4: Brand Soul & Anti-AI-Slop Token Enforcement');

REQUIRED_FILES.forEach((relPath) => {
  if (relPath.endsWith('.ts') || relPath.endsWith('.tsx') || relPath.endsWith('.scss')) {
    const fullPath = path.join(ROOT_DIR, relPath);
    const content = fs.readFileSync(fullPath, 'utf8');

    // Rule 1: No generic blue
    check(`Zero generic blue (#2563eb) in ${relPath}`, () => {
      assert.ok(!content.includes('#2563eb'), `Found prohibited generic blue #2563eb in ${relPath}`);
    });

    // Rule 2: Zero 'any' types in TypeScript files
    if (relPath.endsWith('.ts') || relPath.endsWith('.tsx')) {
      check(`Zero ': any' or '<any>' types in ${relPath}`, () => {
        const hasExplicitAny = /:\s*any\b|<any>|as\s+any\b/.test(content);
        assert.ok(!hasExplicitAny, `Found prohibited 'any' type in ${relPath}`);
      });
    }

    // Rule 3: Zero decorative separator banners (// =======, // -------)
    check(`Zero decorative separator comment banners in ${relPath}`, () => {
      const hasBanner = /\/\/\s*={5,}|\/\/\s*-{5,}|\/\*\s*={5,}|\/\*\s*-{5,}/.test(content);
      assert.ok(!hasBanner, `Found prohibited decorative comment banner in ${relPath}`);
    });
  }
});

// ============================================================================
// Section 5: Role-Gated Security & Functional Invariants
// ============================================================================
console.log('\nSection 5: Security & Role-Gated Access Control Invariants');

check('AdminSidebar contains role-gated items for admin and sales_manager', () => {
  const sidebarPath = path.join(ROOT_DIR, 'src/app/admin/components/layout/AdminSidebar.tsx');
  const content = fs.readFileSync(sidebarPath, 'utf8');
  assert.ok(content.includes("requiredRoles: ['admin', 'sales_manager']"), 'Team route must be gated');
  assert.ok(content.includes("requiredRoles: ['admin']"), 'Settings route must be gated');
  assert.ok(content.includes('/admin/tasks'), 'Tasks route must be in sidebar');
  assert.ok(content.includes('/admin/leads'), 'Leads route must be in sidebar');
  assert.ok(content.includes('/admin/analytics'), 'Analytics route must be in sidebar');
  assert.ok(content.includes('/admin/ingestion'), 'Ingestion route must be in sidebar');
  assert.ok(content.includes("currentUser.role !== 'viewer'"), 'Quick action button must be hidden from viewers');
});

check('AdminHeader gates + New Lead from viewer role', () => {
  const headerPath = path.join(ROOT_DIR, 'src/app/admin/components/layout/AdminHeader.tsx');
  const content = fs.readFileSync(headerPath, 'utf8');
  assert.ok(content.includes("canCreateLead"), 'Header must calculate canCreateLead');
  assert.ok(content.includes("currentUser.role !== 'viewer'"), 'canCreateLead must block viewers');
});

check('UserProfileDropdown routes logout through logoutAction Server Action', () => {
  const dropdownPath = path.join(ROOT_DIR, 'src/app/admin/components/layout/UserProfileDropdown.tsx');
  const content = fs.readFileSync(dropdownPath, 'utf8');
  assert.ok(content.includes('logoutAction'), 'Must wire logoutAction');
  assert.ok(content.includes('TLS 1.3 / Edge Guarded'), 'Must render security tier telemetry');
});

check('AdminSettingsPage enforces strict admin role boundary', () => {
  const settingsPath = path.join(ROOT_DIR, 'src/app/admin/(workspace)/settings/page.tsx');
  const content = fs.readFileSync(settingsPath, 'utf8');
  assert.ok(content.includes("role !== 'admin'"), 'Must guard settings to admin role only');
  assert.ok(content.includes('unauthorized_role_access'), 'Must redirect unauthorized users');
});

check('AdminWorkspaceShell manages responsive width variable --sidebar-width', () => {
  const shellPath = path.join(ROOT_DIR, 'src/app/admin/components/layout/AdminWorkspaceShell.tsx');
  const content = fs.readFileSync(shellPath, 'utf8');
  assert.ok(content.includes("'--sidebar-width'"), 'Must inject --sidebar-width CSS variable');
  assert.ok(content.includes('localStorage'), 'Must persist collapse state');
  assert.ok(content.includes('marca_crm_sidebar_collapsed'), 'Must use dedicated storage key');
});

// ============================================================================
// Section 6: Manual Lead Creation Drawer & Server Action Invariants
// ============================================================================
console.log('\nSection 6: Manual Lead Creation & Ingestion Drawer Verification');

check('AdminWorkspaceShell mounts NewLeadDrawer and listens to open-new-lead-drawer', () => {
  const shellPath = path.join(ROOT_DIR, 'src/app/admin/components/layout/AdminWorkspaceShell.tsx');
  const content = fs.readFileSync(shellPath, 'utf8');
  assert.ok(content.includes('NewLeadDrawer'), 'Must import and mount NewLeadDrawer');
  assert.ok(content.includes('open-new-lead-drawer'), 'Must subscribe to open-new-lead-drawer event');
  assert.ok(content.includes("e.key.toLowerCase() === 'l'"), 'Must bind Ctrl+L / ⌘L shortcut');
});

check('src/app/actions/leads.ts complies strictly with Server Action boundary', () => {
  const leadsActionPath = path.join(ROOT_DIR, 'src/app/actions/leads.ts');
  const content = fs.readFileSync(leadsActionPath, 'utf8');
  assert.ok(content.startsWith("'use server'"), "File must start with 'use server' directive");
  assert.ok(content.includes('export async function createManualLead'), 'Must export createManualLead');
  assert.ok(content.includes('export async function getActiveTeamAssignees'), 'Must export getActiveTeamAssignees');
  assert.ok(!content.includes('export type'), 'Zero type exports permitted from use server file');
  assert.ok(!content.includes('export interface'), 'Zero interface exports permitted from use server file');
  assert.ok(!content.includes('export const'), 'Zero schema/constant exports permitted from use server file');
});

check('createManualLeadSchema enforces database constraint chk_lead_contact_info', () => {
  
  // Valid with email only
  const validEmail = createManualLeadSchema.safeParse({
    name: 'Tariq Mansoor',
    email: 'tariq@apex.ae',
  });
  assert.ok(validEmail.success, 'Valid email must succeed');

  // Valid with phone only
  const validPhone = createManualLeadSchema.safeParse({
    name: 'Tariq Mansoor',
    phone: '+971501234567',
  });
  assert.ok(validPhone.success, 'Valid phone must succeed');

  // Invalid with neither email nor phone (database constraint violation)
  const invalidNoContact = createManualLeadSchema.safeParse({
    name: 'Tariq Mansoor',
  });
  assert.ok(!invalidNoContact.success, 'Must fail when neither email nor phone is provided');

  // Invalid with short name
  const invalidShortName = createManualLeadSchema.safeParse({
    name: 'A',
    email: 'tariq@apex.ae',
  });
  assert.ok(!invalidShortName.success, 'Must fail when name is under 2 characters');

  // Invalid with negative expected value
  const invalidNegativeValue = createManualLeadSchema.safeParse({
    name: 'Tariq Mansoor',
    email: 'tariq@apex.ae',
    expectedValue: -100,
  });
  assert.ok(!invalidNegativeValue.success, 'Must fail with negative expected value');
});

// Section 7: Client 360 Lead Detail Drawer & Interactivity Invariants
console.log('\nSection 7: Client 360 Lead Detail Drawer & Interactivity Invariants');

check('AdminWorkspaceShell mounts LeadDetailDrawer and handles deep links', () => {
  const shellPath = path.join(ROOT_DIR, 'src/app/admin/components/layout/AdminWorkspaceShell.tsx');
  const content = fs.readFileSync(shellPath, 'utf8');
  assert.ok(content.includes('LeadDetailDrawer'), 'Must mount LeadDetailDrawer');
  assert.ok(content.includes('open-lead-drawer'), 'Must subscribe to open-lead-drawer event');
  assert.ok(content.includes('leadId'), 'Must handle leadId parameter');
});

check('src/app/actions/leads.ts exports all 6 Client 360 Server Actions', () => {
  const actionPath = path.join(ROOT_DIR, 'src/app/actions/leads.ts');
  const content = fs.readFileSync(actionPath, 'utf8');
  assert.ok(content.includes('export async function getLeadDetails'), 'Must export getLeadDetails');
  assert.ok(content.includes('export async function updateLeadStatus'), 'Must export updateLeadStatus');
  assert.ok(content.includes('export async function updateLeadAssignee'), 'Must export updateLeadAssignee');
  assert.ok(content.includes('export async function addLeadTouchpoint'), 'Must export addLeadTouchpoint');
  assert.ok(content.includes('export async function updateLeadDealParameters'), 'Must export updateLeadDealParameters');
  assert.ok(content.includes('export async function clearLeadFollowUp'), 'Must export clearLeadFollowUp');
});

check('Leads workspace table rows dispatch open-lead-drawer custom event', () => {
  const clientPath = path.join(ROOT_DIR, 'src/app/admin/(workspace)/leads/LeadsWorkspaceClient.tsx');
  const content = fs.readFileSync(clientPath, 'utf8');
  assert.ok(content.includes("'open-lead-drawer'"), 'Row clicks must dispatch open-lead-drawer');
});

check('TaskCard dispatches open-lead-drawer and provides quick action links', () => {
  const taskCardPath = path.join(ROOT_DIR, 'src/app/admin/(workspace)/tasks/components/TaskCard.tsx');
  const content = fs.readFileSync(taskCardPath, 'utf8');
  assert.ok(content.includes("'open-lead-drawer'"), 'Card clicks must dispatch open-lead-drawer');
  assert.ok(content.includes('clearLeadFollowUp'), 'Card must integrate clearLeadFollowUp');
  assert.ok(content.includes('tel:'), 'Card must render direct phone link');
  assert.ok(content.includes('https://wa.me/'), 'Card must render WhatsApp link');
});

check('ActivityRowItem dispatches open-lead-drawer on row click', () => {
  const actPath = path.join(ROOT_DIR, 'src/app/admin/(workspace)/components/ActivityRowItem.tsx');
  const content = fs.readFileSync(actPath, 'utf8');
  assert.ok(content.includes("'open-lead-drawer'"), 'Activity clicks must dispatch open-lead-drawer');
});

check('Copywriting detox dictionary is applied across navigation, ingestion and workspaces', () => {
  const sidebarPath = path.join(ROOT_DIR, 'src/app/admin/components/layout/AdminSidebar.tsx');
  const sidebarContent = fs.readFileSync(sidebarPath, 'utf8');
  assert.ok(sidebarContent.includes('Team & Analytics'), 'Sidebar must use Team & Analytics');
  assert.ok(sidebarContent.includes('Website Inquiries'), 'Sidebar must use Website Inquiries');

  const ingestionPath = path.join(ROOT_DIR, 'src/app/admin/(workspace)/ingestion/page.tsx');
  const ingestionContent = fs.readFileSync(ingestionPath, 'utf8');
  assert.ok(ingestionContent.includes('Website Inquiries & Form Capture'), 'Ingestion page must use detoxed title');
  assert.ok(ingestionContent.includes('24-Hour Smart Merge'), 'Ingestion page must use 24-Hour Smart Merge');
  assert.ok(ingestionContent.includes('Automated Spam Shield Active'), 'Ingestion page must use Automated Spam Shield Active');

  const teamPath = path.join(ROOT_DIR, 'src/app/admin/(workspace)/team/page.tsx');
  const teamContent = fs.readFileSync(teamPath, 'utf8');
  assert.ok(teamContent.includes('Team Directory'), 'Team page must use Team Directory');

  const analyticsPath = path.join(ROOT_DIR, 'src/app/admin/(workspace)/analytics/page.tsx');
  const analyticsContent = fs.readFileSync(analyticsPath, 'utf8');
  assert.ok(analyticsContent.includes('Closed Revenue'), 'Analytics page must use Closed Revenue');
  assert.ok(analyticsContent.includes('Total Deals'), 'Analytics page must use Total Deals');
});

// Summary
console.log('\n============================================================');
console.log(`Verification Complete: ${passedChecks}/${totalChecks} assertions passed successfully.`);
console.log('Sprint 5.3 Workspace Shell, Lead Drawer & Navigation Rails Certified.');
console.log('============================================================\n');
