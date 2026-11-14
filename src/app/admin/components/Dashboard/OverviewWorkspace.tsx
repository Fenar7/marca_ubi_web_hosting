"use client";

/**
 * @file OverviewWorkspace.tsx
 * @description Master Commercial Desk & Overview Workspace for Marca Ubi Enterprise CRM (/admin).
 *              Replaces the old Conyest bento layout with:
 *              1. ExecutiveTelemetryMasthead (Timeframe controls, CSV export, 4 telemetry scorecards).
 *              2. PipelineStageFlowBar (Interactive sequential stage filter).
 *              3. Two-Column Working Grid: CommercialActionDesk (70%) + CadenceUrgencyRail (30%).
 *              4. Guarded StageTransitionModal and Dossier Drawer integrations.
 *              5. Outcomes & Governance Summary.
 * @module admin/components/Dashboard/OverviewWorkspace
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import React, { useState, useTransition } from "react";
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
import { ExecutiveTelemetryMasthead } from "./ExecutiveTelemetryMasthead";
import { ConyestCashflowCard } from "./ConyestCashflowCard";
import { ConyestStatisticCard } from "./ConyestStatisticCard";
import { PipelineStageFlowBar } from "./PipelineStageFlowBar";
import { CommercialActionDesk } from "./CommercialActionDesk";
import { CadenceUrgencyRail } from "./CadenceUrgencyRail";
import { RevenueDynamicsCard } from "./RevenueDynamicsCard";
import { StageTransitionModal } from "@/app/admin/components/modals/StageTransitionModal";
import styles from "./OverviewWorkspace.module.scss";

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

export function OverviewWorkspace({
  data,
}: {
  data: OverviewData;
}): React.ReactElement {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Active Stage Filter State (Interconnects PipelineStageFlowBar and CommercialActionDesk)
  const [selectedStageId, setSelectedStageId] = useState<string | null>(null);

  // Guarded Stage Transition Modal State
  const [isStageModalOpen, setIsStageModalOpen] = useState(false);
  const [targetTransitionRecord, setTargetTransitionRecord] = useState<OverviewRecord | null>(null);

  function navigate(key: "queue" | "timeframe", value: string): void {
    const params = new URLSearchParams(searchParams.toString());
    params.set(key, value);
    startTransition(() =>
      router.push(`/admin?${params.toString()}`, { scroll: false })
    );
  }

  function exportSummary(): void {
    if (!data.canExport || !data.pipelineReady || !data.outcomesReady || isPending)
      return;

    const rows: (string | number | null)[][] = [
      ["Marca Ubi Commercial Desk Summary", "RLS-visible records"],
      ["Generated at (UTC)", data.generatedAt],
      ["Snapshot scope", "Current open and potential pipeline"],
      ["Active deals", data.pipelineCount],
      ...(data.financials
        ? [["Current pipeline value (INR)", data.pipelineValue ?? "Unavailable"]]
        : []),
      ["Outcomes window start (UTC)", data.periodStart],
      ["Outcomes window end (UTC)", data.periodEnd],
      ["Conversions in period", data.convertedCount],
      ...(data.financials
        ? [["Converted contract value (INR)", data.convertedValue ?? "Unavailable"]]
        : []),
      [],
      ["Current stage", "Deal count", ...(data.financials ? ["Expected value (INR)"] : [])],
      ...data.stages.map((stage) => [
        stage.name,
        stage.count,
        ...(data.financials ? [stage.value ?? "Unavailable"] : []),
      ]),
    ];

    const blob = new Blob(
      ["\uFEFF" + rows.map((row) => row.map(dashboardCsvCell).join(",")).join("\r\n")],
      { type: "text/csv;charset=utf-8" }
    );
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `marca-ubi-commercial-desk-${data.timeframe}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  const handleAdvanceStage = (record: OverviewRecord) => {
    setTargetTransitionRecord(record);
    setIsStageModalOpen(true);
  };

  const handleOpenDossier = (record: OverviewRecord) => {
    if (record.href) {
      router.push(record.href);
    } else {
      window.dispatchEvent(
        new CustomEvent("open-lead-drawer", {
          detail: { leadId: record.id, id: record.id },
        })
      );
    }
  };

  return (
    <div className={styles.overview}>
      {/* 1. Executive Telemetry Masthead */}
      <ExecutiveTelemetryMasthead
        userName={data.userName || "MARCA UBI DESK"}
        timeframe={data.timeframe}
        periodLabel={data.periodLabel}
        cadenceLabel={data.cadenceLabel}
        pipelineValue={data.pipelineValue}
        pipelineCount={data.pipelineCount}
        weightedPotential={data.weightedPotential}
        convertedValue={data.convertedValue}
        convertedCount={data.convertedCount}
        revenueDelta={data.revenueDelta}
        priorConvertedValue={data.priorConvertedValue}
        averageCycleDays={data.averageCycleDays}
        financials={data.financials}
        canExport={data.canExport}
        onExportSummary={exportSummary}
      />

      {/* 2. Visual Intelligence Cockpit: Clustered Dual-Bar Velocity (65%) + Segmented Donut Distribution (35%) */}
      <section className={styles.visualCockpitGrid} aria-label="Commercial velocity and stage distribution charts">
        {/* Left Column: Clustered Dual-Bar Velocity Chart */}
        <div className={styles.velocityChartColumn}>
          <ConyestCashflowCard
            cardTitle="Pipeline Velocity"
            balanceLabel="Total Deal Intake"
            totalBalance={data.pipelineValue !== null ? formatCrmCurrency(data.pipelineValue) : "Confidential"}
            financials={data.financials}
            periodLabel="This Year"
          />
        </div>

        {/* Right Column: Horological Segmented Donut / Arc Distribution Chart */}
        <div className={styles.donutChartColumn}>
          <ConyestStatisticCard
            cardTitle="Pipeline Distribution"
            primaryTabLabel="By Value"
            secondaryTabLabel="By Volume"
            expensesTotal={data.pipelineValue !== null ? formatCrmCurrency(data.pipelineValue) : "Confidential"}
            incomeTotal={`${data.pipelineCount ?? 0} Deals`}
            expenseItems={data.stages.map((stage, idx) => {
              const colors = ["#18181b", "#ea002a", "#d97706", "#059669", "#6366f1", "#0284c7", "#4f46e5"];
              const totalVal = data.pipelineValue || 1;
              const val = stage.value ?? 0;
              const percentage = Math.max(1, Math.round((val / totalVal) * 100));
              return {
                percentage,
                label: stage.name,
                amount: stage.value !== null ? formatCrmCurrency(stage.value) : `${stage.count} deals`,
                color: colors[idx % colors.length],
                badgeTextColor: colors[idx % colors.length],
              };
            })}
            incomeItems={data.stages.map((stage, idx) => {
              const colors = ["#18181b", "#ea002a", "#d97706", "#059669", "#6366f1", "#0284c7", "#4f46e5"];
              const totalCount = data.pipelineCount || 1;
              const percentage = Math.max(1, Math.round((stage.count / totalCount) * 100));
              return {
                percentage,
                label: stage.name,
                amount: `${stage.count} deals`,
                color: colors[idx % colors.length],
                badgeTextColor: colors[idx % colors.length],
              };
            })}
          />
        </div>
      </section>

      {/* 3. Pipeline Stage Flow Bar */}
      <section aria-labelledby="pipeline-heading">
        <h2 id="pipeline-heading" className={styles.srOnly}>Pipeline Stage Velocity</h2>
        <PipelineStageFlowBar
          stages={data.stages}
          selectedStageId={selectedStageId}
          onSelectStage={setSelectedStageId}
          totalDealsCount={data.pipelineCount ?? 0}
          totalPipelineValue={data.pipelineValue}
          financials={data.financials}
        />
      </section>

      {/* 4. Two-Column Working Grid (70% Desk + 30% Urgency Rail) */}
      <section aria-labelledby="today-heading" className={styles.workingGrid}>
        <h2 id="today-heading" className={styles.srOnly}>Commercial Action Desk and Cadence</h2>
        {/* Left Column: Commercial Action Desk (70%) */}
        <div className={styles.actionDeskColumn}>
          <CommercialActionDesk
            records={data.records}
            recordsReady={data.recordsReady}
            stages={data.stages}
            selectedStageId={selectedStageId}
            onSelectStage={setSelectedStageId}
            financials={data.financials}
            canTasks={data.canTasks}
            onAdvanceStage={handleAdvanceStage}
            onOpenDossier={handleOpenDossier}
          />
        </div>

        {/* Right Column: Cadence Urgency Rail (30%) */}
        <div className={styles.urgencyRailColumn}>
          <CadenceUrgencyRail
            records={data.records}
            recordsReady={data.recordsReady}
            convertedValue={data.convertedValue}
            targetMonthlyRevenue={1500000}
            financials={data.financials}
          />
        </div>
      </section>

      {/* 5. Outcomes & Revenue Realization Governance Section */}
      <section className={styles.outcomes} aria-labelledby="outcomes-heading">
        <div className={styles.outcomesCard}>
          <div className={styles.sectionHeading}>
            <div>
              <h2 id="outcomes-heading">Outcomes &amp; Revenue Realization</h2>
              <p>Conversions, spline trajectory, and governance metrics recorded during the selected period.</p>
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
            </div>
          </div>

          {!data.outcomesReady ? (
            <div className={styles.state}>
              <h3>Outcomes are unavailable</h3>
              <p>Try refreshing to retrieve this reporting period.</p>
            </div>
          ) : (
            <>
              {/* Spline Chart of Converted Value Trajectory */}
              <div className={styles.outcomesChartWrapper}>
                <RevenueDynamicsCard
                  dataPoints={data.chart}
                  timeframe={data.periodLabel}
                  conversionCount={data.convertedCount}
                  dataStatus={data.outcomesReady ? "ready" : "unavailable"}
                />
              </div>

              {/* Metric Summary Tiles */}
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
                {data.cohort && (
                  <div>
                    <span>Conversion Yield</span>
                    <strong>
                      {data.cohort.eligible > 0
                        ? `${Math.round((data.cohort.won / data.cohort.eligible) * 100)}%`
                        : "0%"}
                    </strong>
                    <small>{data.cohort.won} won / {data.cohort.eligible} eligible</small>
                  </div>
                )}
                <div>
                  <span>Commercial Turnaround</span>
                  <strong>
                    {data.averageCycleDays === null
                      ? "Unavailable"
                      : `${data.averageCycleDays.toFixed(1)} days`}
                  </strong>
                  <small>Target: &lt; 21 days</small>
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
                    . Approved stage probabilities: Qualified 25%, Proposal Sent 50%, Negotiation 85%.
                  </p>
                )}
                <p>
                  Average creation-to-conversion turnaround:{" "}
                  {data.averageCycleDays === null
                    ? "Unavailable"
                    : `${data.averageCycleDays.toFixed(1)} days`}
                  . Target: &lt; 21 days.
                </p>
                <p>
                  Report window: {dateLabel(data.periodStart)} to {dateLabel(data.periodEnd)}.
                </p>
              </details>
            </>
          )}
        </div>
      </section>

      {/* 5. Guarded Stage Advancement Modal Integration */}
      {isStageModalOpen && targetTransitionRecord && (() => {
        const currentStageIndex = data.stages.findIndex(
          (s) =>
            s.name.toLowerCase() === targetTransitionRecord.stage.toLowerCase() ||
            s.id === targetTransitionRecord.stage
        );
        const resolvedNext =
          currentStageIndex >= 0 && currentStageIndex < data.stages.length - 1
            ? data.stages[currentStageIndex + 1]
            : data.stages[data.stages.length - 1] || {
                id: "next-stage",
                name: "Negotiation",
                count: 0,
                value: null,
              };

        const targetBucket: FunnelBucket =
          resolvedNext.name.toLowerCase().includes("won") ||
          resolvedNext.name.toLowerCase().includes("converted")
            ? "converted"
            : resolvedNext.name.toLowerCase().includes("lost") ||
              resolvedNext.name.toLowerCase().includes("hold")
            ? "lost"
            : "potential";

        return (
          <StageTransitionModal
            isOpen={isStageModalOpen}
            onClose={() => {
              setIsStageModalOpen(false);
              setTargetTransitionRecord(null);
            }}
            leadId={targetTransitionRecord.id}
            dealName={targetTransitionRecord.name}
            currentExpectedValue={targetTransitionRecord.expectedValue ?? 0}
            targetStatus={{
              id: resolvedNext.id,
              name: resolvedNext.name,
              bucket: targetBucket,
            }}
            onSuccess={() => {
              setIsStageModalOpen(false);
              setTargetTransitionRecord(null);
              router.refresh();
            }}
          />
        );
      })()}
    </div>
  );
}