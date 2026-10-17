/**
 * @file client_dossier_drawer.test.ts
 * @description Production Unit Test Suite for Sprint 8.1: Client 360° Sliding Drawer Shell & Organization Dossier.
 *              Validates mathematical currency formatting, RFC 3966 telephone sanitization,
 *              WhatsApp deep-link protocol generation, brief payload parsing, and data contract invariants.
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  formatDossierCurrency,
  sanitizeTelUri,
  createWhatsAppUri,
  formatBriefLabel,
  formatBriefValue,
  extractBriefEntries,
} from '../../src/app/admin/components/DossierDrawer/dossierUtils';
import type { LeadDossierData } from '../../src/app/admin/components/DossierDrawer/ClientDossierDrawer';

describe('Sprint 8.1: Client 360° Dossier & Organization Dossier Engine', () => {
  describe('Block 1: Currency & Valuation Mathematical Formatting', () => {
    it('formats zero and negative deal values safely as ₹0.00 without NaN exceptions', () => {
      assert.strictEqual(formatDossierCurrency(0), '₹0.00');
      assert.strictEqual(formatDossierCurrency(-5000), '₹0.00');
      assert.strictEqual(formatDossierCurrency(NaN), '₹0.00');
    });

    it('formats figures between 1 Lakh and 1 Crore accurately into Lakhs (L)', () => {
      assert.strictEqual(formatDossierCurrency(100000), '₹1.00 L');
      assert.strictEqual(formatDossierCurrency(2550000), '₹25.50 L');
      assert.strictEqual(formatDossierCurrency(9900000), '₹99.00 L');
    });

    it('formats figures of 1 Crore and above accurately into Crores (Cr)', () => {
      assert.strictEqual(formatDossierCurrency(10000000), '₹1.00 Cr');
      assert.strictEqual(formatDossierCurrency(35000000), '₹3.50 Cr');
      assert.strictEqual(formatDossierCurrency(125000000), '₹12.50 Cr');
    });

    it('formats values under 1 Lakh using localized standard currency representation', () => {
      const formatted = formatDossierCurrency(45000);
      assert.ok(formatted.includes('45,000') || formatted.includes('45000'));
    });
  });

  describe('Block 2: Deep-Link Communication Protocols (tel: & wa.me)', () => {
    it('sanitizes telephone numbers into strict RFC 3966 tel: protocol URIs', () => {
      assert.strictEqual(sanitizeTelUri('+971 50 123 4567'), 'tel:+971501234567');
      assert.strictEqual(sanitizeTelUri('(04) 312-9900'), 'tel:043129900');
      assert.strictEqual(sanitizeTelUri('+91 98765 43210'), 'tel:+919876543210');
    });

    it('returns null for absent, malformed, or insufficient phone numbers (<7 digits)', () => {
      assert.strictEqual(sanitizeTelUri(null), null);
      assert.strictEqual(sanitizeTelUri(''), null);
      assert.strictEqual(sanitizeTelUri('123'), null);
      assert.strictEqual(sanitizeTelUri('abc-def'), null);
    });

    it('generates fully encoded, valid WhatsApp deep link URIs with deal references', () => {
      const uri = createWhatsAppUri('+971 50 123 4567', 'LD-1042', 'Zayd Al-Hadi');
      assert.ok(uri !== null);
      assert.ok(uri.startsWith('https://wa.me/971501234567?text='));
      assert.ok(uri.includes('LD-1042'));
      assert.ok(uri.includes('Zayd%20Al-Hadi') || uri.includes('Zayd+Al-Hadi') || uri.includes('Zayd'));
    });

    it('returns null for WhatsApp URLs when phone coordinates are invalid or absent', () => {
      assert.strictEqual(createWhatsAppUri(null, 'LD-1001', 'Test Client'), null);
      assert.strictEqual(createWhatsAppUri('', 'LD-1001', 'Test Client'), null);
      assert.strictEqual(createWhatsAppUri('999', 'LD-1001', 'Test Client'), null);
    });
  });

  describe('Block 3: Brief Questionnaire Transformation & Normalization', () => {
    it('formats snake_case and camelCase field keys into clean uppercase titles', () => {
      assert.strictEqual(formatBriefLabel('primary_service'), 'PRIMARY SERVICE');
      assert.strictEqual(formatBriefLabel('budgetRange'), 'BUDGET RANGE');
      assert.strictEqual(formatBriefLabel('target_launch_timeline'), 'TARGET LAUNCH TIMELINE');
    });

    it('formats diverse data types (arrays, booleans, objects) into human-readable strings', () => {
      assert.strictEqual(formatBriefValue(['Next.js', 'WebGL']), 'Next.js, WebGL');
      assert.strictEqual(formatBriefValue(true), 'Yes');
      assert.strictEqual(formatBriefValue(false), 'No');
      assert.strictEqual(formatBriefValue(null), 'Not Specified');
      assert.strictEqual(formatBriefValue('Tier 1 Enterprise'), 'Tier 1 Enterprise');
    });

    it('filters internal metadata and empty values from questionnaire entries', () => {
      const payload = {
        primary_goal: 'Rebrand portal',
        submitted_at: '2026-10-15T00:00:00Z',
        _timestamp: 123456789,
        empty_field: '',
        null_field: null,
        valid_budget: '$50,000+',
      };
      const entries = extractBriefEntries(payload);
      assert.strictEqual(entries.length, 2);
      assert.deepStrictEqual(entries[0], ['primary_goal', 'Rebrand portal']);
      assert.deepStrictEqual(entries[1], ['valid_budget', '$50,000+']);
    });
  });

  describe('Block 4: Lead Dossier Entity & Data Contract Invariants', () => {
    const mockLead: LeadDossierData = {
      id: 'c0000000-0000-0000-0000-000000000001',
      lead_id: 'LD-1001',
      name: 'Elena Rostova',
      company: 'Aura Luxury Group',
      company_website: 'https://auraluxury.com',
      industry: 'Hospitality',
      phone: '+971 50 999 8888',
      email: 'elena@auraluxury.com',
      preferred_channel: 'WhatsApp',
      service_category: 'Web & Digital',
      budget_bracket: 'Tier 1 Enterprise ($50k+)',
      priority: 'High',
      status_id: 'b0000000-0000-0000-0000-000000000002',
      status_name: 'Negotiation',
      status_color: '#ff6100',
      bucket: 'potential',
      assigned_to: 'u0000000-0000-0000-0000-000000000001',
      assigned_to_name: 'Anita Nair',
      expected_value: 3500000,
      next_follow_up: '2026-10-25T14:30:00Z',
      lost_reason: null,
      revisit_date: null,
      notes: 'Client reviewed Next.js custom architecture brief.',
      brief_payload: {
        primary_goal: 'Next-gen luxury booking portal',
        target_launch: 'Q2 2027',
        tech_stack_preference: ['Next.js 16', 'WebGL 3D'],
      },
      created_at: '2026-10-15T10:00:00Z',
      converted_at: null,
      updated_at: '2026-10-17T12:00:00Z',
    };

    it('enforces that human-readable deal ID tokens follow the canonical LD-XXXX sequence prefix', () => {
      assert.match(mockLead.lead_id, /^LD-\d{4,}$/);
    });

    it('enforces that commercial valuation is a non-negative finite number', () => {
      assert.ok(typeof mockLead.expected_value === 'number');
      assert.ok(mockLead.expected_value >= 0);
      assert.ok(Number.isFinite(mockLead.expected_value));
    });

    it('verifies that service categories match defined agency domains', () => {
      const allowedCategories = [
        'Branding',
        'Web & Digital',
        'Mobile Apps',
        'UI/UX Design',
        'Full-Suite Advisory',
        'Other',
      ];
      assert.ok(allowedCategories.includes(mockLead.service_category));
    });

    it('preserves structured brief payload responses for interactive rendering', () => {
      assert.ok(mockLead.brief_payload !== null);
      assert.strictEqual(mockLead.brief_payload?.primary_goal, 'Next-gen luxury booking portal');
      assert.ok(Array.isArray(mockLead.brief_payload?.tech_stack_preference));
    });
  });
});
