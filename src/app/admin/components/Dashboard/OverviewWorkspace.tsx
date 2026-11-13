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
import { PipelineStageFlowBar } from "./PipelineStageFlowBar";
import { CommercialActionDesk } from "./CommercialActionDesk";
import { CadenceUrgencyRail } from "./CadenceUrgencyRail";
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

      {/* 2. Pipeline Stage Flow Bar */}
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

      {/* 3. Two-Column Working Grid (70% Desk + 30% Urgency Rail) */}
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

      {/* 4. Outcomes & Reporting Governance Section */}
      <section className={styles.outcomes} aria-labelledby="outcomes-heading">
        <div className={styles.sectionHeading}>
          <div>
            <h2 id="outcomes-heading">Outcomes &amp; Reporting Governance</h2>
            <p>Conversions and performance metrics recorded during the selected period.</p>
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
      </section>

      {/* 5. Guarded Stage Advancement Modal Integration */}
      {isStageModalOpen && targetTransitionRecord && (
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
            id: "next-stage",
            name: "Negotiation",
            bucket: "potential",
          }}
          onSuccess={() => {
            setIsStageModalOpen(false);
            setTargetTransitionRecord(null);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}