/**
 * @file page.tsx
 * @description Pipeline Deals Workspace (/admin/deals).
 *              Server Component querying active commercial deal opportunities,
 *              deal valuations, commercial stage progression, and representative ownership.
 * @module app/admin/(workspace)/deals/page
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import React, { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/app/lib/supabase/server";
import { ROLE_DEFAULT_TABS, type CrmUserRole } from "@/types/crm";
import {
  dashboardAmount,
  dashboardFeature,
  dashboardTab,
  foldDashboardPages,
} from "@/app/admin/lib/dashboardContracts";
import {
  dealSelectColumns,
  normalizeDealAmount,
  dealsPayloadAvailable,
} from "./dealsWorkspaceModel";
import { buildCommercialSearchFilter } from "@/app/admin/lib/commercialSearch";
import { DealsLoading } from "./DealsLoading";
import { ResultPagination } from "@/app/admin/components/LeadsTable/ResultPagination";
import {
  DealsWorkspaceClient,
  type HydratedDealItem,
} from "./DealsWorkspaceClient";
import styles from "./deals.module.scss";

export const metadata: Metadata = {
  title: "Pipeline Deals | Marca Ubi Enterprise CRM",
  robots: {
    index: false,
    follow: false,
  },
};

interface FilterableDealQuery<TResult = unknown> {
  eq(column: string, value: string): FilterableDealQuery<TResult>;
  ilike(column: string, pattern: string): FilterableDealQuery<TResult>;
  or?: (filters: string) => FilterableDealQuery<TResult>;
  order(column: string, opts?: { ascending?: boolean }): FilterableDealQuery<TResult>;
  range(from: number, to: number): PromiseLike<TResult>;
}

interface AdminDealsPageProps {
  searchParams?: Promise<{
    id?: string;
    dealId?: string;
    leadId?: string;
    stage?: string;
    assigned_to?: string;
    source?: string;
    priority?: string;
    service_category?: string;
    search?: string;
    q?: string;
    bucket?: string;
    page?: string;
  }>;
}

/** Keep the fallback inside the caller's profile RLS when the directory view is unavailable. */
async function loadDealOwners(
  supabase: Awaited<ReturnType<typeof createClient>>,
) {
  const directory = await supabase
    .from("crm_team_directory")
    .select("id, full_name")
    .order("full_name");
  if (!directory.error)
    return { rows: directory.data ?? [], incomplete: false };

  console.warn("[deals-workspace] Owner directory unavailable:", {
    code: directory.error.code,
  });
  const profiles = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("status", "active")
    .order("full_name");
  if (profiles.error)
    console.error("[deals-workspace] Owner fallback unavailable:", {
      code: profiles.error.code,
    });
  return { rows: profiles.data ?? [], incomplete: true, error: profiles.error };
}

