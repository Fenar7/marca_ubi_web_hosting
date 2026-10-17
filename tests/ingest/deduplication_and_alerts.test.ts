/**
 * @file deduplication_and_alerts.test.ts
 * @description Comprehensive unit test suite for Sprint 5.2 Smart Deduplication State Machine,
 *              Studio Alert Notification Dispatch Bridge & Client Form Ingestion Mappings.
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  evaluateLeadDeduplication,
  type ExistingLeadRecord,
  type IncomingInquiryPayload,
} from '@/app/lib/deduplication';
import { dispatchStudioLeadAlert } from '@/app/lib/notifications';
import { ingestLeadSchema } from '@/app/lib/validations/ingest';

describe('Marca Ubi CRM — Deduplication Engine & Studio Alerts (Sprint 5.2)', () => {
  describe('Section 1: Deduplication State Machine Invariants', () => {
    it('flags an active open lead as MERGE_INQUIRY, elevates priority to High, and schedules overdue follow-up', () => {
      const existing: ExistingLeadRecord = {
        id: '11111111-1111-1111-1111-111111111111',
        lead_id: 'LD-1001',
        name: 'Rashid Al Nuaimi',
        email: 'rashid@alnuaimi.ae',
        phone: '+971501234567',
        priority: 'Medium',
        status_id: 'b0000000-0000-0000-0000-000000000001',
        status_name: 'New',
        status_bucket: 'open',
        inquiry_count: 1,
        assigned_to: null,
        notes: 'Initial inquiry via form',
        brief_payload: {},
        created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      };

      const incoming: IncomingInquiryPayload = {
        name: 'Rashid Al Nuaimi',
        email: 'rashid@alnuaimi.ae',
        phone: '+971501234567',
        company: 'Al Nuaimi Capital',
        notes: 'Urgent expansion proposal needed',
        source_code: 'Website Form',
        brief_payload: { budget: '₹ 50L' },
      };

      const result = evaluateLeadDeduplication(existing, incoming);

      assert.equal(result.action, 'MERGE_INQUIRY');
      assert.equal(result.targetLeadId, 'LD-1001');
      assert.equal(result.triggerOverdue, true);
      assert.equal(result.elevatePriority, true);
      assert.equal(result.newPriority, 'High');
      assert.equal(result.inquiryCountIncrement, 1);
      assert.equal(result.activityType, 'duplicate_inquiry');
      assert.ok(result.activityDescription.includes('elevated to High'));
    });

    it('flags an active potential lead (e.g. Proposal sent) as MERGE_INQUIRY without creating duplicate record', () => {
      const existing: ExistingLeadRecord = {
        id: '22222222-2222-2222-2222-222222222222',
        lead_id: 'LD-1015',
        name: 'Fatima Al Mansoori',
        email: 'fatima@mansoori.ae',
        phone: '+971559876543',
        priority: 'Medium',
        status_id: 'b0000000-0000-0000-0000-000000000004',
        status_name: 'Proposal sent',
        status_bucket: 'potential',
        inquiry_count: 2,
        assigned_to: 'd0000000-0000-0000-0000-000000000002',
        notes: 'Proposal delivered at Gitex',
        brief_payload: {},
        created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      };

      const incoming: IncomingInquiryPayload = {
        name: 'Fatima Al Mansoori',
        email: 'fatima@mansoori.ae',
        phone: '+971559876543',
        notes: 'Requesting revision on branding timeline',
        brief_payload: { revised_timeline: '4 weeks' },
      };

      const result = evaluateLeadDeduplication(existing, incoming);

      assert.equal(result.action, 'MERGE_INQUIRY');
      assert.equal(result.targetLeadId, 'LD-1015');
      assert.equal(result.elevatePriority, true);
      assert.equal(result.newPriority, 'High');
      assert.equal(result.triggerOverdue, true);
    });

    it('reactivates a previously Lost lead within 90-day cooldown to REACTIVATE_LEAD', () => {
      const existing: ExistingLeadRecord = {
        id: '33333333-3333-3333-3333-333333333333',
        lead_id: 'LD-1020',
        name: 'Vikram Sethi',
        email: 'vikram@sethi-ventures.in',
        phone: '+919847012345',
        priority: 'Low',
        status_id: 'b0000000-0000-0000-0000-000000000006',
        status_name: 'Lost',
        status_bucket: 'lost',
        inquiry_count: 1,
        assigned_to: null,
        notes: 'Client paused project due to Q3 budget freeze',
        brief_payload: {},
        created_at: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
      };

      const incoming: IncomingInquiryPayload = {
        name: 'Vikram Sethi',
        email: 'vikram@sethi-ventures.in',
        phone: '+919847012345',
        company: 'Sethi Ventures',
        notes: 'Q4 budget approved, ready to kick off design audit',
      };

      const result = evaluateLeadDeduplication(existing, incoming);

      assert.equal(result.action, 'REACTIVATE_LEAD');
      assert.equal(result.targetLeadId, 'LD-1020');
      assert.equal(result.elevatePriority, true);
      assert.equal(result.newPriority, 'High');
      assert.equal(result.triggerOverdue, true);
      assert.ok(result.activityDescription.includes('Previously lost lead re-engaged'));
    });

    it('generates CREATE_NEW_REENGAGEMENT for converted clients returning for new projects', () => {
      const existing: ExistingLeadRecord = {
        id: '44444444-4444-4444-4444-444444444444',
        lead_id: 'LD-0980',
        name: 'Elena Rostova',
        email: 'elena@monolith-lux.com',
        phone: '+971520001122',
        priority: 'High',
        status_id: 'b0000000-0000-0000-0000-000000000005',
        status_name: 'Converted',
        status_bucket: 'converted',
        inquiry_count: 3,
        assigned_to: 'd0000000-0000-0000-0000-000000000001',
        notes: 'Closed contract for flagship e-commerce redesign',
        brief_payload: {},
        created_at: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 150 * 24 * 60 * 60 * 1000).toISOString(),
        converted_at: new Date(Date.now() - 150 * 24 * 60 * 60 * 1000).toISOString(),
      };

      const incoming: IncomingInquiryPayload = {
        name: 'Elena Rostova',
        email: 'elena@monolith-lux.com',
        company: 'Monolith Luxury Group',
        notes: 'New inquiry for subsidiary mobile application design',
        brief_payload: { subsidiary: 'Monolith Private Aviation' },
      };

      const result = evaluateLeadDeduplication(existing, incoming);

      assert.equal(result.action, 'CREATE_NEW_REENGAGEMENT');
      assert.equal(result.previousLeadId, 'LD-0980');
      assert.equal(result.triggerOverdue, false);
      assert.ok(result.activityDescription.includes('New re-engagement opportunity initiated'));
    });

    it('generates CREATE_NEW_REENGAGEMENT for aged lost leads closed more than 90 days ago', () => {
      const existing: ExistingLeadRecord = {
        id: '55555555-5555-5555-5555-555555555555',
        lead_id: 'LD-0850',
        name: 'David Vance',
        email: 'david@vance-holdings.co.uk',
        phone: '+447911123456',
        priority: 'Low',
        status_id: 'b0000000-0000-0000-0000-000000000006',
        status_name: 'Lost',
        status_bucket: 'lost',
        inquiry_count: 1,
        assigned_to: null,
        notes: 'No response after preliminary quotation',
        brief_payload: {},
        created_at: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString(), // 100 days ago (>90)
      };

      const incoming: IncomingInquiryPayload = {
        name: 'David Vance',
        email: 'david@vance-holdings.co.uk',
        phone: '+447911123456',
        notes: 'Re-evaluating digital agency partners for 2027 roadmap',
      };

      const result = evaluateLeadDeduplication(existing, incoming);

      assert.equal(result.action, 'CREATE_NEW_REENGAGEMENT');
      assert.equal(result.previousLeadId, 'LD-0850');
      assert.equal(result.triggerOverdue, false);
    });
  });

  describe('Section 2: Studio Alert Notification Dispatch Bridge', () => {
    it('dispatches structured notification in console audit mode when webhook URL is unconfigured', async () => {
      const result = await dispatchStudioLeadAlert({
        leadId: 'LD-1055',
        action: 'NEW_LEAD',
        name: 'Tariq Mansoor',
        company: 'Al Khaleej Developments',
        email: 'tariq@alkhaleej.ae',
        phone: '+971505554433',
        source: 'Website Form',
        serviceCategory: 'Web & Digital',
        expectedValue: 4500000, // 45 Lakhs
        priority: 'High',
        notes: 'Inquiry for full luxury website re-platforming',
      });

      assert.equal(result.success, true);
      assert.equal(result.mode, 'console_audit');
      assert.equal(result.delivered, false);
    });

    it('dispatches structured notification for duplicate inquiry with elevated priority', async () => {
      const result = await dispatchStudioLeadAlert({
        leadId: 'LD-1001',
        action: 'MERGE_INQUIRY',
        name: 'Rashid Al Nuaimi',
        company: 'Al Nuaimi Capital',
        email: 'rashid@alnuaimi.ae',
        phone: '+971501234567',
        source: 'Website Form',
        expectedValue: 12500000, // 1.25 Crore
        priority: 'High',
        isDuplicate: true,
        notes: 'Follow-up inquiry submitted',
      });

      assert.equal(result.success, true);
      assert.equal(result.mode, 'console_audit');
    });
  });

  describe('Section 3: Client Form Ingestion Mappings & Serialization', () => {
    it('validates a serialized /start-project payload with rich brief metadata', () => {
      const startProjectPayload = {
        name: 'Zayed Al Nahyan',
        email: 'zayed@nahyan-office.ae',
        phone: '+971501112233',
        company: 'Nahyan Sovereign Wealth',
        company_website: 'https://nahyan-office.ae',
        industry: 'Private Equity & Wealth',
        service_category: 'Full-Suite Advisory',
        budget_bracket: 'Q1 Launch',
        notes: 'Project Scope: Full corporate digital rebranding\n\nAdditional Notes: Confidential NDA required',
        source_name: 'Website Form',
        source_detail: 'Start Project Brief Wizard',
        brief_payload: {
          category: 'AI & Digital Strategy',
          service: 'Enterprise Digital Transformation',
          language: 'English & Arabic',
          projectName: 'Nahyan Sovereign Wealth',
          projectDescription: 'Full corporate digital rebranding',
          industry: 'Private Equity & Wealth',
          website: 'https://nahyan-office.ae',
          timeline: 'Q1 Launch',
          extraNotes: 'Confidential NDA required',
          idempotencyKey: 'test-key-001',
        },
      };

      const parsed = ingestLeadSchema.safeParse(startProjectPayload);
      assert.equal(parsed.success, true);
      if (parsed.success) {
        assert.equal(parsed.data.name, 'Zayed Al Nahyan');
        assert.equal(parsed.data.service_category, 'Full-Suite Advisory');
        assert.equal(parsed.data.source_name, 'Website Form');
        assert.ok(parsed.data.brief_payload);
      }
    });

    it('validates a serialized CompanyProfileModal payload with download intent', () => {
      const modalPayload = {
        name: 'Kareem Benzema',
        email: 'kareem@al-ittihad.sa',
        phone: '+966501234567',
        company: 'Sports & Entertainment',
        company_website: 'https://ittihad.sa',
        source_name: 'Modal Company Profile',
        source_detail: 'Hero Company Profile Download Modal',
        notes: 'Business Type: Sports & Entertainment\n\nInstagram: @kareem\n\nInquiry Note: Looking for branding deck',
        brief_payload: {
          businessType: 'Sports & Entertainment',
          instagramId: '@kareem',
          website: 'https://ittihad.sa',
          message: 'Looking for branding deck',
          submissionId: 'modal-test-uuid',
        },
      };

      const parsed = ingestLeadSchema.safeParse(modalPayload);
      assert.equal(parsed.success, true);
      if (parsed.success) {
        assert.equal(parsed.data.name, 'Kareem Benzema');
        assert.equal(parsed.data.source_name, 'Modal Company Profile');
      }
    });
  });
});
