-- ============================================================================
-- Marca Ubi Enterprise Agency CRM & Sales Intelligence Platform
-- Migration: 20261015000002_initial_seed_data.sql
-- Phase: 1 (Database Architecture & Stored Logic Engine)
-- Sprint: 1.1 (Core Relational Schema, Domain Types & Table Constraints)
-- Target Engine: PostgreSQL 15+ (Supabase Managed PostgreSQL)
-- Description: Provisions deterministic reference seed records for lead sources
--              and funnel statuses, ensuring fail-safe ingestion fallbacks.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. SEED LEAD SOURCES
-- ----------------------------------------------------------------------------
-- Deterministic seed UUIDs are provided to allow resilient fallback assignment
-- in inbound webhook APIs (/api/sales-funnel/ingest) without database lookup round-trips.
INSERT INTO public.lead_sources (id, name, color_code, is_active)
VALUES
    ('a0000000-0000-0000-0000-000000000001', 'Website Form', '#ff6100', true),
    ('a0000000-0000-0000-0000-000000000002', 'WhatsApp Inbound', '#22c55e', true),
    ('a0000000-0000-0000-0000-000000000003', 'Direct Referral', '#3b82f6', true),
    ('a0000000-0000-0000-0000-000000000004', 'Founder / Executive Outreach', '#a855f7', true),
    ('a0000000-0000-0000-0000-000000000005', 'Cold Campaign', '#eab308', true)
ON CONFLICT (name) DO UPDATE SET
    color_code = EXCLUDED.color_code,
    is_active = EXCLUDED.is_active;

-- ----------------------------------------------------------------------------
-- 2. SEED FUNNEL STATUSES
-- ----------------------------------------------------------------------------
-- The initial 8 stages map directly to the 4 commercial macro-buckets.
-- 'New' status (UUID b0000000-0000-0000-0000-000000000001) serves as the
-- immutable default state for all automated inbound web briefs.
INSERT INTO public.funnel_statuses (id, name, bucket, color_code, sort_order, is_active)
VALUES
    ('b0000000-0000-0000-0000-000000000001', 'New', 'open', '#ffffff', 10, true),
    ('b0000000-0000-0000-0000-000000000002', 'Contacted', 'open', '#94a3b8', 20, true),
    ('b0000000-0000-0000-0000-000000000003', 'On Hold', 'open', '#f59e0b', 30, true),
    ('b0000000-0000-0000-0000-000000000004', 'Qualified', 'potential', '#38bdf8', 40, true),
    ('b0000000-0000-0000-0000-000000000005', 'Proposal Sent', 'potential', '#818cf8', 50, true),
    ('b0000000-0000-0000-0000-000000000006', 'Negotiation', 'potential', '#ff6100', 60, true),
    ('b0000000-0000-0000-0000-000000000007', 'Converted', 'converted', '#22c55e', 70, true),
    ('b0000000-0000-0000-0000-000000000008', 'Lost', 'lost', '#ef4444', 80, true)
ON CONFLICT (name) DO UPDATE SET
    bucket = EXCLUDED.bucket,
    color_code = EXCLUDED.color_code,
    sort_order = EXCLUDED.sort_order,
    is_active = EXCLUDED.is_active;
