/**
 * Marca Ubi Enterprise Agency CRM & Sales Intelligence Platform
 * Migration: 20261015000002_triggers_and_sequences.sql
 * Phase: 1 (Database Architecture & Stored Logic Engine)
 * Sprint: 1.2 (Deterministic Sequence Generators, Audit Engines & Database Triggers)
 * Target Engine: PostgreSQL 15+ (Supabase Managed PostgreSQL)
 * Description: Implements database-level triggers for automatic UTC timestamp synchronization,
 *              agency sole administrator lockout defense with advisory serialization,
 *              and hardened automated JSONB delta audit logging.
 */

-- 1. Automatic UTC Timestamp Synchronization Function & Triggers
-- Architectural Rationale: Intercepts BEFORE UPDATE on mutable entities (leads, profiles)
-- and synchronizes updated_at to the current UTC timestamp using the database engine clock.
-- Eliminates reliance on client application clocks and prevents timezone drift.
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.handle_updated_at() IS 'Enforces automatic UTC timestamp synchronization on record mutation.';

DROP TRIGGER IF EXISTS trg_leads_updated_at ON public.leads;
CREATE TRIGGER trg_leads_updated_at
BEFORE UPDATE ON public.leads
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 2. Agency Sole Administrator Protection Trigger
-- Architectural Rationale: Prevents catastrophic administrative lockout where an agency
-- admin demotes, suspends, or deletes the sole remaining active admin.
-- Concurrency Defense: Uses pg_advisory_xact_lock to eliminate write-skew race conditions
-- when two active administrators attempt concurrent self-demotions in parallel transactions.
CREATE OR REPLACE FUNCTION public.protect_sole_admin()
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
    active_admin_count INT;
BEGIN
    -- Evaluate updates on existing active administrators
    IF TG_OP = 'UPDATE' THEN
        IF OLD.role = 'admin' AND OLD.status = 'active' THEN
            -- Check if the update alters role or operational status away from active admin
            IF NEW.role IS DISTINCT FROM 'admin' OR NEW.status IS DISTINCT FROM 'active' THEN
                -- Acquire transactional advisory lock to strictly serialize sole-admin verification
                PERFORM pg_advisory_xact_lock(hashtext('protect_sole_admin_lock'));

                SELECT COUNT(*)
                INTO active_admin_count
                FROM public.profiles
                WHERE role = 'admin' 
                  AND status = 'active' 
                  AND id != OLD.id;

                IF active_admin_count = 0 THEN
                    RAISE EXCEPTION 'Agency Invariant Violation: Operation rejected. Cannot demote or suspend the sole active administrator in the agency.'
                        USING ERRCODE = '23514';
                END IF;
            END IF;
        END IF;
        RETURN NEW;
    END IF;

    -- Evaluate hard deletions
    IF TG_OP = 'DELETE' THEN
        IF OLD.role = 'admin' AND OLD.status = 'active' THEN
            -- Acquire transactional advisory lock to serialize deletion checks
            PERFORM pg_advisory_xact_lock(hashtext('protect_sole_admin_lock'));

            SELECT COUNT(*)
            INTO active_admin_count
            FROM public.profiles
            WHERE role = 'admin' 
              AND status = 'active' 
              AND id != OLD.id;

            IF active_admin_count = 0 THEN
                RAISE EXCEPTION 'Agency Invariant Violation: Operation rejected. Cannot delete the sole active administrator profile.'
                    USING ERRCODE = '23514';
            END IF;
        END IF;
        RETURN OLD;
    END IF;

    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.protect_sole_admin() IS 'Guarantees agency governance by preventing demotion, suspension, or deletion of the sole active administrator with advisory locking.';

DROP TRIGGER IF EXISTS trg_protect_sole_admin ON public.profiles;
CREATE TRIGGER trg_protect_sole_admin
BEFORE UPDATE OR DELETE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.protect_sole_admin();

