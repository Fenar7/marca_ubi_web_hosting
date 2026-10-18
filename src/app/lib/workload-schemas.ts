/**
 * @file workload-schemas.ts
 * @description Zod validation schemas and payload definitions for manager workload oversight
 *              and batch overdue lead reassignment.
 *              Separated from 'use server' modules to strictly comply with Next.js App Router
 *              Server Action boundary invariants (all Server Action exports must be async functions).
 * @module lib/workload-schemas
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import { z } from 'zod';
import type { OverdueTier } from '@/app/admin/components/Badges/badgeUtils';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Zod validation schema for batch overdue lead reassignment.
 */
export const batchReassignSchema = z.object({
  leadIds: z
    .array(z.string().regex(UUID_REGEX, 'Each lead ID must be a valid UUID v4.'))
    .min(1, 'At least one overdue deal must be selected for reassignment.')
    .max(100, 'Cannot reassign more than 100 deals in a single batch.'),
  destinationUserId: z.string().regex(UUID_REGEX, 'Destination representative ID must be a valid UUID v4.'),
  reason: z
    .string()
    .min(3, 'Reassignment rationale must contain at least 3 characters.')
    .max(1000, 'Reassignment rationale cannot exceed 1,000 characters.'),
});

export type BatchReassignInput = z.infer<typeof batchReassignSchema>;

export interface OverdueLeadSummary {
  id: string;
  leadId: string;
  name: string;
  company: string;
  expectedValue: number;
  priority: string;
  nextFollowUp: string;
  statusName: string;
  currentAssigneeId: string | null;
  currentAssigneeName: string;
  tier: OverdueTier;
  overdueLabel: string;
}

export interface RepWorkloadTelemetry {
  userId: string;
  fullName: string;
  email: string;
  role: string;
  status: string;
  avatarInitials: string;
  activeDealsCount: number;
  totalPipelineValue: number;
  convertedDealsCount: number;
  conversionRatePercentage: number;
  overdueTasksCount: number;
  amberCount: number;
  orangeCount: number;
  criticalCount: number;
  overdueLeads: OverdueLeadSummary[];
}

export interface ManagerWorkloadData {
  reps: RepWorkloadTelemetry[];
  totals: {
    totalActiveReps: number;
    totalActiveDeals: number;
    totalPipelineValue: number;
    totalOverdueDeals: number;
    totalCriticalOverdue: number;
  };
  availableReps: Array<{ id: string; fullName: string; role: string; email: string }>;
}
