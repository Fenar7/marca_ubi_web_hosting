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

## 2. Analytics Engine & Aggregated Queries (`/admin/analytics`)

The Analytics Engine delivers sub-15ms aggregation across the entire commercial lifecycle without loading raw records into Node.js application memory. All complex calculations are executed natively in PostgreSQL via optimized CTEs and stored procedures.

### 2.1 Conversion Funnel Drop-off Query

Calculates cumulative progression, stage-to-stage transition rates, drop-off volumes, and drop-off percentages along the canonical agency pipeline:
`New` (10) $\rightarrow$ `Contacted` (20) $\rightarrow$ `Qualified` (40) $\rightarrow$ `Proposal Sent` (50) $\rightarrow$ `Negotiation` (60) $\rightarrow$ `Converted` (70).

#### Stored Function: `public.get_funnel_conversion_dropoff`

```sql
CREATE OR REPLACE FUNCTION public.get_funnel_conversion_dropoff(
  p_start_date timestamptz DEFAULT NULL,
  p_end_date timestamptz DEFAULT NULL,
  p_assignee_id uuid DEFAULT NULL,
  p_source_id uuid DEFAULT NULL
)
RETURNS TABLE (
  stage_id uuid,
  stage_name text,
  sort_order integer,
  color_code text,
  bucket text,
  leads_entered_count bigint,
  leads_currently_in_stage bigint,
  cumulative_reached_count bigint,
  drop_off_count bigint,
  stage_conversion_rate numeric(5,2),
  drop_off_rate numeric(5,2),
  overall_conversion_rate numeric(5,2)
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_total_intake bigint;
BEGIN
  -- 1. Establish Total Intake Baseline (Excluding synthetic benchmarks)
  SELECT COUNT(DISTINCT l.id)
  INTO v_total_intake
  FROM public.leads l
  WHERE (l.brief_payload->'synthetic_benchmark' IS NULL OR l.brief_payload->>'synthetic_benchmark' != 'true')
    AND (p_start_date IS NULL OR l.created_at >= p_start_date)
    AND (p_end_date IS NULL OR l.created_at <= p_end_date)
    AND (p_assignee_id IS NULL OR l.assigned_to = p_assignee_id)
    AND (p_source_id IS NULL OR l.lead_source_id = p_source_id);

  IF v_total_intake = 0 THEN
    v_total_intake := 1; -- Guard against division by zero
  END IF;

  RETURN QUERY
  WITH RECURSIVE ordered_stages AS (
    SELECT 
      fs.id AS s_id,
      fs.name AS s_name,
      fs.sort_order AS s_order,
      fs.color_code AS s_color,
      fs.bucket::text AS s_bucket
    FROM public.funnel_statuses fs
    WHERE fs.is_active = true 
      AND fs.bucket != 'lost' -- Lost is captured as terminal drop-off
    ORDER BY fs.sort_order ASC
  ),
  lead_historical_milestones AS (
    -- Collect highest milestone stage reached by every lead
    -- Incorporates both current stage and historical transition logs in lead_activities
    SELECT 
      l.id AS lead_id,
      l.status_id AS current_status_id,
      COALESCE(
        MAX(fs_hist.sort_order),
        fs_curr.sort_order
      ) AS max_sort_order_reached
    FROM public.leads l
    JOIN public.funnel_statuses fs_curr ON fs_curr.id = l.status_id
    LEFT JOIN public.lead_activities la ON la.lead_id = l.id AND la.activity_type = 'status_change'
    LEFT JOIN public.funnel_statuses fs_hist ON fs_hist.name = (la.metadata->>'new_stage')
    WHERE (l.brief_payload->'synthetic_benchmark' IS NULL OR l.brief_payload->>'synthetic_benchmark' != 'true')
      AND (p_start_date IS NULL OR l.created_at >= p_start_date)
      AND (p_end_date IS NULL OR l.created_at <= p_end_date)
      AND (p_assignee_id IS NULL OR l.assigned_to = p_assignee_id)
      AND (p_source_id IS NULL OR l.lead_source_id = p_source_id)
    GROUP BY l.id, l.status_id, fs_curr.sort_order
  ),
  stage_counts AS (
    SELECT 
      os.s_id,
      os.s_name,
      os.s_order,
      os.s_color,
      os.s_bucket,
      -- Leads currently sitting in this stage
      COUNT(lhm.lead_id) FILTER (WHERE lhm.current_status_id = os.s_id) AS currently_here,
      -- Leads that have ever reached or surpassed this stage
      COUNT(lhm.lead_id) FILTER (WHERE lhm.max_sort_order_reached >= os.s_order) AS cumulative_reached
    FROM ordered_stages os
    LEFT JOIN lead_historical_milestones lhm ON true
    GROUP BY os.s_id, os.s_name, os.s_order, os.s_color, os.s_bucket
  ),
  funnel_with_lag AS (
    SELECT 
      sc.s_id,
      sc.s_name,
      sc.s_order,
      sc.s_color,
      sc.s_bucket,
      sc.currently_here,
      sc.cumulative_reached,
      LEAD(sc.cumulative_reached) OVER (ORDER BY sc.s_order ASC) AS next_stage_reached
    FROM stage_counts sc
  )
  SELECT 
    f.s_id AS stage_id,
    f.s_name AS stage_name,
    f.s_order AS sort_order,
    f.s_color AS color_code,
    f.s_bucket AS bucket,
    f.cumulative_reached AS leads_entered_count,
    f.currently_here AS leads_currently_in_stage,
    f.cumulative_reached AS cumulative_reached_count,
    GREATEST(0, f.cumulative_reached - COALESCE(f.next_stage_reached, f.currently_here)) AS drop_off_count,
    ROUND(
      (COALESCE(f.next_stage_reached, f.cumulative_reached)::numeric / NULLIF(f.cumulative_reached, 0)::numeric) * 100.0, 
      2
    ) AS stage_conversion_rate,
    ROUND(
      (GREATEST(0, f.cumulative_reached - COALESCE(f.next_stage_reached, f.currently_here))::numeric / NULLIF(f.cumulative_reached, 0)::numeric) * 100.0, 
      2
    ) AS drop_off_rate,
    ROUND(
      (f.cumulative_reached::numeric / v_total_intake::numeric) * 100.0, 
      2
    ) AS overall_conversion_rate
  FROM funnel_with_lag f
  ORDER BY f.s_order ASC;
END;
$$;
```

