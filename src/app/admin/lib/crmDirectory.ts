/**
 * @file crmDirectory.ts
 * @description Resilient, schema-cache-immune directory resolution engine for CRM workspaces.
 *              Implements a verified multi-tier lookup strategy:
 *                Tier 1 (Safe Projection): Queries `public.crm_team_directory` security barrier view.
 *                Tier 2 (Database Fallback): Falls back to `public.profiles` constrained to active personnel.
 *                Tier 3 (Degraded Grace): Returns empty collections without throwing or halting page execution.
 *              Decouples primary row queries from PostgREST view-join constraints to prevent fatal PGRST200/205 crashes.
 * @module admin/lib/crmDirectory
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import type { SupabaseClient } from '@supabase/supabase-js';

export interface CrmDirectoryMember {
  id: string;
  full_name: string;
  role?: string;
  avatar_url?: string | null;
}

/**
 * Resolves a Map of user ID to full_name with automatic fallback from crm_team_directory to profiles.
 *
 * @param supabase - Authenticated Supabase client instance
 * @param ownerIds - Optional array of user IDs to filter by. If an empty array is provided,
 *                   immediately returns an empty Map without executing database roundtrips.
 *                   If omitted, resolves names for all active personnel.
 * @returns Map mapping profile ID to full name
 */
export async function getCrmDirectoryMap(
  supabase: SupabaseClient,
  ownerIds?: string[]
): Promise<Map<string, string>> {
  if (Array.isArray(ownerIds) && ownerIds.length === 0) {
    return new Map();
  }

  try {
    let primaryQuery = supabase
      .from('crm_team_directory')
      .select('id, full_name');

    if (ownerIds && ownerIds.length > 0) {
      primaryQuery = primaryQuery.in('id', ownerIds);
    }

    const { data: primaryData, error: primaryError } = await primaryQuery;

    if (!primaryError && primaryData) {
      return new Map(primaryData.map((row) => [row.id, row.full_name]));
    }

    console.warn(
      '[crm-directory] crm_team_directory view unavailable, falling back to profiles:',
      primaryError?.message
    );

    let fallbackQuery = supabase
      .from('profiles')
      .select('id, full_name')
      .eq('status', 'active');

    if (ownerIds && ownerIds.length > 0) {
      fallbackQuery = fallbackQuery.in('id', ownerIds);
    }

    const { data: fallbackData, error: fallbackError } = await fallbackQuery;

    if (!fallbackError && fallbackData) {
      return new Map(fallbackData.map((row) => [row.id, row.full_name]));
    }

    console.error(
      '[crm-directory] Profiles directory fallback query failed:',
      fallbackError?.message
    );
    return new Map();
  } catch (err: unknown) {
    console.error(
      '[crm-directory] Unexpected error resolving directory map:',
      err instanceof Error ? err.message : String(err)
    );
    return new Map();
  }
}

/**
 * Resolves full active personnel records with automatic fallback from crm_team_directory to profiles.
 * Used for dropdown filters, director assignments, and assignee selectors.
 *
 * @param supabase - Authenticated Supabase client instance
 * @param filterRoles - Optional role array to filter personnel (e.g. ['admin', 'sales_manager', 'sales_executive'])
 * @returns Array of active personnel records
 */
export async function getCrmDirectoryList(
  supabase: SupabaseClient,
  filterRoles?: string[]
): Promise<CrmDirectoryMember[]> {
  try {
    let primaryQuery = supabase
      .from('crm_team_directory')
      .select('id, full_name, role, avatar_url')
      .order('full_name', { ascending: true });

    if (filterRoles && filterRoles.length > 0) {
      primaryQuery = primaryQuery.in('role', filterRoles);
    }

    const { data: primaryData, error: primaryError } = await primaryQuery;

    if (!primaryError && primaryData) {
      return primaryData as CrmDirectoryMember[];
    }

    console.warn(
      '[crm-directory] crm_team_directory view unavailable for list, falling back to profiles:',
      primaryError?.message
    );

    let fallbackQuery = supabase
      .from('profiles')
      .select('id, full_name, role, avatar_url')
      .eq('status', 'active')
      .order('full_name', { ascending: true });

    if (filterRoles && filterRoles.length > 0) {
      fallbackQuery = fallbackQuery.in('role', filterRoles);
    }

    const { data: fallbackData, error: fallbackError } = await fallbackQuery;

    if (!fallbackError && fallbackData) {
      return fallbackData as CrmDirectoryMember[];
    }

    console.error(
      '[crm-directory] Profiles fallback list query failed:',
      fallbackError?.message
    );
    return [];
  } catch (err: unknown) {
    console.error(
      '[crm-directory] Unexpected error resolving directory list:',
      err instanceof Error ? err.message : String(err)
    );
    return [];
  }
}
