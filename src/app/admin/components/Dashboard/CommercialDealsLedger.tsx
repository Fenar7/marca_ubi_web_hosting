"use client";

import Link from "next/link";
import { useState } from "react";
import { formatCrmCurrency } from "@/app/admin/lib/currency";
import type { OverviewRecord } from "./OverviewWorkspace";
import {
  followUpTiming,
  RecordDate,
  RecordName,
} from "./OverviewRecordDetails";
import styles from "./CommercialDealsLedger.module.scss";

export type LedgerFilterTab = "all" | "high_value" | "overdue" | "today";

export interface StageSummary {
  id: string;
  name: string;
  count: number;
  value: number | null;
}

interface StageFilterProps {
  stages: StageSummary[];
  financials: boolean;
  selectedStageId: string | null;
  onStageSelect: (id: string | null) => void;
}

export interface CommercialDealsLedgerProps extends StageFilterProps {
  records: OverviewRecord[];
  recordsReady: boolean;
  generatedAt: string;
  recordRoute?: string | null;
  onAdvanceStage?: (record: OverviewRecord) => void;
}

/** Full-pipeline stage totals remain independent of pagination and search in the opportunity preview. */
export function StageDistribution({
  stages,
  financials,
  pipelineReady,
  selectedStageId,
  onStageSelect,
}: Omit<StageFilterProps, "onStageSelect"> & {
  pipelineReady: boolean;
  onStageSelect?: StageFilterProps["onStageSelect"];
}) {
  const total = stages.reduce((sum, stage) => sum + stage.count, 0);
  return (
    <section aria-label="Pipeline by stage" className={styles.stagePanel}>
      <header className={styles.heading}>
        <h2>Pipeline by stage</h2>
        {selectedStageId && onStageSelect && (
          <button
            type="button"
            className={styles.textAction}
            onClick={() => onStageSelect(null)}
          >
            Clear stage
          </button>
        )}
      </header>
      {!pipelineReady ? (
        <p className={styles.state}>Stage totals are unavailable.</p>
      ) : !stages.length ? (
        <p className={styles.state}>No open stages configured.</p>
      ) : (
        <>
          <p className={styles.scope}>
            {total.toLocaleString("en-IN")} open{" "}
            {total === 1 ? "opportunity" : "opportunities"} across all stages
          </p>
          <ul className={styles.stages}>
            {stages.map((stage) => {
              const selected = stage.id === selectedStageId;
              const StageRow = onStageSelect ? "button" : "div";
              return (
                <li key={stage.id}>
                  <StageRow
                    type={onStageSelect ? "button" : undefined}
                    className={styles.stageButton}
                    aria-pressed={onStageSelect ? selected : undefined}
                    aria-controls={onStageSelect ? "overview-opportunities" : undefined}
                    onClick={onStageSelect ? () => onStageSelect(selected ? null : stage.id) : undefined}
                  >
                    <span className={styles.stageLine}>
                      <span>{stage.name}</span>
                      <span>{stage.count}</span>
                    </span>
                    <span className={styles.track} aria-hidden="true">
                      <span
                        style={{
                          width: `${total ? (stage.count * 100) / total : 0}%`,
                        }}
                      />
                    </span>
                    {financials && (
                      <span className={styles.stageValue}>
                        {stage.value === null
                          ? "Value unavailable"
                          : formatCrmCurrency(stage.value)}
                      </span>
                    )}
                  </StageRow>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </section>
  );
}

/** Search and urgency operate on the visible preview. Selecting a stage requests its own server-scoped preview. */
export function CommercialDealsLedger({
  records,
  recordsReady,
  financials,
  stages,
  generatedAt,
  recordRoute,
  selectedStageId,
  onStageSelect,
  onAdvanceStage,
}: CommercialDealsLedgerProps) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<LedgerFilterTab>("all");
  const term = search.trim().toLowerCase();
  const visible = records.filter((record) => {
    const timing = followUpTiming(record.due, generatedAt);
    if (filter === "overdue" && timing !== "Overdue") return false;
    if (filter === "today" && timing !== "Due today") return false;
    if (
      filter === "high_value" &&
      (!financials ||
        record.expectedValue === null ||
        record.expectedValue < 1000000)
    )
      return false;
    return (
      !term ||
      [
        record.name,
        record.company,
        record.leadId,
        record.owner,
        record.serviceCategory,
      ].some((field) => field?.toLowerCase().includes(term))
    );
  });
  const selectedStage = stages.find((stage) => stage.id === selectedStageId);
  return (
    <section
      id="overview-opportunities"
      className={styles.ledger}
      aria-label="Open opportunities"
    >
      <header className={styles.heading}>
        <h2>Open opportunities</h2>
        {recordRoute && (
          <Link className={styles.directory} href={recordRoute}>
            Open directory <span aria-hidden="true">↗</span>
          </Link>
        )}
      </header>
      <p className={styles.scope}>
        Latest 25 opportunities
        {selectedStage
          ? ` in ${selectedStage.name}`
          : " across all open stages"}
        . Search and filters apply to this list.
      </p>
      <div className={styles.controls}>
        <label>
          Search opportunities
          <input
            type="search"
            placeholder="Client, owner or lead ID"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
        <label>
          Show
          <select
            value={filter}
            onChange={(event) =>
              setFilter(event.target.value as LedgerFilterTab)
            }
          >
            <option value="all">All opportunities</option>
            <option value="overdue">Overdue follow-up</option>
            <option value="today">Follow-up due today</option>
            {financials && (
              <option value="high_value">₹10,00,000 or more</option>
            )}
          </select>
        </label>
        <label>
          Stage
          <select
            value={selectedStageId ?? ""}
            onChange={(event) => onStageSelect(event.target.value || null)}
          >
            <option value="">All stages</option>
            {stages.map((stage) => (
              <option key={stage.id} value={stage.id}>
                {stage.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      {!recordsReady ? (
        <p className={styles.state}>Opportunities are unavailable.</p>
      ) : !visible.length ? (
        <p className={styles.state} role="status">
          {term || filter !== "all"
            ? "No opportunities match this search and filter."
            : "No open opportunities in this view."}
        </p>
      ) : (
        <table className={styles.table} aria-label="Latest open opportunities">
          <thead>
            <tr>
              <th scope="col">Opportunity</th>
              <th scope="col">Stage</th>
              <th scope="col">Owner</th>
              <th scope="col">Follow-up (UTC)</th>
              {financials && (
                <th scope="col" className={styles.amount}>
                  Expected value
                </th>
              )}
              {onAdvanceStage && <th scope="col">Next action</th>}
            </tr>
          </thead>
          <tbody>
            {visible.map((record) => {
              const timing = followUpTiming(record.due, generatedAt);
              return (
                <tr key={record.id}>
                  <th scope="row">
                    <RecordName record={record} />
                  </th>
                  <td data-label="Stage">{record.stage}</td>
                  <td data-label="Owner">{record.owner}</td>
                  <td data-label="Follow-up (UTC)">
                    <span>
                      <RecordDate value={record.due} missing="Unscheduled" />
                      {(timing === "Overdue" || timing === "Due today") && (
                        <small className={styles.deadline} data-timing={timing}>
                          {timing}
                        </small>
                      )}
                    </span>
                  </td>
                  {financials && (
                    <td data-label="Expected value" className={styles.amount}>
                      {record.expectedValue === null
                        ? "Not entered"
                        : formatCrmCurrency(record.expectedValue)}
                    </td>
                  )}
                  {onAdvanceStage && (
                    <td data-label="Next action">
                      {record.canAdvance && record.nextStage ? (
                        <button
                          type="button"
                          className={styles.advance}
                          onClick={() => onAdvanceStage(record)}
                        >
                          Move to {record.nextStage.name}
                        </button>
                      ) : (
                        <span aria-label="No available transition">—</span>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </section>
  );
}