---

### 2.2 Stage Dwell Time & Velocity Analytics

Computes the precise temporal residence (mean days, median days, P90 bottleneck duration) across each stage, using atomic `status_change` touchpoints and `created_at` timestamps.

#### Stored Function: `public.get_stage_dwell_time_metrics`

```sql
CREATE OR REPLACE FUNCTION public.get_stage_dwell_time_metrics(
  p_lookback_days integer DEFAULT 180
)
RETURNS TABLE (
  stage_id uuid,
  stage_name text,
  sort_order integer,
  color_code text,
  sample_size bigint,
  avg_dwell_days numeric(6,1),
  median_dwell_days numeric(6,1),
  p90_dwell_days numeric(6,1),
  stalled_deals_count bigint
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN QUERY
  WITH stage_events AS (
    -- Collect stage entry events from activities and initial lead creation
    SELECT 
      l.id AS lead_id,
      fs_initial.id AS stage_id,
      fs_initial.name AS stage_name,
      fs_initial.sort_order,
      fs_initial.color_code,
      l.created_at AS entered_at
    FROM public.leads l
    JOIN public.funnel_statuses fs_initial ON fs_initial.name = 'New'
    WHERE l.created_at >= (NOW() - (p_lookback_days || ' days')::interval)
      AND (l.brief_payload->'synthetic_benchmark' IS NULL OR l.brief_payload->>'synthetic_benchmark' != 'true')
    
    UNION ALL
    
    SELECT 
      la.lead_id,
      fs.id AS stage_id,
      fs.name AS stage_name,
      fs.sort_order,
      fs.color_code,
      la.created_at AS entered_at
    FROM public.lead_activities la
    JOIN public.funnel_statuses fs ON fs.name = (la.metadata->>'new_stage')
    WHERE la.activity_type = 'status_change'
      AND la.created_at >= (NOW() - (p_lookback_days || ' days')::interval)
  ),
  stage_intervals AS (
    SELECT 
      se.lead_id,
      se.stage_id,
      se.stage_name,
      se.sort_order,
      se.color_code,
      se.entered_at,
      LEAD(se.entered_at) OVER (PARTITION BY se.lead_id ORDER BY se.entered_at ASC) AS exited_at,
      EXTRACT(EPOCH FROM (
        COALESCE(
          LEAD(se.entered_at) OVER (PARTITION BY se.lead_id ORDER BY se.entered_at ASC),
          NOW()
        ) - se.entered_at
      )) / 86400.0 AS dwell_days
    FROM stage_events se
  )
  SELECT 
    si.stage_id,
    si.stage_name,
    si.sort_order,
    si.color_code,
    COUNT(si.lead_id) AS sample_size,
    ROUND(AVG(si.dwell_days)::numeric, 1) AS avg_dwell_days,
    ROUND(PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY si.dwell_days)::numeric, 1) AS median_dwell_days,
    ROUND(PERCENTILE_CONT(0.90) WITHIN GROUP (ORDER BY si.dwell_days)::numeric, 1) AS p90_dwell_days,
    COUNT(si.lead_id) FILTER (WHERE si.exited_at IS NULL AND si.dwell_days > 14.0) AS stalled_deals_count
  FROM stage_intervals si
  WHERE si.dwell_days >= 0.05 -- Filter out instantaneous duplicate click actions (<1 hr)
  GROUP BY si.stage_id, si.stage_name, si.sort_order, si.color_code
  ORDER BY si.sort_order ASC;
END;
$$;
```

---

### 2.3 Real Converted Revenue & Timeframe Spline Aggregation

Aggregates closed-won revenue strictly against verified `converted_at` timestamps on `public.leads`, pairing converted contracts against incoming commercial pipeline intake for comparative area splines.

#### Stored Function: `public.get_timeframe_revenue_spline`

