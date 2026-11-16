"use client";

/**
 * @file OverviewWorkspace.tsx
 * @description Master Commercial Desk Workspace for Marca Ubi Enterprise CRM (/admin).
 *              Complete from-scratch synthesis of the Finexy and AI Manager archetypes:
 *              Tier 1: Executive Telemetry Masthead (Obsidian VIP card + 3 white scorecards).
 *              Tier 2: Visual Intelligence Cockpit (68% Commercial Velocity Dual-Bar + 32% Donut Gauge).
 *              Tier 3: Master Commercial Deals Ledger (AI Manager multi-segment progress pips).
 *              Modal: Guarded StageTransitionModal for 1-click pipeline progression.
 * @module admin/components/Dashboard/OverviewWorkspace
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import React, { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  dashboardCsvCell,
  type OverviewQueue,
} from "@/app/admin/lib/dashboardContracts";
import type { CadenceLabel } from "@/app/admin/lib/timeframeUtils";
import type { FunnelBucket } from "@/types/crm";
import {
  type DynamicRevenueSplinePoint,
  type TimeframeSlug,
} from "@/app/admin/lib/timeframeUtils";
import { ExecutiveTelemetryMasthead } from "./ExecutiveTelemetryMasthead";
import { CommercialVelocityBarChart } from "./CommercialVelocityBarChart";
import { PipelineDonutChart } from "./PipelineDonutChart";
import { CommercialDealsLedger } from "./CommercialDealsLedger";
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
  categories: { name: string; value: number; count: number }[];
  cohort: { eligible: number; won: number } | null;
}

export function OverviewWorkspace({
  data,
}: {
  data: OverviewData;
}): React.ReactElement {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  // Guarded Stage Transition Modal State
  const [isStageModalOpen, setIsStageModalOpen] = useState(false);
  const [targetTransitionRecord, setTargetTransitionRecord] = useState<OverviewRecord | null>(null);

  function handleTimeframeChange(newSlug: TimeframeSlug): void {
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    params.set("timeframe", newSlug);
    startTransition(() => {
      router.push(`/admin?${params.toString()}`, { scroll: false });
    });
  }

  function exportSummary(): void {
    if (!data.canExport || !data.pipelineReady)
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
      {/* Tier 1: Executive Telemetry Masthead (Obsidian VIP Card + 3 White Companion Scorecards) */}
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

      {/* Tier 2: Visual Intelligence Cockpit (68% Cash Flow Bar Chart + 32% Category Breakdown) */}
      <section
        className={styles.visualCockpitGrid}
        aria-label="Commercial cash flow bar chart and pipeline category breakdown"
      >
        {/* Left Column (68%): Finexy Dual-Bar Chart */}
        <div className={styles.chartColumn}>
          <CommercialVelocityBarChart
            chart={data.chart}
            totalIntake={data.pipelineValue}
            totalRealized={data.convertedValue}
            periodLabel={data.periodLabel}
            timeframe={data.timeframe}
            financials={data.financials}
            onTimeframeChange={handleTimeframeChange}
          />
        </div>

        {/* Right Column (32%): Finexy Donut Gauge */}
        <div className={styles.donutColumn}>
          <PipelineDonutChart
            categories={data.categories}
            records={data.records}
            totalValue={data.pipelineValue}
            financials={data.financials}
          />
        </div>
      </section>

      {/* Tier 3: Master Commercial Deals Ledger (AI Manager Multi-Segment Progress Pips) */}
      <section
        className={styles.ledgerSection}
        aria-label="Commercial opportunities and action queue"
      >
        <CommercialDealsLedger
          records={data.records}
          recordsReady={data.recordsReady}
          financials={data.financials}
          onAdvanceStage={handleAdvanceStage}
          onOpenDossier={handleOpenDossier}
        />
      </section>

      {/* Guarded Stage Advancement Modal Integration */}
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
