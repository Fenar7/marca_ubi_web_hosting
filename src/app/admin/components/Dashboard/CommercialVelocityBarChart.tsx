"use client";

/**
 * @file CommercialVelocityBarChart.tsx
 * @description Outcomes & Pipeline Intake Bar Chart for the Marca Ubi Commercial Desk.
 *              Renders an HTML Y-axis with full en-IN currency (or integer counts when financials
 *              are restricted), keyboard-accessible interval bar buttons, an inline 44px selected
 *              interval strip, explicit unavailable/empty states, and a collapsible data table.
 * @module admin/components/Dashboard/CommercialVelocityBarChart
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import React, { useMemo, useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { formatCrmCurrency } from "@/app/admin/lib/currency";
import type { DynamicRevenueSplinePoint, TimeframeSlug } from "@/app/admin/lib/timeframeUtils";
import styles from "./CommercialVelocityBarChart.module.scss";

export interface MonthlyBarData {
  month: string;
  intake: number;
  realized: number;
  fullPeriod?: string;
  intakeCount?: number;
  realizedCount?: number;
}

export interface CommercialVelocityBarChartProps {
  chart?: DynamicRevenueSplinePoint[];
  totalRealized?: number | null;
  periodLabel?: string;
  timeframe?: TimeframeSlug;
  financials?: boolean;
  onTimeframeChange?: (slug: TimeframeSlug) => void;
  periodIntakeValue?: number | null;
  periodIntakeCount?: number | null;
  convertedCount?: number | null;
  intakeReady?: boolean;
  outcomesReady?: boolean;
  recordRoute?: string | null;
  isPending?: boolean;
}

export type CashFlowPerspective = "intake" | "realized";

type VelocityChartPoint = DynamicRevenueSplinePoint & {
  cashCount?: number;
  intakeCount?: number;
};

const TIMEFRAME_OPTIONS: ReadonlyArray<{ slug: TimeframeSlug; label: string; sub: string }> = [
  { slug: "7d", label: "Last 7 Days", sub: "Daily deal intake" },
  { slug: "30d", label: "Last 30 Days", sub: "Weekly cadence intervals" },
  { slug: "90d", label: "Last 90 Days", sub: "Quarterly momentum" },
  { slug: "quarter", label: "This Quarter", sub: "Current fiscal quarter" },
  { slug: "year", label: "This Year", sub: "Annual trajectory" },
];

const INR_STEP_UNITS = [
  1000, 2500, 5000, 10000, 25000, 50000, 100000, 200000, 500000, 1000000, 2500000,
];

function computeCleanQuarter(highest: number, isCurrency: boolean): number {
  if (!isCurrency) {
    return Math.max(1, Math.ceil((highest * 1.15) / 4));
  }
  const targetQuarter = (highest * 1.15) / 4;
  for (let i = INR_STEP_UNITS.length - 1; i >= 0; i -= 1) {
    const unit = INR_STEP_UNITS[i];
    if (targetQuarter >= unit) {
      return Math.ceil(targetQuarter / unit) * unit;
    }
  }
  return Math.max(500, Math.ceil(targetQuarter / 500) * 500);
}

export const CommercialVelocityBarChart: React.FC<CommercialVelocityBarChartProps> = ({
  chart = [],
  totalRealized = null,
  periodLabel = "Last 30 Days",
  timeframe = "30d",
  financials = true,
  onTimeframeChange,
  periodIntakeValue = null,
  periodIntakeCount = null,
  convertedCount = null,
  intakeReady = true,
  outcomesReady = true,
  recordRoute,
  isPending = false,
}) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [perspective, setPerspective] = useState<CashFlowPerspective>("intake");
  const [isTimeframeOpen, setIsTimeframeOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const perspectiveRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const barRefs = useRef<Array<HTMLButtonElement | null>>([]);

  useEffect(() => {
    if (!isTimeframeOpen) return;

    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsTimeframeOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isTimeframeOpen]);

  const closeTimeframeMenu = useCallback((restoreFocus = false) => {
    setIsTimeframeOpen(false);
    if (restoreFocus) {
      triggerRef.current?.focus();
    }
  }, []);

  const handleSelectTimeframe = (slug: TimeframeSlug) => {
    closeTimeframeMenu(true);
    if (onTimeframeChange) {
      onTimeframeChange(slug);
    }
  };

  const openAndFocusMenu = useCallback(
    (targetIdx?: number) => {
      setIsTimeframeOpen(true);
      const activeIdx =
        typeof targetIdx === "number"
          ? targetIdx
          : Math.max(
              0,
              TIMEFRAME_OPTIONS.findIndex((opt) => opt.slug === timeframe)
            );
      requestAnimationFrame(() => {
        optionRefs.current[activeIdx]?.focus();
      });
    },
    [timeframe]
  );

  const handleTriggerKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!isTimeframeOpen) {
        openAndFocusMenu(e.key === "ArrowUp" ? TIMEFRAME_OPTIONS.length - 1 : undefined);
      }
    } else if (e.key === "Escape" && isTimeframeOpen) {
      e.preventDefault();
      closeTimeframeMenu(true);
    }
  };

  const handleOptionKeyDown = (
    e: React.KeyboardEvent<HTMLButtonElement>,
    idx: number
  ) => {
    if (e.key === "Escape") {
      e.preventDefault();
      closeTimeframeMenu(true);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      const next = (idx + 1) % TIMEFRAME_OPTIONS.length;
      optionRefs.current[next]?.focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const prev = (idx - 1 + TIMEFRAME_OPTIONS.length) % TIMEFRAME_OPTIONS.length;
      optionRefs.current[prev]?.focus();
    } else if (e.key === "Home") {
      e.preventDefault();
      optionRefs.current[0]?.focus();
    } else if (e.key === "End") {
      e.preventDefault();
      optionRefs.current[TIMEFRAME_OPTIONS.length - 1]?.focus();
    }
  };

  const handlePerspectiveKeyDown = (
    e: React.KeyboardEvent<HTMLButtonElement>,
    idx: number
  ) => {
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      e.preventDefault();
      const nextIdx = idx === 0 ? 1 : 0;
      const nextPerspective: CashFlowPerspective = nextIdx === 0 ? "intake" : "realized";
      setPerspective(nextPerspective);
      setSelectedIndex(null);
      perspectiveRefs.current[nextIdx]?.focus();
    } else if (e.key === "Home") {
      e.preventDefault();
      setPerspective("intake");
      setSelectedIndex(null);
      perspectiveRefs.current[0]?.focus();
    } else if (e.key === "End") {
      e.preventDefault();
      setPerspective("realized");
      setSelectedIndex(null);
      perspectiveRefs.current[1]?.focus();
    }
  };

  const monthlyData = useMemo<MonthlyBarData[]>(() => {
    if (!chart || chart.length === 0) return [];
    return chart.map((rawPt) => {
      const pt = rawPt as VelocityChartPoint;
      return {
        month: pt.month,
        fullPeriod: pt.fullPeriod,
        intake: typeof pt.intakeVal === "number" && Number.isFinite(pt.intakeVal) ? pt.intakeVal : 0,
        realized: typeof pt.cashVal === "number" && Number.isFinite(pt.cashVal) ? pt.cashVal : 0,
        intakeCount:
          typeof pt.intakeCount === "number" && Number.isFinite(pt.intakeCount) ? pt.intakeCount : 0,
        realizedCount:
          typeof pt.cashCount === "number" && Number.isFinite(pt.cashCount) ? pt.cashCount : 0,
      };
    });
  }, [chart]);

  const getBucketValue = useCallback(
    (item: MonthlyBarData): number => {
      if (financials) {
        return perspective === "realized" ? item.realized : item.intake;
      }
      return perspective === "realized" ? item.realizedCount ?? 0 : item.intakeCount ?? 0;
    },
    [financials, perspective]
  );

  const isUnavailable =
    perspective === "realized" ? outcomesReady === false : intakeReady === false;

  const isEmpty = useMemo(() => {
    if (isUnavailable) return false;
    if (monthlyData.length === 0) return true;
    return monthlyData.every((item) => getBucketValue(item) === 0);
  }, [isUnavailable, monthlyData, getBucketValue]);

  const heroDisplay = useMemo(() => {
    if (isUnavailable) {
      return "Telemetry unavailable";
    }
    if (financials) {
      const sumIntake = monthlyData.reduce((sum, d) => sum + d.intake, 0);
      const sumRealized = monthlyData.reduce((sum, d) => sum + d.realized, 0);
      const activeTotal =
        perspective === "intake"
          ? typeof periodIntakeValue === "number"
            ? periodIntakeValue
            : sumIntake
          : typeof totalRealized === "number"
            ? totalRealized
            : sumRealized;
      return formatCrmCurrency(activeTotal);
    }

    const sumIntakeCount = monthlyData.reduce((sum, d) => sum + (d.intakeCount ?? 0), 0);
    const sumRealizedCount = monthlyData.reduce((sum, d) => sum + (d.realizedCount ?? 0), 0);
    const activeCount =
      perspective === "intake"
        ? typeof periodIntakeCount === "number"
          ? periodIntakeCount
          : sumIntakeCount
        : typeof convertedCount === "number"
          ? convertedCount
          : sumRealizedCount;
    return perspective === "intake"
      ? `${activeCount} New Leads`
      : `${activeCount} Converted Deals`;
  }, [
    isUnavailable,
    financials,
    monthlyData,
    perspective,
    periodIntakeValue,
    totalRealized,
    periodIntakeCount,
    convertedCount,
  ]);

  const { maxVal, yTicks } = useMemo(() => {
    const highest = Math.max(...monthlyData.map(getBucketValue), 0);
    if (highest <= 0) {
      return { maxVal: 0, yTicks: [0] };
    }
    const cleanQuarter = computeCleanQuarter(highest, financials);
    const ceiling = cleanQuarter * 4;
    return {
      maxVal: ceiling,
      yTicks: [ceiling, cleanQuarter * 3, cleanQuarter * 2, cleanQuarter, 0],
    };
  }, [monthlyData, getBucketValue, financials]);

  const peakIndex = useMemo(() => {
    if (monthlyData.length === 0) return 0;
    let maxIdx = 0;
    let maxFound = -1;
    monthlyData.forEach((d, idx) => {
      const val = getBucketValue(d);
      if (val > maxFound) {
        maxFound = val;
        maxIdx = idx;
      }
    });
    return maxIdx;
  }, [monthlyData, getBucketValue]);

  const activeIndex =
    selectedIndex !== null && selectedIndex < monthlyData.length ? selectedIndex : peakIndex;
  const spotlightItem = monthlyData[activeIndex] ?? null;
  const spotlightVal = spotlightItem ? getBucketValue(spotlightItem) : 0;

  const effectiveRecordRoute = recordRoute === undefined ? "/admin/deals" : recordRoute;
  const drilldownHref = effectiveRecordRoute
    ? `${effectiveRecordRoute}?bucket=${perspective === "realized" ? "converted" : "open"}`
    : null;

  const formatMetricValue = useCallback(
    (val: number): string => {
      if (financials) {
        return formatCrmCurrency(val);
      }
      return perspective === "realized" ? `${val} Converted Deals` : `${val} New Leads`;
    },
    [financials, perspective]
  );

  const handleBarKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, idx: number) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      const next = (idx + 1) % monthlyData.length;
      setSelectedIndex(next);
      barRefs.current[next]?.focus();
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      const prev = (idx - 1 + monthlyData.length) % monthlyData.length;
      setSelectedIndex(prev);
      barRefs.current[prev]?.focus();
    } else if (e.key === "Home") {
      e.preventDefault();
      setSelectedIndex(0);
      barRefs.current[0]?.focus();
    } else if (e.key === "End") {
      e.preventDefault();
      const last = Math.max(0, monthlyData.length - 1);
      setSelectedIndex(last);
      barRefs.current[last]?.focus();
    } else if (e.key === "Escape") {
      e.preventDefault();
      setSelectedIndex(null);
    }
  };

  return (
    <article
      className={styles.cardContainer}
      aria-labelledby="outcomes-intake-title"
      aria-busy={isPending}
    >
      <header className={styles.chartHeader}>
        <div className={styles.titleBlock}>
          <h2 className={styles.title} id="outcomes-intake-title">
            Outcomes &amp; Pipeline Intake
          </h2>
          <p className={styles.scopeSubtitle}>
            Converted deals vs. newly created leads in period · UTC
          </p>

          <p className={isUnavailable ? styles.heroUnavailable : styles.heroValuation}>
            {heroDisplay}
          </p>

          <div
            className={styles.perspectiveControls}
            role="group"
            aria-label="Metric perspective"
          >
            <button
              ref={(el) => {
                perspectiveRefs.current[0] = el;
              }}
              type="button"
              aria-pressed={perspective === "intake"}
              className={`${styles.perspectiveBtn} ${
                perspective === "intake" ? styles.perspectiveBtnActive : ""
              }`}
              onClick={() => {
                setPerspective("intake");
                setSelectedIndex(null);
              }}
              onKeyDown={(e) => handlePerspectiveKeyDown(e, 0)}
            >
              <span
                className={`${styles.perspectiveDot} ${styles.perspectiveDotIntake}`}
                aria-hidden="true"
              />
              <span>{financials ? "New Intake" : "New Leads"}</span>
            </button>
            <button
              ref={(el) => {
                perspectiveRefs.current[1] = el;
              }}
              type="button"
              aria-pressed={perspective === "realized"}
              className={`${styles.perspectiveBtn} ${
                perspective === "realized" ? styles.perspectiveBtnActive : ""
              }`}
              onClick={() => {
                setPerspective("realized");
                setSelectedIndex(null);
              }}
              onKeyDown={(e) => handlePerspectiveKeyDown(e, 1)}
            >
              <span
                className={`${styles.perspectiveDot} ${styles.perspectiveDotRealized}`}
                aria-hidden="true"
              />
              <span>{financials ? "Converted Value" : "Converted Deals"}</span>
            </button>
          </div>
        </div>

        <div className={styles.controlsGroup}>
          <div
            className={styles.dropdownContainer}
            ref={dropdownRef}
            onBlur={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
                setIsTimeframeOpen(false);
              }
            }}
          >
            <button
              ref={triggerRef}
              type="button"
              id="velocity-timeframe-trigger"
              className={`${styles.timeframeButton} ${
                isTimeframeOpen ? styles.timeframeButtonActive : ""
              }`}
              onClick={() => {
                if (isTimeframeOpen) {
                  closeTimeframeMenu(false);
                } else {
                  openAndFocusMenu();
                }
              }}
              onKeyDown={handleTriggerKeyDown}
              aria-haspopup="listbox"
              aria-expanded={isTimeframeOpen}
              aria-controls="velocity-timeframe-menu"
              aria-label={`Timeframe: ${periodLabel}. Change reporting period.`}
            >
              <span>{periodLabel}</span>
              <svg
                className={`${styles.chevron} ${isTimeframeOpen ? styles.chevronOpen : ""}`}
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {isTimeframeOpen && (
              <ul
                id="velocity-timeframe-menu"
                className={styles.dropdownMenu}
                role="listbox"
                aria-labelledby="velocity-timeframe-trigger"
              >
                {TIMEFRAME_OPTIONS.map((opt, idx) => {
                  const isSelected = timeframe === opt.slug;
                  return (
                    <li key={opt.slug} role="presentation">
                      <button
                        ref={(el) => {
                          optionRefs.current[idx] = el;
                        }}
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        className={`${styles.dropdownItem} ${
                          isSelected ? styles.dropdownItemActive : ""
                        }`}
                        onClick={() => handleSelectTimeframe(opt.slug)}
                        onKeyDown={(e) => handleOptionKeyDown(e, idx)}
                      >
                        <span className={styles.optionTextGroup}>
                          <span className={styles.optionLabel}>{opt.label}</span>
                          <span className={styles.optionSubtext}>{opt.sub}</span>
                        </span>
                        {isSelected && (
                          <svg
                            className={styles.activeCheck}
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
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </header>

      {isUnavailable ? (
        <div className={styles.unavailableBanner} role="status">
          <p className={styles.stateMessage}>
            Telemetry is currently unavailable for this period.
          </p>
        </div>
      ) : isEmpty ? (
        <div className={styles.emptyBanner} role="status">
          <p className={styles.stateMessage}>
            No {perspective === "realized" ? "conversions" : "new leads"} recorded in {periodLabel}.
          </p>
          {drilldownHref && (
            <Link href={drilldownHref} className={styles.emptyActionLink}>
              <span>Inspect deals</span>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </Link>
          )}
        </div>
      ) : (
        <>
          <div
            className={`${styles.plotSection} ${isPending ? styles.plotPending : ""}`}
            role="region"
            aria-label="Interval bar chart"
          >
            <div className={styles.yAxisRail} aria-hidden="true">
              {yTicks.map((tick) => (
                <span key={tick} className={styles.yAxisTick}>
                  {financials ? formatCrmCurrency(tick) : String(tick)}
                </span>
              ))}
            </div>

            <div className={styles.plotArea}>
              <div className={styles.gridlinesLayer} aria-hidden="true">
                {yTicks.slice(0, -1).map((tick) => (
                  <div key={tick} className={styles.gridlineRow} />
                ))}
              </div>

              <div className={styles.columnsRow}>
                {monthlyData.map((item, idx) => {
                  const val = getBucketValue(item);
                  const heightPct = maxVal > 0 ? Math.max(val > 0 ? 4 : 0, (val / maxVal) * 100) : 0;
                  const isSelected = activeIndex === idx;

                  return (
                    <button
                      key={`${item.month}-${idx}`}
                      ref={(el) => {
                        barRefs.current[idx] = el;
                      }}
                      type="button"
                      className={styles.barColumnBtn}
                      aria-pressed={isSelected}
                      aria-label={`${item.fullPeriod || item.month}: ${formatMetricValue(val)}`}
                      onClick={() => setSelectedIndex(idx)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      onFocus={() => setSelectedIndex(idx)}
                      onKeyDown={(e) => handleBarKeyDown(e, idx)}
                    >
                      <span className={styles.barTrack}>
                        {val > 0 ? (
                          <span
                            className={`${styles.barFill} ${
                              perspective === "realized"
                                ? isSelected
                                  ? styles.barFillRealizedActive
                                  : styles.barFillRealizedIdle
                                : isSelected
                                  ? styles.barFillIntakeActive
                                  : styles.barFillIntakeIdle
                            }`}
                            style={{ height: `${heightPct}%` }}
                          />
                        ) : (
                          <span className={styles.barZeroTick} />
                        )}
                      </span>
                      <span
                        className={`${styles.xAxisLabel} ${
                          isSelected ? styles.xAxisLabelActive : ""
                        }`}
                      >
                        {item.month}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {spotlightItem && (
            <div
              className={`${styles.selectedIntervalStrip} ${
                perspective === "realized"
                  ? styles.selectedIntervalStripRealized
                  : styles.selectedIntervalStripIntake
              }`}
              aria-live="polite"
            >
              <div className={styles.selectedIntervalMeta}>
                <span
                  className={`${styles.selectedDot} ${
                    perspective === "realized"
                      ? styles.selectedDotRealized
                      : styles.selectedDotIntake
                  }`}
                  aria-hidden="true"
                />
                <span className={styles.selectedPeriodLabel}>
                  {spotlightItem.fullPeriod || spotlightItem.month}
                </span>
                <strong className={styles.selectedPeriodValue}>
                  {formatMetricValue(spotlightVal)}
                </strong>
              </div>

              {drilldownHref && (
                <Link href={drilldownHref} className={styles.stripActionLink}>
                  <span>View records</span>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </Link>
              )}
            </div>
          )}

          <details className={styles.breakdownDetails}>
            <summary className={styles.breakdownSummary}>View interval breakdown</summary>
            <div className={styles.breakdownTableWrap}>
              <table className={styles.breakdownTable}>
                <thead>
                  <tr>
                    <th scope="col">Interval</th>
                    <th scope="col">{financials ? "New Intake" : "New Leads"}</th>
                    <th scope="col">{financials ? "Converted Value" : "Converted Deals"}</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyData.map((row, idx) => (
                    <tr key={`${row.month}-row-${idx}`}>
                      <td>{row.fullPeriod || row.month}</td>
                      <td className={styles.numericCell}>
                        {financials
                          ? formatCrmCurrency(row.intake)
                          : String(row.intakeCount ?? 0)}
                      </td>
                      <td className={styles.numericCell}>
                        {financials
                          ? formatCrmCurrency(row.realized)
                          : String(row.realizedCount ?? 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </>
      )}
    </article>
  );
};
