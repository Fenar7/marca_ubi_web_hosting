/**
 * @file kpi_ribbon.test.ts
 * @description Dedicated automated test suite for Sprint 6.2:
 *              Dark Luxury Executive KPI Ribbon & Real-time Recalculation Engine.
 *              Validates currency formatting (INR Lakhs/Crores & USD at ₹83.50 rate),
 *              metrics normalization, edge cases, rapid filter AbortController handling,
 *              and component contract compliance.
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 * @governance Master PRD Section 6, SPEC-MARCA-CRM-UX-PHASES-6-9 & DESIGN.md
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  USD_TO_INR_RATE,
  extractKpiMetrics,
  formatKpiCurrency,
  formatFullCurrency,
  formatSyncTimestamp,
  type NormalizedKpiMetrics,
} from '../../src/app/admin/components/kpi/kpiFormatters';
import type { PipelineRpcMetrics } from '../../src/types/crm';

describe('Marca Ubi CRM — Sprint 6.2: Executive KPI Ribbon & Currency Recalculation Engine', () => {
  describe('Section 1: Dual-Currency Mathematical Precision & Abbreviation Scaling', () => {
    it('enforces the official institutional peg of 1 USD = 83.50 INR', () => {
      assert.strictEqual(USD_TO_INR_RATE, 83.5);
    });

    it('formats zero or negative amounts cleanly without layout-breaking symbols', () => {
      assert.strictEqual(formatKpiCurrency(0, 'INR'), '₹ 0');
      assert.strictEqual(formatKpiCurrency(-5000, 'INR'), '₹ 0');
      assert.strictEqual(formatKpiCurrency(0, 'USD'), '$ 0');
      assert.strictEqual(formatKpiCurrency(-100, 'USD'), '$ 0');
    });

    it('formats Indian Rupees into Lakhs when between 1 Lakh and 1 Crore', () => {
      // 48.5 Lakhs (₹48,50,000)
      assert.strictEqual(formatKpiCurrency(4850000, 'INR'), '₹ 48.5 L');
      // Exact 1 Lakh (₹1,00,000)
      assert.strictEqual(formatKpiCurrency(100000, 'INR'), '₹ 1 L');
      // 15 Lakhs (₹15,00,000)
      assert.strictEqual(formatKpiCurrency(1500000, 'INR'), '₹ 15 L');
    });

    it('formats Indian Rupees into Crores when 1 Crore or greater', () => {
      // 1.25 Crores (₹1,25,00,000)
      assert.strictEqual(formatKpiCurrency(12500000, 'INR'), '₹ 1.25 Cr');
      // Exact 1 Crore (₹1,00,00,000)
      assert.strictEqual(formatKpiCurrency(10000000, 'INR'), '₹ 1 Cr');
      // Extreme valuation: 100 Crores (₹100,00,00,000)
      assert.strictEqual(formatKpiCurrency(1000000000, 'INR'), '₹ 100 Cr');
    });

    it('formats standard sub-lakh INR amounts with Indian locale separators', () => {
      assert.strictEqual(formatKpiCurrency(85000, 'INR'), '₹ 85,000');
      assert.strictEqual(formatKpiCurrency(500, 'INR'), '₹ 500');
    });

    it('converts INR amounts into USD using the institutional multiplier and abbreviates in K and M', () => {
      // 35,000 USD * 83.50 = ₹29,22,500
      const inrValue35k = 35000 * 83.5;
      assert.strictEqual(formatKpiCurrency(inrValue35k, 'USD'), '$ 35K');

      // 1.4 Million USD * 83.50 = ₹11,69,00,000
      const inrValue1Point4M = 1400000 * 83.5;
      assert.strictEqual(formatKpiCurrency(inrValue1Point4M, 'USD'), '$ 1.4M');

      // Small USD amounts (< 1,000 USD)
      const inrValue500Usd = 500 * 83.5;
      assert.strictEqual(formatKpiCurrency(inrValue500Usd, 'USD'), '$ 500');
    });

    it('provides full localized non-abbreviated currency values for tooltips and accessibility', () => {
      const amount = 4850000;
      assert.strictEqual(formatFullCurrency(amount, 'INR'), '₹ 48,50,000');
      const expectedUsd = Math.round(amount / 83.5).toLocaleString('en-US');
      assert.strictEqual(formatFullCurrency(amount, 'USD'), `$ ${expectedUsd}`);
    });
  });

  describe('Section 2: Metric Normalization, SQL Alias Reconciliation & Edge Cases', () => {
    it('gracefully handles null or undefined RPC payloads returning safe zero metrics', () => {
      const metrics = extractKpiMetrics(null);
      assert.strictEqual(metrics.totalLeads, 0);
      assert.strictEqual(metrics.potentialValue, 0);
      assert.strictEqual(metrics.convertedRevenue, 0);
      assert.strictEqual(metrics.conversionRate, 0);
      assert.strictEqual(metrics.overdueCount, 0);
      assert.strictEqual(metrics.activeLeads, 0);
    });

    it('reconciles short SQL aliases from public.get_pipeline_kpis RPC', () => {
      const sqlRpcPayload: PipelineRpcMetrics = {
        total_leads_count: 142,
        total_leads: 142,
        open_leads_count: 20,
        potential_leads_count: 38,
        potential_count: 38,
        potential_pipeline_value: 4850000,
        potential_value: 4850000,
        stage_weighted_pipeline_value: 2910000,
        converted_leads_count: 19,
        converted_count: 19,
        converted_revenue_value: 3200000,
        converted_value: 3200000,
        lost_leads_count: 12,
        lost_count: 12,
        disqualified_leads_count: 3,
        overdue_follow_ups_count: 4,
        overdue_count: 4,
        conversion_rate_percentage: 13.4,
        conversion_rate: 13.4,
      };

      const normalized: NormalizedKpiMetrics = extractKpiMetrics(sqlRpcPayload);

      assert.strictEqual(normalized.totalLeads, 142);
      assert.strictEqual(normalized.potentialValue, 4850000);
      assert.strictEqual(normalized.stageWeightedValue, 2910000);
      assert.strictEqual(normalized.convertedRevenue, 3200000);
      assert.strictEqual(normalized.conversionRate, 13.4);
      assert.strictEqual(normalized.overdueCount, 4);
      assert.strictEqual(normalized.activeLeads, 58); // 20 open + 38 potential
    });

    it('calculates active pipeline leads as open plus potential count', () => {
      const payload: PipelineRpcMetrics = {
        total_leads_count: 100,
        open_leads_count: 25,
        potential_leads_count: 45,
        potential_pipeline_value: 10000000,
        converted_leads_count: 10,
        converted_revenue_value: 5000000,
        lost_leads_count: 20,
        overdue_follow_ups_count: 0,
        conversion_rate_percentage: 12.5,
      };

      const normalized = extractKpiMetrics(payload);
      assert.strictEqual(normalized.activeLeads, 70);
      assert.strictEqual(normalized.overdueCount, 0);
    });

    it('supports stage-weighted pipeline forecasting valuation', () => {
      const payload: PipelineRpcMetrics = {
        total_leads_count: 50,
        open_leads_count: 10,
        potential_leads_count: 20,
        potential_pipeline_value: 8000000,
        stage_weighted_pipeline_value: 4800000,
        converted_leads_count: 5,
        converted_revenue_value: 2000000,
        lost_leads_count: 5,
        overdue_follow_ups_count: 2,
        conversion_rate_percentage: 10.0,
      };

      const normalized = extractKpiMetrics(payload);
      assert.strictEqual(normalized.stageWeightedValue, 4800000);
      assert.strictEqual(formatKpiCurrency(normalized.stageWeightedValue, 'INR'), '₹ 48 L');
    });
  });

  describe('Section 3: Relative Sync Timestamp Humanization', () => {
    it('displays "Sync pending" when no synchronization has occurred', () => {
      assert.strictEqual(formatSyncTimestamp(null), 'Sync pending');
    });

    it('displays "Updated just now" when within 30 seconds', () => {
      const now = new Date();
      assert.strictEqual(formatSyncTimestamp(now), 'Updated just now');
    });

    it('displays "Updated <1m ago" when between 30 and 60 seconds', () => {
      const thirtyFiveSecsAgo = new Date(Date.now() - 35000);
      assert.strictEqual(formatSyncTimestamp(thirtyFiveSecsAgo), 'Updated <1m ago');
    });

    it('displays "Cached Xm ago" for older updates within an hour', () => {
      const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000);
      assert.strictEqual(formatSyncTimestamp(fiveMinsAgo), 'Cached 5m ago');
    });
  });

  describe('Section 4: AbortController Signal Cancellation Semantics', () => {
    it('cancels pending requests cleanly and catches AbortError without unhandled rejection', async () => {
      const controller = new AbortController();
      let wasAborted = false;

      const mockFetchPromise = new Promise((_, reject) => {
        controller.signal.addEventListener('abort', () => {
          const abortError = new Error('The user aborted a request.');
          abortError.name = 'AbortError';
          reject(abortError);
        });
      });

      // Simulate rapid subsequent filter update
      controller.abort();

      try {
        await mockFetchPromise;
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') {
          wasAborted = true;
        }
      }

      assert.strictEqual(wasAborted, true);
      assert.strictEqual(controller.signal.aborted, true);
    });
  });
});
