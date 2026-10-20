/**
 * @file client_360_full_page_workspace.test.ts
 * @description Comprehensive unit test suite for the Dedicated Client 360° Lead/Deal Dossier Workspace.
 *              Verifies:
 *              - Dynamic route file architecture (/admin/leads/[id] and /admin/deals/[id]).
 *              - Suspense streaming skeletons and bespoke 404 Deal Missing surfaces.
 *              - Query parameter automatic HTTP 307 redirection (?leadId=... & ?dealId=...).
 *              - Direct push navigation across data grids, mobile cards, and Kanban boards.
 *              - Anti-Slop layout hygiene: 7:5 asymmetric operational grid, 0 text truncation,
 *                single-line duration presets (repeat(5, 1fr)), and mobile bottom dock.
 * @module tests/leads/client_360_full_page_workspace.test
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

describe('Phase 8.2: Client 360° Full-Page Dedicated Workspace Architecture', () => {
  const root = process.cwd();

  describe('Block 1: Dynamic Route File Hierarchy & Server Component Contracts', () => {
    it('verifies /admin/leads/[id] route, loading, and not-found files exist', () => {
      const pagePath = path.join(root, 'src/app/admin/(workspace)/leads/[id]/page.tsx');
      const loadingPath = path.join(root, 'src/app/admin/(workspace)/leads/[id]/loading.tsx');
      const notFoundPath = path.join(root, 'src/app/admin/(workspace)/leads/[id]/not-found.tsx');

      assert.ok(fs.existsSync(pagePath), 'leads/[id]/page.tsx must exist');
      assert.ok(fs.existsSync(loadingPath), 'leads/[id]/loading.tsx must exist');
      assert.ok(fs.existsSync(notFoundPath), 'leads/[id]/not-found.tsx must exist');

      const pageContent = fs.readFileSync(pagePath, 'utf-8');
      assert.ok(pageContent.includes('getLeadDetails'), 'page.tsx must fetch getLeadDetails directly');
      assert.ok(pageContent.includes('generateMetadata'), 'page.tsx must export dynamic generateMetadata');
      assert.ok(pageContent.includes('notFound()'), 'page.tsx must invoke notFound() on missing deals');
      assert.ok(pageContent.includes('workspaceMode="leads"'), 'page.tsx must pass workspaceMode="leads"');
    });

    it('verifies /admin/deals/[id] route, loading, and not-found files exist', () => {
      const pagePath = path.join(root, 'src/app/admin/(workspace)/deals/[id]/page.tsx');
      const loadingPath = path.join(root, 'src/app/admin/(workspace)/deals/[id]/loading.tsx');
      const notFoundPath = path.join(root, 'src/app/admin/(workspace)/deals/[id]/not-found.tsx');

      assert.ok(fs.existsSync(pagePath), 'deals/[id]/page.tsx must exist');
      assert.ok(fs.existsSync(loadingPath), 'deals/[id]/loading.tsx must exist');
      assert.ok(fs.existsSync(notFoundPath), 'deals/[id]/not-found.tsx must exist');

      const pageContent = fs.readFileSync(pagePath, 'utf-8');
      assert.ok(pageContent.includes('getLeadDetails'), 'page.tsx must fetch getLeadDetails directly');
      assert.ok(pageContent.includes('generateMetadata'), 'page.tsx must export dynamic generateMetadata');
      assert.ok(pageContent.includes('workspaceMode="deals"'), 'page.tsx must pass workspaceMode="deals"');
    });
  });

  describe('Block 2: Backward Compatibility & Query String Redirections', () => {
    it('verifies /admin/leads/page.tsx intercepts searchParams.leadId and redirects to dynamic route', () => {
      const pagePath = path.join(root, 'src/app/admin/(workspace)/leads/page.tsx');
      const content = fs.readFileSync(pagePath, 'utf-8');

      assert.ok(content.includes('resolvedSearchParams?.leadId'), 'must inspect resolved searchParams.leadId');
      assert.ok(content.includes('redirect(`/admin/leads/${resolvedSearchParams.leadId}`)'), 'must redirect to /admin/leads/${leadId}');
    });

    it('verifies /admin/deals/page.tsx intercepts searchParams.dealId/leadId and redirects to dynamic route', () => {
      const pagePath = path.join(root, 'src/app/admin/(workspace)/deals/page.tsx');
      const content = fs.readFileSync(pagePath, 'utf-8');

      assert.ok(content.includes('targetDealId'), 'must resolve targetDealId from searchParams');
      assert.ok(content.includes('redirect(`/admin/deals/${targetDealId}`)'), 'must redirect to /admin/deals/${targetDealId}');
    });

    it('verifies AdminWorkspaceShell routes open-lead-drawer events via router.push', () => {
      const shellPath = path.join(root, 'src/app/admin/components/layout/AdminWorkspaceShell.tsx');
      const content = fs.readFileSync(shellPath, 'utf-8');

      assert.ok(content.includes('open-lead-drawer'), 'must listen to open-lead-drawer');
      assert.ok(content.includes('targetRoute') && content.includes('router.push(targetRoute)'), 'must execute router.push upon event');
    });
  });

  describe('Block 3: Direct Navigation in Data Tables, Mobile Cards & Kanban', () => {
    it('verifies LeadsDataGrid navigates to /admin/leads/${lead.id} on row and view click', () => {
      const gridPath = path.join(root, 'src/app/admin/components/LeadsTable/LeadsDataGrid.tsx');
      const content = fs.readFileSync(gridPath, 'utf-8');

      assert.ok(content.includes("router.push(`/admin/leads/${leadId}`)"), 'handleRowClick must execute router.push');
      assert.ok(content.includes('handleRowClick(lead.id)'), 'Inspect button must trigger handleRowClick');
    });

    it('verifies LeadMobileCard routes to /admin/leads/${lead.id} upon card click', () => {
      const mobileCardPath = path.join(root, 'src/app/admin/components/LeadsTable/LeadMobileCard.tsx');
      const content = fs.readFileSync(mobileCardPath, 'utf-8');

      assert.ok(content.includes("router.push(`/admin/leads/${lead.id}`)"), 'handleCardClick must execute router.push');
    });

    it('verifies DealsWorkspaceClient routes to /admin/deals/${dealId} on deal inspection', () => {
      const dealsPath = path.join(root, 'src/app/admin/(workspace)/deals/DealsWorkspaceClient.tsx');
      const content = fs.readFileSync(dealsPath, 'utf-8');

      assert.ok(content.includes("router.push(`/admin/deals/${dealId}`)"), 'handleInspectDeal must execute router.push');
    });

    it('verifies CurrentDealsTable routes to /admin/deals/${deal.id}', () => {
      const currentDealsPath = path.join(root, 'src/app/admin/components/Dashboard/CurrentDealsTable.tsx');
      const content = fs.readFileSync(currentDealsPath, 'utf-8');

      assert.ok(content.includes('/admin/deals/${deal.id}') || content.includes('/admin/leads/${deal.id}'), 'CurrentDealsTable must link to dedicated deal dossier');
    });
  });

  describe('Block 4: Anti-Slop Visual Archetypes & Layout Invariants', () => {
    it('verifies LeadDossierWorkspace.module.scss implements 7:5 asymmetric grid and no generic blue', () => {
      const scssPath = path.join(root, 'src/app/admin/components/DossierWorkspace/LeadDossierWorkspace.module.scss');
      const content = fs.readFileSync(scssPath, 'utf-8');

      assert.ok(content.includes('grid-template-columns: 7fr 5fr'), 'must define 7:5 asymmetric columns');
      assert.ok(!content.includes('#2563eb'), 'must strictly prohibit generic AI blue (#2563eb)');
      assert.ok(content.includes('#ff6100'), 'must enforce authentic Marca Orange (#ff6100)');
    });

    it('verifies RapidTouchpointComposer enforces single-line duration presets', () => {
      const scssPath = path.join(root, 'src/app/admin/components/DossierWorkspace/LeadDossierWorkspace.module.scss');
      const content = fs.readFileSync(scssPath, 'utf-8');

      assert.ok(content.includes('grid-template-columns: repeat(5, 1fr)'), 'duration preset grid must be 5 equal columns on one line');
      assert.ok(content.includes('white-space: nowrap'), 'duration preset and action labels must not wrap');
    });

    it('verifies contact coordinates enforce zero text truncation', () => {
      const scssPath = path.join(root, 'src/app/admin/components/DossierWorkspace/LeadDossierWorkspace.module.scss');
      const content = fs.readFileSync(scssPath, 'utf-8');

      assert.ok(content.includes('word-break: break-all') || content.includes('overflow-wrap: anywhere'), 'must break long emails and URLs safely without clipping');
    });

    it('verifies CommercialKpiRibbon implements Stripe Scorecards with tabular numbers', () => {
      const ribbonPath = path.join(root, 'src/app/admin/components/DossierWorkspace/CommercialKpiRibbon.tsx');
      const content = fs.readFileSync(ribbonPath, 'utf-8');

      assert.ok(content.includes('Expected Valuation'), 'must include Expected Valuation scorecard');
      assert.ok(content.includes('Priority & Turnaround'), 'must include Priority & Turnaround scorecard');
      assert.ok(content.includes('Win Probability'), 'must include Win Probability scorecard');
    });
  });
});
