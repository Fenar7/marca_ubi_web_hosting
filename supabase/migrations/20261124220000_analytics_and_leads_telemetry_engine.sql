-- ==============================================================================
-- Migration: 20261124220000_analytics_and_leads_telemetry_engine.sql
-- Description: Stored Procedures & High-Performance Indexes for Commercial Analytics
--              and Inbound Leads Workspace (/admin/analytics & /admin/leads).
-- Author: Fenar7 <86710532+Fenar7@users.noreply.github.com>
-- ==============================================================================

-- 1. High-Performance Deterministic Composite Indexes for Leads Workspace
CREATE INDEX IF NOT EXISTS idx_leads_pagination_created 
ON public.leads (created_at DESC, id DESC)
WHERE (brief_payload->'synthetic_benchmark' IS NULL OR brief_payload->>'synthetic_benchmark' != 'true');

CREATE INDEX IF NOT EXISTS idx_leads_status_assigned 
ON public.leads (status_id, assigned_to, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_leads_source_priority 
ON public.leads (lead_source_id, priority, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_leads_follow_up_queue 
ON public.leads (next_follow_up ASC) 
WHERE next_follow_up IS NOT NULL;

-- 2. Stored Procedure: Funnel Conversion Drop-off Engine
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
  -- Establish Total Intake Baseline (Excluding synthetic benchmarks)
  SELECT COUNT(DISTINCT l.id)
  INTO v_total_intake
  FROM public.leads l
  WHERE (l.brief_payload->'synthetic_benchmark' IS NULL OR l.brief_payload->>'synthetic_benchmark' != 'true')
    AND (p_start_date IS NULL OR l.created_at >= p_start_date)
    AND (p_end_date IS NULL OR l.created_at <= p_end_date)
    AND (p_assignee_id IS NULL OR l.assigned_to = p_assignee_id)
    AND (p_source_id IS NULL OR l.lead_source_id = p_source_id);

  IF v_total_intake = 0 OR v_total_intake IS NULL THEN
    v_total_intake := 1;
  END IF;

  RETURN QUERY
  WITH ordered_stages AS (
    SELECT 
      fs.id AS s_id,
      fs.name AS s_name,
      fs.sort_order AS s_order,
      fs.color_code AS s_color,
      fs.bucket::text AS s_bucket
    FROM public.funnel_statuses fs
    WHERE fs.is_active = true 
      AND fs.bucket != 'lost'
    ORDER BY fs.sort_order ASC
  ),
  lead_historical_milestones AS (
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
      COUNT(lhm.lead_id) FILTER (WHERE lhm.current_status_id = os.s_id) AS currently_here,
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

-- 3. Stored Procedure: Stage Dwell Time & Velocity Metrics
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
    SELECT 
      l.id AS lead_id,
      fs_initial.id AS stage_id,
      fs_initial.name AS stage_name,
      fs_initial.sort_order,
      fs_initial.color_code,
      l.created_at AS entered_at
    FROM public.leads l
    JOIN (
      SELECT id, name, sort_order, color_code
      FROM public.funnel_statuses
      WHERE bucket = 'open' AND is_active = true
      ORDER BY sort_order ASC
      LIMIT 1
    ) fs_initial ON true
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
  WHERE si.dwell_days >= 0.05
  GROUP BY si.stage_id, si.stage_name, si.sort_order, si.color_code
  ORDER BY si.sort_order ASC;
END;
$$;

-- 4. Stored Procedure: Timeframe Revenue Spline Aggregation
CREATE OR REPLACE FUNCTION public.get_timeframe_revenue_spline(
  p_timeframe text DEFAULT '30d'
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
  v_step_seconds double precision;
BEGIN
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

-- 5. Stored Procedure: Service Category Distribution
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
  SELECT COALESCE(SUM(l.expected_value), 0.00)
  INTO v_total_pipeline
  FROM public.leads l
  JOIN public.funnel_statuses fs ON fs.id = l.status_id
  WHERE fs.bucket IN ('open', 'potential')
    AND (l.brief_payload->'synthetic_benchmark' IS NULL OR l.brief_payload->>'synthetic_benchmark' != 'true');

  IF v_total_pipeline = 0 OR v_total_pipeline IS NULL THEN
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
      WHEN 'Web & Digital' THEN '#111111'
      WHEN 'UI/UX Design' THEN '#454542'
      WHEN 'Brand Identity' THEN '#ea002a'
      WHEN 'Full-Suite Advisory' THEN '#696965'
      WHEN 'Mobile Apps' THEN '#888888'
      ELSE '#aaaaaa'
    END AS color_code
  FROM category_raw c
  ORDER BY c.active_val DESC;
END;
$$;

-- 6. Stored Procedure: Cohort Maturation & Pipeline Win Rates
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

-- 7. Stored Procedure: Atomic Batch Status Update
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
  v_actor_role text;
  v_actor_name text;
  v_target_stage record;
  v_affected_count integer := 0;
  v_lead record;
  v_sanitized_note text := TRIM(COALESCE(p_note, ''));
BEGIN
  IF auth.uid() IS NULL OR auth.uid() != p_actor_id THEN
    RAISE EXCEPTION 'Caller identity mismatch.';
  END IF;

  SELECT role, full_name INTO v_actor_role, v_actor_name
  FROM public.profiles
  WHERE id = p_actor_id AND status = 'active';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Caller identity not found or suspended.';
  END IF;

  IF v_actor_role = 'viewer' THEN
    RAISE EXCEPTION 'Privilege Violation: Read-only accounts cannot modify deal status.';
  END IF;

  SELECT id, name, bucket INTO v_target_stage
  FROM public.funnel_statuses
  WHERE id = p_status_id AND is_active = true;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Target funnel status not found or inactive.';
  END IF;

  FOR v_lead IN 
    SELECT l.id, l.status_id, l.assigned_to, l.converted_at, fs.name AS current_stage_name
    FROM public.leads l
    JOIN public.funnel_statuses fs ON fs.id = l.status_id
    WHERE l.id = ANY(p_lead_ids)
    ORDER BY l.id ASC
    FOR UPDATE
  LOOP
    IF v_actor_role = 'sales_executive' AND v_lead.assigned_to != p_actor_id THEN
      RAISE EXCEPTION 'Privilege Violation: Sales executives may only update deals assigned to their portfolio. Deal ID: %', v_lead.id;
    END IF;

    IF v_lead.converted_at IS NOT NULL AND v_actor_role != 'admin' THEN
      RAISE EXCEPTION 'Forbidden: Converted deals are locked from non-administrative modification. Deal ID: %', v_lead.id;
    END IF;

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

-- 8. Stored Procedure: Atomic Batch Reassignment
CREATE OR REPLACE FUNCTION public.batch_reassign_leads(
  p_lead_ids uuid[],
  p_destination_user_id uuid,
  p_actor_id uuid,
  p_transfer_reason text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_actor_role text;
  v_actor_name text;
  v_dest_role text;
  v_dest_name text;
  v_dest_status text;
  v_affected_count integer := 0;
  v_lead record;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() != p_actor_id THEN
    RAISE EXCEPTION 'Caller identity mismatch.';
  END IF;

  SELECT role, full_name INTO v_actor_role, v_actor_name
  FROM public.profiles
  WHERE id = p_actor_id AND status = 'active';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Caller identity not found or suspended.';
  END IF;

  IF v_actor_role != 'admin' AND v_actor_role != 'sales_manager' THEN
    RAISE EXCEPTION 'Privilege Violation: Only administrators and sales managers can reassign leads.';
  END IF;

  SELECT role, full_name, status INTO v_dest_role, v_dest_name, v_dest_status
  FROM public.profiles
  WHERE id = p_destination_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Destination user not found.';
  END IF;

  IF v_dest_status != 'active' THEN
    RAISE EXCEPTION 'Destination representative is currently suspended.';
  END IF;

  IF v_dest_role NOT IN ('admin', 'sales_manager', 'sales_executive') THEN
    RAISE EXCEPTION 'Destination user must hold an active commercial role.';
  END IF;

  FOR v_lead IN 
    SELECT l.id, l.name, l.assigned_to, l.converted_at
    FROM public.leads l
    WHERE l.id = ANY(p_lead_ids)
    ORDER BY l.id ASC
    FOR UPDATE
  LOOP
    IF v_lead.converted_at IS NOT NULL AND v_actor_role != 'admin' THEN
      RAISE EXCEPTION 'Forbidden: Converted deals cannot be reassigned by non-administrators. Deal ID: %', v_lead.id;
    END IF;

    UPDATE public.leads
    SET 
      assigned_to = p_destination_user_id,
      updated_at = NOW()
    WHERE id = v_lead.id;

    INSERT INTO public.lead_activities (
      lead_id, actor_id, activity_type, description, metadata, created_at
    ) VALUES (
      v_lead.id,
      p_actor_id,
      'reassignment',
      'Lead reassigned to ' || v_dest_name || ' by ' || v_actor_name || '. Reason: ' || p_transfer_reason,
      jsonb_build_object(
        'batch_mutation', true,
        'previous_assigned_to', v_lead.assigned_to,
        'new_assigned_to', p_destination_user_id,
        'transfer_reason', p_transfer_reason
      ),
      NOW()
    );

    v_affected_count := v_affected_count + 1;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'affected_count', v_affected_count,
    'destination_user_name', v_dest_name
  );
END;
$$;

-- Explicit RPC Permissions: Revoke execution from PUBLIC and grant only to authenticated roles
REVOKE EXECUTE ON FUNCTION public.get_funnel_conversion_dropoff(timestamp with time zone, timestamp with time zone) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_stage_dwell_time_metrics(integer) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_timeframe_revenue_spline(integer, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_service_category_distribution() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_cohort_win_rates(integer) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.batch_update_lead_status(uuid[], uuid, uuid, text, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.batch_reassign_leads(uuid[], uuid, uuid, text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.get_funnel_conversion_dropoff(timestamp with time zone, timestamp with time zone) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_stage_dwell_time_metrics(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_timeframe_revenue_spline(integer, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_service_category_distribution() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_cohort_win_rates(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.batch_update_lead_status(uuid[], uuid, uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.batch_reassign_leads(uuid[], uuid, uuid, text) TO authenticated;