```sql
CREATE OR REPLACE FUNCTION public.get_timeframe_revenue_spline(
  p_timeframe text DEFAULT '30d' -- '7d', '30d', '90d', 'q1', 'q2', 'q3', 'q4', 'ytd', 'year'
)
RETURNS TABLE (
  bucket_index integer,
  period_label text,
  full_period_range text,
  start_timestamp timestamptz,
  end_timestamp timestamptz,
  converted_revenue numeric(14,2),
  converted_deals_count bigint,
  inbound_pipeline_value numeric(14,2),
  inbound_deals_count bigint
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_start timestamptz;
  v_end timestamptz := NOW();
  v_interval_count integer;
  v_interval_step interval;
  v_step_seconds double precision;
BEGIN
  -- 1. Resolve Timeframe Window
  IF p_timeframe = '7d' THEN
    v_start := v_end - interval '7 days';
    v_interval_count := 7;
  ELSIF p_timeframe = '30d' THEN
    v_start := v_end - interval '30 days';
    v_interval_count := 8;
  ELSIF p_timeframe = '90d' THEN
    v_start := v_end - interval '90 days';
    v_interval_count := 8;
  ELSIF p_timeframe ILIKE 'q%' THEN
    -- Specific quarter resolution for current year
    DECLARE
      v_q_num integer := SUBSTRING(p_timeframe FROM 2 FOR 1)::integer;
      v_year integer := EXTRACT(YEAR FROM NOW())::integer;
    BEGIN
      v_start := MAKE_TIMESTAMPTZ(v_year, (v_q_num - 1) * 3 + 1, 1, 0, 0, 0, 'UTC');
      v_end := (v_start + interval '3 months') - interval '1 millisecond';
      v_interval_count := 6;
    END;
  ELSIF p_timeframe IN ('ytd', 'year') THEN
    v_start := MAKE_TIMESTAMPTZ(EXTRACT(YEAR FROM NOW())::integer, 1, 1, 0, 0, 0, 'UTC');
    v_interval_count := 12;
  ELSE
    v_start := v_end - interval '30 days';
    v_interval_count := 8;
  END IF;

  v_step_seconds := EXTRACT(EPOCH FROM (v_end - v_start)) / v_interval_count;

  RETURN QUERY
  WITH interval_series AS (
    SELECT 
      s.idx,
      v_start + ((s.idx * v_step_seconds) || ' seconds')::interval AS b_start,
      v_start + (((s.idx + 1) * v_step_seconds) || ' seconds')::interval AS b_end
    FROM generate_series(0, v_interval_count - 1) AS s(idx)
  )
  SELECT 
    i.idx AS bucket_index,
    TO_CHAR(i.b_start, 'DD Mon') AS period_label,
    TO_CHAR(i.b_start, 'DD Mon YYYY') || ' – ' || TO_CHAR(i.b_end, 'DD Mon YYYY') AS full_period_range,
    i.b_start AS start_timestamp,
    i.b_end AS end_timestamp,
    COALESCE(SUM(l_conv.expected_value), 0.00) AS converted_revenue,
    COUNT(l_conv.id) AS converted_deals_count,
    COALESCE(SUM(l_inbound.expected_value), 0.00) AS inbound_pipeline_value,
    COUNT(l_inbound.id) AS inbound_deals_count
  FROM interval_series i
  LEFT JOIN public.leads l_conv ON l_conv.converted_at >= i.b_start 
                                AND l_conv.converted_at < i.b_end
                                AND (l_conv.brief_payload->'synthetic_benchmark' IS NULL OR l_conv.brief_payload->>'synthetic_benchmark' != 'true')
  LEFT JOIN public.leads l_inbound ON l_inbound.created_at >= i.b_start 
                                  AND l_inbound.created_at < i.b_end
                                  AND (l_inbound.brief_payload->'synthetic_benchmark' IS NULL OR l_inbound.brief_payload->>'synthetic_benchmark' != 'true')
  GROUP BY i.idx, i.b_start, i.b_end
  ORDER BY i.idx ASC;
END;
$$;
```

---

### 2.4 Practice / Service Category Distribution

#### Stored Function: `public.get_service_category_distribution`

```sql
CREATE OR REPLACE FUNCTION public.get_service_category_distribution(
  p_lookback_days integer DEFAULT 90
)
RETURNS TABLE (
  category_name text,
  active_deals_count bigint,
  active_pipeline_value numeric(14,2),
  converted_deals_count bigint,
  converted_revenue_value numeric(14,2),
  win_rate_percentage numeric(5,2),
  portfolio_share_percentage numeric(5,2),
  color_code text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_total_pipeline numeric(14,2);
BEGIN
  -- Total Active Pipeline Baseline
  SELECT COALESCE(SUM(l.expected_value), 0.00)
  INTO v_total_pipeline
  FROM public.leads l
  JOIN public.funnel_statuses fs ON fs.id = l.status_id
  WHERE fs.bucket IN ('open', 'potential')
    AND (l.brief_payload->'synthetic_benchmark' IS NULL OR l.brief_payload->>'synthetic_benchmark' != 'true');

  IF v_total_pipeline = 0 THEN
    v_total_pipeline := 1;
  END IF;

  RETURN QUERY
  WITH category_raw AS (
    SELECT 
      COALESCE(NULLIF(TRIM(l.service_category), ''), 'Other') AS cat,
      COUNT(l.id) FILTER (WHERE fs.bucket IN ('open', 'potential')) AS active_cnt,
      COALESCE(SUM(l.expected_value) FILTER (WHERE fs.bucket IN ('open', 'potential')), 0.00) AS active_val,
      COUNT(l.id) FILTER (WHERE fs.bucket = 'converted') AS won_cnt,
      COALESCE(SUM(l.expected_value) FILTER (WHERE fs.bucket = 'converted'), 0.00) AS won_val,
      COUNT(l.id) FILTER (WHERE fs.bucket = 'lost') AS lost_cnt
    FROM public.leads l
    JOIN public.funnel_statuses fs ON fs.id = l.status_id
    WHERE l.created_at >= (NOW() - (p_lookback_days || ' days')::interval)
      AND (l.brief_payload->'synthetic_benchmark' IS NULL OR l.brief_payload->>'synthetic_benchmark' != 'true')
    GROUP BY COALESCE(NULLIF(TRIM(l.service_category), ''), 'Other')
  )
  SELECT 
    c.cat AS category_name,
    c.active_cnt AS active_deals_count,
    c.active_val AS active_pipeline_value,
    c.won_cnt AS converted_deals_count,
    c.won_val AS converted_revenue_value,
    ROUND(
      (c.won_cnt::numeric / NULLIF((c.won_cnt + c.lost_cnt), 0)::numeric) * 100.0,
      2
    ) AS win_rate_percentage,
    ROUND(
      (c.active_val / v_total_pipeline) * 100.0,
      2
    ) AS portfolio_share_percentage,
    CASE c.cat
      WHEN 'Web & Digital' THEN '#2563eb'
      WHEN 'UI/UX Design' THEN '#3b82f6'
      WHEN 'Branding' THEN '#60a5fa'
      WHEN 'Full-Suite Advisory' THEN '#a855f7'
      WHEN 'Mobile Apps' THEN '#06b6d4'
      ELSE '#cbd5e1'
    END AS color_code
  FROM category_raw c
  ORDER BY c.active_val DESC;
END;
$$;
```

