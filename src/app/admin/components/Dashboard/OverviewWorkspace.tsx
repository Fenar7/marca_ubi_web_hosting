"use client";

import React, { useEffect, useRef, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { updateLeadStatusInlineAction } from "@/app/actions/leadInlineActions";
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
import { EarningOverviewSplineCard } from "./EarningOverviewSplineCard";
import { SpendingOverviewBarCard } from "./SpendingOverviewBarCard";

import { RecentTransactionsTable } from "./RecentTransactionsTable";
import { UpcomingSlaCard } from "./UpcomingSlaCard";

import { CommercialDealsLedger, StageDistribution } from "./CommercialDealsLedger";
import { StageTransitionModal } from "@/app/admin/components/modals/StageTransitionModal";
import styles from "./OverviewWorkspace.module.scss";

const periodDate = new Intl.DateTimeFormat("en-GB", {
  day: "numeric", month: "short", year: "numeric", timeZone: "UTC",
});

export interface OverviewRecord {
  id: string;
  leadId: string;
  name: string;
  company: string | null;
  stage: string;
  stageBucket: FunnelBucket;
  stageId: string;
  canAdvance: boolean;
  nextStage: { id: string; name: string; bucket: FunnelBucket } | null;
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
  canAdvance: boolean;
  selectedStageId: string | null;
  dealRecords: OverviewRecord[];
  dealsReady: boolean;
  recentRecords: OverviewRecord[];
  recentReady: boolean;
  followUpRecords: OverviewRecord[];
  followUpsReady: boolean;
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
  const [pending, startTransition] = useTransition();

  const [target, setTarget] = useState<OverviewRecord | null>(null);

  /** Keep report and pipeline filters independent in the URL. */
  function handleTimeframeChange(newSlug: TimeframeSlug): void {
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    params.set("timeframe", newSlug);
    startTransition(() => {
      router.push(`/admin?${params.toString()}`, { scroll: false });
    });
  }

  function exportSummary(): void {
    if (!data.canExport || !data.pipelineReady || !data.outcomesReady || pending)
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

  /** The route validates stage IDs and filters before applying the preview limit. */
  function selectStage(id: string | null): void {
    const params = new URLSearchParams(searchParams.toString());
    if (id) params.set("stage", id);
    else params.delete("stage");
    startTransition(() => router.push(params.size ? "/admin?" + params.toString() : "/admin", { scroll: false }));
  }

  const stageProps = {
    stages: data.stages,
    financials: data.financials,
    selectedStageId: data.selectedStageId,
    onStageSelect: selectStage,
  };

  return (
    <div className={styles.overview}>
      <ExecutiveTelemetryMasthead data={data} pending={pending} onTimeframeChange={handleTimeframeChange} onExportSummary={exportSummary} />
      <div aria-busy={pending} className={styles.content}>
        <div className={styles.workingGrid}>
          <div id="today-heading">
            {data.canTasks ? (
              <UpcomingSlaCard
                records={data.followUpRecords}
                recordsReady={data.followUpsReady}
                generatedAt={data.generatedAt}
                canTasks={data.canTasks}
                queueCounts={data.queueCounts}
              />
            ) : <RecentTransactionsTable records={data.recentRecords} recordsReady={data.recentReady} />}
          </div>
          <div id="pipeline-heading"><StageDistribution {...stageProps} pipelineReady={data.pipelineReady} /></div>
        </div>
        <div className={styles.reportingGrid} id="outcomes-heading">
          <EarningOverviewSplineCard
            key={data.timeframe}
            points={data.chart}
            count={data.outcomesReady ? data.convertedCount : null}
            value={data.convertedValue}
            financials={data.financials}
            periodLabel={periodDate.formatRange(new Date(data.periodStart), new Date(data.periodEnd))}
            delta={data.revenueDelta}
          />
          <SpendingOverviewBarCard totalValue={data.pipelineValue} dealCount={data.pipelineCount}
            categories={data.categories} financials={data.financials} />
        </div>
        {data.canTasks && data.recordRoute && <RecentTransactionsTable records={data.recentRecords} recordsReady={data.recentReady} />}
        {data.recordRoute && (
          <CommercialDealsLedger {...stageProps}
            records={data.dealRecords}
            recordsReady={data.dealsReady}
            generatedAt={data.generatedAt}
            recordRoute={data.recordRoute}
            onAdvanceStage={data.canAdvance ? setTarget : undefined}
          />
        )}
      </div>
      {target?.nextStage && (target.nextStage.bucket === "converted" || target.nextStage.name.trim().toLowerCase() === "negotiation" ? (
        <StageTransitionModal isOpen onClose={() => setTarget(null)} leadId={target.id}
          dealName={target.company || target.name}
          currentExpectedValue={target.expectedValue ?? 0} targetStatus={target.nextStage}
          onSuccess={() => { setTarget(null); router.refresh(); }} />
      ) : (
        <ConfirmStageMove record={target} stage={target.nextStage}
          onClose={() => setTarget(null)}
          onSuccess={() => { setTarget(null); router.refresh(); }} />
      ))}
    </div>
  );
}

/** Ordinary stage changes do not collect financial terms. The server action still validates the move and actor. */
function ConfirmStageMove({ record, stage, onClose, onSuccess }: {
  record: OverviewRecord;
  stage: NonNullable<OverviewRecord["nextStage"]>;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    return () => element?.close();
  }, []);

  return (
    <dialog ref={dialog} className={styles.confirm} aria-labelledby="overview-stage-title"
      onCancel={event => { event.preventDefault(); if (!pending) onClose(); }}>
      <h2 id="overview-stage-title">Move to {stage.name}?</h2>
      <p>{record.company || record.name}</p>
      {error && <p role="alert">{error}</p>}
      <div className={styles.confirmActions}>
        <button type="button" disabled={pending} onClick={onClose}>Cancel</button>
        <button type="button" disabled={pending} onClick={() => {
          setError(null);
          startTransition(async () => {
            try {
              const result = await updateLeadStatusInlineAction(record.id, stage.id);
              if (result.success) onSuccess();
              else setError(result.error || "The stage could not be changed.");
            } catch (cause) {
              console.error("[overview] Stage request failed", cause);
              setError("The stage could not be changed. Try again.");
            }
          });
        }}>{pending ? "Moving…" : "Confirm move"}</button>
      </div>
    </dialog>
  );
}
