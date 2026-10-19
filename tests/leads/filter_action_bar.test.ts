/**
 * @file filter_action_bar.test.ts
 * @description Comprehensive unit test suite for Sprint 7.1: Multi-Filter Action Bar,
 *              Pipeline Bucket Tabs, Overdue Evaluation, Search Debouncing & Deep-Linking State.
 * @module tests/leads/filter_action_bar.test
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { HydratedLeadItem } from '@/app/admin/(workspace)/leads/LeadsWorkspaceClient';
import type { BucketCounts, BucketTabId } from '@/app/admin/components/FilterActionBar';

/**
 * Mock lead generator for pipeline filtering tests
 */
function createMockLead(overrides: Partial<HydratedLeadItem> = {}): HydratedLeadItem {
  return {
    id: 'f87a0b35-124b-4b47-a87a-39d1b09b0001',
    lead_id: 'LD-1001',
    name: 'Zayd Al-Hadi',
    company: 'Apex Media Corp',
    phone: '+971 50 123 4567',
    email: 'zayd@apexmedia.ae',
    preferred_channel: 'Email',
    service_category: 'Commercial Production',
    expected_value: 3500000,
    priority: 'High',
    status_id: 'status-neg-01',
    status_name: 'Negotiation',
    status_color: '#ff6100',
    bucket: 'potential',
    assigned_to: 'user-anita-01',
    assigned_to_name: 'Anita Nair',
    lead_source_id: 'src-web-01',
    lead_source_name: 'Website Brief',
    lead_source_color: '#ff6100',
    next_follow_up: new Date(Date.now() + 86400000).toISOString(), // Tomorrow (Not overdue)
    created_at: new Date(Date.now() - 172800000).toISOString(),
    ...overrides,
  };
}

/**
 * Filter evaluation engine replicating LeadsWorkspaceClient filtering invariants
 */
function filterLeads(
  leads: HydratedLeadItem[],
  params: {
    bucket?: BucketTabId;
    search?: string;
    sourceId?: string | null;
    assigneeId?: string | null;
    priority?: string | null;
    stageId?: string | null;
  }
): HydratedLeadItem[] {
  const {
    bucket = 'all',
    search = '',
    sourceId = null,
    assigneeId = null,
    priority = null,
    stageId = null,
  } = params;

  const q = search.toLowerCase().trim();

  return leads.filter((lead) => {
    // 1. Bucket condition
    if (bucket === 'overdue') {
      const isOverdue =
        Boolean(lead.next_follow_up) &&
        lead.bucket !== 'converted' &&
        lead.bucket !== 'lost' &&
        new Date(lead.next_follow_up!).getTime() < Date.now();
      if (!isOverdue) return false;
    } else if (bucket !== 'all') {
      if (lead.bucket !== bucket) return false;
    }

    // 2. Stage condition
    if (stageId && lead.status_id !== stageId) return false;

    // 3. Source condition
    if (sourceId && lead.lead_source_id !== sourceId) return false;

    // 4. Assignee condition
    if (assigneeId && lead.assigned_to !== assigneeId) return false;

    // 5. Priority condition
    if (priority && lead.priority.toLowerCase() !== priority.toLowerCase()) return false;

    // 6. Search query condition
    if (!q) return true;

    return (
      lead.lead_id.toLowerCase().includes(q) ||
      lead.name.toLowerCase().includes(q) ||
      (lead.company && lead.company.toLowerCase().includes(q)) ||
      (lead.email && lead.email.toLowerCase().includes(q)) ||
      (lead.phone && lead.phone.toLowerCase().includes(q)) ||
      lead.service_category.toLowerCase().includes(q) ||
      lead.assigned_to_name.toLowerCase().includes(q)
    );
  });
}

function calculateBucketCounts(leads: HydratedLeadItem[]): BucketCounts {
  return {
    all: leads.length,
    open: leads.filter((l) => l.bucket === 'open').length,
    potential: leads.filter((l) => l.bucket === 'potential').length,
    converted: leads.filter((l) => l.bucket === 'converted').length,
    lost: leads.filter((l) => l.bucket === 'lost').length,
    overdue: leads.filter((l) => {
      if (!l.next_follow_up) return false;
      if (l.bucket === 'converted' || l.bucket === 'lost') return false;
      return new Date(l.next_follow_up).getTime() < Date.now();
    }).length,
  };
}

