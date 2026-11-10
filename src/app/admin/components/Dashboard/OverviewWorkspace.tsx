"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { formatCrmCurrency } from "@/app/admin/lib/currency";
import {
  dashboardCsvCell,
  type OverviewQueue,
} from "@/app/admin/lib/dashboardContracts";
import {
  TIMEFRAME_SLUG_LABELS,
  type DynamicRevenueSplinePoint,
  type TimeframeSlug,
} from "@/app/admin/lib/timeframeUtils";
import styles from "./OverviewWorkspace.module.scss";

/** Preview rows contain no monetary data, including for users restricted to operational access. */
export interface OverviewRecord {
  id: string;
  leadId: string;
  name: string;
  company: string | null;
  stage: string;
  due: string | null;
  owner: string;
  href: string | null;
}

/** Server-owned availability flags distinguish a successful zero from a failed or restricted query. */
export interface OverviewData {
  generatedAt: string;
  timeframe: TimeframeSlug;
  periodLabel: string;
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

const QUEUES: { key: OverviewQueue; label: string; empty: string }[] = [
  {
    key: "overdue",
    label: "Overdue",
    empty: "No overdue follow-ups. Review today’s conversations next.",
  },
  { key: "today", label: "Today", empty: "No follow-ups scheduled for today." },
  {
    key: "unassigned",
    label: "Unassigned",
    empty: "No active leads without both an owner and a scheduled follow-up.",
  },
];
const number = (value: number | null): string =>
  value === null ? "Unavailable" : value.toLocaleString("en-IN");

/** Dates use the same explicit UTC contract as the server queue, independent of browser timezone. */
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

/** A single authorized DTO drives the work queue and its quieter snapshot/reporting context. */
export function OverviewWorkspace({
  data,
}: {
  data: OverviewData;
}): React.ReactElement {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [pendingScope, setPendingScope] = useState<
    "queue" | "timeframe" | "retry"
  >("retry");
  const queuePending = isPending && pendingScope !== "timeframe";
  const outcomesPending = isPending && pendingScope !== "queue";
  const selectedQueue = QUEUES.find((queue) => queue.key === data.queue)!;
  const total = data.queueCounts[data.queue];
  const maxStage = Math.max(1, ...data.stages.map((stage) => stage.count));
  const maxValue = Math.max(1, ...data.chart.map((point) => point.cashVal));

  /** URL mutations preserve the other module's scope and never imply a global dashboard date filter. */
  function navigate(key: "queue" | "timeframe", value: string): void {
    setPendingScope(key);
    const params = new URLSearchParams(searchParams.toString());
    params.set(key, value);
    startTransition(() =>
      router.push(`/admin?${params.toString()}`, { scroll: false }),
    );
  }

  /** Export contains only visible snapshot/outcome aggregates, with explicit current and period scopes. */
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
      <header className={styles.introduction}>
        <div>
          <p className={styles.context}>Your commercial workspace</p>
          <h1>Overview</h1>
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

      <div className={styles.workingGrid}>
        <section
          className={styles.workSection}
          aria-labelledby="today-heading"
          aria-busy={queuePending}
        >
          <div className={styles.sectionHeading}>
            <div>
              <h2 id="today-heading">
                {data.canTasks ? "Today" : "Active opportunities"}
              </h2>
              <p>
                {data.canTasks
                  ? "The next conversations that need your attention."
                  : "A preview of the active records you can access."}
              </p>
            </div>
            <span className={styles.scope}>Current · UTC</span>
          </div>
          {data.canTasks && (
            <div className={styles.filters} aria-label="Follow-up filters">
              {QUEUES.map((queue) => (
                <button
                  key={queue.key}
                  type="button"
                  aria-pressed={data.queue === queue.key}
                  disabled={isPending}
                  onClick={() => navigate("queue", queue.key)}
                  className={
                    data.queue === queue.key
                      ? styles.selectedFilter
                      : styles.filter
                  }
                >
                  {queue.label}
                  <span>
                    {data.queueCounts[queue.key] === null
                      ? "Unknown"
                      : number(data.queueCounts[queue.key])}
                  </span>
                </button>
              ))}
            </div>
          )}
          <div className={styles.workSurface}>
            <div className={styles.columnLabels} aria-hidden="true">
              <span>Lead / company</span>
              <span>
                {data.canTasks ? "Next conversation" : "Stage / follow-up"}
              </span>
              <span>Owner</span>
              <span />
            </div>
            {queuePending && (
              <p className={styles.pendingMessage} role="status">
                Updating dashboard…
              </p>
            )}
            {!data.recordsReady ? (
              <div className={styles.state} role="status">
                <h3>Records couldn’t be loaded</h3>
                <p>Your other dashboard sections remain available.</p>
                {retry}
              </div>
            ) : data.records.length === 0 ? (
              <div className={styles.state}>
                <h3>
                  {data.canTasks
                    ? `No ${selectedQueue.label.toLowerCase()} follow-ups`
                    : "No active opportunities"}
                </h3>
                <p>
                  {data.canTasks
                    ? selectedQueue.empty
                    : data.recordRoute
                      ? "Active leads and deals will appear here."
                      : "No record workspace is available with your current permissions."}
                </p>
              </div>
            ) : (
              <ul className={styles.recordList}>
                {data.records.map((record) => (
                  <li key={record.id} className={styles.record}>
                    <div className={styles.recordIdentity}>
                      {record.href ? (
                        <Link href={record.href} className={styles.recordName}>
                          {record.name}
                        </Link>
                      ) : (
                        <strong>{record.name}</strong>
                      )}
                      <span>{record.company || record.leadId}</span>
                    </div>
                    <div className={styles.recordSchedule}>
                      <span
                        className={
                          data.canTasks && data.queue === "overdue"
                            ? styles.overdue
                            : ""
                        }
                      >
                        {data.canTasks && data.queue === "unassigned"
                          ? "Assign an owner and follow-up"
                          : dateLabel(record.due)}
                      </span>
                      <span>{record.stage}</span>
                    </div>
                    <span className={styles.owner}>{record.owner}</span>
                    {record.href ? (
                      <Link
                        className={styles.openRecord}
                        href={record.href}
                        aria-label={`Open ${record.name}`}
                      >
                        Open
                      </Link>
                    ) : (
                      <span />
                    )}
                  </li>
                ))}
              </ul>
            )}
            <div className={styles.queueFooter}>
              <span>
                {data.recordsReady
                  ? data.canTasks
                    ? `Showing ${data.records.length} of ${total === null ? "an unavailable total" : number(total)} ${selectedQueue.label.toLowerCase()} follow-ups`
                    : `Latest ${data.records.length} active records`
                  : "Preview unavailable"}
              </span>
              {data.canTasks ? (
                <Link href={`/admin/tasks?queue=${data.queue}`}>
                  View all follow-ups
                </Link>
              ) : data.recordRoute ? (
                <Link href={data.recordRoute}>View all opportunities</Link>
              ) : null}
            </div>
          </div>
        </section>

        <section
          className={styles.pipelineSection}
          aria-labelledby="pipeline-heading"
        >
          <div className={styles.sectionHeading}>
            <div>
              <h2 id="pipeline-heading">Pipeline now</h2>
              <p>Open and potential opportunities.</p>
            </div>
          </div>
          {!data.pipelineReady ? (
            <div className={styles.state}>
              <p>Pipeline is unavailable.</p>
              {retry}
            </div>
          ) : data.stages.length === 0 ? (
            <p className={styles.quietState}>
              No active stages are configured.
            </p>
          ) : (
            <>
              <div className={styles.stageLabels}>
                <span>Stage</span>
                <span>Deals{data.financials ? " / value" : ""}</span>
              </div>
              <ul className={styles.stageList}>
                {data.stages.map((stage) => (
                  <li key={stage.id}>
                    <div className={styles.stageHeading}>
                      {data.recordRoute ? (
                        <Link
                          href={`${data.recordRoute}?stage=${encodeURIComponent(stage.id)}`}
                        >
                          {stage.name}
                        </Link>
                      ) : (
                        <span>{stage.name}</span>
                      )}
                      <span>
                        <strong>{number(stage.count)}</strong>
                        {data.financials && (
                          <small>
                            {stage.value === null
                              ? "Value unavailable"
                              : formatCrmCurrency(stage.value)}
                          </small>
                        )}
                      </span>
                    </div>
                    <div className={styles.stageTrack} aria-hidden="true">
                      <span
                        style={{ width: `${(stage.count / maxStage) * 100}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
              <p className={styles.barNote}>Bar length shows deal count.</p>
              {data.recordRoute && (
                <Link className={styles.pipelineLink} href={data.recordRoute}>
                  Open pipeline
                </Link>
              )}
            </>
          )}
        </section>
      </div>

      <section
        className={styles.outcomes}
        aria-labelledby="outcomes-heading"
        aria-busy={outcomesPending}
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
        {outcomesPending && (
          <p className={styles.pendingMessage} role="status">
            Updating outcomes…
          </p>
        )}
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
            {data.convertedCount === 0 ? (
              <p className={styles.quietState}>
                No conversions recorded in this period.
                {data.recordRoute && (
                  <>
                    {" "}
                    <Link href={data.recordRoute}>Review your pipeline</Link>
                  </>
                )}
              </p>
            ) : (
              data.chart.length > 0 && (
                <details className={styles.trend}>
                  <summary>Conversion value by interval</summary>
                  <p>
                    Equal time intervals, UTC. Values are shown below each bar.
                  </p>
                  <ul className={styles.chart}>
                    {data.chart.map((point, index) => (
                      <li key={index}>
                        <span className={styles.chartWell}>
                          <span
                            style={{
                              height: `${(point.cashVal / maxValue) * 100}%`,
                            }}
                          />
                        </span>
                        <span>{point.fullPeriod}</span>
                        <strong>{point.cashFormatted}</strong>
                      </li>
                    ))}
                  </ul>
                </details>
              )
            )}
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
