import React from "react";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/app/lib/supabase/server";
import type { CrmUserRole, FunnelBucket } from "@/types/crm";
import {
  resolveTimeframeBounds,
  timeframeToSlug,
  aggregateTimeframeRevenue,
} from "@/app/admin/lib/timeframeUtils";
import { getUtcDayWindow } from "@/app/admin/lib/followUpQueue";
import {
  dashboardAmount,
  dashboardFeature,
  dashboardTab,
  dashboardSelect,
  foldDashboardPages as foldPages,
  overviewQueue,
  type OverviewQueue,
} from "@/app/admin/lib/dashboardContracts";
import {
  OverviewWorkspace,
  type OverviewData,
  type OverviewRecord,
} from "@/app/admin/components/Dashboard/OverviewWorkspace";

export const metadata: Metadata = {
  title: "Overview | Marca Ubi Commercial Desk",
  robots: { index: false, follow: false },
};

interface Stage {
  id: string;
  name: string;
  bucket: FunnelBucket;
}
interface PipelineRow {
  id: string;
  status_id: string;
  expected_value?: number | string;
}
interface ConversionRow {
  converted_at: string;
  created_at: string;
  expected_value?: number | string;
}
interface CohortRow {
  status_id: string;
  lost_reason: string | null;
}
interface PreviewRow {
  id: string;
  lead_id: string;
  name: string;
  company: string | null;
  status_id: string;
  assigned_to: string | null;
  next_follow_up: string | null;
}
interface DirectoryRow {
  id: string;
  full_name: string | null;
}
const SYNTHETIC_EXCLUSION =
  "brief_payload->synthetic_benchmark.is.null,brief_payload->>synthetic_benchmark.neq.true";

