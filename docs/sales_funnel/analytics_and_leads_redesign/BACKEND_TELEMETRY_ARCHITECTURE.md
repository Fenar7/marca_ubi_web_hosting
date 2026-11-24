# Commercial Analytics & Leads Desk — Backend & Telemetry Architecture Specification

**Module**: Marca Ubi Enterprise CRM (`/admin/analytics` & `/admin/leads`)  
**Version**: 2.0.0 (Production Architecture)  
**Author**: Fenar7 <86710532+Fenar7@users.noreply.github.com>  
**Status**: APPROVED SPECIFICATION  

---

## 1. Executive Architecture & Relational Schema Mapping

This specification establishes the enterprise backend, aggregated query telemetry, and mutation contracts for the redesigned `/admin/analytics` and `/admin/leads` workspaces. The architecture is 100% grounded in real Supabase PostgreSQL tables, enforces strict Next.js 16 Server Action boundaries, guarantees atomic multi-row transactional integrity, and enforces granular Row Level Security (RLS) role boundaries.

### 1.1 Supabase Relational Schema Map

```
┌─────────────────────────────────┐               ┌─────────────────────────────────┐
│     public.funnel_statuses      │               │       public.lead_sources       │
├─────────────────────────────────┤               ├─────────────────────────────────┤
│ id: uuid (PK)                   │               │ id: uuid (PK)                   │
│ name: text                      │               │ name: text                      │
│ bucket: funnel_bucket (enum)    │               │ color_code: text                │
│ color_code: text                │               │ is_active: boolean              │
│ sort_order: integer             │               │ created_at: timestamptz         │
│ is_active: boolean              │               └───────────────┬─────────────────┘
│ created_at: timestamptz         │                               │
└───────────────┬─────────────────┘                               │
                │ 1                                               │ 1
                │                                                 │
                │ *                                               │ *
┌───────────────┴─────────────────────────────────────────────────┴─────────────────┐
│                                   public.leads                                   │
├──────────────────────────────────────────────────────────────────────────────────┤
│ id: uuid (PK)                                                                    │
│ lead_id: text (UNIQUE, e.g. 'LD-1001', generated via public.lead_code_seq)       │
│ name: text (NOT NULL)                                                            │
│ company: text (NULLABLE)                                                         │
│ company_website: text (NULLABLE)                                                 │
│ industry: text (NULLABLE)                                                        │
│ email: text (NULLABLE)                                                           │
│ phone: text (NULLABLE)                                                           │
│ preferred_channel: text (CHECK: Phone, WhatsApp, Email, Meeting)                 │
│ lead_source_id: uuid (FK -> public.lead_sources.id)                              │
│ source_detail: text (NULLABLE)                                                   │
│ service_category: text (CHECK: Web & Digital, UI/UX Design, Branding,            │
│                        Full-Suite Advisory, Mobile Apps, Other)                  │
│ budget_bracket: text (NULLABLE)                                                  │
│ priority: text (CHECK: High, Medium, Low)                                        │
│ status_id: uuid (FK -> public.funnel_statuses.id, NOT NULL)                      │
│ assigned_to: uuid (FK -> public.profiles.id, NULLABLE)                           │
│ expected_value: numeric(14,2) (DEFAULT 0.00, CHECK >= 0)                         │
│ next_follow_up: timestamptz (NULLABLE)                                           │
│ lost_reason: text (NULLABLE)                                                     │
│ revisit_date: timestamptz (NULLABLE)                                             │
│ notes: text (NULLABLE)                                                           │
│ brief_payload: jsonb (DEFAULT '{}'::jsonb)                                       │
│ inquiry_count: integer (DEFAULT 1)                                               │
│ converted_at: timestamptz (NULLABLE)                                             │
│ created_at: timestamptz (DEFAULT NOW())                                          │
│ updated_at: timestamptz (DEFAULT NOW())                                          │
└───────┬──────────────────────────────────────────────────────────┬───────────────┘
        │ 1                                                        │ *
        │                                                          │
        │ *                                                        │ 1
┌───────┴─────────────────────────┐               ┌────────────────┴────────────────┐
│      public.lead_activities     │               │         public.profiles         │
├─────────────────────────────────┤               ├─────────────────────────────────┤
│ id: uuid (PK)                   │               │ id: uuid (PK -> auth.users.id)  │
│ lead_id: uuid (FK -> leads.id)  │               │ email: text (UNIQUE)            │
│ actor_id: uuid (FK -> profiles) │               │ full_name: text                 │
│ activity_type: text (CHECK)     │               │ role: crm_user_role (enum)      │
│ description: text (NOT NULL)    │               │ job_title: text                 │
│ metadata: jsonb (DEFAULT '{}')  │               │ status: profile_account_status  │
│ created_at: timestamptz         │               │ allowed_tabs: text[]            │
└─────────────────────────────────┘               │ feature_permissions: jsonb      │
                                                  │ avatar_url: text                │
                                                  │ created_at: timestamptz         │
                                                  │ updated_at: timestamptz         │
                                                  └─────────────────────────────────┘
```

### 1.2 Security & RLS Matrix

| Role | Leads Visibility | Financials (`expected_value`) | Mutations (Status/Param) | Reassignment | Data Export |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `admin` | Global (All rows) | Visible | All deals | All deals | Permitted |
| `sales_manager` | Global (All rows) | Visible | All deals | All deals | Permitted |
| `sales_executive` | Portfolio-isolated (`assigned_to = auth.uid()`) | Hidden unless granted | Assigned deals only | Blocked | Blocked |
| `viewer` | Global (All rows) | Redacted unless `can_view_financials` | Blocked (Read-only) | Blocked | Blocked |

---

## 2. Analytics Engine & Stored PostgreSQL Telemetry

All metrics are computed inside PostgreSQL via 5 dedicated stored procedures:
1. `public.get_funnel_conversion_dropoff`: Computes step conversion and drop-off % along the 6-stage funnel.
2. `public.get_stage_dwell_time_metrics`: Computes mean, median, P90 dwell duration and flagged stalled deals.
3. `public.get_timeframe_revenue_spline`: Aggregates converted revenue and inbound pipeline across timeframe buckets (`7d`, `30d`, `90d`, `q1`–`q4`, `ytd`).
4. `public.get_service_category_distribution`: Computes revenue and win rates across service lines.
5. `public.get_cohort_win_rates`: Calculates cohort maturation win rates, cycle days, and weighted pipeline.

---

## 3. Server Actions & Batch Contracts

1. **`batchUpdateLeadStatusAction`**: Atomic transaction via `public.batch_update_lead_status` RPC. Uses `ORDER BY id ASC FOR UPDATE` to avoid deadlocks. Automatically maintains `converted_at` and audit activities.
2. **`batchReassignLeadsAction`**: Atomic transaction via `public.batch_reassign_leads` RPC. Restricted to `admin` and `sales_manager`.
3. **`exportLeadsCsvAction`**: Streaming CSV with RFC 4180 quoting, formula injection protection (`dashboardCsvCell`), and monetary masking (`dashboardSelect`).
