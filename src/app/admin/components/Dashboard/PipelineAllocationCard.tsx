"use client";

import React, { useMemo, useState } from "react";
import type { StageAllocationItem } from "./types";
import styles from "./PipelineAllocationCard.module.scss";

export type { StageAllocationItem } from "./types";

export interface PipelineAllocationCardProps {
  totalValuation: number;
  stages: StageAllocationItem[];
  deltaPercentage?: number | null;
  cadenceLabel?: string;
  dataStatus?: "ready" | "unavailable";
}

function formatRupees(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export const PipelineAllocationCard: React.FC<PipelineAllocationCardProps> = ({
  totalValuation,
  stages,
  deltaPercentage,
  cadenceLabel,
  dataStatus = "ready",
}) => {
  const [hoveredStageId, setHoveredStageId] = useState<string | null>(null);
  const rows = useMemo(
    () =>
      stages.map((stage) => ({
        ...stage,
        color: stage.color,
        formattedAmount: stage.formattedAmount || formatRupees(stage.amount),
      })),
    [stages],
  );
  const totalActiveDeals = rows.reduce(
    (sum, stage) => sum + stage.dealCount,
    0,
  );

  if (dataStatus === "unavailable") {
    return (
      <div className={styles.pipelineCard}>
        <h2 className={styles.title}>Pipeline Stages</h2>
        <p className={styles.emptyState} role="status">
          Pipeline stage data is unavailable. The source query did not complete.
        </p>
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className={styles.pipelineCard}>
        <div className={styles.headerBlock}>
          <div className={styles.titleCluster}>
            <h2 className={styles.title}>Pipeline Stages</h2>
            <p className={styles.subtitle}>
              Distribution across active conversion milestones.
            </p>
          </div>
          <span className={styles.valuationBadge}>
            {formatRupees(totalValuation)}
          </span>
        </div>
        <p className={styles.emptyState} role="status">
          No active pipeline deals were recorded for this view.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.pipelineCard}>
      <div className={styles.headerBlock}>
        <div className={styles.titleCluster}>
          <h2 className={styles.title}>Pipeline Stages</h2>
          <p className={styles.subtitle}>
            Distribution across active conversion milestones and operational
            deal velocity.
          </p>
        </div>
        <div className={styles.headlineCluster}>
          <div className={styles.valuationRow}>
            <span className={styles.valuationBadge}>
              {formatRupees(totalValuation)}
            </span>
            {deltaPercentage === null || deltaPercentage === undefined ? (
              <span className={styles.comparisonUnavailable}>
                Comparison unavailable
              </span>
            ) : (
              <span className={styles.deltaPill}>
                {deltaPercentage > 0 ? "+" : ""}
                {deltaPercentage.toFixed(1)}%{" "}
                {cadenceLabel || "vs prior period"}
              </span>
            )}
          </div>
          <span className={styles.dealCountMuted}>
            {totalActiveDeals} active deals
          </span>
        </div>
      </div>

      <div
        className={styles.segmentedBarTrack}
        role="img"
        aria-label={
          "Pipeline distribution across " + rows.length + " active stages"
        }
        onMouseLeave={() => setHoveredStageId(null)}
      >
        {rows.map((stage) => {
          const isHovered = hoveredStageId === stage.id;
          const isAnyHovered = Boolean(hoveredStageId);
          return (
            <div
              key={stage.id}
              className={
                styles.segmentedBarSlice +
                (isHovered
                  ? " " + styles.sliceActive
                  : isAnyHovered
                    ? " " + styles.sliceDimmed
                    : "")
              }
              style={{
                flex: Math.max(0, stage.percentage),
                backgroundColor: stage.color,
              }}
              onMouseEnter={() => setHoveredStageId(stage.id)}
              title={
                stage.name +
                ": " +
                stage.percentage.toFixed(1) +
                "% (" +
                formatRupees(stage.amount) +
                ")"
              }
            />
          );
        })}
      </div>

      <div
        className={styles.stageLedgerList}
        role="list"
        aria-label="Pipeline stages breakdown"
        onMouseLeave={() => setHoveredStageId(null)}
      >
        {rows.map((stage) => {
          const isHovered = hoveredStageId === stage.id;
          const isAnyHovered = Boolean(hoveredStageId) && !isHovered;
          const velocity =
            stage.velocityDays === null || stage.velocityDays === undefined
              ? "Average duration unavailable"
              : stage.velocityDays.toFixed(1) + "d avg";

          return (
            <div
              key={stage.id}
              className={
                styles.stageLedgerRow +
                (isHovered
                  ? " " + styles.rowActive
                  : isAnyHovered
                    ? " " + styles.rowDimmed
                    : "")
              }
              role="listitem"
              onMouseEnter={() => setHoveredStageId(stage.id)}
            >
              <div className={styles.stagePrimaryCluster}>
                <div
                  className={styles.circularAvatar}
                  style={{ backgroundColor: stage.color + "15" }}
                >
                  <span
                    className={styles.avatarDot}
                    style={{ backgroundColor: stage.color }}
                  />
                </div>
                <div className={styles.stageNameBlock}>
                  <span className={styles.stageName}>{stage.name}</span>
                  <span className={styles.stageVolumeSubText}>
                    {stage.dealCount} deals � {velocity}
                  </span>
                </div>
              </div>

              <div className={styles.stageMetricsCluster}>
                <span className={styles.stageValuation}>
                  {formatRupees(stage.amount)}
                </span>
                <div className={styles.progressShareGroup}>
                  <div className={styles.microProgressTrack} aria-hidden="true">
                    <div
                      className={styles.microProgressFill}
                      style={{
                        width:
                          Math.min(100, Math.max(0, stage.percentage)) + "%",
                        backgroundColor: stage.color,
                      }}
                    />
                  </div>
                  <span className={styles.percentageShareVal}>
                    {stage.percentage.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