/** Reads authenticated, RLS-visible data; monetary fields are never selected for restricted roles. */
export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams?: Promise<{ timeframe?: string; queue?: string }>;
}): Promise<React.ReactElement> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login?next=%2Fadmin");
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, status, allowed_tabs, feature_permissions")
    .eq("id", user.id)
    .maybeSingle();
  if (profileError || !profile || profile.status !== "active") notFound();
  const role = profile.role as CrmUserRole;
  if (!dashboardTab(role, profile.allowed_tabs, "command_center")) notFound();
  const canFinancial = dashboardFeature(
    role,
    profile.feature_permissions,
    "can_view_financials",
  );
  const canExport = dashboardFeature(
    role,
    profile.feature_permissions,
    "can_export_data",
  );
  const canTasks = dashboardTab(role, profile.allowed_tabs, "tasks");
  const recordRoute = dashboardTab(role, profile.allowed_tabs, "deals")
    ? "/admin/deals"
    : dashboardTab(role, profile.allowed_tabs, "leads")
      ? "/admin/leads"
      : null;
  const canCreate =
    role !== "viewer" && dashboardTab(role, profile.allowed_tabs, "leads");
  const params = searchParams ? await searchParams : undefined;
  const now = new Date();
  const window = getUtcDayWindow(now);
  const bounds = resolveTimeframeBounds(
    timeframeToSlug(params?.timeframe),
    now,
  );
  const { data: rawStages, error: stageError } = await supabase
    .from("funnel_statuses")
    .select("id, name, bucket")
    .order("sort_order", { ascending: true });
  if (stageError)
    console.error("[dashboard] Stage lookup failed", stageError.message);
  const stages = (rawStages ?? []) as Stage[];
  const stagesUnavailable = Boolean(stageError || !rawStages);
  if (!rawStages && !stageError)
    console.error("[dashboard] Stage lookup returned no payload");
  const activeIds = stages
    .filter((stage) => stage.bucket === "open" || stage.bucket === "potential")
    .map((stage) => stage.id);
  const convertedIds = stages
    .filter((stage) => stage.bucket === "converted")
    .map((stage) => stage.id);
  const stageById = new Map(stages.map((stage) => [stage.id, stage]));

  const pipelinePromise = stagesUnavailable
    ? Promise.resolve(null)
    : activeIds.length === 0
      ? Promise.resolve({
          count: 0,
          value: 0,
          valid: true,
          stages: new Map<string, { count: number; value: number }>(),
        })
      : foldPages<
          PipelineRow,
          {
            count: number;
            value: number;
            valid: boolean;
            stages: Map<string, { count: number; value: number }>;
          }
        >(
          async (from, to) => {
            const result = await supabase
              .from("leads")
              .select(dashboardSelect(canFinancial, "pipeline"))
              .in("status_id", activeIds)
              .or(SYNTHETIC_EXCLUSION)
              .order("id")
              .range(from, to);
            return {
              data: result.data as unknown as PipelineRow[] | null,
              error: result.error,
            };
          },
          { count: 0, value: 0, valid: true, stages: new Map() },
          (summary, row) => {
            const amount = canFinancial
              ? dashboardAmount(row.expected_value)
              : 0;
            if (amount === null) summary.valid = false;
            summary.count += 1;
            summary.value += amount ?? 0;
            const stage = summary.stages.get(row.status_id) ?? {
              count: 0,
              value: 0,
            };
            stage.count += 1;
            stage.value += amount ?? 0;
            summary.stages.set(row.status_id, stage);
          },
        );

  const outcomePromise = stagesUnavailable
    ? Promise.resolve(null)
    : convertedIds.length === 0
      ? Promise.resolve({
          count: 0,
          value: 0,
          valid: true,
          cycleDays: 0,
          cycleCount: 0,
          events: [] as { convertedAt: string; amount: number }[],
        })
      : foldPages<
          ConversionRow,
          {
            count: number;
            value: number;
            valid: boolean;
            cycleDays: number;
            cycleCount: number;
            events: { convertedAt: string; amount: number }[];
          }
        >(
          async (from, to) => {
            const result = await supabase
              .from("leads")
              .select(dashboardSelect(canFinancial, "conversion"))
              .in("status_id", convertedIds)
              .gte("converted_at", bounds.currentStart.toISOString())
              .lte("converted_at", bounds.currentEnd.toISOString())
              .or(SYNTHETIC_EXCLUSION)
              .order("id")
              .range(from, to);
            return {
              data: result.data as unknown as ConversionRow[] | null,
              error: result.error,
            };
          },
          {
            count: 0,
            value: 0,
            valid: true,
            cycleDays: 0,
            cycleCount: 0,
            events: [],
          },
          (summary, row) => {
            const amount = canFinancial
              ? dashboardAmount(row.expected_value)
              : 0;
            summary.count += 1;
            const cycle =
              (Date.parse(row.converted_at) - Date.parse(row.created_at)) /
              86_400_000;
            if (Number.isFinite(cycle) && cycle >= 0) {
              summary.cycleDays += cycle;
              summary.cycleCount += 1;
            }
            if (amount === null) summary.valid = false;
            summary.value += amount ?? 0;
            if (canFinancial)
              summary.events.push({
                convertedAt: row.converted_at,
                amount: amount ?? 0,
              });
          },
        );

  const cohortPromise = stagesUnavailable
    ? Promise.resolve(null)
    : foldPages<CohortRow, { eligible: number; won: number }>(
        async (from, to) => {
          const result = await supabase
            .from("leads")
            .select("status_id, lost_reason")
            .gte("created_at", bounds.currentStart.toISOString())
            .lte("created_at", bounds.currentEnd.toISOString())
            .or(SYNTHETIC_EXCLUSION)
            .order("id")
            .range(from, to);
          return {
            data: result.data as CohortRow[] | null,
            error: result.error,
          };
        },
        { eligible: 0, won: 0 },
        (summary, row) => {
          if (
            row.lost_reason === "spam_invalid" ||
            row.lost_reason === "out_of_scope"
          )
            return;
          summary.eligible += 1;
          if (stageById.get(row.status_id)?.bucket === "converted")
            summary.won += 1;
        },
      );

  /** Tasks eligibility runs before counting or limiting, so deferred rows cannot starve the preview. */
  const queueBase = (head: boolean) =>
    supabase
      .from("leads")
      .select(
        "id, lead_id, name, company, status_id, assigned_to, next_follow_up",
        { count: "exact", head },
      )
      .in("status_id", activeIds)
      .or(
        `and(or(revisit_date.is.null,revisit_date.lte.${window.date}),or(${SYNTHETIC_EXCLUSION}))`,
      );
  const queueQuery = (queue: OverviewQueue, head = false) => {
    const query = queueBase(head);
    if (queue === "unassigned")
      return query.is("assigned_to", null).is("next_follow_up", null);
    if (queue === "overdue")
      return query
        .not("next_follow_up", "is", null)
        .lt("next_follow_up", window.start);
    return query
      .not("next_follow_up", "is", null)
      .gte("next_follow_up", window.start)
      .lte("next_follow_up", window.end);
  };
  const queueNames: OverviewQueue[] = ["overdue", "today", "unassigned"];
  const counts = await Promise.all(
    queueNames.map(async (queue) => {
      if (!canTasks || stagesUnavailable) return null;
      if (!activeIds.length) return 0;
      const result = await queueQuery(queue, true);
      if (result.error)
        console.error(
          "[dashboard] Queue count failed",
          queue,
          result.error.message,
        );
      return result.error ? null : result.count;
    }),
  );
  const selectedQueue = overviewQueue(params?.queue, counts[0]);
  const previewResult = stagesUnavailable
    ? { data: null, error: stageError ?? { message: "Stages unavailable" } }
    : activeIds.length === 0 || (!canTasks && !recordRoute)
      ? { data: [], error: null }
      : canTasks
        ? await queueQuery(selectedQueue)
            .order(
              selectedQueue === "unassigned" ? "created_at" : "next_follow_up",
              { ascending: true },
            )
            .order("id")
            .limit(6)
        : await supabase
            .from("leads")
            .select(
              "id, lead_id, name, company, status_id, assigned_to, next_follow_up",
            )
            .in("status_id", activeIds)
            .or(SYNTHETIC_EXCLUSION)
            .order("created_at", { ascending: false })
            .order("id")
            .limit(6);
  if (previewResult.error)
    console.error("[dashboard] Preview failed", previewResult.error.message);
  else if (!previewResult.data)
    console.error("[dashboard] Preview returned no payload");
  const preview = (previewResult.data ?? []) as PreviewRow[];
  const ownerIds = [
    ...new Set(
      preview.flatMap((row) => (row.assigned_to ? [row.assigned_to] : [])),
    ),
  ];
  let directory: DirectoryRow[] = [];
  let directoryFailed = false;
  if (ownerIds.length) {
    const primary = await supabase
      .from("crm_team_directory")
      .select("id, full_name")
      .in("id", ownerIds);
    if (!primary.error && primary.data)
      directory = primary.data as DirectoryRow[];
    else {
      console.warn(
        "[dashboard] Directory view unavailable, using profiles",
        primary.error?.message,
      );
      const fallback = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", ownerIds);
      if (!fallback.error && fallback.data)
        directory = fallback.data as DirectoryRow[];
      else {
        directoryFailed = true;
        console.error(
          "[dashboard] Directory fallback failed",
          fallback.error?.message,
        );
      }
    }
  }
  const ownerById = new Map(directory.map((row) => [row.id, row.full_name]));
  const records: OverviewRecord[] = preview.map((row) => ({
    id: row.id,
    leadId: row.lead_id,
    name: row.name,
    company: row.company,
    stage: stageById.get(row.status_id)?.name ?? "Unknown stage",
    due: row.next_follow_up,
    owner: !row.assigned_to
      ? "Unassigned"
      : (ownerById.get(row.assigned_to) ??
        (directoryFailed ? "Owner unavailable" : "Name unavailable")),
    href: recordRoute ? `${recordRoute}/${encodeURIComponent(row.id)}` : null,
  }));
  const [pipeline, outcome, cohort] = await Promise.all([
    pipelinePromise,
    outcomePromise,
    cohortPromise,
  ]);
  const potentialStages = stages.filter(
    (stage) => stage.bucket === "potential",
  );
  const weights: Record<string, number> = {
    qualified: 0.25,
    "proposal sent": 0.5,
    negotiation: 0.85,
  };
  const weightedPotential =
    canFinancial &&
    pipeline?.valid &&
    potentialStages.every((stage) =>
      Object.hasOwn(weights, stage.name.trim().toLowerCase()),
    )
      ? potentialStages.reduce(
          (sum, stage) =>
            sum +
            (pipeline.stages.get(stage.id)?.value ?? 0) *
              weights[stage.name.trim().toLowerCase()],
          0,
        )
      : null;
  const data: OverviewData = {
    generatedAt: now.toISOString(),
    timeframe: bounds.slug,
    periodLabel: bounds.label,
    periodStart: bounds.currentStart.toISOString(),
    periodEnd: bounds.currentEnd.toISOString(),
    canCreate,
    canTasks,
    canExport,
    recordRoute,
    pipelineCount: pipeline?.count ?? null,
    pipelineValue: canFinancial && pipeline?.valid ? pipeline.value : null,
    weightedPotential,
    averageCycleDays:
      outcome && outcome.cycleCount > 0
        ? outcome.cycleDays / outcome.cycleCount
        : null,
    financials: canFinancial,
    stages: stages
      .filter((stage) => activeIds.includes(stage.id))
      .map((stage) => ({
        id: stage.id,
        name: stage.name,
        count: pipeline?.stages.get(stage.id)?.count ?? 0,
        value:
          canFinancial && pipeline?.valid
            ? (pipeline.stages.get(stage.id)?.value ?? 0)
            : null,
      })),
    pipelineReady: pipeline !== null,
    queue: selectedQueue,
    queueCounts: {
      overdue: counts[0],
      today: counts[1],
      unassigned: counts[2],
    },
    records,
    recordsReady: Boolean(previewResult.data && !previewResult.error),
    outcomesReady: outcome !== null,
    convertedCount: outcome?.count ?? null,
    convertedValue: canFinancial && outcome?.valid ? outcome.value : null,
    chart:
      canFinancial && outcome?.valid
        ? aggregateTimeframeRevenue(bounds.slug, bounds, outcome.events)
        : [],
    cohort: cohort ? { eligible: cohort.eligible, won: cohort.won } : null,
  };
  return <OverviewWorkspace data={data} />;
}