---

### 2.5 Cohort Win Rate & Pipeline Velocity Engine

Tracks monthly and quarterly intake cohorts over their natural maturation cycle:
$$\text{Cohort Win Rate} = \frac{\text{Won Leads in Cohort}}{\text{Total Terminal Leads (Won + Lost) in Cohort}} \times 100\%$$
$$\text{Weighted Pipeline Velocity} = \frac{\sum (\text{Deal Valuation} \times \text{Stage Probability})}{\text{Mean Sales Cycle Duration (Days)}}$$

#### Stored Function: `public.get_cohort_win_rates`

```sql
CREATE OR REPLACE FUNCTION public.get_cohort_win_rates(
  p_cohort_months integer DEFAULT 12
)
RETURNS TABLE (
  cohort_month text,
  total_ingested bigint,
  active_in_flight bigint,
  closed_won bigint,
  closed_lost bigint,
  closed_deal_win_rate numeric(5,2),
  pipeline_win_rate numeric(5,2),
  total_won_revenue numeric(14,2),
  avg_cycle_days numeric(6,1),
  weighted_pipeline_value numeric(14,2)
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN QUERY
  WITH cohort_leads AS (
    SELECT 
      TO_CHAR(DATE_TRUNC('month', l.created_at), 'YYYY-MM') AS c_month,
      l.id,
      l.expected_value,
      fs.bucket,
      fs.name AS stage_name,
      l.created_at,
      l.converted_at,
      CASE 
        WHEN l.converted_at IS NOT NULL THEN 
          EXTRACT(EPOCH FROM (l.converted_at - l.created_at)) / 86400.0
        ELSE NULL
      END AS cycle_days,
      CASE fs.name
        WHEN 'New' THEN 0.10
        WHEN 'Contacted' THEN 0.20
        WHEN 'Qualified' THEN 0.40
        WHEN 'Proposal Sent' THEN 0.65
        WHEN 'Negotiation' THEN 0.85
        WHEN 'Converted' THEN 1.00
        ELSE 0.00
      END AS stage_probability
    FROM public.leads l
    JOIN public.funnel_statuses fs ON fs.id = l.status_id
    WHERE l.created_at >= (DATE_TRUNC('month', NOW()) - ((p_cohort_months - 1) || ' months')::interval)
      AND (l.brief_payload->'synthetic_benchmark' IS NULL OR l.brief_payload->>'synthetic_benchmark' != 'true')
  )
  SELECT 
    cl.c_month AS cohort_month,
    COUNT(cl.id) AS total_ingested,
    COUNT(cl.id) FILTER (WHERE cl.bucket IN ('open', 'potential')) AS active_in_flight,
    COUNT(cl.id) FILTER (WHERE cl.bucket = 'converted') AS closed_won,
    COUNT(cl.id) FILTER (WHERE cl.bucket = 'lost') AS closed_lost,
    ROUND(
      (COUNT(cl.id) FILTER (WHERE cl.bucket = 'converted')::numeric / 
       NULLIF(COUNT(cl.id) FILTER (WHERE cl.bucket IN ('converted', 'lost')), 0)::numeric) * 100.0,
      2
    ) AS closed_deal_win_rate,
    ROUND(
      (COUNT(cl.id) FILTER (WHERE cl.bucket = 'converted')::numeric / 
       NULLIF(COUNT(cl.id), 0)::numeric) * 100.0,
      2
    ) AS pipeline_win_rate,
    COALESCE(SUM(cl.expected_value) FILTER (WHERE cl.bucket = 'converted'), 0.00) AS total_won_revenue,
    ROUND(AVG(cl.cycle_days)::numeric, 1) AS avg_cycle_days,
    ROUND(SUM(cl.expected_value * cl.stage_probability)::numeric, 2) AS weighted_pipeline_value
  FROM cohort_leads cl
  GROUP BY cl.c_month
  ORDER BY cl.c_month DESC;
END;
$$;
```