-- 3. Automated Delta-Capturing Audit Engine Trigger
-- Architectural Rationale: Automatically captures before-and-after JSONB deltas on all lead mutations.
-- Security Definer Hardening: Statically pinned to SET search_path = public, auth, pg_temp to eliminate
-- search_path hijacking vulnerabilities (CWE-426).
-- Background Job Categorization: Classifies unauthenticated backend cron mutations as system_event per PRD §15.2.
CREATE OR REPLACE FUNCTION public.audit_lead_changes_trigger()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
    current_actor UUID;
    delta_json JSONB := '{}'::jsonb;
    key_name TEXT;
    old_val JSONB;
    new_val JSONB;
    activity_type_val TEXT := 'field_update';
    change_desc TEXT := 'Lead record updated';
    old_row_json JSONB;
    new_row_json JSONB;
    is_status_changed BOOLEAN := FALSE;
    is_reassigned BOOLEAN := FALSE;
    is_priority_changed BOOLEAN := FALSE;
BEGIN
    -- Extract current authenticated Supabase user or fall back to NULL for automated background jobs
    BEGIN
        current_actor := auth.uid();
    EXCEPTION WHEN OTHERS THEN
        current_actor := NULL;
    END;

    -- Validate referential integrity: Verify actor exists in public.profiles
    IF current_actor IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = current_actor) THEN
            current_actor := NULL;
        END IF;
    END IF;

    -- Convert records to JSONB for key-by-key comparison
    old_row_json := to_jsonb(OLD);
    new_row_json := to_jsonb(NEW);

    -- Calculate delta payload, omitting transient timestamps
    FOR key_name IN SELECT jsonb_object_keys(new_row_json) LOOP
        IF key_name NOT IN ('updated_at', 'created_at') THEN
            old_val := old_row_json -> key_name;
            new_val := new_row_json -> key_name;

            IF old_val IS DISTINCT FROM new_val THEN
                delta_json := delta_json || jsonb_build_object(
                    key_name, jsonb_build_object('old', old_val, 'new', new_val)
                );
            END IF;
        END IF;
    END LOOP;

    -- If no substantial data columns changed (e.g. only updated_at changed), bypass activity logging
    IF delta_json = '{}'::jsonb THEN
        RETURN NEW;
    END IF;

    -- Detect primary commercial events
    is_status_changed := (OLD.status_id IS DISTINCT FROM NEW.status_id);
    is_reassigned := (OLD.assigned_to IS DISTINCT FROM NEW.assigned_to);
    is_priority_changed := (OLD.priority IS DISTINCT FROM NEW.priority);

    -- Classify and compose event descriptions
    IF is_status_changed AND is_reassigned THEN
        activity_type_val := 'status_change';
        change_desc := 'Funnel status transitioned & account ownership reassigned';
    ELSIF is_status_changed THEN
        activity_type_val := 'status_change';
        change_desc := 'Funnel status transitioned';
    ELSIF is_reassigned THEN
        activity_type_val := 'reassignment';
        change_desc := 'Account ownership reassigned';
    ELSIF is_priority_changed THEN
        activity_type_val := 'priority_change';
        change_desc := 'Priority level updated to ' || NEW.priority;
    ELSIF current_actor IS NULL THEN
        -- Automated backend job update per Master PRD Section 15.2
        activity_type_val := 'system_event';
        change_desc := 'Automated system update';
    ELSE
        activity_type_val := 'field_update';
        change_desc := 'Lead record updated';
    END IF;

    -- Insert immutable audit record directly into lead_activities
    INSERT INTO public.lead_activities (
        lead_id,
        actor_id,
        activity_type,
        description,
        metadata,
        created_at
    ) VALUES (
        NEW.id,
        current_actor,
        activity_type_val,
        change_desc,
        jsonb_build_object(
            'changes', delta_json,
            'lead_id_code', NEW.lead_id
        ),
        timezone('utc'::text, now())
    );

    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.audit_lead_changes_trigger() IS 'Automated JSONB delta-capturing audit trigger recording stage transitions and field mutations into lead_activities with security definer search_path protection.';

DROP TRIGGER IF EXISTS trg_audit_lead_changes ON public.leads;
CREATE TRIGGER trg_audit_lead_changes
AFTER UPDATE ON public.leads
FOR EACH ROW EXECUTE FUNCTION public.audit_lead_changes_trigger();
