"use client";

import { useId, useState } from "react";
import { formatCrmCurrency } from "@/app/admin/lib/currency";
import styles from "./EarningOverviewSplineCard.module.scss";

export interface SplineMonthPoint {
  label: string;
  period: string;
  value: number;
}

export interface EarningOverviewSplineCardProps {
  totalValue: number | null;
  periodLabel: string;
  points: readonly SplineMonthPoint[];
  financials: boolean;
}

const PLOT_WIDTH = 500;
const PLOT_HEIGHT = 140;
const BASELINE = 126;
const PLOT_RANGE = 108;

/** Plot converted contract value from the same persisted buckets used by the dashboard period. */
export function EarningOverviewSplineCard({
  totalValue,
  periodLabel,
  points,
  financials,
}: EarningOverviewSplineCardProps) {
  const gradientId = useId();
  const [selectedPeriod, setSelectedPeriod] = useState<string | null>(null);

  const available = financials && totalValue !== null;
  const visiblePoints = available ? points : [];
  const selected = visiblePoints.findIndex((point) => point.period === selectedPeriod);
  const activeIndex = selected >= 0 ? selected : visiblePoints.length - 1;
  const scaleMax = Math.max(...visiblePoints.map(({ value }) => value), 0) || 1;
  const columnWidth = PLOT_WIDTH / Math.max(visiblePoints.length, 1);

  // Bucket centers are shared by the SVG and equal-width HTML buttons.
  const coordinates = visiblePoints.map(({ value }, index) => ({
    x: (index + 0.5) * columnWidth,
    y: BASELINE - (value / scaleMax) * PLOT_RANGE,
  }));
  const active = coordinates[activeIndex];
  const activePoint = visiblePoints[activeIndex];
  const first = coordinates[0];
  const last = coordinates.at(-1);
  const segments = coordinates.slice(1).map((point, index) => {
    const previous = coordinates[index];
    const midpoint = (previous.x + point.x) / 2;
    return `C ${midpoint} ${previous.y}, ${midpoint} ${point.y}, ${point.x} ${point.y}`;
  });
  const line = first ? `M ${first.x} ${first.y} ${segments.join(" ")}` : "";
  const area = first && last && segments.length
    ? `${line} L ${last.x} ${BASELINE} L ${first.x} ${BASELINE} Z`
    : null;

  return (
    <article className={styles.cardContainer} aria-labelledby={`${gradientId}-title`}>
      <header className={styles.cardHeader}>
        <h2 id={`${gradientId}-title`} className={styles.title}>Converted contract value</h2>
        <span className={styles.periodLabel}>{periodLabel}</span>
      </header>
      <div className={styles.heroRow}>
        <span className={styles.heroValuation}>
          {available ? formatCrmCurrency(totalValue) : financials ? "Unavailable" : "Confidential"}
        </span>
      </div>

      {active && activePoint ? (
        <div className={styles.chartContainer}>
          <p className={styles.pointReadout}>
            {activePoint.period} <strong>{formatCrmCurrency(activePoint.value)}</strong>
          </p>
          <svg
            className={styles.splineSvg}
            viewBox={`0 0 ${PLOT_WIDTH} ${PLOT_HEIGHT}`}
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ea002a" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#ea002a" stopOpacity="0" />
              </linearGradient>
            </defs>
            {area && <path d={area} fill={`url(#${gradientId})`} />}
            <path d={line} fill="none" stroke="#bb0022" strokeWidth="2" vectorEffect="non-scaling-stroke" />
            <line
              x1={active.x}
              x2={active.x}
              y1={active.y}
              y2={BASELINE}
              stroke="#bb0022"
              strokeDasharray="3 3"
              vectorEffect="non-scaling-stroke"
            />
            <circle cx={active.x} cy={active.y} r="4" fill="#bb0022" />
            {visiblePoints.map((point, index) => (
              <rect
                key={point.period}
                x={index * columnWidth}
                y={0}
                width={columnWidth}
                height={PLOT_HEIGHT}
                fill="transparent"
                onMouseEnter={() => setSelectedPeriod(point.period)}
                onClick={() => setSelectedPeriod(point.period)}
              />
            ))}
          </svg>
          <label className={styles.compactPicker}>
            Chart interval
            <select
              value={activePoint.period}
              onChange={(event) => setSelectedPeriod(event.target.value)}
            >
              {visiblePoints.map((point) => (
                <option key={point.period} value={point.period}>{point.period}</option>
              ))}
            </select>
          </label>
          <div
            className={styles.monthLabelsRow}
            style={{ gridTemplateColumns: `repeat(${visiblePoints.length}, minmax(0, 1fr))` }}
          >
            {visiblePoints.map((point, index) => (
              <button
                key={point.period}
                type="button"
                className={styles.monthLabel}
                aria-pressed={index === activeIndex}
                aria-label={`${point.period}, ${formatCrmCurrency(point.value)}`}
                onClick={() => setSelectedPeriod(point.period)}
              >
                {point.label}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <p className={styles.emptyState}>
          {available
            ? "No converted contract value recorded for this period."
            : financials
              ? "Conversion data could not be loaded."
              : "Financial details are restricted."}
        </p>
      )}
    </article>
  );
}