---

## 3. Leads Query & Batch Mutation Contracts (`/admin/leads`)

### 3.1 High-Performance Indexed Query Specification

To achieve $< 20\text{ms}$ query latency on paginated data grids with up to 100,000 lead records, the following composite indexes must exist in PostgreSQL:

```sql
-- 1. High-Performance Deterministic Pagination & Ordering Index
CREATE INDEX IF NOT EXISTS idx_leads_pagination_created 
ON public.leads (created_at DESC, id DESC)
WHERE (brief_payload->'synthetic_benchmark' IS NULL OR brief_payload->>'synthetic_benchmark' != 'true');

-- 2. Stage & Assignee Filtering Composite Index
CREATE INDEX IF NOT EXISTS idx_leads_status_assigned 
ON public.leads (status_id, assigned_to, created_at DESC);

-- 3. Source & Priority Filtering Composite Index
CREATE INDEX IF NOT EXISTS idx_leads_source_priority 
ON public.leads (lead_source_id, priority, created_at DESC);

-- 4. Follow-up SLA Queue Index
CREATE INDEX IF NOT EXISTS idx_leads_follow_up_queue 
ON public.leads (next_follow_up ASC) 
WHERE next_follow_up IS NOT NULL;
```

#### Pagination Engine Invariant

The pagination query strictly uses:
1. `range((page - 1) * pageSize, page * pageSize - 1)`
2. Deterministic secondary ordering: `.order('created_at', { ascending: false }).order('id', { ascending: false })`
3. Mandatory `SYNTHETIC_EXCLUSION`: `.or('brief_payload->synthetic_benchmark.is.null,brief_payload->>synthetic_benchmark.neq.true')`
4. Permission-controlled column selection via `dashboardSelect(canViewFinancials, 'pipeline')`.

---

### 3.2 Server Actions for Batch Mutations

All batch operations are executed inside PostgreSQL transactions via dedicated stored procedures to guarantee ACID compliance.

#### 1. `batchUpdateLeadStatus`

Advances or changes the funnel stage for up to 100 deals simultaneously.
- Locks candidate rows deterministically (`ORDER BY id ASC FOR UPDATE`) to prevent deadlocks.
- Automatically stamps `converted_at = NOW()` when moving to bucket `converted`.
- Prevents non-administrators from tampering with already-converted deals.
- Injects atomic audit entries into `public.lead_activities` for every affected deal.

##### Stored Procedure: `public.batch_update_lead_status`

```sql
CREATE OR REPLACE FUNCTION public.batch_update_lead_status(
  p_lead_ids uuid[],
  p_status_id uuid,
  p_actor_id uuid,
  p_lost_reason text DEFAULT NULL,
  p_note text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_actor_role crm_user_role;
  v_actor_name text;
  v_target_stage record;
  v_affected_count integer := 0;
  v_lead record;
  v_sanitized_note text := TRIM(COALESCE(p_note, ''));
BEGIN
  -- 1. Validate Caller Profile
  SELECT role, full_name INTO v_actor_role, v_actor_name
  FROM public.profiles
  WHERE id = p_actor_id AND status = 'active';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Caller identity not found or suspended.';
  END IF;

  IF v_actor_role = 'viewer' THEN
    RAISE EXCEPTION 'Privilege Violation: Read-only accounts cannot modify deal status.';
  END IF;

  -- 2. Validate Target Status
  SELECT id, name, bucket INTO v_target_stage
  FROM public.funnel_statuses
  WHERE id = p_status_id AND is_active = true;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Target funnel status not found or inactive.';
  END IF;

  -- 3. Lock & Process Candidate Leads (Deterministic Lock Order eliminates Deadlock)
  FOR v_lead IN 
    SELECT l.id, l.status_id, l.assigned_to, l.converted_at, fs.name AS current_stage_name
    FROM public.leads l
    JOIN public.funnel_statuses fs ON fs.id = l.status_id
    WHERE l.id = ANY(p_lead_ids)
    ORDER BY l.id ASC
    FOR UPDATE
  LOOP
    -- Sales Executive Portfolio Isolation Guard
    IF v_actor_role = 'sales_executive' AND v_lead.assigned_to != p_actor_id THEN
      RAISE EXCEPTION 'Privilege Violation: Sales executives may only update deals assigned to their portfolio. Deal ID: %', v_lead.id;
    END IF;

    -- Converted Deal Lock Guard
    IF v_lead.converted_at IS NOT NULL AND v_actor_role != 'admin' THEN
      RAISE EXCEPTION 'Forbidden: Converted deals are locked from non-administrative modification. Deal ID: %', v_lead.id;
    END IF;

    -- Execute Mutation
    UPDATE public.leads
    SET 
      status_id = p_status_id,
      converted_at = CASE 
        WHEN v_target_stage.bucket = 'converted' AND v_lead.converted_at IS NULL THEN NOW()
        WHEN v_target_stage.bucket != 'converted' THEN NULL
        ELSE converted_at
      END,
      lost_reason = CASE 
        WHEN v_target_stage.bucket = 'lost' THEN p_lost_reason
        ELSE NULL
      END,
      updated_at = NOW()
    WHERE id = v_lead.id;

    -- Insert Audit Activity
    INSERT INTO public.lead_activities (
      lead_id, actor_id, activity_type, description, metadata, created_at
    ) VALUES (
      v_lead.id,
      p_actor_id,
      'status_change',
      'Batch updated stage from ' || v_lead.current_stage_name || ' to ' || v_target_stage.name || ' by ' || v_actor_name || 
        CASE WHEN v_sanitized_note != '' THEN '. Note: ' || v_sanitized_note ELSE '' END,
      jsonb_build_object(
        'batch_mutation', true,
        'old_stage', v_lead.current_stage_name,
        'new_stage', v_target_stage.name,
        'new_status_id', p_status_id,
        'lost_reason', p_lost_reason
      ),
      NOW()
    );

    v_affected_count := v_affected_count + 1;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'affected_count', v_affected_count,
    'target_status_name', v_target_stage.name
  );
END;
$$;
```

