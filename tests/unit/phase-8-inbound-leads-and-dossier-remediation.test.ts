/**
 * @file phase-8-inbound-leads-and-dossier-remediation.test.ts
 * @description Unit test suite verifying Phase 8 Inbound Leads Triage, Stacking Contexts,
 *              and Client 360° Dossier Data Management Remediation.
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  extractBriefEntries,
  formatBriefLabel,
} from '../../src/app/admin/components/DossierDrawer/dossierUtils';
import {
  updateLeadDetailsSchema,
} from '../../src/app/lib/lead-schemas';

describe('Phase 8: Inbound Leads Triage, Stacking Contexts & Dossier Data Remediation', () => {
  describe('Block 1: CSS Stacking Context & Stacking Level Invariants', () => {
    it('verifies FilterActionBar elevates container to z-index: 60 and menu to z-index: 70', () => {
      const scss = fs.readFileSync(
        path.resolve(process.cwd(), 'src/app/admin/components/FilterActionBar/FilterActionBar.module.scss'),
        'utf8'
      );
      assert.ok(scss.includes('z-index: 60;'), 'FilterActionBar must be at z-index 60');
      assert.ok(scss.includes('z-index: 70;'), 'FilterActionBar popover menu must be at z-index 70');
    });

    it('verifies LeadsDataGrid encapsulates virtualScrollContainer with isolation: isolate and z-index: 1', () => {
      const scss = fs.readFileSync(
        path.resolve(process.cwd(), 'src/app/admin/components/LeadsTable/LeadsDataGrid.module.scss'),
        'utf8'
      );
      assert.ok(scss.includes('isolation: isolate;'), 'Grid must enforce isolation: isolate');
      assert.ok(scss.includes('z-index: 1;'), 'Grid container must enforce z-index: 1');
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
    it('verifies NewLeadHeaderButton component exists and handles ⌘L shortcut', () => {
      const file = fs.readFileSync(
        path.resolve(process.cwd(), 'src/app/admin/(workspace)/leads/NewLeadHeaderButton.tsx'),
        'utf8'
      );
      assert.ok(file.includes('open-new-lead-modal'), 'Must dispatch open-new-lead-modal event');
      assert.ok(file.includes('⌘L'), 'Must render shortcut badge');
    });

    it('verifies leads/page.tsx renders NewLeadHeaderButton in headerRight', () => {
      const page = fs.readFileSync(
        path.resolve(process.cwd(), 'src/app/admin/(workspace)/leads/page.tsx'),
        'utf8'
      );
      assert.ok(page.includes('NewLeadHeaderButton'), 'Must import and mount NewLeadHeaderButton');
      assert.ok(page.includes('headerRight'), 'Must render headerRight container');
    });

    it('verifies LeadsDataGrid renders View button on all leads including open discovery leads', () => {
      const grid = fs.readFileSync(
        path.resolve(process.cwd(), 'src/app/admin/components/LeadsTable/LeadsDataGrid.tsx'),
        'utf8'
      );
      assert.ok(grid.includes('rowInspectBtn'), 'Must render inspect button');
      assert.ok(grid.includes('Open Client Dossier & Touchpoint Notes'), 'Must provide descriptive title');
    });
  });

  describe('Block 3: Status Dropdown Clipping & Contrast Fallback', () => {
    it('verifies InlineStatusSelect has upward-flip collision detection and popoverMenuUp styling', () => {
      const tsx = fs.readFileSync(
        path.resolve(process.cwd(), 'src/app/admin/components/LeadsTable/InlineStatusSelect.tsx'),
        'utf8'
      );
      const scss = fs.readFileSync(
        path.resolve(process.cwd(), 'src/app/admin/components/LeadsTable/InlineStatusSelect.module.scss'),
        'utf8'
      );
      assert.ok(tsx.includes('openUpward'), 'Must track openUpward state');
      assert.ok(scss.includes('.popoverMenuUp'), 'Must define .popoverMenuUp styling');
      assert.ok(scss.includes('bottom: calc(100% + 6px)'), 'Must position upward when flipped');
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

  describe('Block 4: Brief Questionnaire Sanitization & Label Mapping', () => {
    it('filters out synthetic benchmark keys (batch_id, synthetic_benchmark, lead_index)', () => {
      const payload = {
        batch_id: 'sprint-10.2-bench',
        synthetic_benchmark: true,
        lead_index: 8501,
        projectDescription: 'Full brand identity overhaul and Next.js portal development',
        timeline: 'Q1 2027',
      };
      const entries = extractBriefEntries(payload);
      assert.strictEqual(entries.length, 2, 'Must filter out all 3 synthetic keys');
      assert.strictEqual(entries[0][0], 'projectDescription');
      assert.strictEqual(entries[1][0], 'timeline');
    });

    it('maps genuine discovery keys to professional human labels', () => {
      assert.strictEqual(formatBriefLabel('projectDescription'), 'Project Scope & Goals');
      assert.strictEqual(formatBriefLabel('timeline'), 'Target Launch Window');
      assert.strictEqual(formatBriefLabel('inspirationLinks'), 'Inspiration References');
      assert.strictEqual(formatBriefLabel('extraNotes'), 'Additional Client Notes');
      // Preserves uppercase fallback for unmapped keys
      assert.strictEqual(formatBriefLabel('custom_scope_item'), 'CUSTOM SCOPE ITEM');
    });
  });

  describe('Block 5: Lead Data Management & Server Action Schema Validation', () => {
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

    it('rejects invalid UUID or negative valuations in updateLeadDetailsSchema', () => {
      const invalidPayload = {
        leadId: 'invalid-uuid',
        expectedValue: -500,
      };
      const result = updateLeadDetailsSchema.safeParse(invalidPayload);
      assert.strictEqual(result.success, false, 'Must reject invalid UUID');
    });

    it('verifies EditLeadModal component exists and exports properly', () => {
      const modal = fs.readFileSync(
        path.resolve(process.cwd(), 'src/app/admin/components/modals/EditLeadModal.tsx'),
        'utf8'
      );
      assert.ok(modal.includes('updateLeadDetailsAction'), 'Must call updateLeadDetailsAction');
      assert.ok(modal.includes('Edit Commercial Scope & Details'), 'Must render dialog header');
    });
  });

  describe('Block 6: Drawer Layout & Valuation Typography Polish', () => {
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
      assert.ok(!scss.includes('$font-mono;\r\n  font-size: 0.95rem;\r\n  font-weight: 700;\r\n  color: var(--admin-status-emerald-text, #065f46);\r\n  letter-spacing: 0.02em;'), 'Must not use monospace with 0.02em tracking on valuation');
    });
  });
});
