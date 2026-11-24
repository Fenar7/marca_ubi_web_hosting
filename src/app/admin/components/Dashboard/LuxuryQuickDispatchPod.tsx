"use client";

/**
 * @file LuxuryQuickDispatchPod.tsx
 * @description Quick Commercial Dispatch & Stage Transition Pod modeled 1:1 after the
 *              "Quick Transfer / Send Money" widget in Conyest and Finlo Flash archetypes.
 *              Enables 1-click deal selection, assigned rep routing, and instant pipeline progression.
 * @module admin/components/Dashboard/LuxuryQuickDispatchPod
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import React, { useState } from "react";
import { formatCrmCurrency } from "@/app/admin/lib/currency";
import type { OverviewRecord } from "./OverviewWorkspace";
import styles from "./LuxuryQuickDispatchPod.module.scss";

export interface LuxuryQuickDispatchPodProps {
  records?: OverviewRecord[];
  onAdvanceStage?: (record: OverviewRecord) => void;
  financials?: boolean;
}

const SALES_REPS = [
  { id: "rep-1", name: "Fenar Khan", initials: "FK", role: "Commercial Lead" },
  { id: "rep-2", name: "Aria Ross", initials: "AR", role: "Enterprise Advisory" },
  { id: "rep-3", name: "Samir Dave", initials: "SD", role: "Digital Architecture" },
  { id: "rep-4", name: "Maya Kapoor", initials: "MK", role: "Brand Strategy" },
];

export const LuxuryQuickDispatchPod: React.FC<LuxuryQuickDispatchPodProps> = ({
  records = [],
  onAdvanceStage,
  financials = true,
}) => {
  const [selectedRepId, setSelectedRepId] = useState<string>("rep-1");
  const [selectedRecordId, setSelectedRecordId] = useState<string>(
    records.length > 0 ? records[0].id : ""
  );

  const activeRecord =
    records.find((r) => r.id === selectedRecordId) || records[0] || null;

  const handleExecute = () => {
    if (activeRecord && onAdvanceStage) {
      onAdvanceStage(activeRecord);
    }
  };

  return (
    <article
      className={styles.dispatchCard}
      aria-label="Quick deal stage dispatch and representative routing pod"
    >
      <header className={styles.cardHeader}>
        <div className={styles.headerTitleGroup}>
          <h2 className={styles.cardTitle}>Quick Dispatch</h2>
          <span className={styles.headerBadge}>1-Click Stage Advance</span>
        </div>
        <span className={styles.repCountTag}>4 Active Reps</span>
      </header>

      {/* Commercial Rep Monogram Avatars */}
      <div className={styles.repsRow}>
        <span className={styles.sectionLabel}>ASSIGNED REPRESENTATIVE</span>
        <div className={styles.avatarList} role="radiogroup" aria-label="Commercial Representatives">
          {SALES_REPS.map((rep) => {
            const isSelected = selectedRepId === rep.id;
            return (
              <button
                key={rep.id}
                type="button"
                role="radio"
                aria-checked={isSelected}
                className={`${styles.avatarChip} ${
                  isSelected ? styles.avatarChipSelected : ""
                }`}
                onClick={() => setSelectedRepId(rep.id)}
                title={`${rep.name} (${rep.role})`}
              >
                <span className={styles.avatarInitials}>{rep.initials}</span>
                <span className={styles.avatarName}>{rep.name.split(" ")[0]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Target Deal Selector & Valuation Display */}
      <div className={styles.dealControlGroup}>
        <label htmlFor="quick-deal-select" className={styles.sectionLabel}>
          TARGET COMMERCIAL OPPORTUNITY
        </label>
        <div className={styles.inputContainer}>
          <select
            id="quick-deal-select"
            className={styles.dealSelect}
            value={activeRecord?.id ?? ""}
            onChange={(e) => setSelectedRecordId(e.target.value)}
          >
            {records.length === 0 ? (
              <option value="">No open commercial opportunities</option>
            ) : (
              records.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} — {r.stage} ({financials && r.expectedValue ? formatCrmCurrency(r.expectedValue) : "Confidential"})
                </option>
              ))
            )}
          </select>
        </div>

        {activeRecord && (
          <div className={styles.dealSummaryRow}>
            <div className={styles.dealMetaItem}>
              <span className={styles.metaLabel}>CURRENT STAGE</span>
              <span className={styles.stagePill}>{activeRecord.stage}</span>
            </div>
            <div className={styles.dealMetaItem}>
              <span className={styles.metaLabel}>VALUATION</span>
              <span className={styles.dealValue}>
                {financials && activeRecord.expectedValue
                  ? formatCrmCurrency(activeRecord.expectedValue)
                  : "Confidential"}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Action CTA Trigger */}
      <button
        type="button"
        className={styles.executeButton}
        onClick={handleExecute}
        disabled={!activeRecord || !onAdvanceStage}
      >
        <span>Execute Stage Progression</span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <line x1="5" y1="12" x2="19" y2="12" />
          <polyline points="12 5 19 12 12 19" />
        </svg>
      </button>
    </article>
  );
};
