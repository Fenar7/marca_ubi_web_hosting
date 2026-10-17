/**
 * @file crm.ts
 * @description Enterprise TypeScript domain definitions and database models for the
 *              Marca Ubi Agency CRM & Sales Intelligence Platform.
 * @architecture Mirrors the PostgreSQL 15+ relational schema in `supabase/migrations/`.
 *               Enforces strict compile-time type safety across Server Actions, API routes,
 *               and UI client components.
 */

/**
 * Domain Enums & Union Types
 */

/**
 * Commercial authorization roles determining RLS access boundaries across the CRM.
 * - `admin`: Full system control, user provisioning, permanent deletion, global analytics.
 * - `sales_manager`: Global pipeline inspection, deal reassignment, stage approvals.
 * - `sales_executive`: Isolated row access to assigned deals, touchpoint logging, stage advancement.
 * - `viewer`: Read-only financial/audit inspection across the commercial pipeline.
 */
export type CrmUserRole = 'admin' | 'sales_manager' | 'sales_executive' | 'viewer';

/**
 * Operational state of an agency staff account.
 */
export type ProfileAccountStatus = 'active' | 'suspended' | 'invited';

/**
 * Commercial macro-bucket classifying pipeline health and revenue aggregation.
 */
export type FunnelBucket = 'open' | 'potential' | 'converted' | 'lost';

/**
 * Client deal priority indicator styled with Marca Ubi design tokens.
 */
export type LeadPriority = 'High' | 'Medium' | 'Low';

/**
 * Preferred communication coordinate for high-ticket prospective client outreach.
 */
export type PreferredChannel = 'Phone' | 'WhatsApp' | 'Email' | 'Meeting';

/**
 * Commercial service categorization for incoming agency engagements.
 */
export type ServiceCategory =
  | 'Branding'
  | 'Web & Digital'
  | 'Mobile Apps'
  | 'UI/UX Design'
  | 'Full-Suite Advisory'
  | 'Other';

/**
 * Omnichannel touchpoint classification captured in the immutable lead activities ledger.
 */
export type LeadActivityType =
  | 'status_change'
  | 'priority_change'
  | 'reassignment'
  | 'call_logged'
  | 'email_sent'
  | 'meeting_held'
  | 'whatsapp_sent'
  | 'meeting_notes'
  | 'note_added'
  | 'follow_up_scheduled'
  | 'system_event'
  | 'field_update'
  | 'duplicate_inquiry';

/**
 * Administrative governance actions recorded in the tamper-proof team audit log.
 */
export type TeamAuditAction =
  | 'user_created'
  | 'role_changed'
  | 'user_suspended'
  | 'user_activated'
  | 'leads_bulk_reassigned'
  | 'password_reset_dispatched'
  | 'password_reset_completed';

/**
 * Relational Entity Models
 */

/**
 * Agency team member profile mirroring `public.profiles` and linked to `auth.users(id)`.
 */
export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: CrmUserRole;
  job_title: string;
  phone: string | null;
  status: ProfileAccountStatus;
  avatar_url: string | null;
  invited_by: string | null;
  last_login_at: string | null;
  must_change_password: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Hydrated team member directory item joined with active commercial metrics.
 * Powers the Commercial Personnel Directory table (/admin/team).
 */
export interface TeamMemberRosterItem extends Profile {
  active_deals_count: number;
  total_deal_value: number;
  invited_by_name?: string | null;
}


/**
 * Catalog entry for commercial lead acquisition channels mirroring `public.lead_sources`.
 */
export interface LeadSource {
  id: string;
  name: string;
  color_code: string;
  is_active: boolean;
  created_at: string;
}

/**
 * Pipeline stage definition mirroring `public.funnel_statuses`.
 */