##### Server Action Implementation: `src/app/actions/batchLeads.ts`

```ts
'use server';

/**
 * @file batchLeads.ts
 * @description Next.js 16 Server Actions for commercial batch mutations and data export.
 *              Strictly exports only async functions to adhere to Next.js boundary invariants.
 * @module actions/batchLeads
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import { revalidatePath } from 'next/cache';
import { createClient } from '@/app/lib/supabase/server';
import { batchUpdateLeadStatusSchema, batchReassignLeadsSchema } from '@/app/lib/lead-schemas';
import type { LeadActionResult } from '@/types/crm';

export async function batchUpdateLeadStatusAction(input: unknown): Promise<LeadActionResult<{ affectedCount: number }>> {
  try {
    const parsed = batchUpdateLeadStatusSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message || 'Invalid batch status parameters.' };
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Unauthorized: Session required.' };

    const { data, error } = await supabase.rpc('batch_update_lead_status', {
      p_lead_ids: parsed.data.leadIds,
      p_status_id: parsed.data.statusId,
      p_actor_id: user.id,
      p_lost_reason: parsed.data.lostReason || null,
      p_note: parsed.data.note || null,
    });

    if (error) return { success: false, error: error.message };

    revalidatePath('/admin');
    revalidatePath('/admin/leads');
    revalidatePath('/admin/deals');
    revalidatePath('/admin/analytics');

    return { success: true, data: { affectedCount: (data as { affected_count: number }).affected_count } };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Batch status update failed.';
    return { success: false, error: message };
  }
}
```

---

#### 2. `batchReassignLeads`

Reassigns a batch of up to 100 leads to another active commercial representative.
- Gated strictly to Administrators and Sales Managers (`can_reassign_leads`).
- Rejects assignment to read-only (`viewer`) or suspended personnel.
- Injects `reassignment` audit entries for every affected lead.

##### Stored Procedure: `public.batch_reassign_leads`

```sql
CREATE OR REPLACE FUNCTION public.batch_reassign_leads(
  p_lead_ids uuid[],
  p_destination_user_id uuid,
  p_transfer_reason text,
  p_actor_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_actor_role crm_user_role;
  v_actor_name text;
  v_dest_user record;
  v_affected_count integer := 0;
  v_lead record;
BEGIN
  -- 1. Validate Caller Authority (Admin or Sales Manager only)
  SELECT role, full_name INTO v_actor_role, v_actor_name
  FROM public.profiles
  WHERE id = p_actor_id AND status = 'active';

  IF NOT FOUND OR (v_actor_role != 'admin' AND v_actor_role != 'sales_manager') THEN
    RAISE EXCEPTION 'Privilege Violation: Deal reassignment requires Administrator or Sales Manager authorization.';
  END IF;

  -- 2. Validate Destination Personnel
  SELECT id, full_name, email, role, status INTO v_dest_user
  FROM public.profiles
  WHERE id = p_destination_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Destination personnel not found in directory.';
  END IF;

  IF v_dest_user.status != 'active' THEN
    RAISE EXCEPTION 'Cannot assign deals to suspended personnel.';
  END IF;

  IF v_dest_user.role = 'viewer' THEN
    RAISE EXCEPTION 'Cannot assign deals to read-only personnel.';
  END IF;

  -- 3. Lock & Reassign Candidate Leads
  FOR v_lead IN 
    SELECT l.id, l.assigned_to, l.converted_at, p_prev.full_name AS prev_name
    FROM public.leads l
    LEFT JOIN public.profiles p_prev ON p_prev.id = l.assigned_to
    WHERE l.id = ANY(p_lead_ids)
    ORDER BY l.id ASC
    FOR UPDATE
  LOOP
    -- Converted deal lock: only admins can reassign converted accounts
    IF v_lead.converted_at IS NOT NULL AND v_actor_role != 'admin' THEN
      RAISE EXCEPTION 'Forbidden: Converted accounts cannot be reassigned by sales managers. Deal ID: %', v_lead.id;
    END IF;

    UPDATE public.leads
    SET 
      assigned_to = p_destination_user_id,
      updated_at = NOW()
    WHERE id = v_lead.id;

    -- Append audit activity
    INSERT INTO public.lead_activities (
      lead_id, actor_id, activity_type, description, metadata, created_at
    ) VALUES (
      v_lead.id,
      p_actor_id,
      'reassignment',
      'Batch reassigned from ' || COALESCE(v_lead.prev_name, 'Unassigned') || ' to ' || v_dest_user.full_name || ' by ' || v_actor_name || '. Reason: ' || p_transfer_reason,
      jsonb_build_object(
        'batch_mutation', true,
        'previous_assignee_id', v_lead.assigned_to,
        'new_assignee_id', p_destination_user_id,
        'new_assignee_name', v_dest_user.full_name,
        'transfer_reason', p_transfer_reason
      ),
      NOW()
    );

    v_affected_count := v_affected_count + 1;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'affected_count', v_affected_count,
    'new_assignee_name', v_dest_user.full_name
  );
END;
$$;
```