export default async function AdminDealsPage(
  props: AdminDealsPageProps,
): Promise<React.ReactElement> {
  const resolvedSearchParams = props.searchParams
    ? await props.searchParams
    : undefined;
  const requestedPage = Number(resolvedSearchParams?.page ?? "1");
  const page =
    Number.isSafeInteger(requestedPage) &&
    requestedPage > 0 &&
    requestedPage <= 100000
      ? requestedPage
      : 1;
  const pageSize = 100;
  const targetDealId =
    resolvedSearchParams?.id ||
    resolvedSearchParams?.dealId ||
    resolvedSearchParams?.leadId;
  if (targetDealId) {
    redirect(`/admin/deals/${encodeURIComponent(targetDealId)}`);
  }
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login?next=%2Fadmin%2Fdeals");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, status, allowed_tabs, feature_permissions")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || profile.status !== "active")
    redirect("/admin/login?error=account_suspended");
  const role = profile.role as CrmUserRole;
  const canViewFinancials = dashboardFeature(
    role,
    profile.feature_permissions,
    "can_view_financials",
  );
  const canCreate =
    role !== "viewer" && dashboardTab(role, profile.allowed_tabs, "leads");
  const allowedTabs = profile.allowed_tabs as string[] | undefined;
  const hasDealsAccess =
    role === "admin" ||
    (Array.isArray(allowedTabs) && allowedTabs.length > 0
      ? allowedTabs.includes("deals")
      : Boolean(ROLE_DEFAULT_TABS[role]?.deals));

  if (!hasDealsAccess) {
    redirect("/admin?error=unauthorized_role_access");
  }

  const uuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const {
    bucket,
    stage,
    assigned_to: assignedTo,
    source,
    priority,
    service_category: serviceCategory,
  } = resolvedSearchParams ?? {};
  const searchTerm = resolvedSearchParams?.search ?? resolvedSearchParams?.q;
  const search = buildCommercialSearchFilter(
    typeof searchTerm === "string" ? searchTerm : undefined,
  );
  // Next may supply arrays for repeated parameters. Reject them before parsing filters.
  const invalidFilter =
    [bucket, stage, assignedTo, source, priority, serviceCategory, searchTerm].some(
      (value) => value !== undefined && typeof value !== "string",
    ) ||
    [stage, assignedTo, source].some((value) => value && !uuid.test(value)) ||
    Boolean(
      priority && !["high", "medium", "low"].includes(priority.toLowerCase()),
    ) ||
    Boolean(
      bucket &&
      !["all", "open", "potential", "converted", "lost"].includes(bucket),
    );

  const syntheticExclusion =
    "brief_payload->synthetic_benchmark.is.null,brief_payload->>synthetic_benchmark.neq.true";

  function applyDealFilters<TResult>(
    q: FilterableDealQuery<TResult>,
  ): FilterableDealQuery<TResult> {
    let query = q;
    if (!invalidFilter) {
      if (stage) query = query.eq("status_id", stage);
      if (assignedTo) query = query.eq("assigned_to", assignedTo);
      if (source) query = query.eq("lead_source_id", source);
      if (priority) query = query.ilike("priority", priority);
      if (serviceCategory) query = query.eq("service_category", serviceCategory);
      if (bucket && bucket !== "all") query = query.eq("funnel_status.bucket", bucket);
      if (typeof query.or === "function") {
        if (search.filter) {
          query = query.or(
            `and(or(${syntheticExclusion}),or(${search.filter}))`,
          );
        } else {
          query = query.or(syntheticExclusion);
        }
      }
    }
    return query;
  };

  interface DealSelectResponse {
    data: unknown[] | null;
    error: { code?: string; message: string } | null;
    count: number | null;
  }

  const dealsQuery = applyDealFilters<DealSelectResponse>(
    supabase
      .from("leads")
      .select(dealSelectColumns(canViewFinancials), { count: "exact" }) as unknown as FilterableDealQuery<DealSelectResponse>,
  );

  interface LaneSummaryAccumulator {
    lanes: Record<string, { count: number; value: number; valuedCount: number; unvaluedCount: number }>;
  }

  const laneSummaryPromise = invalidFilter
    ? Promise.resolve(null)
    : foldDashboardPages<
        { id: string; status_id: string; expected_value?: number | string },
        LaneSummaryAccumulator
      >(
        async (from, to) => {
          const cols = canViewFinancials
            ? "id, status_id, expected_value, funnel_status:funnel_statuses!leads_status_id_fkey!inner(bucket)"
            : "id, status_id, funnel_status:funnel_statuses!leads_status_id_fkey!inner(bucket)";
          const q = applyDealFilters<DealSelectResponse>(
            supabase.from("leads").select(cols) as unknown as FilterableDealQuery<DealSelectResponse>,
          )
            .order("id")
            .range(from, to);
          const res = await q;
          return {
            data: res.data as unknown as Array<{
              id: string;
              status_id: string;
              expected_value?: number | string;
            }> | null,
            error: res.error ? { code: res.error.code, message: res.error.message } : null,
          };
        },
        { lanes: {} },
        (acc, row) => {
          const key = row.status_id || "unlisted";
          if (!acc.lanes[key]) {
            acc.lanes[key] = { count: 0, value: 0, valuedCount: 0, unvaluedCount: 0 };
          }
          acc.lanes[key].count += 1;
          if (canViewFinancials) {
            const amt = dashboardAmount(row.expected_value);
            if (amt === null) acc.lanes[key].unvaluedCount += 1;
            else {
              acc.lanes[key].valuedCount += 1;
              acc.lanes[key].value += amt;
            }
          }
        },
      );

  const [sourcesRes, statusesRes, owners, dealsRes, laneSummary] = await Promise.all([
    supabase.from("lead_sources").select("id, name").order("name"),
    supabase
      .from("funnel_statuses")
      .select("id, name, sort_order, bucket, color_code, is_active")
      .order("sort_order"),
    loadDealOwners(supabase),
    dealsQuery
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1),
    laneSummaryPromise,
  ]);

  const laneTotals: Record<string, { count: number; value: number | null; valuedCount?: number }> | undefined =
    laneSummary
      ? Object.fromEntries(
          Object.entries(laneSummary.lanes).map(([k, v]) => [
            k,
            {
              count: v.count,
              value:
                !canViewFinancials || v.valuedCount === 0
                  ? v.count === 0
                    ? 0
                    : null
                  : v.value,
              valuedCount: v.valuedCount,
            },
          ]),
        )
      : undefined;

  if (dealsRes.error)
    console.error("[deals-workspace] Failed to load deals:", {
      code: dealsRes.error.code,
      message: dealsRes.error.message,
    });
  if (statusesRes.error)
    console.error("[deals-workspace] Failed to load stages:", {
      code: statusesRes.error.code,
      message: statusesRes.error.message,
    });
  if (sourcesRes.error)
    console.error("[deals-workspace] Lead source filters unavailable:", {
      code: sourcesRes.error.code,
      message: sourcesRes.error.message,
    });

  const dealsAvailable = dealsPayloadAvailable(dealsRes.data, dealsRes.error);
  const stagesAvailable = dealsPayloadAvailable(
    statusesRes.data,
    statusesRes.error,
  );
  if (!dealsAvailable && !dealsRes.error)
    console.error("[deals-workspace] Deal records response is missing.");
  if (!stagesAvailable && !statusesRes.error)
    console.error("[deals-workspace] Pipeline stages response is missing.");

  const sources = sourcesRes.data || [];
  const statuses = statusesRes.data || [];
  const ownerNameById = new Map(
    owners.rows.map((member) => [member.id, member.full_name]),
  );
  const sourceNameById = new Map(
    (sourcesRes.data || []).map((source) => [source.id, source.name]),
  );

  // The financial select is dynamic, so PostgREST can't infer one shared row type.
  const dealRows: unknown[] = dealsAvailable ? (dealsRes.data ?? []) : [];
  const deals: HydratedDealItem[] = dealRows.map((raw) => {
    const item = raw as Record<string, unknown>;
    const statusObj = item.funnel_status as {
      id: string;
      name: string;
      sort_order: number;
      bucket: string;
      color_code: string;
    } | null;

    return {
      id: item.id as string,
      lead_id: (item.lead_id as string) || (item.id as string).substring(0, 8),
      name: (item.name as string) || "Undisclosed Client",
      company: (item.company as string) || null,
      phone: (item.phone as string) || null,
      email: (item.email as string) || null,
      expected_value: canViewFinancials
        ? normalizeDealAmount(item.expected_value)
        : null,
      service_category:
        typeof item.service_category === "string"
          ? item.service_category
          : undefined,
      priority: (item.priority as "High" | "Medium" | "Low") || "Medium",
      next_follow_up: (item.next_follow_up as string) || null,
      revisit_date: (item.revisit_date as string) || null,
      created_at: (item.created_at as string) || "",
      updated_at: (item.updated_at as string) || "",
      assigned_to: (item.assigned_to as string) || null,
      status_id: (item.status_id as string) || "",
      lead_source_id: (item.lead_source_id as string) || "",
      assigned_to_name: item.assigned_to
        ? ownerNameById.get(item.assigned_to as string) || "Owner unavailable"
        : "Unassigned",
      status_name: statusObj?.name || "Open",
      status_bucket:
        (statusObj?.bucket as "open" | "potential" | "converted" | "lost") ||
        "open",
      status_color: statusObj?.color_code || "#1f242f",
      source_name: sourcesRes.error
        ? "Source unavailable"
        : sourceNameById.get(item.lead_source_id as string) || "Unknown source",
    };
  });

  const missingOwnerDetails =
    owners.error ||
    (owners.incomplete &&
      deals.some(
        (deal) => deal.assigned_to && !ownerNameById.has(deal.assigned_to),
      ));
  const unavailableDetails = [
    sourcesRes.error && "Sources",
    missingOwnerDetails && "Owner names",
  ].filter(Boolean);
  const lookupNotice = unavailableDetails.length
    ? `${unavailableDetails.join(" and ")} unavailable.`
    : undefined;

  return (
    <div className={styles.dealsWorkspace}>
      <Suspense fallback={<DealsLoading />}>
        {invalidFilter || !dealsAvailable || !stagesAvailable ? (
          <div className={styles.loadError} role="alert">
            <span>
              {invalidFilter
                ? "A filter in this link is invalid. Open the deals page without filters to try again."
                : !dealsAvailable
                  ? `Deal records could not be loaded${dealsRes.error?.code ? ` (${dealsRes.error.code})` : ""}.`
                  : `Pipeline stages could not be loaded${statusesRes.error?.code ? ` (${statusesRes.error.code})` : ""}.`}
            </span>
            <Link href="/admin/deals" className={styles.retryLink}>
              {invalidFilter ? "Clear filters" : "Reload deals"}
            </Link>
          </div>
        ) : (
          <>
            {search.error && (
              <p className={styles.loadError} role="alert">
                {search.error}
              </p>
            )}
            <DealsWorkspaceClient
              initialDeals={search.error ? [] : deals}
              sources={sources}
              statuses={statuses}
              userRole={role}
              canViewFinancials={canViewFinancials}
              canCreate={canCreate}
              laneTotals={laneTotals}
              owners={owners.rows.map((owner) => ({
                id: owner.id,
                name: owner.full_name || "Name unavailable",
              }))}
              lookupNotice={lookupNotice}
              pagination={
                !search.error && (
                  <ResultPagination
                    page={page}
                    pageSize={pageSize}
                    loadedCount={deals.length}
                    totalCount={dealsRes.count}
                    scopeDescription="Lane totals reflect the full matching pipeline; cards show up to 100 deals per page."
                  />
                )
              }
            />
          </>
        )}
      </Suspense>
    </div>
  );
}
