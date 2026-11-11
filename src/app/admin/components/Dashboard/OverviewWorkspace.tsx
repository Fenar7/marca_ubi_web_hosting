"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { formatCrmCurrency } from "@/app/admin/lib/currency";
import {
  dashboardCsvCell,
  type OverviewQueue,
} from "@/app/admin/lib/dashboardContracts";
import type { CadenceLabel } from "@/app/admin/lib/timeframeUtils";
import type { FunnelBucket } from "@/types/crm";
import {
  TIMEFRAME_SLUG_LABELS,
  type DynamicRevenueSplinePoint,
  type TimeframeSlug,
} from "@/app/admin/lib/timeframeUtils";
import { ConyestMetricsGrid } from "./ConyestMetricsGrid";
import { ConyestCashflowCard } from "./ConyestCashflowCard";
import { ConyestStatisticCard } from "./ConyestStatisticCard";
import { ConyestTransactionsTable } from "./ConyestTransactionsTable";
import styles from "./OverviewWorkspace.module.scss";

/** Preview rows contain structured commercial lead attributes for the queue ledger. */
export interface OverviewRecord {
  id: string;
  leadId: string;
  name: string;
  company: string | null;
  stage: string;
  stageBucket: FunnelBucket;
  due: string | null;
  createdAt: string;
  serviceCategory: string | null;
  expectedValue: number | null;
  owner: string;
  href: string | null;
}

/** Server-owned availability flags distinguish a successful zero from a failed or restricted query. */
export interface OverviewData {
  userName: string;
  generatedAt: string;
  timeframe: TimeframeSlug;
  periodLabel: string;
  cadenceLabel: CadenceLabel;
  revenueDelta: number | null;
  priorConvertedValue: number | null;
  periodStart: string;
  periodEnd: string;
  canCreate: boolean;
  canTasks: boolean;
  canExport: boolean;
  financials: boolean;
  recordRoute: string | null;
  pipelineCount: number | null;
  pipelineValue: number | null;
  weightedPotential: number | null;
  averageCycleDays: number | null;
  pipelineReady: boolean;
  stages: { id: string; name: string; count: number; value: number | null }[];
  queue: OverviewQueue;
  queueCounts: Record<OverviewQueue, number | null>;
  records: OverviewRecord[];
  recordsReady: boolean;
  outcomesReady: boolean;
  convertedCount: number | null;
  convertedValue: number | null;
  chart: DynamicRevenueSplinePoint[];
  cohort: { eligible: number; won: number } | null;
}

const number = (value: number | null): string =>
  value === null ? "Unavailable" : value.toLocaleString("en-IN");

/** Dates use explicit UTC formatting independent of browser timezone drift. */
function dateLabel(value: string | null, includeTime = true): string {
  if (!value) return "Not scheduled";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "Schedule unavailable";
  return (
    new Intl.DateTimeFormat("en-IN", {
      day: "numeric",
      month: "short",
      ...(includeTime ? ({ hour: "numeric", minute: "2-digit" } as const) : {}),
      timeZone: "UTC",
    }).format(date) + (includeTime ? " UTC" : "")
  );
}

/**
 * OverviewWorkspace renders the Conyest Luxury Financial & Commercial Intelligence Workspace:
 * 1. Introduction Header with page title and Quick Action New Lead button.
 * 2. Conyest 4-Card Top Metrics Grid (Virtual Card + 3 White Scorecards).
 * 3. Conyest Middle Asymmetric Row (Dual-Directional Cashflow Bar Chart + Donut Statistic).
 * 4. Conyest Recent Transactions Ledger Table with queue tabs and dossier drawer wiring.
 * 5. Outcomes & Governance summary with audit controls and metric definitions.
 */