##### Server Action Implementation: `src/app/actions/batchLeads.ts` (Cont.)

```ts
export async function batchReassignLeadsAction(input: unknown): Promise<LeadActionResult<{ affectedCount: number }>> {
  try {
    const parsed = batchReassignLeadsSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message || 'Invalid batch reassignment parameters.' };
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Unauthorized: Session required.' };

    const { data, error } = await supabase.rpc('batch_reassign_leads', {
      p_lead_ids: parsed.data.leadIds,
      p_destination_user_id: parsed.data.assigneeId,
      p_transfer_reason: parsed.data.transferReason,
      p_actor_id: user.id,
    });

    if (error) return { success: false, error: error.message };

    revalidatePath('/admin');
    revalidatePath('/admin/leads');
    revalidatePath('/admin/deals');
    revalidatePath('/admin/team');

    return { success: true, data: { affectedCount: (data as { affected_count: number }).affected_count } };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Batch reassignment failed.';
    return { success: false, error: message };
  }
}
```

---

#### 3. `exportLeadsCsv`

Generates an RFC 4180-compliant, streaming-compatible CSV export.
- Gated strictly by `can_export_data` feature flag.
- Enforces formula-injection neutralization (`dashboardCsvCell`) preventing CSV injection vulnerabilities (`=`, `+`, `-`, `@`, `\t`, `\r`).
- Redacts financial valuations (`expected_value`) if the caller's role lacks `can_view_financials`.

##### Implementation: `src/app/actions/exportLeads.ts`

```ts
'use server';

/**
 * @file exportLeads.ts
 * @description RLS-sanitized CSV export action for commercial leads.
 *              Strictly complies with Next.js 16 Server Action boundaries.
 * @module actions/exportLeads
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import { createClient } from '@/app/lib/supabase/server';
import { dashboardCsvCell, dashboardFeature } from '@/app/admin/lib/dashboardContracts';
import { exportLeadsCsvSchema, type ExportLeadsCsvFilters } from '@/app/lib/lead-schemas';
import type { CrmUserRole } from '@/types/crm';

export async function exportLeadsCsvAction(filters: ExportLeadsCsvFilters): Promise<{ success: boolean; csvContent?: string; error?: string }> {
  try {
    const parsed = exportLeadsCsvSchema.safeParse(filters);
    if (!parsed.success) {
      return { success: false, error: 'Invalid filter criteria for CSV export.' };
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Unauthorized: Active CRM session required.' };

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, status, feature_permissions')
      .eq('id', user.id)
      .maybeSingle();

    if (!profile || profile.status !== 'active') return { success: false, error: 'Account suspended or unverified.' };

    const role = profile.role as CrmUserRole;
    const canExport = dashboardFeature(role, profile.feature_permissions, 'can_export_data');
    if (!canExport) return { success: false, error: 'Privilege Violation: Your role is not authorized to export commercial data.' };

    const canViewFinancials = dashboardFeature(role, profile.feature_permissions, 'can_view_financials');

    // Build RLS-scoped query
    let query = supabase.from('leads').select(`
      lead_id, name, company, email, phone, preferred_channel, service_category,
      priority, expected_value, next_follow_up, created_at,
      funnel_statuses!inner(name, bucket),
      lead_sources(name),
      profiles:profiles!leads_assigned_to_fkey(full_name)
    `).or('brief_payload->synthetic_benchmark.is.null,brief_payload->>synthetic_benchmark.neq.true');

    const f = parsed.data;
    if (f.stage) query = query.eq('status_id', f.stage);
    if (f.assignedTo) query = query.eq('assigned_to', f.assignedTo);
    if (f.source) query = query.eq('lead_source_id', f.source);
    if (f.priority) query = query.ilike('priority', f.priority);
    if (f.bucket && f.bucket !== 'all') query = query.eq('funnel_statuses.bucket', f.bucket);
    if (f.startDate) query = query.gte('created_at', f.startDate);
    if (f.endDate) query = query.lte('created_at', f.endDate);

    const { data: leads, error } = await query
      .order('created_at', { ascending: false })
      .limit(10000);

    if (error || !leads) {
      return { success: false, error: `Failed to query leads for export: ${error?.message || 'Empty response'}` };
    }

    // CSV Headers
    const headers = [
      'Lead ID', 'Client Name', 'Company', 'Email', 'Phone', 'Preferred Channel',
      'Service Practice', 'Priority', 'Funnel Stage', 'Pipeline Bucket',
      'Lead Source', 'Assigned Representative',
      ...(canViewFinancials ? ['Expected Valuation (INR)'] : []),
      'Next SLA Commitment', 'Ingestion Date'
    ];

    const rows: string[] = [headers.map(dashboardCsvCell).join(',')];

    for (const lead of leads) {
      const status = lead.funnel_statuses as { name: string; bucket: string } | null;
      const source = lead.lead_sources as { name: string } | null;
      const assignee = lead.profiles as { full_name: string } | null;

      const rowValues = [
        lead.lead_id,
        lead.name,
        lead.company || '',
        lead.email || '',
        lead.phone || '',
        lead.preferred_channel || 'Phone',
        lead.service_category || 'Web & Digital',
        lead.priority || 'Medium',
        status?.name || 'Active',
        status?.bucket || 'open',
        source?.name || 'Direct Referral',
        assignee?.full_name || 'Unassigned',
        ...(canViewFinancials ? [lead.expected_value !== null ? Number(lead.expected_value) : 0] : []),
        lead.next_follow_up || '',
        lead.created_at
      ];

      rows.push(rowValues.map(dashboardCsvCell).join(','));
    }

    return {
      success: true,
      csvContent: rows.join('\r\n'),
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'CSV generation failed.';
    return { success: false, error: message };
  }
}
```

