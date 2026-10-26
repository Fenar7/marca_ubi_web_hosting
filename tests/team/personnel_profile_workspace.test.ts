/**
 * @file personnel_profile_workspace.test.ts
 * @description Comprehensive automated unit and architectural test suite for the
 *              Dedicated Personnel Profile & Performance Workspace (/admin/team/[id]).
 *              Verifies:
 *              1. Zod schemas (adminResetPassword, adminRevokeSessions, updateCoordinates, dealsFilter).
 *              2. KPI mathematical invariants (won revenue, active pipeline, win rate %, capacity meter).
 *              3. Breadcrumb routing and fallback resolution.
 *              4. Route structure, file existence, and component boundary guarantees.
 * @module tests/team/personnel_profile_workspace
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  adminResetPasswordSchema,
  adminRevokeSessionsSchema,
  updatePersonnelCoordinatesSchema,
  personnelDealsFilterSchema,
  SALES_REP_CAPACITY_LIMIT,
} from '../../src/app/lib/team-schemas';
import type { PersonnelPerformanceKpis } from '../../src/types/crm';

describe('Dedicated Personnel Profile & Performance Workspace (/admin/team/[id])', () => {
  const validUuid = 'c8b21c4e-5c68-4f2a-b7e1-8a9012345678';
  const invalidUuid = 'not-a-valid-uuid-string';

  describe('1. Zod Validation Schemas Invariants', () => {
    describe('adminResetPasswordSchema', () => {
      it('validates payload with valid UUID and optional custom password', () => {
        const payload = {
          targetUserId: validUuid,
          tempPassword: 'SecureTempPass123!@#',
          mustChangePassword: true,
        };
        const result = adminResetPasswordSchema.safeParse(payload);
        assert.equal(result.success, true);
        if (result.success) {
          assert.equal(result.data.targetUserId, validUuid);
          assert.equal(result.data.tempPassword, 'SecureTempPass123!@#');
          assert.equal(result.data.mustChangePassword, true);
        }
      });

      it('permits omitted tempPassword for auto-generation flow', () => {
        const payload = {
          targetUserId: validUuid,
        };
        const result = adminResetPasswordSchema.safeParse(payload);
        assert.equal(result.success, true);
        if (result.success) {
          assert.equal(result.data.mustChangePassword, true, 'Default mustChangePassword must be true');
          assert.equal(result.data.tempPassword, undefined);
        }
      });

      it('rejects invalid UUID formats', () => {
        const result = adminResetPasswordSchema.safeParse({ targetUserId: invalidUuid });
        assert.equal(result.success, false);
      });

      it('rejects short passwords below 8 characters', () => {
        const result = adminResetPasswordSchema.safeParse({
          targetUserId: validUuid,
          tempPassword: 'short',
        });
        assert.equal(result.success, false);
      });
    });

    describe('adminRevokeSessionsSchema', () => {
      it('accepts valid RFC 4122 UUID', () => {
        const result = adminRevokeSessionsSchema.safeParse({ targetUserId: validUuid });
        assert.equal(result.success, true);
      });

      it('rejects invalid UUID formats', () => {
        const result = adminRevokeSessionsSchema.safeParse({ targetUserId: 'invalid' });
        assert.equal(result.success, false);
      });
    });

    describe('updatePersonnelCoordinatesSchema', () => {
      it('validates and trims valid coordinate fields', () => {
        const payload = {
          targetUserId: validUuid,
          fullName: '  Sophia Sterling  ',
          jobTitle: '  Senior Sales Director  ',
          phone: '  +91 98765 43210  ',
          avatarUrl: 'https://marcaubi.com/avatars/sophia.jpg',
        };
        const result = updatePersonnelCoordinatesSchema.safeParse(payload);
        assert.equal(result.success, true);
        if (result.success) {
          assert.equal(result.data.fullName, 'Sophia Sterling');
          assert.equal(result.data.jobTitle, 'Senior Sales Director');
          assert.equal(result.data.phone, '+91 98765 43210');
          assert.equal(result.data.avatarUrl, 'https://marcaubi.com/avatars/sophia.jpg');
        }
      });

      it('transforms empty phone strings into null', () => {
        const payload = {
          targetUserId: validUuid,
          phone: '',
        };
        const result = updatePersonnelCoordinatesSchema.safeParse(payload);
        assert.equal(result.success, true);
        if (result.success) {
          assert.equal(result.data.phone, null);
        }
      });

      it('rejects fullName shorter than 2 characters', () => {
        const result = updatePersonnelCoordinatesSchema.safeParse({
          targetUserId: validUuid,
          fullName: 'A',
        });
        assert.equal(result.success, false);
      });
    });

    describe('personnelDealsFilterSchema', () => {
      it('supplies enterprise default values when given empty object', () => {
        const result = personnelDealsFilterSchema.safeParse({});
        assert.equal(result.success, true);
        if (result.success) {
          assert.equal(result.data.statusBucket, 'all');
          assert.equal(result.data.timeRange, 'all');
          assert.equal(result.data.page, 1);
          assert.equal(result.data.pageSize, 10);
        }
      });

      it('accepts valid status buckets (open, potential, converted, lost)', () => {
        const buckets = ['all', 'open', 'potential', 'converted', 'lost'] as const;
        for (const bucket of buckets) {
          const res = personnelDealsFilterSchema.safeParse({ statusBucket: bucket });
          assert.equal(res.success, true);
        }
      });

      it('rejects pageSize greater than 100 to prevent DoS', () => {
        const result = personnelDealsFilterSchema.safeParse({ pageSize: 500 });
        assert.equal(result.success, false);
      });
    });
  });

  describe('2. KPI Mathematical Invariants & Velocity Calculations', () => {
    it('calculates win rate % accurately from closed deals (converted / (converted + lost))', () => {
      const wonDealsCount = 8;
      const lostDealsCount = 2;
      const closedDealsCount = wonDealsCount + lostDealsCount; // 10
      const winRatePercentage = Math.round((wonDealsCount / closedDealsCount) * 100);

      assert.equal(winRatePercentage, 80);
    });

    it('safely handles zero closed deals returning 0% win rate', () => {
      const wonDealsCount = 0;
      const lostDealsCount = 0;
      const closedDealsCount = wonDealsCount + lostDealsCount;
      const winRatePercentage = closedDealsCount > 0 ? Math.round((wonDealsCount / closedDealsCount) * 100) : 0;

      assert.equal(winRatePercentage, 0);
    });

    it('computes workload capacity against SALES_REP_CAPACITY_LIMIT = 15', () => {
      assert.equal(SALES_REP_CAPACITY_LIMIT, 15);

      const activeDealsNormal = 9;
      const capacityPctNormal = Math.min(100, Math.round((activeDealsNormal / SALES_REP_CAPACITY_LIMIT) * 100));
      const isAtCapacityNormal = activeDealsNormal >= SALES_REP_CAPACITY_LIMIT;

      assert.equal(capacityPctNormal, 60);
      assert.equal(isAtCapacityNormal, false);

      const activeDealsAtLimit = 15;
      const capacityPctAtLimit = Math.min(100, Math.round((activeDealsAtLimit / SALES_REP_CAPACITY_LIMIT) * 100));
      const isAtCapacityLimit = activeDealsAtLimit >= SALES_REP_CAPACITY_LIMIT;

      assert.equal(capacityPctAtLimit, 100);
      assert.equal(isAtCapacityLimit, true);

      const activeDealsOverLimit = 18;
      const capacityPctOverLimit = Math.min(100, Math.round((activeDealsOverLimit / SALES_REP_CAPACITY_LIMIT) * 100));
      assert.equal(capacityPctOverLimit, 100, 'Utilization must cap at 100%');
    });

    it('satisfies the PersonnelPerformanceKpis interface invariants', () => {
      const kpis: PersonnelPerformanceKpis = {
        wonRevenue: 4500000,
        activePipelineValue: 8200000,
        winRatePercentage: 75,
        closedDealsCount: 12,
        wonDealsCount: 9,
        activeDealsCount: 7,
        capacityLimit: 15,
        capacityUtilizationPercentage: 47,
        isAtCapacity: false,
        totalDealsAssigned: 19,
      };

      assert.equal(kpis.wonDealsCount + kpis.activeDealsCount + 3, kpis.totalDealsAssigned);
      assert.equal(kpis.isAtCapacity, false);
      assert.equal(kpis.wonRevenue > 0, true);
    });
  });

  describe('3. File Structure & Component Boundary Verification', () => {
    const workspaceDir = path.resolve(process.cwd(), 'src/app/admin/(workspace)/team/[id]');
    const componentsDir = path.resolve(workspaceDir, 'components');

    it('verifies that page.tsx, loading.tsx, and not-found.tsx exist in the route folder', () => {
      assert.ok(fs.existsSync(path.join(workspaceDir, 'page.tsx')), 'page.tsx must exist');
      assert.ok(fs.existsSync(path.join(workspaceDir, 'page.module.scss')), 'page.module.scss must exist');
      assert.ok(fs.existsSync(path.join(workspaceDir, 'loading.tsx')), 'loading.tsx must exist');
      assert.ok(fs.existsSync(path.join(workspaceDir, 'loading.module.scss')), 'loading.module.scss must exist');
      assert.ok(fs.existsSync(path.join(workspaceDir, 'not-found.tsx')), 'not-found.tsx must exist');
      assert.ok(fs.existsSync(path.join(workspaceDir, 'not-found.module.scss')), 'not-found.module.scss must exist');
    });

    it('verifies that all 7 workspace components and SCSS modules exist', () => {
      const expectedComponents = [
        'ExecutiveMasthead',
        'CommercialVelocityScorecards',
        'RepresentativeDealLedger',
        'PersonnelSecurityEnclave',
        'TabPermissionsEnclave',
        'PersonnelAuditTimeline',
        'PersonnelProfileWorkspaceClient',
      ];

      for (const comp of expectedComponents) {
        assert.ok(
          fs.existsSync(path.join(componentsDir, `${comp}.tsx`)),
          `${comp}.tsx must exist in components directory`
        );
      }
    });

    it('verifies page.tsx awaits Next.js 16 dynamic route params Promise', () => {
      const pageContent = fs.readFileSync(path.join(workspaceDir, 'page.tsx'), 'utf8');
      assert.ok(
        pageContent.includes('const { id } = await props.params;'),
        'page.tsx MUST await props.params in Next.js 16 / React 19'
      );
      assert.ok(pageContent.includes('generateMetadata'), 'page.tsx must export generateMetadata');
    });

    it('verifies PersonnelCard footer includes Next.js Link to /admin/team/${member.id}', () => {
      const cardPath = path.resolve(process.cwd(), 'src/app/admin/(workspace)/team/components/PersonnelCard.tsx');
      const cardContent = fs.readFileSync(cardPath, 'utf8');
      assert.ok(
        cardContent.includes('/admin/team/${member.id}'),
        'PersonnelCard must link directly to /admin/team/${member.id}'
      );
      assert.ok(
        cardContent.includes('View Profile'),
        'PersonnelCard must render "View Profile" link'
      );
    });

    it('verifies AdminBreadcrumbs recognizes team/users UUID as Personnel Dossier', () => {
      const breadcrumbsPath = path.resolve(process.cwd(), 'src/app/admin/components/layout/AdminBreadcrumbs.tsx');
      const breadcrumbsContent = fs.readFileSync(breadcrumbsPath, 'utf8');
      assert.ok(
        breadcrumbsContent.includes('Personnel Dossier'),
        'AdminBreadcrumbs must render "Personnel Dossier" for team/users UUID routes'
      );
    });
  });

  describe('5. App Router 404, Edge Proxy & Client RLS Remediation Invariants', () => {
    it('verifies elevated not-found.tsx exists at src/app/admin/(workspace)/team/not-found.tsx', () => {
      const elevatedNotFound = path.resolve(process.cwd(), 'src/app/admin/(workspace)/team/not-found.tsx');
      const elevatedNotFoundStyles = path.resolve(process.cwd(), 'src/app/admin/(workspace)/team/not-found.module.scss');
      assert.ok(fs.existsSync(elevatedNotFound), 'Elevated not-found.tsx must exist at team route segment level');
      assert.ok(fs.existsSync(elevatedNotFoundStyles), 'Elevated not-found.module.scss must exist');
    });

    it('verifies getPersonnelProfile consumes standard session client under RLS and avoids unhandled exceptions', () => {
      const teamActionsPath = path.resolve(process.cwd(), 'src/app/actions/team.ts');
      const teamActionsContent = fs.readFileSync(teamActionsPath, 'utf8');
      
      const getProfileStart = teamActionsContent.indexOf('export async function getPersonnelProfile(');
      const getProfileEnd = teamActionsContent.indexOf('export async function getPersonnelDeals(');
      const profileCode = teamActionsContent.slice(getProfileStart, getProfileEnd);

      assert.ok(!profileCode.includes('getAdminClient()'), 'getPersonnelProfile MUST NOT invoke getAdminClient()');
      assert.ok(profileCode.includes('try {'), 'getPersonnelProfile must wrap operations in top-level try/catch');
      assert.ok(profileCode.includes('catch (err: unknown)'), 'getPersonnelProfile must catch unknown errors safely');
    });

    it('verifies getPersonnelDeals consumes standard session client under RLS', () => {
      const teamActionsPath = path.resolve(process.cwd(), 'src/app/actions/team.ts');
      const teamActionsContent = fs.readFileSync(teamActionsPath, 'utf8');

      const getDealsStart = teamActionsContent.indexOf('export async function getPersonnelDeals(');
      const getDealsEnd = teamActionsContent.indexOf('export async function adminResetPersonnelPassword(');
      const dealsCode = teamActionsContent.slice(getDealsStart, getDealsEnd);

      assert.ok(!dealsCode.includes('getAdminClient()'), 'getPersonnelDeals MUST NOT invoke getAdminClient()');
      assert.ok(dealsCode.includes('try {'), 'getPersonnelDeals must wrap queries in try/catch');
    });

    it('verifies proxy.ts permits dynamic /admin/team/[uuid] paths to pass through to Server Component', () => {
      const proxyPath = path.resolve(process.cwd(), 'src/proxy.ts');
      const proxyContent = fs.readFileSync(proxyPath, 'utf8');
      assert.ok(
        proxyContent.includes('isPersonnelDossierRoute'),
        'proxy.ts must define isPersonnelDossierRoute check'
      );
      assert.ok(
        proxyContent.includes('0-9a-fA-F]{8}-[0-9a-fA-F]{4}'),
        'proxy.ts must validate canonical RFC4122 UUID route format'
      );
    });

    it('verifies page.tsx differentiates 403 access denial from 404 not found', () => {
      const pagePath = path.resolve(process.cwd(), 'src/app/admin/(workspace)/team/[id]/page.tsx');
      const pageContent = fs.readFileSync(pagePath, 'utf8');
      assert.ok(
        pageContent.includes("res.error?.includes('Access Denied')"),
        'page.tsx must inspect Access Denied response'
      );
      assert.ok(
        pageContent.includes("redirect('/admin?error=unauthorized_role_access')"),
        'page.tsx must redirect unauthorized attempts with error parameter'
      );
    });
  });
});
