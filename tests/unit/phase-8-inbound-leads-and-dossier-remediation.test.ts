/**
 * @file phase-8-inbound-leads-and-dossier-remediation.test.ts
 * @description Comprehensive unit test suite verifying Phase 8 Inbound Leads Triage, Stacking Contexts,
 *              Accessibility (WCAG 2.1 AA / 2.5.3), PostgreSQL DB Invariants, and Client 360° Dossier Utilities.
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  formatDossierCurrency,
  sanitizeTelUri,
  createWhatsAppUri,
  formatBriefLabel,
  formatBriefValue,
  getDossierInitials,
  formatRelativeTime,
  extractBriefEntries,
} from '../../src/app/admin/components/DossierDrawer/dossierUtils';
import {
  updateLeadDetailsSchema,
} from '../../src/app/lib/lead-schemas';

describe('Phase 8: Inbound Leads Triage, Stacking Contexts & Dossier Data Remediation', () => {
  describe('Block 1: CSS Stacking Context & Shell Isolation Invariants', () => {
    it('verifies ClientDossierDrawer mounts via React portal to document.body avoiding stacking context traps', () => {
      const tsx = fs.readFileSync(
        path.resolve(process.cwd(), 'src/app/admin/components/DossierDrawer/ClientDossierDrawer.tsx'),
        'utf8'
      );
      assert.ok(tsx.includes('createPortal(drawerContent, document.body)'), 'Must portal drawer to document.body');
      assert.ok(tsx.includes('import { createPortal }'), 'Must import createPortal');
    });

    it('verifies FilterActionBar sets container to z-index: 25 and menu to z-index: 35', () => {
      const scss = fs.readFileSync(
        path.resolve(process.cwd(), 'src/app/admin/components/FilterActionBar/FilterActionBar.module.scss'),
        'utf8'
      );
      assert.ok(scss.includes('z-index: 25;'), 'FilterActionBar must be at z-index 25 above grid');
      assert.ok(scss.includes('z-index: 35;'), 'FilterActionBar popover menu must be at z-index 35');
    });

    it('verifies LeadsDataGrid encapsulates virtualScrollContainer with isolation: isolate and z-index: 1', () => {
      const scss = fs.readFileSync(
        path.resolve(process.cwd(), 'src/app/admin/components/LeadsTable/LeadsDataGrid.module.scss'),
        'utf8'
      );
      assert.ok(scss.includes('isolation: isolate;'), 'Grid must enforce isolation: isolate');
      assert.ok(scss.includes('z-index: 1;'), 'Grid container must enforce z-index: 1');
    });

    it('verifies LeadsDataGrid sets Col 9 to 190px ensuring collision-free action buttons', () => {
      const scss = fs.readFileSync(
        path.resolve(process.cwd(), 'src/app/admin/components/LeadsTable/LeadsDataGrid.module.scss'),
        'utf8'
      );
      assert.ok(scss.includes('190px;'), 'Col 9 must have 190px track width to avoid button spillage');
    });

    it('verifies AdminHeader maintains z-index: 100 on page scroll', () => {
      const scss = fs.readFileSync(
        path.resolve(process.cwd(), 'src/app/admin/components/layout/AdminHeader.module.scss'),
        'utf8'
      );
      assert.ok(scss.includes('z-index: 100;'), 'AdminHeader must have z-index: 100');
    });
  });

  describe('Block 2: Inbound Leads Header CTA & Row Actions', () => {
    it('verifies NewLeadHeaderButton complies with WCAG 2.5.3 (Label in Name) and OS shortcut detection', () => {
      const file = fs.readFileSync(
        path.resolve(process.cwd(), 'src/app/admin/(workspace)/leads/NewLeadHeaderButton.tsx'),
        'utf8'
      );
      assert.ok(file.includes('aria-label="Log New Lead"'), 'Must match visible button label for WCAG 2.5.3');
      assert.ok(file.includes('open-new-lead-modal'), 'Must dispatch open-new-lead-modal event');
      assert.ok(file.includes("setShortcutText(isMac ? '⌘L' : 'Ctrl+L')"), 'Must dynamically switch shortcut text by OS');
    });

    it('verifies NewLeadHeaderButton enforces 44px touch target expander with zero drop shadows', () => {
      const scss = fs.readFileSync(
        path.resolve(process.cwd(), 'src/app/admin/(workspace)/leads/leads.module.scss'),
        'utf8'
      );
      assert.ok(scss.includes('min-width: 44px;'), 'Must have min 44px touch target');
      assert.ok(scss.includes('min-height: 44px;'), 'Must have min 44px touch target');
      assert.ok(!scss.includes('box-shadow: 0 2px 8px'), 'Must not use drop shadows (Rule R-05)');
    });

    it('verifies LeadsDataGrid renders accessible View button on all leads', () => {
      const grid = fs.readFileSync(
        path.resolve(process.cwd(), 'src/app/admin/components/LeadsTable/LeadsDataGrid.tsx'),
        'utf8'
      );
      assert.ok(grid.includes('rowInspectBtn'), 'Must render inspect button');
      assert.ok(grid.includes('Open Client Dossier & Touchpoint Notes'), 'Must provide descriptive title');
      assert.ok(grid.includes('Inspect dossier for ${lead.company || lead.name}'), 'Must provide contextual aria-label');
    });
  });

  describe('Block 3: Status Dropdown Collision & Hex Sanitization', () => {
    it('verifies InlineStatusSelect has upward-flip collision detection against scroll viewport', () => {
      const tsx = fs.readFileSync(
        path.resolve(process.cwd(), 'src/app/admin/components/LeadsTable/InlineStatusSelect.tsx'),
        'utf8'
      );
      assert.ok(tsx.includes('openUpward'), 'Must track openUpward state');
      assert.ok(tsx.includes('scrollParent'), 'Must check against closest virtualScrollContainer');
      assert.ok(tsx.includes('hexToRgba'), 'Must safely convert colors via hexToRgba');
    });

    it('verifies InlineStatusSelect sanitizes white (#ffffff) color codes to slate (#475569)', () => {
      const tsx = fs.readFileSync(
        path.resolve(process.cwd(), 'src/app/admin/components/LeadsTable/InlineStatusSelect.tsx'),
        'utf8'
      );
      assert.ok(tsx.includes('#475569'), 'Must fallback to dark slate for white text contrast');
      assert.ok(tsx.includes('#ffffff'), 'Must check for #ffffff white text');
    });
  });

  describe('Block 4: Pure Dossier Utilities Runtime Invariant Tests', () => {
    it('accurately formats monetary values in Indian Lakhs and Crores via formatDossierCurrency', () => {
      assert.strictEqual(formatDossierCurrency(0), '₹0.00');
      assert.strictEqual(formatDossierCurrency(-500), '₹0.00');
      assert.strictEqual(formatDossierCurrency(NaN), '₹0.00');
      assert.strictEqual(formatDossierCurrency(206000), '₹2.06 L');
      assert.strictEqual(formatDossierCurrency(1500000), '₹15.00 L');
      assert.strictEqual(formatDossierCurrency(15000000), '₹1.50 Cr');
      assert.strictEqual(formatDossierCurrency(27500000), '₹2.75 Cr');
    });

    it('sanitizes telephone strings into RFC 3966 URIs via sanitizeTelUri', () => {
      assert.strictEqual(sanitizeTelUri(null), null);
      assert.strictEqual(sanitizeTelUri(''), null);
      assert.strictEqual(sanitizeTelUri('123'), null); // too short
      assert.strictEqual(sanitizeTelUri('+971 (50) 123-4567'), 'tel:+971501234567');
      assert.strictEqual(sanitizeTelUri('+91 98765 43210'), 'tel:+919876543210');
    });

    it('generates prefilled WhatsApp click-to-chat deep links via createWhatsAppUri', () => {
      assert.strictEqual(createWhatsAppUri(null, 'LD-101', 'Farhan'), null);
      assert.strictEqual(createWhatsAppUri('123', 'LD-101', 'Farhan'), null);
      const uri = createWhatsAppUri('+971 50 123 4567', 'LD-10347', 'Zayd Al-Hadi');
      assert.ok(uri?.startsWith('https://wa.me/971501234567?text='), 'Must target correct international number');
      assert.ok(uri?.includes('LD-10347'), 'Must include reference token');
      assert.ok(uri?.includes('Zayd'), 'Must include client name');
    });

    it('formats brief values across arrays, objects, booleans, and nulls via formatBriefValue', () => {
      assert.strictEqual(formatBriefValue(null), 'Not Specified');
      assert.strictEqual(formatBriefValue(undefined), 'Not Specified');
      assert.strictEqual(formatBriefValue(''), 'Not Specified');
      assert.strictEqual(formatBriefValue(true), 'Yes');
      assert.strictEqual(formatBriefValue(false), 'No');
      assert.strictEqual(formatBriefValue(['Web Design', 'SEO', 'Branding']), 'Web Design, SEO, Branding');
      assert.strictEqual(formatBriefValue({ tier: 'enterprise' }), '{\n  "tier": "enterprise"\n}');
      assert.strictEqual(formatBriefValue('Custom string'), 'Custom string');
    });

    it('extracts avatar initials cleanly via getDossierInitials', () => {
      assert.strictEqual(getDossierInitials(null), 'UN');
      assert.strictEqual(getDossierInitials(''), 'UN');
      assert.strictEqual(getDossierInitials('Unassigned'), 'UN');
      assert.strictEqual(getDossierInitials('Zayd'), 'ZA');
      assert.strictEqual(getDossierInitials('Zayd Al-Hadi'), 'ZA');
      assert.strictEqual(getDossierInitials('Sarah Fatima Mansoor'), 'SM');
    });

    it('computes relative duration strings via formatRelativeTime', () => {
      assert.strictEqual(formatRelativeTime(null), 'Pending');
      const now = new Date('2026-10-20T12:00:00Z');
      const tenMinsAgo = new Date('2026-10-20T11:50:00Z').toISOString();
      const threeHoursAgo = new Date('2026-10-20T09:00:00Z').toISOString();
      const twoDaysAgo = new Date('2026-10-18T12:00:00Z').toISOString();

      assert.strictEqual(formatRelativeTime(tenMinsAgo, now), '10m ago');
      assert.strictEqual(formatRelativeTime(threeHoursAgo, now), '3h ago');
      assert.strictEqual(formatRelativeTime(twoDaysAgo, now), '2d ago');
    });

    it('filters out synthetic benchmark keys (batch_id, synthetic_benchmark, lead_index)', () => {
      const payload = {
        batch_id: 'sprint-10.2-bench',
        synthetic_benchmark: true,
        lead_index: 8501,
        benchmark_run: 'run-44',
        simulated: true,
        projectDescription: 'Full brand identity overhaul and Next.js portal development',
        timeline: 'Q1 2027',
      };
      const entries = extractBriefEntries(payload);
      assert.strictEqual(entries.length, 2, 'Must filter out all 5 synthetic simulation keys');
      assert.strictEqual(entries[0][0], 'projectDescription');
      assert.strictEqual(entries[1][0], 'timeline');
    });

    it('maps genuine discovery keys to professional human labels', () => {
      assert.strictEqual(formatBriefLabel('projectDescription'), 'Project Scope & Goals');
      assert.strictEqual(formatBriefLabel('timeline'), 'Target Launch Window');
      assert.strictEqual(formatBriefLabel('inspirationLinks'), 'Inspiration References');
      assert.strictEqual(formatBriefLabel('extraNotes'), 'Additional Client Notes');
      assert.strictEqual(formatBriefLabel('custom_scope_item'), 'CUSTOM SCOPE ITEM');
    });
  });

  describe('Block 5: Lead Data Management & Database Invariants', () => {
    it('validates updateLeadDetailsSchema accepts comprehensive scope updates', () => {
      const validPayload = {
        leadId: 'a1111111-1111-1111-1111-111111111111',
        name: 'Tariq Al-Mansoor',
        company: 'Apex Luxury Properties',
        companyWebsite: 'https://apexluxury.ae',
        industry: 'Real Estate & Hospitality',
        email: 'tariq@apexluxury.ae',
        phone: '+971 50 123 4567',
        preferredChannel: 'WhatsApp',
        serviceCategory: 'UI/UX Design',
        budgetBracket: '₹15L - ₹30L',
        expectedValue: 2500000,
        priority: 'High',
        notes: 'Client reviewed scope. Awaiting MSA signature.',
      };

      const result = updateLeadDetailsSchema.safeParse(validPayload);
      assert.ok(result.success, 'Valid payload must parse successfully');
      if (result.success) {
        assert.strictEqual(result.data.expectedValue, 2500000);
        assert.strictEqual(result.data.serviceCategory, 'UI/UX Design');
      }
    });

    it('rejects invalid UUID, negative valuations, or invalid email in updateLeadDetailsSchema', () => {
      const invalidPayload = {
        leadId: 'invalid-uuid',
        expectedValue: -500,
        email: 'not-an-email',
      };
      const result = updateLeadDetailsSchema.safeParse(invalidPayload);
      assert.strictEqual(result.success, false, 'Must reject invalid parameters');
    });

    it('verifies updateLeadDetailsAction enforces field_update activity_type and contact coordinate checks', () => {
      const actionFile = fs.readFileSync(
        path.resolve(process.cwd(), 'src/app/actions/leads.ts'),
        'utf8'
      );
      assert.ok(actionFile.includes("activity_type: 'field_update'"), 'Must strictly use field_update to comply with PostgreSQL check constraint');
      assert.ok(actionFile.includes('!finalEmail && !finalPhone'), 'Must enforce contact coordinate invariant');
      assert.ok(actionFile.includes('sanitizeHtml(trimmed)'), 'Must sanitize name input');
      assert.ok(actionFile.includes('activityError'), 'Must handle and log activity error');
    });

    it('verifies EditLeadModal implements Escape key listener, Tab focus trap, and 44px touch targets', () => {
      const modal = fs.readFileSync(
        path.resolve(process.cwd(), 'src/app/admin/components/modals/EditLeadModal.tsx'),
        'utf8'
      );
      const scss = fs.readFileSync(
        path.resolve(process.cwd(), 'src/app/admin/components/modals/EditLeadModal.module.scss'),
        'utf8'
      );
      assert.ok(modal.includes("e.key === 'Escape'"), 'Must handle Escape key dismissal');
      assert.ok(modal.includes("key === 'Tab'") || modal.includes("key !== 'Tab'"), 'Must implement Tab key focus trap');
      assert.ok(modal.includes('ref={dialogRef}'), 'Must bind dialogRef for focus management');
      assert.ok(scss.includes('min-width: 44px;'), 'Must have 44px touch target expander');
      assert.ok(scss.includes('rgba(0, 0, 0, 0.6)'), 'Must use Marca Ubi dark backdrop token');
      assert.ok(!scss.includes('rgba(15, 23, 42,'), 'Must not use generic Tailwind slate-900');
    });
  });

  describe('Block 6: Drawer Layout & Typography Polish', () => {
    it('verifies DossierDrawer enforces overflow-x: hidden and scrollbar-gutter: stable', () => {
      const scss = fs.readFileSync(
        path.resolve(process.cwd(), 'src/app/admin/components/DossierDrawer/DossierDrawer.module.scss'),
        'utf8'
      );
      assert.ok(scss.includes('overflow-x: hidden;'), 'Must disable horizontal scrollbar leaking');
      assert.ok(scss.includes('scrollbar-gutter: stable;'), 'Must reserve stable scrollbar gutter');
    });

    it('verifies valuationBadge uses proportional sans-serif with tabular-nums', () => {
      const scss = fs.readFileSync(
        path.resolve(process.cwd(), 'src/app/admin/components/DossierDrawer/DossierDrawer.module.scss'),
        'utf8'
      );
      assert.ok(scss.includes('font-variant-numeric: tabular-nums;'), 'Must enforce tabular-nums on valuationBadge');
    });

    it('verifies ClientDossierDrawer eliminates inline styles for notes edit trigger and sanitizes lorem ipsum', () => {
      const tsx = fs.readFileSync(
        path.resolve(process.cwd(), 'src/app/admin/components/DossierDrawer/ClientDossierDrawer.tsx'),
        'utf8'
      );
      assert.ok(tsx.includes('className={styles.editNotesInlineBtn}'), 'Must use dedicated SCSS class for notes edit');
      assert.ok(!tsx.includes("style={{ background: 'none'"), 'Must not have inline styles on notes button');
      assert.ok(tsx.includes('sanitizeDealNotes'), 'Must filter out synthetic lorem ipsum notes');
    });

    it('verifies QuickActionComposer prevents two-line text wrapping on submit button, tabs, and duration', () => {
      const scss = fs.readFileSync(
        path.resolve(process.cwd(), 'src/app/admin/components/DossierDrawer/DossierDrawer.module.scss'),
        'utf8'
      );
      const composerTsx = fs.readFileSync(
        path.resolve(process.cwd(), 'src/app/admin/components/DossierDrawer/QuickActionComposer.tsx'),
        'utf8'
      );
      // Submit button nowrap
      assert.ok(scss.includes('white-space: nowrap;'), 'Must prevent button or tab text wrapping');
      assert.ok(composerTsx.includes('<span>Note</span>'), 'Must use concise single-word Note tab label');
      assert.ok(scss.includes('grid-template-columns: repeat(5, minmax(0, 1fr))'), 'Must arrange 5 duration presets on single horizontal row');
    });
  });

  describe('Block 7: User Management Canonical Route & Query Parameter Harmonization', () => {
    it('verifies /admin/user-management page exists and redirects cleanly to /admin/team', () => {
      const pagePath = path.resolve(process.cwd(), 'src/app/admin/(workspace)/user-management/page.tsx');
      assert.ok(fs.existsSync(pagePath), 'User management canonical route page.tsx must exist on disk');
      const tsx = fs.readFileSync(pagePath, 'utf8');
      assert.ok(tsx.includes("redirect('/admin/team')"), 'Must redirect cleanly to /admin/team');
    });

    it('verifies src/middleware.ts registers /admin/user-management in ROUTE_TAB_MAP with tabKey: users', () => {
      const middlewarePath = path.resolve(process.cwd(), 'src/middleware.ts');
      const code = fs.readFileSync(middlewarePath, 'utf8');
      assert.ok(
        code.includes("{ prefix: '/admin/user-management', tabKey: 'users' }"),
        'Edge middleware must include /admin/user-management in ROUTE_TAB_MAP'
      );
    });

    it('verifies AdminBreadcrumbs maps user-management to Administration and User Management', () => {
      const breadcrumbPath = path.resolve(process.cwd(), 'src/app/admin/components/layout/AdminBreadcrumbs.tsx');
      const code = fs.readFileSync(breadcrumbPath, 'utf8');
      assert.ok(code.includes("'user-management': 'Administration'"), 'SECTION_MAP must map user-management');
      assert.ok(code.includes("'user-management': 'User Management'"), 'ROUTE_NAME_MAP must map user-management');
      assert.ok(code.includes("users: 'Administration'"), 'SECTION_MAP must map users');
      assert.ok(code.includes("users: 'User Management'"), 'ROUTE_NAME_MAP must map users');
    });

    it('verifies LeadsWorkspaceClient hydrates drawer from both canonical id and legacy leadId', () => {
      const clientPath = path.resolve(process.cwd(), 'src/app/admin/(workspace)/leads/LeadsWorkspaceClient.tsx');
      const code = fs.readFileSync(clientPath, 'utf8');
      assert.ok(
        code.includes("searchParams.get('id') || searchParams.get('leadId')"),
        'LeadsWorkspaceClient must hydrate active drawer lead ID from id or leadId'
      );
      assert.ok(code.includes("url.searchParams.delete('id')"), 'handleCloseDrawer must delete id from searchParams');
      assert.ok(code.includes("url.searchParams.delete('leadId')"), 'handleCloseDrawer must delete leadId from searchParams');
    });

    it('verifies AdminWorkspaceShell LeadUrlSync harmonizes both id and leadId parameters', () => {
      const shellPath = path.resolve(process.cwd(), 'src/app/admin/components/layout/AdminWorkspaceShell.tsx');
      const code = fs.readFileSync(shellPath, 'utf8');
      assert.ok(
        code.includes("searchParams.get('id') || searchParams.get('leadId')"),
        'AdminWorkspaceShell LeadUrlSync must check id or leadId'
      );
    });

    it('verifies AdminLeadsPageProps and AdminDealsPageProps support canonical id parameter', () => {
      const leadsPage = fs.readFileSync(
        path.resolve(process.cwd(), 'src/app/admin/(workspace)/leads/page.tsx'),
        'utf8'
      );
      const dealsPage = fs.readFileSync(
        path.resolve(process.cwd(), 'src/app/admin/(workspace)/deals/page.tsx'),
        'utf8'
      );
      assert.ok(leadsPage.includes('id?: string;'), 'AdminLeadsPageProps must accept id');
      assert.ok(dealsPage.includes('id?: string;'), 'AdminDealsPageProps must accept id');
    });
  });

  describe('Block 8: Decoupled Tailwind v4 & Sass Compilation Pipeline', () => {
    it('verifies src/app/globals.css exists with native Tailwind v4 import and theme tokens', () => {
      const cssPath = path.resolve(process.cwd(), 'src/app/globals.css');
      assert.ok(fs.existsSync(cssPath), 'src/app/globals.css must exist');
      const css = fs.readFileSync(cssPath, 'utf8');
      assert.ok(css.includes('@import "tailwindcss";'), 'globals.css must import tailwindcss');
      assert.ok(css.includes('@theme inline'), 'globals.css must define @theme inline block');
      assert.ok(css.includes('--color-cta-orange: #ff6100;'), 'globals.css must map CTA orange');
      assert.ok(css.includes('.type-display-giant'), 'globals.css must include typography utility classes');
    });

    it('verifies src/app/globals.scss is purged of Tailwind directives and enforces explicit .scss extensions', () => {
      const scssPath = path.resolve(process.cwd(), 'src/app/globals.scss');
      assert.ok(fs.existsSync(scssPath), 'src/app/globals.scss must exist');
      const scss = fs.readFileSync(scssPath, 'utf8');
      assert.ok(!scss.includes('@use "tailwindcss"'), 'globals.scss must not contain @use "tailwindcss"');
      assert.ok(!scss.includes('@theme'), 'globals.scss must not contain @theme');
      assert.ok(scss.includes('@import "./components/WorksSection/style.scss";'), 'WorksSection must have .scss extension');
      assert.ok(scss.includes('@import "./components/Footer/style.scss";'), 'Footer must have .scss extension');
    });

    it('verifies src/app/layout.tsx imports both globals.css and globals.scss in sequence', () => {
      const layoutPath = path.resolve(process.cwd(), 'src/app/layout.tsx');
      const code = fs.readFileSync(layoutPath, 'utf8');
      assert.ok(code.includes('import "./globals.css";'), 'layout.tsx must import globals.css');
      assert.ok(code.includes('import "./globals.scss";'), 'layout.tsx must import globals.scss');
    });

    it('verifies canonical root not-found.tsx exists and provides dark luxury 404 boundary', () => {
      const notFoundPath = path.resolve(process.cwd(), 'src/app/not-found.tsx');
      assert.ok(fs.existsSync(notFoundPath), 'src/app/not-found.tsx must exist');
      const code = fs.readFileSync(notFoundPath, 'utf8');
      assert.ok(code.includes('RootNotFound'), 'Root not-found must export RootNotFound');
      assert.ok(code.includes('404 • Resource Not Found'), 'Must render high-contrast 404 message');
      assert.ok(code.includes('href="/"'), 'Must link to Studio Home');
      assert.ok(code.includes('href="/admin"'), 'Must link to Workspace');
    });
  });

  describe('Block 9: User Management Navigation, Scrim Stacking & RBAC Synchronization', () => {
    it('verifies AdminSidebar.module.scss elevates .sidebar to z-index: 10000 above drawer scrims', () => {
      const sidebarScssPath = path.resolve(process.cwd(), 'src/app/admin/components/layout/AdminSidebar.module.scss');
      const scss = fs.readFileSync(sidebarScssPath, 'utf8');
      assert.ok(scss.includes('z-index: 10000;'), 'AdminSidebar must have z-index: 10000');
    });

    it('verifies AdminMobileDrawer elevates backdrop and drawer above overlay drawers', () => {
      const mobileScssPath = path.resolve(process.cwd(), 'src/app/admin/components/layout/AdminMobileDrawer.module.scss');
      const scss = fs.readFileSync(mobileScssPath, 'utf8');
      assert.ok(scss.includes('z-index: 10001;'), 'Backdrop must have z-index: 10001');
      assert.ok(scss.includes('z-index: 10002;'), 'Drawer must have z-index: 10002');
    });

    it('verifies AdminWorkspaceShell monitors pathname changes to reset drawers and clear scroll locks', () => {
      const shellPath = path.resolve(process.cwd(), 'src/app/admin/components/layout/AdminWorkspaceShell.tsx');
      const code = fs.readFileSync(shellPath, 'utf8');
      assert.ok(code.includes('usePathname'), 'AdminWorkspaceShell must consume usePathname');
      assert.ok(code.includes('setIsDrawerOpen(false);'), 'Must reset drawer state on navigation');
      assert.ok(code.includes("document.body.style.overflow = '';"), 'Must reset document overflow on navigation');
    });

    it('verifies src/middleware.ts checks hasExplicitAuthClaims to prevent false-positive role lockouts', () => {
      const mwPath = path.resolve(process.cwd(), 'src/middleware.ts');
      const code = fs.readFileSync(mwPath, 'utf8');
      assert.ok(code.includes('hasExplicitAuthClaims'), 'Middleware must define hasExplicitAuthClaims check');
      assert.ok(code.includes('if (matchingRoute && hasExplicitAuthClaims)'), 'Must guard only when explicit claims exist');
    });

    it('verifies src/app/actions/auth.ts synchronizes profiles role and allowed_tabs into app_metadata', () => {
      const authPath = path.resolve(process.cwd(), 'src/app/actions/auth.ts');
      const code = fs.readFileSync(authPath, 'utf8');
      assert.ok(code.includes('SEC-03: Synchronize profile role and allowed_tabs into app_metadata'), 'auth.ts must include SEC-03 sync');
      assert.ok(code.includes('adminClient.auth.admin.updateUserById'), 'Must synchronize via adminClient');
    });
  });
  describe('Block 10: Timeframe Query Synchronization & Dynamic Telemetry Invariants', () => {
    it('verifies timeframeToSlug and slugToTimeframeLabel mappings across all supported periods', async () => {
      const { timeframeToSlug, slugToTimeframeLabel } = await import(
        '../../src/app/admin/lib/timeframeUtils'
      );
      assert.equal(timeframeToSlug('Last 7 Days'), '7d');
      assert.equal(timeframeToSlug('7d'), '7d');
      assert.equal(timeframeToSlug('Last 30 Days'), '30d');
      assert.equal(timeframeToSlug(undefined), '30d');
      assert.equal(timeframeToSlug(null), '30d');
      assert.equal(timeframeToSlug('Last 90 Days'), '90d');
      assert.equal(timeframeToSlug('This Quarter'), 'quarter');
      assert.equal(timeframeToSlug('This Year'), 'year');

      assert.equal(slugToTimeframeLabel('7d'), 'Last 7 Days');
      assert.equal(slugToTimeframeLabel('30d'), 'Last 30 Days');
      assert.equal(slugToTimeframeLabel('90d'), 'Last 90 Days');
      assert.equal(slugToTimeframeLabel('quarter'), 'This Quarter');
      assert.equal(slugToTimeframeLabel('year'), 'This Year');
    });

    it('verifies resolveTimeframeBounds calculates precise intervals and cadences', async () => {
      const { resolveTimeframeBounds } = await import(
        '../../src/app/admin/lib/timeframeUtils'
      );
      const ref = new Date('2026-10-22T12:00:00Z');

      const b7d = resolveTimeframeBounds('7d', ref);
      assert.equal(b7d.slug, '7d');
      assert.equal(b7d.cadenceLabel, 'WoW');
      assert.equal(b7d.intervalType, 'daily');
      assert.equal(b7d.currentEnd.getTime() - b7d.currentStart.getTime(), 7 * 86400000);

      const b30d = resolveTimeframeBounds('30d', ref);
      assert.equal(b30d.slug, '30d');
      assert.equal(b30d.cadenceLabel, 'MoM');
      assert.equal(b30d.intervalType, 'weekly');
      assert.equal(b30d.currentEnd.getTime() - b30d.currentStart.getTime(), 30 * 86400000);

      const b90d = resolveTimeframeBounds('90d', ref);
      assert.equal(b90d.slug, '90d');
      assert.equal(b90d.cadenceLabel, 'QoQ');

      const bQuarter = resolveTimeframeBounds('quarter', ref);
      assert.equal(bQuarter.slug, 'quarter');
      assert.equal(bQuarter.cadenceLabel, 'QoQ');

      const bYear = resolveTimeframeBounds('year', ref);
      assert.equal(bYear.slug, 'year');
      assert.equal(bYear.cadenceLabel, 'YoY');
    });

    it('verifies calculateMetricDelta protects against IEEE 754 zero-division anomalies', async () => {
      const { calculateMetricDelta } = await import(
        '../../src/app/admin/lib/timeframeUtils'
      );
      assert.equal(calculateMetricDelta(100, 0), 100.0);
      assert.equal(calculateMetricDelta(0, 0), 0.0);
      assert.equal(calculateMetricDelta(150, 100), 50.0);
      assert.equal(calculateMetricDelta(80, 100), -20.0);
    });

    it('verifies generateTimeframeSplinePoints synthesizes dynamic intervals', async () => {
      const { generateTimeframeSplinePoints } = await import(
        '../../src/app/admin/lib/timeframeUtils'
      );
      const p7d = generateTimeframeSplinePoints('7d', 480000);
      assert.equal(p7d.length, 7);
      assert.equal(p7d[0].month, 'Mon');

      const p30d = generateTimeframeSplinePoints('30d', 4280000);
      assert.equal(p30d.length, 5);
      assert.equal(p30d[0].month, 'W1');

      const p90d = generateTimeframeSplinePoints('90d', 11250000);
      assert.equal(p90d.length, 3);

      const pYear = generateTimeframeSplinePoints('year', 38400000);
      assert.equal(pYear.length, 4);
      assert.equal(pYear[0].month, 'Q1');
    });

    it('verifies ExecutiveMasthead binds URL query synchronization with React 19 transitions', () => {
      const code = fs.readFileSync(
        path.resolve(process.cwd(), 'src/app/admin/components/Dashboard/ExecutiveMasthead.tsx'),
        'utf8'
      );
      assert.ok(code.includes('useRouter'), 'Must import useRouter');
      assert.ok(code.includes('useSearchParams'), 'Must import useSearchParams');
      assert.ok(code.includes('useTransition'), 'Must import useTransition');
      assert.ok(code.includes("params.set('timeframe', targetSlug);"), 'Must mutate timeframe query param');
      assert.ok(code.includes('router.push('), 'Must push updated search parameters to router');
    });

    it('verifies page.tsx declares async searchParams and passes reactive props to all visual cards', () => {
      const code = fs.readFileSync(
        path.resolve(process.cwd(), 'src/app/admin/(workspace)/page.tsx'),
        'utf8'
      );
      assert.ok(code.includes('searchParams?: Promise<{'), 'page.tsx must accept async searchParams');
      assert.ok(code.includes('resolveTimeframeBounds'), 'Must resolve temporal boundaries');
      assert.ok(code.includes('<ExecutiveMasthead selectedTimeframe={bounds.label} />'), 'Must pass active label to Masthead');
      assert.ok(code.includes('cadenceLabel={bounds.cadenceLabel}'), 'Must pass dynamic cadence to KPI grid');
      assert.ok(code.includes('dataPoints={revenueSplinePoints}'), 'Must pass dynamic spline points to RevenueDynamicsCard');
      assert.ok(code.includes('stages={dynamicStages}'), 'Must pass dynamic stages array to PipelineAllocationCard');
    });
  });
});