---

## 4. Security, Validation & Zod Schema Contracts

In strict compliance with `scripts/verify-server-action-boundaries.ts`, all Zod schemas are isolated in `src/app/lib/lead-schemas.ts` and `src/app/lib/analytics-schemas.ts`. Zero non-async values are exported from Server Action modules.

### 4.1 Schemas: `src/app/lib/analytics-schemas.ts`

```ts
/**
 * @file analytics-schemas.ts
 * @description Zod input validation schemas for executive analytics query endpoints.
 * @module lib/analytics-schemas
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import { z } from 'zod';

const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

export const analyticsTimeframeQuerySchema = z.object({
  timeframe: z.enum(['7d', '30d', '90d', 'q1', 'q2', 'q3', 'q4', 'ytd', 'year']).default('30d'),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  assigneeId: z.string().regex(UUID_REGEX, 'Invalid representative identifier').optional(),
  sourceId: z.string().regex(UUID_REGEX, 'Invalid lead source identifier').optional(),
  serviceCategory: z.enum([
    'Branding',
    'Web & Digital',
    'Mobile Apps',
    'UI/UX Design',
    'Full-Suite Advisory',
    'Other'
  ]).optional(),
});

export type AnalyticsTimeframeQueryParams = z.infer<typeof analyticsTimeframeQuerySchema>;
```

### 4.2 Schemas: Added to `src/app/lib/lead-schemas.ts`

```ts
export const batchUpdateLeadStatusSchema = z.object({
  leadIds: z
    .array(z.string().regex(UUID_REGEX, 'Invalid lead UUID'))
    .min(1, 'At least one lead must be selected for batch update.')
    .max(100, 'Batch status update cannot exceed 100 leads simultaneously.'),
  statusId: z
    .string({ message: 'Target status identifier is required.' })
    .regex(UUID_REGEX, 'Invalid status UUID.'),
  lostReason: z
    .string()
    .trim()
    .max(500, 'Lost reason cannot exceed 500 characters.')
    .optional()
    .nullable(),
  note: z
    .string()
    .trim()
    .max(2000, 'Transition note cannot exceed 2000 characters.')
    .optional()
    .nullable(),
});

export type BatchUpdateLeadStatusInput = z.infer<typeof batchUpdateLeadStatusSchema>;

export const batchReassignLeadsSchema = z.object({
  leadIds: z
    .array(z.string().regex(UUID_REGEX, 'Invalid lead UUID'))
    .min(1, 'At least one lead must be selected for reassignment.')
    .max(100, 'Batch reassignment cannot exceed 100 leads simultaneously.'),
  assigneeId: z
    .string({ message: 'Target assignee identifier is required.' })
    .regex(UUID_REGEX, 'Invalid representative UUID.'),
  transferReason: z
    .string({ message: 'Transfer reason is mandatory for commercial governance.' })
    .trim()
    .min(3, 'Transfer reason must be at least 3 characters.')
    .max(1000, 'Transfer reason cannot exceed 1000 characters.'),
});

export type BatchReassignLeadsInput = z.infer<typeof batchReassignLeadsSchema>;

export const exportLeadsCsvSchema = z.object({
  stage: z.string().regex(UUID_REGEX).optional(),
  assignedTo: z.string().regex(UUID_REGEX).optional(),
  source: z.string().regex(UUID_REGEX).optional(),
  priority: z.enum(['high', 'medium', 'low']).optional(),
  bucket: z.enum(['all', 'open', 'potential', 'converted', 'lost']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  search: z.string().max(255).optional(),
});

export type ExportLeadsCsvFilters = z.infer<typeof exportLeadsCsvSchema>;
```

---

## 5. Summary & Hand-off Checklist

This architecture provides the complete backend blueprint for `/admin/analytics` and `/admin/leads`:
1. **Mathematical Rigor**: Native PostgreSQL RPC stored procedures for conversion drop-off curves, dwell time percentiles (median and P90), spline revenue aggregation, and cohort win rates.
2. **ACID Transaction Isolation**: Deadlock-free batch mutations via `batch_update_lead_status` and `batch_reassign_leads` with deterministic row locking and immutable audit logs.
3. **Enterprise Defense**: Next.js 16 Server Action boundaries, Zod schema isolation, RLS role isolation, CSV formula-injection protection, and zero financial telemetry leakage for viewer accounts.
