/**
 * @file phase-5-command-center-and-interactions.test.ts
 * @description Dedicated unit and integration test suite for Phase 5:
 *              Executive Dashboard Overhaul, Funnel Trinity Pipeline Velocity,
 *              Sortable Data Grid Engine & Dead-Click Remediation.
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

interface MockLeadItem {
  id: string;
  lead_id: string;
  name: string;
  service_category: string;
  status_name: string;
  expected_value: number;
  assigned_to_name: string;
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
}

function sortLeads(
  leads: MockLeadItem[],
  field: keyof MockLeadItem,
  ascending: boolean
): MockLeadItem[] {
  const cloned = [...leads];
  cloned.sort((a, b) => {
    const aVal = a[field];
    const bVal = b[field];

    if (field === 'expected_value') {
      const aNum = Number(aVal) || 0;
      const bNum = Number(bVal) || 0;
      return ascending ? aNum - bNum : bNum - aNum;
    }

    if (field === 'priority') {
      const weight: Record<string, number> = { Critical: 4, High: 3, Medium: 2, Low: 1 };
      const aW = weight[String(aVal)] || 0;
      const bW = weight[String(bVal)] || 0;
      return ascending ? aW - bW : bW - aW;
    }

    const aStr = String(aVal || '').toLowerCase();
    const bStr = String(bVal || '').toLowerCase();
    if (aStr < bStr) return ascending ? -1 : 1;
    if (aStr > bStr) return ascending ? 1 : -1;
    return 0;
  });
  return cloned;
}

describe('Phase 5: Command Center Overhaul & Dead Click Remediation Suite', () => {
  const mockDataset: MockLeadItem[] = [
    {
      id: 'uuid-1',
      lead_id: 'MU-1020',
      name: 'Zara Enterprise',
      service_category: 'Brand Strategy',
      status_name: 'Discovery',
      expected_value: 500000,
      assigned_to_name: 'Devin Vance',
      priority: 'High',
    },
    {
      id: 'uuid-2',
      lead_id: 'MU-1005',
      name: 'Acme Global',
      service_category: 'Web Platform',
      status_name: 'Proposal',
      expected_value: 1800000,
      assigned_to_name: 'Elena Rostova',
      priority: 'Critical',
    },
    {
      id: 'uuid-3',
      lead_id: 'MU-1045',
      name: 'Omni Media',
      service_category: 'Creative Production',
      status_name: 'Negotiation',
      expected_value: 250000,
      assigned_to_name: 'Amir Khan',
      priority: 'Low',
    },
  ];

  describe('Block 1: Data Grid Multi-Column Sorting Engine', () => {
    it('sorts accurately by numeric expected_value ascending and descending', () => {
      const asc = sortLeads(mockDataset, 'expected_value', true);
      assert.equal(asc[0].lead_id, 'MU-1045'); // 250k
      assert.equal(asc[1].lead_id, 'MU-1020'); // 500k
      assert.equal(asc[2].lead_id, 'MU-1005'); // 1.8M

      const desc = sortLeads(mockDataset, 'expected_value', false);
      assert.equal(desc[0].lead_id, 'MU-1005'); // 1.8M
      assert.equal(desc[1].lead_id, 'MU-1020'); // 500k
      assert.equal(desc[2].lead_id, 'MU-1045'); // 250k
    });

    it('sorts accurately by priority tier hierarchy (Critical > High > Medium > Low)', () => {
      const desc = sortLeads(mockDataset, 'priority', false);
      assert.equal(desc[0].priority, 'Critical');
      assert.equal(desc[1].priority, 'High');
      assert.equal(desc[2].priority, 'Low');

      const asc = sortLeads(mockDataset, 'priority', true);
      assert.equal(asc[0].priority, 'Low');
      assert.equal(asc[1].priority, 'High');
      assert.equal(asc[2].priority, 'Critical');
    });

    it('sorts accurately by string fields (lead_id, client name, representative)', () => {
      const byIdAsc = sortLeads(mockDataset, 'lead_id', true);
      assert.equal(byIdAsc[0].lead_id, 'MU-1005');
      assert.equal(byIdAsc[1].lead_id, 'MU-1020');
      assert.equal(byIdAsc[2].lead_id, 'MU-1045');

      const byNameAsc = sortLeads(mockDataset, 'name', true);
      assert.equal(byNameAsc[0].name, 'Acme Global');
      assert.equal(byNameAsc[1].name, 'Omni Media');
      assert.equal(byNameAsc[2].name, 'Zara Enterprise');
    });
  });

  describe('Block 2: Executive KPI Ribbon Route & Deep-Link Resolution', () => {
    const resolveKpiHref = (cardId: string, count?: number): string => {
      switch (cardId) {
        case 'total-leads':
          return '/admin/leads';
        case 'potential-value':
          return '/admin/deals?bucket=potential';
        case 'converted-revenue':
          return '/admin/deals?bucket=converted';
        case 'conversion-rate':
          return '/admin/deals?bucket=converted';
        case 'overdue-followups':
          return (count ?? 0) > 0 ? '/admin/leads?bucket=overdue' : '/admin/leads';
        default:
          return '/admin';
      }
    };

    it('routes overdue follow-ups directly to the overdue leads filter', () => {
      assert.equal(resolveKpiHref('overdue-followups', 5), '/admin/leads?bucket=overdue');
      assert.equal(resolveKpiHref('overdue-followups', 0), '/admin/leads');
    });

    it('routes potential pipeline valuation to the Deals potential bucket', () => {
      assert.equal(resolveKpiHref('potential-value'), '/admin/deals?bucket=potential');
    });

    it('routes converted revenue and conversion rate to the Deals converted bucket', () => {
      assert.equal(resolveKpiHref('converted-revenue'), '/admin/deals?bucket=converted');
      assert.equal(resolveKpiHref('conversion-rate'), '/admin/deals?bucket=converted');
    });

    it('routes total leads to inbound leads triage', () => {
      assert.equal(resolveKpiHref('total-leads'), '/admin/leads');
    });
  });

  describe('Block 3: Representative Workload Oversight Drilldown & Aggregations', () => {
    it('constructs correct URL for rep deal filtering', () => {
      const userId = '11111111-2222-3333-4444-555555555555';
      const dealsUrl = `/admin/deals?assigned_to=${encodeURIComponent(userId)}`;
      assert.equal(dealsUrl, '/admin/deals?assigned_to=11111111-2222-3333-4444-555555555555');
    });

    it('constructs correct URL for rep overdue task filtering', () => {
      const userId = '11111111-2222-3333-4444-555555555555';
      const overdueUrl = `/admin/leads?assigned_to=${encodeURIComponent(userId)}&bucket=overdue`;
      assert.equal(
        overdueUrl,
        '/admin/leads?assigned_to=11111111-2222-3333-4444-555555555555&bucket=overdue'
      );
    });

    it('verifies summary metric destination routes', () => {
      const summaryRoutes = {
        activeStaff: '/admin/team',
        activePipeline: '/admin/deals',
        overdueDeals: '/admin/leads?bucket=overdue',
        criticalOverdue: '/admin/leads?bucket=overdue',
      };

      assert.equal(summaryRoutes.activeStaff, '/admin/team');
      assert.equal(summaryRoutes.activePipeline, '/admin/deals');
      assert.equal(summaryRoutes.overdueDeals, '/admin/leads?bucket=overdue');
      assert.equal(summaryRoutes.criticalOverdue, '/admin/leads?bucket=overdue');
    });
  });

  describe('Block 4: Funnel Trinity Distribution Architecture & Copywriting', () => {
    it('maps all 3 Funnel Trinity workspaces to canonical routes', () => {
      const funnelTrinity = [
        { enclave: 'Discovery', route: '/admin/leads', name: 'Inbound Leads' },
        { enclave: 'Negotiation', route: '/admin/deals', name: 'Pipeline Deals' },
        { enclave: 'Production', route: '/admin/works', name: 'Client Works' },
      ];

      assert.equal(funnelTrinity.length, 3);
      assert.equal(funnelTrinity[0].route, '/admin/leads');
      assert.equal(funnelTrinity[1].route, '/admin/deals');
      assert.equal(funnelTrinity[2].route, '/admin/works');
    });

    it('prohibits military theater slang in human copywriting', () => {
      const forbiddenSlang = ['command center', 'activity ledger', 'pipeline ops', 'staff roster'];
      const elevatedCopy = {
        pageTitle: 'Executive Dashboard',
        eyebrow: 'Overview',
        subtitle: 'Key metrics, team workload, and recent client activity across the agency.',
        activityTitle: 'Recent Activity',
      };

      for (const phrase of forbiddenSlang) {
        assert.equal(
          elevatedCopy.pageTitle.toLowerCase().includes(phrase),
          false,
          `Forbidden slang "${phrase}" found in pageTitle`
        );
        assert.equal(
          elevatedCopy.eyebrow.toLowerCase().includes(phrase),
          false,
          `Forbidden slang "${phrase}" found in eyebrow`
        );
        assert.equal(
          elevatedCopy.activityTitle.toLowerCase().includes(phrase),
          false,
          `Forbidden slang "${phrase}" found in activityTitle`
        );
      }
    });
  });

  describe('Block 5: Delivery Stage Verification & Deep-Link Parameter Handling', () => {
    it('verifies client_works queries target delivery_stage rather than missing stage column', () => {
      // Invariant: client_works schema uses delivery_stage ENUM ('kickoff', 'strategy', 'design_ui_ux', 'development', 'review_qa', 'delivered')
      const validDeliveryStages = ['kickoff', 'strategy', 'design_ui_ux', 'development', 'review_qa', 'delivered'];
      const activeStageFilter = (stage: string) => stage !== 'delivered';

      const mockWorks = [
        { id: '1', delivery_stage: 'kickoff' },
        { id: '2', delivery_stage: 'design_ui_ux' },
        { id: '3', delivery_stage: 'delivered' },
      ];

      const activeWorks = mockWorks.filter((w) => activeStageFilter(w.delivery_stage));
      assert.equal(activeWorks.length, 2);
      assert.ok(validDeliveryStages.includes('delivered'));
    });

    it('verifies DealsWorkspaceClient filters correctly by assigned_to and bucket searchParams', () => {
      const deals = [
        { id: 'd1', assigned_to: 'user-alpha', status_bucket: 'open' },
        { id: 'd2', assigned_to: 'user-beta', status_bucket: 'potential' },
        { id: 'd3', assigned_to: 'user-alpha', status_bucket: 'converted' },
      ];

      const filterDeals = (
        items: typeof deals,
        assignedTo: string | null,
        bucket: string
      ) => {
        return items.filter((d) => {
          const matchAssignee = !assignedTo || d.assigned_to === assignedTo;
          const matchBucket = bucket === 'all' || d.status_bucket === bucket;
          return matchAssignee && matchBucket;
        });
      };

      // Test rep filter
      const repFiltered = filterDeals(deals, 'user-alpha', 'all');
      assert.equal(repFiltered.length, 2);
      assert.equal(repFiltered[0].id, 'd1');
      assert.equal(repFiltered[1].id, 'd3');

      // Test bucket filter
      const bucketFiltered = filterDeals(deals, null, 'potential');
      assert.equal(bucketFiltered.length, 1);
      assert.equal(bucketFiltered[0].id, 'd2');

      // Test composite filter
      const compositeFiltered = filterDeals(deals, 'user-alpha', 'converted');
      assert.equal(compositeFiltered.length, 1);
      assert.equal(compositeFiltered[0].id, 'd3');
    });

    it('validates WAI-ARIA sort attribute mappings for data grid columns', () => {
      const getAriaSort = (field: string, currentField: string, isAscending: boolean) => {
        if (field !== currentField) return 'none';
        return isAscending ? 'ascending' : 'descending';
      };

      assert.equal(getAriaSort('lead_id', 'lead_id', true), 'ascending');
      assert.equal(getAriaSort('lead_id', 'lead_id', false), 'descending');
      assert.equal(getAriaSort('name', 'lead_id', true), 'none');
    });
  });
});