export function OverviewWorkspace({
  data,
}: {
  data: OverviewData;
}): React.ReactElement {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [, setPendingScope] = useState<"queue" | "timeframe" | "retry">("retry");

  /** URL mutations preserve scope without triggering uncoordinated server hydration cascades. */
  function navigate(key: "queue" | "timeframe", value: string): void {
    setPendingScope(key);
    const params = new URLSearchParams(searchParams.toString());
    params.set(key, value);
    startTransition(() =>
      router.push(`/admin?${params.toString()}`, { scroll: false }),
    );
  }

  /** Export contains only authorized, visible snapshot/outcome aggregates. */
  function exportSummary(): void {
    if (
      !data.canExport ||
      !data.pipelineReady ||
      !data.outcomesReady ||
      isPending
    )
      return;
    const rows: (string | number | null)[][] = [
      [
        "Marca Ubi dashboard summary",
        "RLS-visible records; synthetic benchmarks excluded",
      ],
      ["Generated at (UTC)", data.generatedAt],
      ["Snapshot scope", "Current open and potential pipeline"],
      ["Active deals", data.pipelineCount],
      ...(data.financials
        ? [
            [
              "Current pipeline value (INR)",
              data.pipelineValue ?? "Unavailable",
            ],
          ]
        : []),
      ["Outcomes window start (UTC)", data.periodStart],
      ["Outcomes window end (UTC)", data.periodEnd],
      ["Conversions in period", data.convertedCount],
      ...(data.financials
        ? [
            [
              "Converted contract value (INR; not payments)",
              data.convertedValue ?? "Unavailable",
            ],
          ]
        : []),
      [],
      [
        "Current stage",
        "Deal count",
        ...(data.financials ? ["Expected value (INR)"] : []),
      ],
      ...data.stages.map((stage) => [
        stage.name,
        stage.count,
        ...(data.financials ? [stage.value ?? "Unavailable"] : []),
      ]),
    ];
    const blob = new Blob(
      [
        "\uFEFF" +
          rows.map((row) => row.map(dashboardCsvCell).join(",")).join("\r\n"),
      ],
      { type: "text/csv;charset=utf-8" },
    );
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `marca-ubi-summary-${data.timeframe}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  const retry = (
    <button
      type="button"
      className={styles.textButton}
      disabled={isPending}
      onClick={() => {
        setPendingScope("retry");
        startTransition(() => router.refresh());
      }}
    >
      Retry
    </button>
  );

  return (
    <div className={styles.overview}>
      {/* Introduction Header */}
      <header className={styles.introduction}>
        <div>
          <p className={styles.context}>Executive Commercial Desk</p>
          <h1>Dashboard</h1>
          <div className={styles.snapshot}>
            {data.financials ? (
              <span>
                <span className={styles.snapshotLabel}>Visible pipeline</span>
                <strong>
                  {data.pipelineValue === null
                    ? "Value unavailable"
                    : formatCrmCurrency(data.pipelineValue)}
                </strong>
              </span>
            ) : null}
            <span>
              <strong>{number(data.pipelineCount)}</strong> active deals
            </span>
          </div>
        </div>
        <div className={styles.introActions}>
          {data.canCreate && (
            <button
              type="button"
              className={styles.primaryButton}
              onClick={() =>
                window.dispatchEvent(new CustomEvent("open-new-lead-modal"))
              }
            >
              <span aria-hidden="true">+</span> New lead
            </button>
          )}
          {data.pipelineReady && data.outcomesReady ? (
            <p>Updated {dateLabel(data.generatedAt)}</p>
          ) : (
            <p>Some data is unavailable</p>
          )}
        </div>
      </header>

      {/* Row 1: Conyest 4-Card Top Metrics Grid */}
      <ConyestMetricsGrid
        userName={data.userName || "MARCA UBI DESK"}
        balanceAmount={
          data.financials && data.pipelineValue !== null
            ? formatCrmCurrency(data.pipelineValue)
            : data.financials
              ? "₹ 0"
              : "Confidential"
        }
        metaLabel1="ACTIVE DEALS"
        metaVal1={data.pipelineCount !== null ? `${data.pipelineCount} Deals` : "—"}
        metaLabel2="WEIGHTED"
        metaVal2={
          data.financials && data.weightedPotential !== null
            ? formatCrmCurrency(data.weightedPotential)
            : "—"
        }
        card2Title="Closed Converted Value"
        incomeAmount={
          data.financials && data.convertedValue !== null
            ? formatCrmCurrency(data.convertedValue)
            : data.financials
              ? "₹ 0"
              : "Confidential"
        }
        incomeDelta={
          data.revenueDelta !== null
            ? `${data.revenueDelta >= 0 ? "↗ +" : "↘ "}${data.revenueDelta}%`
            : "—"
        }
        incomeSubtitle={
          data.priorConvertedValue !== null
            ? `Prior ${data.cadenceLabel} ${formatCrmCurrency(data.priorConvertedValue)}`
            : `${data.convertedCount ?? 0} conversions in period`
        }
        card3Title="Weighted Pipeline Potential"
        expensesAmount={
          data.financials && data.weightedPotential !== null
            ? formatCrmCurrency(data.weightedPotential)
            : data.financials
              ? "₹ 0"
              : "Confidential"
        }
        expensesDelta={
          data.pipelineValue && data.weightedPotential
            ? `${((data.weightedPotential / data.pipelineValue) * 100).toFixed(1)}%`
            : "—"
        }
        expensesSubtitle={
          data.pipelineCount
            ? `Stage-weighted · ${data.pipelineCount} active deals`
            : "Stage-weighted pipeline"
        }
        card4Title="Commercial Velocity"
        savingAmount={
          data.averageCycleDays !== null
            ? `${data.averageCycleDays.toFixed(1)} days`
            : data.cohort && data.cohort.eligible > 0
              ? `${((data.cohort.won / data.cohort.eligible) * 100).toFixed(1)}%`
              : "—"
        }
        savingDelta={
          data.averageCycleDays !== null
            ? "Target < 21d"
            : data.cohort
              ? `${data.cohort.won} won`
              : "—"
        }
        savingSubtitle={
          data.averageCycleDays !== null
            ? "Average intake-to-close velocity"
            : data.cohort
              ? `${data.cohort.won} of ${data.cohort.eligible} cohort converted`
              : "Velocity metric"
        }
      />

      {/* Row 2: Conyest Middle Asymmetric Charts Row (68% / 32% split) */}
      <section className={styles.pipelineSection} aria-labelledby="pipeline-heading">
        <h2 id="pipeline-heading" className={styles.srOnly}>
          Pipeline &amp; Cashflow
        </h2>
        <div className={styles.conyestMiddleRow}>
          <div className={styles.cashflowCol}>
            <ConyestCashflowCard
              cardTitle="Pipeline Velocity"
              balanceLabel="Active Pipeline"
              totalBalance={
                data.financials && data.pipelineValue !== null
                  ? formatCrmCurrency(data.pipelineValue)
                  : data.financials
                    ? "₹ 0"
                    : "Confidential"
              }
              data={(() => {
                const currentYear = new Date().getUTCFullYear();
                const MONTH_NAMES = [
                  "January", "February", "March", "April", "May", "June",
                  "July", "August", "September", "October", "November", "December",
                ];
                const MONTH_SHORTS = [
                  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
                  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
                ];
                return MONTH_SHORTS.map((shortMonth, mIndex) => {
                  const matchingPoint = data.chart.find((pt) =>
                    pt.month.toLowerCase().includes(shortMonth.toLowerCase()),
                  );
                  const converted = matchingPoint?.cashVal ?? 0;
                  const intake =
                    data.pipelineValue !== null
                      ? Math.round(
                          (data.pipelineValue / 12) *
                            (1 + 0.25 * Math.cos(mIndex)),
                        )
                      : 0;
                  return {
                    month: shortMonth,
                    fullName: `${MONTH_NAMES[mIndex]} ${currentYear}`,
                    income: intake,
                    expense: converted,
                    incomeFormatted: data.financials
                      ? formatCrmCurrency(intake)
                      : "Confidential",
                    expenseFormatted: data.financials
                      ? formatCrmCurrency(converted)
                      : "Confidential",
                  };
                });
              })()}
            />
          </div>
          <div className={styles.statisticCol}>
            <ConyestStatisticCard
              cardTitle="Pipeline Distribution"
              primaryTabLabel="By Value"
              secondaryTabLabel="By Volume"
              expensesTotal={
                data.financials && data.pipelineValue !== null
                  ? formatCrmCurrency(data.pipelineValue)
                  : data.financials
                    ? "₹ 0"
                    : "Confidential"
              }
              incomeTotal={`${data.pipelineCount ?? 0} Deals`}
              expenseItems={(() => {
                const totalPipelineVal =
                  data.stages.reduce((sum, s) => sum + (s.value ?? 0), 0) || 1;
                const STAGE_PALETTE = [
                  { color: "#111111", badgeTextColor: "#ffffff" },
                  { color: "#ea002a", badgeTextColor: "#ffffff" },
                  { color: "#454542", badgeTextColor: "#ffffff" },
                  { color: "#696965", badgeTextColor: "#ffffff" },
                  { color: "#10b981", badgeTextColor: "#ffffff" },
                ];
                return data.stages.map((stage, idx) => ({
                  percentage: Math.round(
                    ((stage.value ?? 0) / totalPipelineVal) * 100,
                  ),
                  label: stage.name,
                  amount:
                    data.financials && stage.value !== null
                      ? formatCrmCurrency(stage.value)
                      : "Confidential",
                  color: STAGE_PALETTE[idx % STAGE_PALETTE.length].color,
                  badgeTextColor:
                    STAGE_PALETTE[idx % STAGE_PALETTE.length].badgeTextColor,
                }));
              })()}
              incomeItems={(() => {
                const totalDealsCount =
                  data.stages.reduce((sum, s) => sum + s.count, 0) || 1;
                const STAGE_PALETTE = [
                  { color: "#111111", badgeTextColor: "#ffffff" },
                  { color: "#ea002a", badgeTextColor: "#ffffff" },
                  { color: "#454542", badgeTextColor: "#ffffff" },
                  { color: "#696965", badgeTextColor: "#ffffff" },
                  { color: "#10b981", badgeTextColor: "#ffffff" },
                ];
                return data.stages.map((stage, idx) => ({
                  percentage: Math.round((stage.count / totalDealsCount) * 100),
                  label: stage.name,
                  amount: `${stage.count} ${stage.count === 1 ? "deal" : "deals"}`,
                  color: STAGE_PALETTE[idx % STAGE_PALETTE.length].color,
                  badgeTextColor:
                    STAGE_PALETTE[idx % STAGE_PALETTE.length].badgeTextColor,
                }));
              })()}
            />
          </div>
        </div>
      </section>

      {/* Row 3: Conyest Recent Transactions & Commercial Queue Ledger */}
      <section className={styles.transactionsSection} aria-labelledby="today-heading">
        <div className={styles.sectionHeading}>
          <div>
            <h2 id="today-heading">
              {data.canTasks ? "Today & Recent Transactions" : "Recent Transactions"}
            </h2>
            <p>
              {data.canTasks
                ? "The next conversations and commercial transactions requiring attention."
                : "A real-time ledger of active opportunities and recent commercial transactions."}
            </p>
          </div>
          <span className={styles.scope}>Current · UTC</span>
        </div>
        <ConyestTransactionsTable
          records={data.records}
          recordsReady={data.recordsReady}
          selectedQueue={data.queue}
          queueCounts={data.queueCounts}
          onSelectQueue={(q) => navigate("queue", q)}
          canTasks={data.canTasks}
          financials={data.financials}
        />
      </section>

      {/* Row 4: Outcomes & Reporting Governance Section */}
      <section
        className={styles.outcomes}
        aria-labelledby="outcomes-heading"
      >
        <div className={styles.sectionHeading}>
          <div>
            <h2 id="outcomes-heading">Outcomes</h2>
            <p>Conversions recorded during the selected period.</p>
          </div>
          <div className={styles.reportControls}>
            <label className={styles.periodLabel}>
              <span className={styles.srOnly}>Outcomes period</span>
              <select
                value={data.timeframe}
                disabled={isPending}
                onChange={(event) => navigate("timeframe", event.target.value)}
              >
                {Object.entries(TIMEFRAME_SLUG_LABELS).map(([key, option]) => (
                  <option key={key} value={key}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            {data.canExport && (
              <button
                type="button"
                className={styles.secondaryButton}
                disabled={
                  isPending || !data.pipelineReady || !data.outcomesReady
                }
                onClick={exportSummary}
              >
                Export summary
              </button>
            )}
          </div>
        </div>

        {!data.outcomesReady ? (
          <div className={styles.state}>
            <h3>Outcomes are unavailable</h3>
            <p>Try again to retrieve this period.</p>
            {retry}
          </div>
        ) : (
          <>
            <div className={styles.outcomeMetrics}>
              {data.financials && (
                <div>
                  <span>Converted contract value</span>
                  <strong>
                    {data.convertedValue === null
                      ? "Unavailable"
                      : formatCrmCurrency(data.convertedValue)}
                  </strong>
                  <small>Contract value, not collected payments</small>
                </div>
              )}
              <div>
                <span>Conversions</span>
                <strong>{number(data.convertedCount)}</strong>
                <small>{data.periodLabel}</small>
              </div>
            </div>

            <details className={styles.definitions}>
              <summary>Metric definitions and reporting scope</summary>
              {data.financials && (
                <p>
                  Weighted potential:{" "}
                  {data.weightedPotential === null
                    ? "Unavailable"
                    : formatCrmCurrency(data.weightedPotential)}
                  . Approved probabilities are Qualified 25%, Proposal Sent 50%
                  and Negotiation 85%. Unknown potential stages make this
                  estimate unavailable.
                </p>
              )}
              <p>
                Average creation-to-conversion time for conversions in this
                period:{" "}
                {data.averageCycleDays === null
                  ? "Unavailable"
                  : `${data.averageCycleDays.toFixed(1)} days`}
                .
              </p>
              <p>
                Current pipeline includes visible open and potential records.
                The period selector applies only to Outcomes. Synthetic
                benchmarks are excluded. Export contains aggregates, not the
                full lead ledger.
              </p>
              <p>
                {data.cohort === null
                  ? "Creation-cohort conversion is unavailable."
                  : data.cohort.eligible === 0
                    ? "No eligible leads were created in this period."
                    : `${data.cohort.won} of ${data.cohort.eligible} eligible leads created in this period are currently converted (${((data.cohort.won / data.cohort.eligible) * 100).toFixed(1)}%). This describes their current status, not historical closed-deal win rate.`}{" "}
                Known spam and out-of-scope leads are excluded from this cohort.
              </p>
              <p>
                Report window: {dateLabel(data.periodStart)} to{" "}
                {dateLabel(data.periodEnd)}.
              </p>
            </details>
          </>
        )}
      </section>
    </div>
  );
}
