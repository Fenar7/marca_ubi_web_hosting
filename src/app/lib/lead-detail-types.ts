/**
 * @file lead-detail-types.ts
 * @description Enterprise TypeScript contracts and DTOs for the Client 360 Lead Dossier,
 *              activity ledger feeds, touchpoint logging, and stage transitions.
 * @module lib/lead-detail-types
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import type {
  CrmUserRole,
  FunnelBucket,
  LeadActivityType,
  LeadPriority,
  PreferredChannel,
  ServiceCategory,
} from '@/types/crm';
import type { AssigneeOption } from './lead-schemas';

/**
 * Hydrated lead record payload returned to the Client 360 Drawer.
 */
export interface LeadDetailDto {
  id: string;
  lead_id: string;
  name: string;
  company: string | null;
  company_website: string | null;
  industry: string | null;
  phone: string | null;
  email: string | null;
  preferred_channel: PreferredChannel;
  lead_source_id: string;
  lead_source_name?: string;
  lead_source_color?: string;
  source_detail: string | null;
  service_category: ServiceCategory;
  budget_bracket: string | null;
  priority: LeadPriority;
  status_id: string;
  status_name?: string;
  status_bucket?: FunnelBucket;
  status_color?: string;
  assigned_to: string | null;
  assignee_name?: string;
  assignee_email?: string;
  assignee_role?: CrmUserRole;
  expected_value: number;
  next_follow_up: string | null;
  lost_reason: string | null;
  revisit_date: string | null;
  notes: string | null;
  brief_payload: Record<string, unknown>;
  inquiry_count: number;
  created_at: string;
  converted_at: string | null;
  updated_at: string;
}

/**
 * Hydrated touchpoint record including actor details for timeline display.
 */
export interface LeadActivityItem {
  id: string;
  lead_id: string;
  actor_id: string | null;
  actor_name: string;
  actor_role: string;
  activity_type: LeadActivityType;
  description: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

/**
 * Pipeline stage definition for stage transition selector.
 */
export interface FunnelStatusOption {
  id: string;
  name: string;
  bucket: FunnelBucket;
  color_code: string;
  sort_order: number;
}

/**
 * Full response envelope returned by getLeadDetails Server Action.
 */
export interface LeadDetailResponse {
  success: boolean;
  error?: string;
  lead?: LeadDetailDto;
  activities?: LeadActivityItem[];
  funnelStatuses?: FunnelStatusOption[];
  teamAssignees?: AssigneeOption[];
}

/**
 * Payload supplied when logging a new touchpoint via addLeadTouchpoint.
 */
export interface TouchpointPayload {
  activityType: 'call_logged' | 'whatsapp_sent' | 'meeting_notes' | 'note_added';
  description: string;
  nextFollowUp?: string | null;
}

/**
 * Payload supplied when updating commercial deal parameters.
 */
export interface DealParametersPayload {
  expectedValue?: number;
  priority?: LeadPriority;
  notes?: string | null;
}