export interface FunnelStatus {
  id: string;
  name: string;
  bucket: FunnelBucket;
  color_code: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

/**
 * Primary commercial lead dossier mirroring `public.leads`.
 * Stores company background, primary decision maker coordinates, deal valuation,
 * and current funnel stage.
 */
export interface Lead {
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
  source_detail: string | null;
  service_category: ServiceCategory;
  budget_bracket: string | null;
  priority: LeadPriority;
  status_id: string;
  assigned_to: string | null;
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
 * Hydrated lead record joining foreign key references for high-performance UI data grids.
 */
export interface LeadWithRelations extends Lead {
  lead_source?: LeadSource;
  status?: FunnelStatus;
  assignee?: Profile | null;
}

/**
 * Append-only customer touchpoint or stage transition entry mirroring `public.lead_activities`.
 */
export interface LeadActivity {
  id: string;
  lead_id: string;
  actor_id: string | null;
  activity_type: LeadActivityType;
  description: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

/**
 * Essential commercial staff profile coordinates joined for touchpoint display.
 */
export interface ActivityActor {
  id: string;
  full_name: string;
  role: CrmUserRole;
  avatar_url?: string | null;
  email?: string | null;
}

/**
 * Hydrated touchpoint record including actor details for timeline display.
 */
export interface LeadActivityWithActor extends LeadActivity {
  actor?: ActivityActor | Profile | null;
  actor_name: string;
  actor_role: string;
}

/**
 * Tamper-proof administrative governance log entry mirroring `public.team_audit_logs`.
 */
export interface TeamAuditLog {
  id: string;
  actor_id: string | null;
  action: TeamAuditAction;
  target_user_email: string;
  details: Record<string, unknown>;
  created_at: string;
}

/**
 * Mutation Payloads (Insert / Update Types)
 */

/**
 * Base attributes for lead creation shared across all ingestion channels.
 */
export interface BaseLeadInput {
  name: string;
  company?: string | null;
  company_website?: string | null;
  industry?: string | null;
  preferred_channel?: PreferredChannel;
  lead_source_id: string;
  source_detail?: string | null;
  service_category?: ServiceCategory;
  budget_bracket?: string | null;
  priority?: LeadPriority;
  status_id: string;
  assigned_to?: string | null;
  expected_value?: number;
  next_follow_up?: string | null;
  notes?: string | null;
  brief_payload?: Record<string, unknown>;
}

/**
 * Payload required to insert a new lead record via webhook or manual drawer.
 * Statically enforces at compile-time that at least one reachable contact coordinate
 * (non-nullable phone or non-nullable email) is provided, aligning with `chk_lead_contact_info`.
 */
export type CreateLeadInput = BaseLeadInput & (
  | { phone: string; email?: string | null }
  | { email: string; phone?: string | null }
);

/**
 * Allowed fields for partial updates to an active deal.
 */
export interface UpdateLeadInput {
  name?: string;
  company?: string | null;
  company_website?: string | null;
  industry?: string | null;
  phone?: string | null;
  email?: string | null;
  preferred_channel?: PreferredChannel;
  lead_source_id?: string;
  source_detail?: string | null;
  service_category?: ServiceCategory;
  budget_bracket?: string | null;
  priority?: LeadPriority;
  status_id?: string;
  assigned_to?: string | null;
  expected_value?: number;
  next_follow_up?: string | null;
  lost_reason?: string | null;
  revisit_date?: string | null;
  notes?: string | null;
  brief_payload?: Record<string, unknown>;
  converted_at?: string | null;
}

/**
 * Payload for logging an interaction or manual note on a deal.
 */
export interface CreateLeadActivityInput {
  lead_id: string;
  actor_id?: string | null;
  activity_type: LeadActivityType;
  description: string;
  metadata?: Record<string, unknown>;
}

/**
 * Executive Analytics & KPI Schemas
 */

/**
 * Aggregated commercial pipeline metrics powering the Executive KPI Ribbon.
 * Supports both standard and camelCase/underscore representations for client-server compatibility.
 */
export interface PipelineKpis {
  total_leads: number;
  potential_count?: number;
  total_potential_value: number;
  stage_weighted_pipeline_value?: number;
  converted_count?: number;
  total_converted_revenue: number;
  lost_count?: number;
  conversion_rate: number;
  overdue_follow_ups_count: number;
  overdue_count?: number;
}

/**
 * Raw commercial metrics payload returned by the `get_pipeline_kpis` PostgreSQL RPC function.
 * Reflects single-round-trip database aggregation with division-by-zero, spam-exclusion,
 * and role-scoping guards.
 */
export interface PipelineRpcMetrics {
  total_leads_count: number;
  total_leads?: number;
  open_leads_count: number;
  potential_leads_count: number;
  potential_count?: number;
  potential_pipeline_value: number;
  potential_value?: number;
  stage_weighted_pipeline_value?: number;
  converted_leads_count: number;
  converted_count?: number;
  converted_revenue_value: number;
  converted_value?: number;
  lost_leads_count: number;
  lost_count?: number;
  disqualified_leads_count?: number;
  overdue_follow_ups_count: number;
  overdue_count?: number;
  conversion_rate_percentage: number;
  conversion_rate?: number;
}

/**
 * Filter parameters for querying pipeline KPIs via API and stored procedure.
 */
export interface KpiQueryParams {
  startDate?: string | null;
  endDate?: string | null;
  sourceId?: string | null;
  assigneeId?: string | null;
  targetUserId?: string | null;
}

/**
 * Structured API response envelope for GET /api/sales-funnel/kpis.
 */
export interface KpiApiResponseEnvelope {
  success: boolean;
  data?: PipelineRpcMetrics;
  error?: string;
  details?: Record<string, string>;
  meta?: {
    startDate: string | null;
    endDate: string | null;
    sourceId: string | null;
    assigneeId: string | null;
    cachedAt: string;
    executionTimeMs?: number;
  };
}

/**
 * Distribution of active deals across funnel statuses for pipeline visualization.
 */
export interface StatusFunnelBreakdown {
  status_id: string;
  status_name: string;
  bucket: FunnelBucket;
  color_code: string;
  sort_order: number;
  deal_count: number;
  total_value: number;
}

/**
 * Payload required to provision a new team member via createTeamUser Server Action.
 */
export interface CreateTeamUserInput {
  fullName: string;
  email: string;
  role: CrmUserRole;
  jobTitle: string;
  phone?: string | null;
  tempPassword: string;
}

/**
 * Standard server action result envelope for team administrative mutations.
 */
export interface TeamActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  validationErrors?: Record<string, string>;
}

/**
 * Action result envelope returned by the administrative login Server Action.
 * Encapsulates redirection path, progressive rate limiting lockout metrics, and error feedback.
 */
export interface LoginActionResult {
  success: boolean;
  error?: string;
  redirectTo?: string;
  remainingLockoutSeconds?: number;
  isLocked?: boolean;
}

/**
 * Action result envelope returned by the mandatory password rotation Server Action.
 * Encapsulates operation status, form-level error message, and granular field validation issues.
 */
export interface ResetPasswordResult {
  success: boolean;
  error?: string;
  validationErrors?: Record<string, string>;
}

/**
 * Breakdown of active deals across individual pipeline stages for a specific sales representative.
 */
export interface StageDealBreakdown {
  status_id: string;
  status_name: string;
  bucket: FunnelBucket;
  color_code: string;
  sort_order: number;
  deal_count: number;
  total_value: number;
}

/**
 * Lightweight dossier of an active deal managed by a departing or offboarded representative.
 */
export interface ActiveDealSummary {
  id: string;
  lead_id: string;
  name: string;
  company: string | null;
  expected_value: number;
  status_name: string;
  priority: LeadPriority;
  next_follow_up: string | null;
  created_at: string;
}

/**
 * Aggregated active commercial inventory dossier for a sales representative used by the Reassignment Wizard.
 */
export interface RepDealInventory {
  user_id: string;
  user_name: string;
  user_email: string;
  user_role: CrmUserRole;
  user_status: ProfileAccountStatus;
  active_deals_count: number;
  cumulative_pipeline_value: number;
  overdue_follow_ups_count: number;
  stage_breakdown: StageDealBreakdown[];
  deals: ActiveDealSummary[];
}

/**
 * Input payload supplied to the atomic batch lead reassignment engine.
 */
export interface LeadReassignmentInput {
  sourceUserId: string;
  destinationUserId: string;
  transferReason: string;
}

/**
 * Enriched execution summary returned by public.execute_atomic_lead_reassignment.
 */
export interface AtomicReassignmentResult {
  success: boolean;
  reassigned_count: number;
  total_value: number;
  affected_lead_ids: string[];
  source_user_id?: string;
  destination_user_id?: string;
  message: string;
}

/**
 * Lightweight representative option for commercial assignee dropdown selectors.
 */
export interface AssigneeOption {
  id: string;
  fullName: string;
  email: string;
  role: CrmUserRole;
}

/**
 * Standard server action result envelope for commercial lead mutations.
 * Provides typed payload delivery, error messages, and validation feedback.
 */
export interface LeadActionResult<T = unknown> {
  success: boolean;
  leadId?: string;
  id?: string;
  error?: string;
  data?: T;
  validationErrors?: Record<string, string>;
  lead?: LeadWithRelations;
  activities?: LeadActivityWithActor[];
  availableStatuses?: FunnelStatus[];
  availableAssignees?: AssigneeOption[];
  funnelStatuses?: FunnelStatus[];
  teamAssignees?: AssigneeOption[];
}

/**
 * Comprehensive 360-degree commercial lead dossier payload powering LeadDetailDrawer.
 * Encapsulates full deal coordinates, related stage & source entities, creative brief payload,
 * chronological interaction ledger, and available dropdown options for atomic mutations.
 */
export interface LeadDetailPayload {
  lead: LeadWithRelations;
  activities: LeadActivityWithActor[];
  availableStatuses: FunnelStatus[];
  availableAssignees: AssigneeOption[];
  funnelStatuses?: FunnelStatus[];
  teamAssignees?: AssigneeOption[];
}

/**
 * Mutation payload for updating a deal's funnel stage, handling terminal bucket timestamps
 * and optional transition notes.
 */
export interface UpdateLeadStatusPayload {
  leadId: string;
  newStatusId: string;
  lostReason?: string | null;
  note?: string | null;
}

/**
 * Mutation payload for recording an omnichannel customer touchpoint or scheduled follow-up
 * into the immutable lead activities ledger.
 */
export interface AddLeadTouchpointPayload {
  leadId: string;
  activityType:
    | 'call_logged'
    | 'email_sent'
    | 'meeting_held'
    | 'meeting_notes'
    | 'whatsapp_sent'
    | 'note_added'
    | 'follow_up_scheduled';
  description: string;
  nextFollowUp?: string | null;
}

/**
 * Mutation payload for single-deal commercial representative reassignment.
 * Strictly gated to administrators and sales managers.
 */
export interface UpdateLeadAssigneePayload {
  leadId: string;
  newAssigneeId: string;
  note?: string | null;
}

/**
 * Mutation payload for updating commercial deal valuation parameters, priority tier,
 * and high-level engagement notes.
 */
export interface UpdateLeadDealParametersPayload {
  leadId: string;
  expectedValue?: number;
  priority?: LeadPriority;
  notes?: string | null;
}

