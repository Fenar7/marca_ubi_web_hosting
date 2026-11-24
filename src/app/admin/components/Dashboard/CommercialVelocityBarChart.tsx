"use client";

import { useId, useState, type CSSProperties } from "react";
import { formatCrmCurrency } from "@/app/admin/lib/currency";
import type { DynamicRevenueSplinePoint } from "@/app/admin/lib/timeframeUtils";
import styles from "./CommercialVelocityBarChart.module.scss";

export interface MonthlyBarData {
  month: string;
  intake: number;
  realized: number;
  fullPeriod?: string;
}

export interface CommercialVelocityBarChartProps {
  chart?: DynamicRevenueSplinePoint[];
  periodLabel?: string;
  financials?: boolean;
  intakeReady?: boolean;
  revenueReady?: boolean;
}

export type CashFlowPerspective = "intake" | "realized" | "net";

const PERSPECTIVES = [
  { id: "intake", label: "Active pipeline added" },
  { id: "realized", label: "Converted value" },
  { id: "net", label: "Net delta" },
] as const;

/** Measure intake minus converted value in whole paise to avoid rounding drift across buckets. */
function bucketPaise(point: DynamicRevenueSplinePoint, perspective: CashFlowPerspective): number | null {
  const intake = point.intakeVal === undefined ? NaN : Math.round(point.intakeVal * 100);
  const converted = Math.round(point.cashVal * 100);

  if (perspective === "intake") return Number.isSafeInteger(intake) ? intake : null;
  if (perspective === "realized") return Number.isSafeInteger(converted) ? converted : null;

  const delta = intake - converted;
  return Number.isSafeInteger(intake) && Number.isSafeInteger(converted) && Number.isSafeInteger(delta) ? delta : null;
}

interface Bucket {
  point: DynamicRevenueSplinePoint;
  amount: number;
}

/** Keep every bucket interactive, even when the narrow layout omits its visible date label. */
function CashFlowPlot({
  points,
}: {
  points: Bucket[];
}) {
  const [selection, setSelection] = useState<number | null>(null);
  const index = selection !== null && points[selection] ? selection : Math.max(0, points.findIndex(({ amount }) => amount !== 0));
  const selected = points[index];
  const ceiling = Math.max(0, ...points.map(({ amount }) => amount));
  const floor = Math.min(0, ...points.map(({ amount }) => amount));
  const spread = ceiling - floor || 1;
  const zeroOffset = (ceiling / spread) * 100;
  const compactStride = Math.max(1, Math.ceil((points.length - 1) / 2));
  const columns = { "--bucket-count": points.length, "--zero-offset": `${zeroOffset}%` } as CSSProperties;

  return (
    <div className={styles.chartBody}>
      <div className={styles.readout}>
        <select
          className={styles.intervalSelect}
          aria-label="Inspect reporting interval"
          value={index}
          onChange={(event) => setSelection(Number(event.currentTarget.value))}
        >
          {points.map(({ point }, pointIndex) => (
            <option key={pointIndex} value={pointIndex}>{point.fullPeriod || point.month}</option>
          ))}
        </select>
        <p className={styles.readoutValue} aria-live="polite">
          <span className={styles.readoutPeriod}>{selected.point.fullPeriod || selected.point.month}</span>
          <strong>{formatCrmCurrency(selected.amount / 100)}</strong>
        </p>
      </div>
      <div className={styles.plot} style={columns}>
        <div className={styles.axis} aria-hidden="true">
          <span className={styles.axisTop}>{formatCrmCurrency(ceiling / 100)}</span>
          <span className={styles.axisBottom}>{formatCrmCurrency(floor / 100)}</span>
        </div>
        <div className={styles.bucketGrid} role="group" aria-label="Reporting intervals">
          {points.map(({ point, amount }, bucketIndex) => {
            const active = index === bucketIndex;
            const inspect = () => setSelection(bucketIndex);
            const barStyle: CSSProperties = {
              height: `${(Math.abs(amount) / spread) * 100}%`,
              top: `${zeroOffset - Math.max(0, (amount / spread) * 100)}%`,
            };

            return (
              <div className={styles.bucket} key={`${point.fullPeriod}-${bucketIndex}`}>
                <button
                  type="button"
                  className={styles.bucketButton}
                  aria-label={`${point.fullPeriod || point.month}, ${formatCrmCurrency(amount / 100)}`}
                  aria-pressed={active}
                  onMouseEnter={inspect}
                  onFocus={inspect}
                  onClick={inspect}
                >
                  {amount !== 0 && <span className={styles.bar} style={barStyle} aria-hidden="true" />}
                </button>
                <span
                  className={styles.bucketLabel}
                  data-compact={bucketIndex % compactStride === 0 || bucketIndex === points.length - 1}
                  aria-hidden="true"
                >
                  {point.month}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/** Headline value, chart, and selected interval use the same role-gated period buckets. */
export function CommercialVelocityBarChart({
  chart = [],
  periodLabel,
  financials = true,
  intakeReady = true,
  revenueReady = true,
}: CommercialVelocityBarChartProps) {
  const titleId = useId();
  const [perspective, setPerspective] = useState<CashFlowPerspective>("intake");
  const sourceReady = perspective === "intake" ? intakeReady : perspective === "realized" ? revenueReady : intakeReady && revenueReady;
  const points = financials && sourceReady ? chart.map((point) => ({ point, amount: bucketPaise(point, perspective) })) : [];
  const buckets = points.filter((bucket): bucket is Bucket => bucket.amount !== null);
  const total = buckets.reduce((amount, bucket) => amount + bucket.amount, 0);
  const ready = sourceReady && buckets.length > 0 && buckets.length === points.length && Number.isSafeInteger(total);
  const hasActivity = ready && buckets.some(({ amount }) => amount !== 0);

  return (
    <article className={styles.cardContainer} aria-labelledby={titleId}>
      <header className={styles.chartHeader}>
        <div>
          <h2 className={styles.title} id={titleId}>Pipeline and conversions</h2>
          <p className={styles.heroValuation}>
            {!financials ? "Confidential" : ready ? formatCrmCurrency(total / 100) : "Unavailable"}
          </p>
        </div>
        {periodLabel && <span className={styles.periodLabel}>{periodLabel}</span>}
      </header>

      {financials && (
        <>
          <div className={styles.segmentedControls} role="group" aria-label="Pipeline and conversion measures">
            {PERSPECTIVES.map(({ id, label }) => (
              <button
                type="button"
                className={styles.segmentedPill}
                key={id}
                aria-pressed={perspective === id}
                onClick={() => setPerspective(id)}
              >
                {label}
              </button>
            ))}
          </div>
          {perspective === "net" && <p className={styles.measureNote}>Active pipeline added minus converted value</p>}
          {hasActivity ? (
            <CashFlowPlot key={`${periodLabel}-${perspective}`} points={buckets} />
          ) : (
            <p className={styles.emptyState}>
              {ready ? "No value recorded for this measure in the selected period." : "Reporting data is unavailable for the selected measure."}
            </p>
          )}
        </>
      )}
    </article>
  );
}
