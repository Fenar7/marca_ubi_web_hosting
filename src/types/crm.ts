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
  | 'whatsapp_sent'
  | 'meeting_notes'
  | 'note_added'
  | 'follow_up_scheduled'
  | 'system_event'
  | 'field_update';

/**
 * Administrative governance actions recorded in the tamper-proof team audit log.
 */
export type TeamAuditAction =
  | 'user_created'
  | 'role_changed'
  | 'user_suspended'
  | 'user_activated'
  | 'leads_bulk_reassigned'
  | 'password_reset_dispatched';

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
  created_at: string;
  updated_at: string;
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
 * Hydrated touchpoint record including actor details for timeline display.
 */
export interface LeadActivityWithActor extends LeadActivity {
  actor?: Profile | null;
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
 */
export interface PipelineKpis {
  total_leads: number;
  total_potential_value: number;
  total_converted_revenue: number;
  conversion_rate: number;
  overdue_follow_ups_count: number;
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
