"use client";

/**
 * @file PipelineStageFlowBar.tsx
 * @description Interactive linear pipeline stage velocity flow bar.
 *              Displays stage progression, deal counts, and stage valuations.
 *              Emits selection events to filter the CommercialActionDesk.
 * @module admin/components/Dashboard/PipelineStageFlowBar
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import React from "react";
import { formatCrmCurrency } from "@/app/admin/lib/currency";
import styles from "./PipelineStageFlowBar.module.scss";

export interface PipelineStageFlowItem {
  id: string;
  name: string;
  count: number;
  value: number | null;
}

export interface PipelineStageFlowBarProps {
  stages: PipelineStageFlowItem[];
  selectedStageId: string | null;
  onSelectStage: (stageId: string | null) => void;
  totalDealsCount: number;
  totalPipelineValue: number | null;
  financials: boolean;
}

export function PipelineStageFlowBar({
  stages,
  selectedStageId,
  onSelectStage,
  totalDealsCount,
  totalPipelineValue,
  financials,
}: PipelineStageFlowBarProps): React.ReactElement {
  return (
    <nav
      className={styles.flowBarContainer}
      aria-label="Pipeline Stage Flow Filter"
    >
      <div className={styles.flowHeader}>
        <div className={styles.flowEyebrow}>
          <span className={styles.radarDot} aria-hidden="true" />
          <span className={styles.flowTitle}>Stage Flow Velocity</span>
        </div>
        <span className={styles.flowSubtitle}>
          Click a stage to isolate opportunities across the commercial desk
        </span>
      </div>

      <div className={styles.stagesTrack} role="tablist">
        {/* All Deals / Reset Pill */}
        <button
          type="button"
          role="tab"
          aria-selected={selectedStageId === null}
          className={`${styles.stageStep} ${
            selectedStageId === null ? styles.stageStepActive : ""
          }`}
          onClick={() => onSelectStage(null)}
        >
          <div className={styles.stageIndicatorRow}>
            <span className={styles.stepIndex}>ALL</span>
            <span className={styles.stepCountBadge}>
              {totalDealsCount.toLocaleString("en-IN")}
            </span>
          </div>
          <span className={styles.stageName}>All Deals</span>
          {financials && totalPipelineValue !== null && (
            <span className={styles.stageValuation}>
              {formatCrmCurrency(totalPipelineValue)}
            </span>
          )}
        </button>

        {/* Individual Pipeline Stages in Sequential Flow */}
        {stages.map((stage, idx) => {
          const isSelected = selectedStageId === stage.id;
          return (
            <React.Fragment key={stage.id}>
              <div className={styles.flowChevron} aria-hidden="true">
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </div>

              <button
                type="button"
                role="tab"
                aria-selected={isSelected}
                className={`${styles.stageStep} ${
                  isSelected ? styles.stageStepActive : ""
                }`}
                onClick={() => onSelectStage(isSelected ? null : stage.id)}
              >
                <div className={styles.stageIndicatorRow}>
                  <span className={styles.stepIndex}>0{idx + 1}</span>
                  <span className={styles.stepCountBadge}>
                    {stage.count.toLocaleString("en-IN")}
                  </span>
                </div>
                <span className={styles.stageName}>{stage.name}</span>
                {financials && (
                  <span className={styles.stageValuation}>
                    {stage.value !== null
                      ? formatCrmCurrency(stage.value)
                      : "—"}
                  </span>
                )}
              </button>
            </React.Fragment>
          );
        })}
      </div>
    </nav>
  );
}