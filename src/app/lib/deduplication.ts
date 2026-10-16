/**
 * @file deduplication.ts
 * @description Smart Deduplication State Machine & Relational Merge Engine for the
 *              Marca Ubi Sales Funnel CRM.
 * @architecture Implements Master PRD Section 3 & Section 15.12 deduplication rules:
 *               1. Active stage leads (open/potential) are deduplicated without creating duplicate records.
 *                  Inquiry count is incremented, priority elevated to 'High', and follow-up reset to NOW().
 *               2. Lost leads within 90 days are reactivated to 'New' with elevated 'High' priority.
 *               3. Converted clients or aged lost leads (>90 days) generate a clean re-engagement opportunity.
 *               4. Prevents race conditions using row-level exclusive locks (FOR UPDATE OF l).
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import type { FunnelBucket, LeadPriority, LeadActivityType } from '@/types/crm';

/**
 * Deduplication decision action enum.
 */
export type DeduplicationAction =
  | 'MERGE_INQUIRY'
  | 'REACTIVATE_LEAD'
  | 'CREATE_NEW_REENGAGEMENT';

/**
 * Snapshot of existing lead required for deduplication evaluation.
 */
export interface ExistingLeadRecord {
  id: string;
  lead_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  priority: LeadPriority;
  status_id: string;
  status_name: string;
  status_bucket: FunnelBucket;
  inquiry_count: number;
  assigned_to: string | null;
  notes: string | null;
  brief_payload: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  converted_at?: string | null;
}

/**
 * Normalized incoming prospect submission for deduplication comparison.
 */
export interface IncomingInquiryPayload {
  name: string;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  notes?: string | null;
  service_category?: string;
  expected_value?: number;
  source_code?: string;
  brief_payload?: Record<string, unknown>;
}

/**
 * Outcome from the deterministic state machine evaluation.
 */
export interface DeduplicationDecision {
  action: DeduplicationAction;
  targetLeadId?: string;
  targetLeadUuid?: string;
  previousLeadId?: string;
  triggerOverdue: boolean;
  elevatePriority: boolean;
  newPriority?: LeadPriority;
  inquiryCountIncrement: number;
  activityType: LeadActivityType;
  activityDescription: string;
  activityMetadata: Record<string, unknown>;
}

/**
 * Deterministic Deduplication State Machine Evaluator.
 * Pure function suitable for isolated unit testing and transactional execution.
 *
 * @param existing - Existing active or historical lead matched by email or phone
 * @param incoming - Newly received inbound prospect inquiry
 * @param referenceDate - Optional reference timestamp for 90-day window evaluation (defaults to now)
 * @returns DeduplicationDecision dictating state transition and touchpoint logging
 */
export function evaluateLeadDeduplication(
  existing: ExistingLeadRecord,
  incoming: IncomingInquiryPayload,
  referenceDate: Date = new Date()
): DeduplicationDecision {
  const isTerminal =
    existing.status_bucket === 'converted' ||
    existing.status_bucket === 'lost' ||
    existing.status_name.toLowerCase() === 'converted' ||
    existing.status_name.toLowerCase() === 'lost';

  // 1. ACTIVE LEAD MATCH: Open or Potential stages
  if (!isTerminal) {
    return {
      action: 'MERGE_INQUIRY',
      targetLeadId: existing.lead_id,
      targetLeadUuid: existing.id,
      triggerOverdue: true,
      elevatePriority: true,
      newPriority: 'High',
      inquiryCountIncrement: 1,
      activityType: 'duplicate_inquiry',
      activityDescription: `Repeat inquiry received from ${incoming.name}. Account priority elevated to High and follow-up scheduled for immediate response.`,
      activityMetadata: {
        source: incoming.source_code || 'direct_ingest',
        timestamp: referenceDate.toISOString(),
        incoming_company: incoming.company || null,
        incoming_notes: incoming.notes || null,
        brief_payload: incoming.brief_payload || {},
      },
    };
  }

  // 2. TERMINAL LOST LEAD: Within 90-day cooldown window -> Reactivate to 'New'
  if (
    existing.status_bucket === 'lost' ||
    existing.status_name.toLowerCase() === 'lost'
  ) {
    const closedTimestamp = existing.updated_at
      ? new Date(existing.updated_at).getTime()
      : new Date(existing.created_at).getTime();
    const elapsedDays = (referenceDate.getTime() - closedTimestamp) / (1000 * 60 * 60 * 24);

    if (elapsedDays <= 90) {
      return {
        action: 'REACTIVATE_LEAD',
        targetLeadId: existing.lead_id,
        targetLeadUuid: existing.id,
        triggerOverdue: true,
        elevatePriority: true,
        newPriority: 'High',
        inquiryCountIncrement: 1,
        activityType: 'duplicate_inquiry',
        activityDescription: `Previously lost lead re-engaged after ${Math.floor(elapsedDays)} days. Opportunity reactivated with High priority.`,
        activityMetadata: {
          previous_status: existing.status_name,
          elapsed_days: Math.floor(elapsedDays),
          timestamp: referenceDate.toISOString(),
          brief_payload: incoming.brief_payload || {},
        },
      };
    }
  }

  // 3. CONVERTED CLIENT OR AGED LOST LEAD (> 90 days): Create clean re-engagement deal
  return {
    action: 'CREATE_NEW_REENGAGEMENT',
    previousLeadId: existing.lead_id,
    targetLeadUuid: existing.id,
    triggerOverdue: false,
    elevatePriority: false,
    inquiryCountIncrement: 0,
    activityType: 'duplicate_inquiry',
    activityDescription: `New re-engagement opportunity initiated for returning enterprise client (Original Lead: ${existing.lead_id}).`,
    activityMetadata: {
      original_lead_id: existing.lead_id,
      original_status: existing.status_name,
      timestamp: referenceDate.toISOString(),
    },
  };
}