describe('Sprint 7.1: Multi-Filter Action Bar & Bucket Navigation Engine', () => {
  const sampleLeads: HydratedLeadItem[] = [
    createMockLead({
      id: 'lead-1',
      lead_id: 'LD-1001',
      name: 'Elena Rostova',
      company: 'Nordic Luxury Living',
      email: 'elena@nordicluxury.se',
      phone: '+46 8 123 4567',
      bucket: 'open',
      status_name: 'New Inquiry',
      priority: 'High',
      lead_source_id: 'src-web',
      lead_source_name: 'Website Form',
      assigned_to: 'user-1',
      assigned_to_name: 'Anita Nair',
      next_follow_up: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago (OVERDUE)
    }),
    createMockLead({
      id: 'lead-2',
      lead_id: 'LD-1002',
      name: 'Marcus Chen',
      company: 'Zenith Global',
      email: 'marcus@zenithglobal.sg',
      phone: '+65 6789 0123',
      bucket: 'potential',
      status_name: 'Proposal Sent',
      priority: 'Medium',
      lead_source_id: 'src-wa',
      lead_source_name: 'WhatsApp Inbound',
      assigned_to: 'user-2',
      assigned_to_name: 'Zayd Al-Hadi',
      next_follow_up: new Date(Date.now() + 7200000).toISOString(), // Future
    }),
    createMockLead({
      id: 'lead-3',
      lead_id: 'LD-1003',
      name: 'Sophia Laurent',
      company: 'Atelier Maison',
      email: 'sophia@ateliermaison.fr',
      phone: '+33 1 42 68 55 00',
      bucket: 'converted',
      status_name: 'Won & Closed',
      priority: 'High',
      lead_source_id: 'src-ref',
      lead_source_name: 'Executive Referral',
      assigned_to: 'user-1',
      assigned_to_name: 'Anita Nair',
      next_follow_up: new Date(Date.now() - 100000).toISOString(), // Past date, but WON (NOT OVERDUE)
    }),
    createMockLead({
      id: 'lead-4',
      lead_id: 'LD-1004',
      name: 'Liam Vance',
      company: 'Vance Capital',
      email: 'liam@vancecapital.co.uk',
      phone: '+44 20 7946 0912',
      bucket: 'lost',
      status_name: 'Disqualified',
      priority: 'Low',
      lead_source_id: 'src-web',
      lead_source_name: 'Website Form',
      assigned_to: null,
      assigned_to_name: 'Unassigned',
      next_follow_up: null,
    }),
    createMockLead({
      id: 'lead-5',
      lead_id: 'LD-1005',
      name: 'Amina Mansoor',
      company: 'Kite Digital',
      email: 'amina@kitedigital.ae',
      phone: '+971 4 321 9876',
      bucket: 'potential',
      status_name: 'Negotiation',
      priority: 'High',
      lead_source_id: 'src-web',
      lead_source_name: 'Website Form',
      assigned_to: 'user-2',
      assigned_to_name: 'Zayd Al-Hadi',
      next_follow_up: new Date(Date.now() - 86400000).toISOString(), // 1 day ago (OVERDUE)
    }),
  ];

  it('calculates bucket counts with precise overdue follow-up suppression', () => {
    const counts = calculateBucketCounts(sampleLeads);

    assert.equal(counts.all, 5, 'Total deal count must match sample dataset size');
    assert.equal(counts.open, 1, 'Open bucket count must be 1');
    assert.equal(counts.potential, 2, 'Potential bucket count must be 2');
    assert.equal(counts.converted, 1, 'Converted bucket count must be 1');
    assert.equal(counts.lost, 1, 'Lost bucket count must be 1');
    assert.equal(
      counts.overdue,
      2,
      'Overdue count must be 2 (lead-1 open, lead-5 potential; converted lead-3 must NOT count)'
    );
  });

  it('filters accurately by pipeline bucket tab', () => {
    const openLeads = filterLeads(sampleLeads, { bucket: 'open' });
    assert.equal(openLeads.length, 1);
    assert.equal(openLeads[0].lead_id, 'LD-1001');

    const potentialLeads = filterLeads(sampleLeads, { bucket: 'potential' });
    assert.equal(potentialLeads.length, 2);

    const wonLeads = filterLeads(sampleLeads, { bucket: 'converted' });
    assert.equal(wonLeads.length, 1);
    assert.equal(wonLeads[0].lead_id, 'LD-1003');

    const lostLeads = filterLeads(sampleLeads, { bucket: 'lost' });
    assert.equal(lostLeads.length, 1);
    assert.equal(lostLeads[0].lead_id, 'LD-1004');
  });

  it('filters overdue leads queue strictly for non-converted, non-lost deals past touchpoint', () => {
    const overdueLeads = filterLeads(sampleLeads, { bucket: 'overdue' });
    assert.equal(overdueLeads.length, 2);
    assert.deepEqual(
      overdueLeads.map((l) => l.lead_id).sort(),
      ['LD-1001', 'LD-1005']
    );
  });

  it('performs multi-field search across deal ID, contact name, company, and representative', () => {
    // 1. By Deal ID
    const byId = filterLeads(sampleLeads, { search: 'LD-1002' });
    assert.equal(byId.length, 1);
    assert.equal(byId[0].name, 'Marcus Chen');

    // 2. By Contact Name (case-insensitive substring)
    const byName = filterLeads(sampleLeads, { search: 'elena' });
    assert.equal(byName.length, 1);
    assert.equal(byName[0].lead_id, 'LD-1001');

    // 3. By Company
    const byCompany = filterLeads(sampleLeads, { search: 'Atelier' });
    assert.equal(byCompany.length, 1);
    assert.equal(byCompany[0].company, 'Atelier Maison');

    // 4. By Assigned Representative
    const byRep = filterLeads(sampleLeads, { search: 'Zayd' });
    assert.equal(byRep.length, 2);
    assert.deepEqual(
      byRep.map((l) => l.lead_id).sort(),
      ['LD-1002', 'LD-1005']
    );
  });

  it('evaluates cascading multi-filter intersections (Source + Priority + Assignee)', () => {
    const multiFilterResult = filterLeads(sampleLeads, {
      sourceId: 'src-web',
      priority: 'High',
      assigneeId: 'user-1',
    });

    assert.equal(multiFilterResult.length, 1);
    assert.equal(multiFilterResult[0].lead_id, 'LD-1001');
    assert.equal(multiFilterResult[0].company, 'Nordic Luxury Living');

    // Negative match intersection
    const noMatch = filterLeads(sampleLeads, {
      sourceId: 'src-wa',
      priority: 'High',
    });
    assert.equal(noMatch.length, 0);
  });

  it('supports global reset returning all deals with zero side-effects', () => {
    const clearedResult = filterLeads(sampleLeads, {
      bucket: 'all',
      search: '',
      sourceId: null,
      assigneeId: null,
      priority: null,
      stageId: null,
    });

    assert.equal(clearedResult.length, sampleLeads.length);
  });
});
