"use client";

/**
 * @file ExecutiveMasthead.tsx
 * @description Executive Overview Masthead for the Marca Ubi Agency CRM (/admin).
 *              Establishes high-level dashboard intent, timeframe selection, report extraction,
 *              and lead generation triggers with strict WCAG AA 44px minimum touch targets.
 *              Synchronizes timeframe mutations directly with Next.js App Router URL searchParams
 *              (?timeframe=7d | 30d | 90d | quarter | year) using non-blocking React 19 transitions.
 * @module admin/components/Dashboard/ExecutiveMasthead
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import React, { useState, useRef, useEffect, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  timeframeToSlug,
  slugToTimeframeLabel,
} from "@/app/admin/lib/timeframeUtils";
import styles from "./ExecutiveMasthead.module.scss";
import type { ExecutiveReportExportData } from "./types";

export interface ExecutiveMastheadProps {
  /** Optional active timeframe passed from Server Component */
  selectedTimeframe?: string;
  /** Optional initial active timeframe window */
  initialDateRange?: string;
  /** Notification hook triggered upon timeframe mutation */
  onDateRangeChange?: (range: string) => void;
  /** Snapshot assembled from successful dashboard queries; absent snapshots cannot be exported. */
  exportData?: ExecutiveReportExportData;
}

const TIMEFRAME_OPTIONS = [
  "Last 7 Days",
  "Last 30 Days",
  "Last 90 Days",
  "This Quarter",
  "This Year",
];

export const ExecutiveMasthead: React.FC<ExecutiveMastheadProps> = ({
  selectedTimeframe,
  initialDateRange = "Last 30 Days",
  onDateRangeChange,
  exportData,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Resolve current active timeframe from URL search parameters, falling back to selectedTimeframe or initialDateRange
  const urlTimeframeParam = searchParams.get("timeframe");
  const activeSlug = timeframeToSlug(
    urlTimeframeParam || selectedTimeframe || initialDateRange,
  );
  const activeLabel = slugToTimeframeLabel(activeSlug);

  const [selectedRange, setSelectedRange] = useState<string>(activeLabel);
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  /**
   * Keep local state in sync when URL query parameter updates externally.
   */
  useEffect(() => {
    setSelectedRange(activeLabel);
  }, [activeLabel]);

  /**
   * Closes the interactive date range menu when clicks occur beyond its boundary.
   */
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    }
    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen]);

  /**
   * Synchronizes timeframe selection to URL query parameters and invokes callback.
   */
  const handleSelectRange = (range: string) => {
    setSelectedRange(range);
    setIsDropdownOpen(false);
    onDateRangeChange?.(range);

    const targetSlug = timeframeToSlug(range);
    const params = new URLSearchParams(searchParams.toString());
    params.set("timeframe", targetSlug);

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    });
  };

  /** Quotes every cell and neutralizes formula-leading values before spreadsheet import. */
  const handleExportClick = () => {
    if (!exportData) return;
    const csvCell = (value: string | number | null): string => {
      const raw = value === null ? "" : String(value);
      const safe = /^[=+\-@\t\r]/.test(raw) ? "'" + raw : raw;
      return '"' + safe.replace(/"/g, '""') + '"';
    };
    const rows: (string | number | null)[][] = [
      ["Executive report", exportData.timeframe, exportData.cadence],
      ["Window start", exportData.dateWindow.start],
      ["Window end", exportData.dateWindow.end],
      ["Generated at", exportData.generatedAt],
      [],
      ["Metrics"],
      ["Metric", "Value"],
      ...exportData.metrics.map((metric) => [metric.label, metric.value]),
      [],
      ["Pipeline stages"],
      ["Stage", "Deal count", "Total value (INR)"],
      ...exportData.stages.map((stage) => [
        stage.stageName,
        stage.dealCount,
        stage.totalValue,
      ]),
      [],
      ["Displayed active deals"],
      [
        "Lead ID",
        "Name",
        "Company",
        "Category",
        "Stage",
        "Expected value (INR)",
        "Priority",
        "Next follow-up",
        "Owner",
      ],
      ...exportData.deals.map((deal) => [
        deal.leadId,
        deal.name,
        deal.company,
        deal.serviceCategory,
        deal.stageName,
        deal.expectedValue,
        deal.priority,
        deal.nextFollowUp,
        deal.owner,
      ]),
    ];
    const csv = rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
    const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download =
      "executive-report-" + timeframeToSlug(exportData.timeframe) + ".csv";
    anchor.style.display = "none";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  };

  return (
    <header
      className={styles.mastheadContainer}
      aria-label="Executive Overview Header"
    >
      <div className={styles.titleCluster}>
        <p className={styles.eyebrow}>Commercial operations</p>
        <h1 className={styles.title}>Commercial Desk</h1>
        <p className={styles.subtitle}>
          Today’s priorities, active pipeline, and contract value from recorded wins.
        </p>
      </div>

      <div className={styles.actionsCluster}>
        {/* Date Range Dropdown with URL Query Synchronization */}
        <div className={styles.dropdownWrapper} ref={dropdownRef}>
          <button
            type="button"
            className={styles.dropdownTrigger}
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            aria-expanded={isDropdownOpen}
            aria-haspopup="menu"
            aria-busy={isPending}
            aria-label={`Select dashboard timeframe. Currently active: ${selectedRange}`}
          >
            <svg
              className={styles.calendarIcon}
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <span>{selectedRange}</span>
            <svg
              className={styles.chevron}
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {isDropdownOpen && (
            <div
              className={styles.dropdownMenu}
              role="menu"
              aria-label="Date range options"
            >
              {TIMEFRAME_OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  role="menuitem"
                  className={`${styles.dropdownItem} ${
                    option === selectedRange ? styles.selected : ""
                  }`}
                  onClick={() => handleSelectRange(option)}
                >
                  <span>{option}</span>
                  {option === selectedRange && (
                    <svg
                      width="13"
                      height="13"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Export Report Pill Button */}
        <button
          type="button"
          className={styles.exportBtn}
          onClick={handleExportClick}
          aria-label="Export executive report"
          disabled={!exportData}
          title={
            !exportData
              ? "Report unavailable until all dashboard data sources load successfully."
              : "Download the displayed dashboard data as CSV."
          }
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          <span>Export Report</span>
        </button>

      </div>
    </header>
  );
};
