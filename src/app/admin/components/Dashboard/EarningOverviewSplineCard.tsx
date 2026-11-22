import { useState } from "react";
import { formatCrmCurrency } from "@/app/admin/lib/currency";
import type { DynamicRevenueSplinePoint } from "@/app/admin/lib/timeframeUtils";
import styles from "./EarningOverviewSplineCard.module.scss";

export type SplineMonthPoint = DynamicRevenueSplinePoint;
export interface EarningOverviewSplineCardProps {
  points: SplineMonthPoint[];
  count: number | null;
  value: number | null;
  financials: boolean;
  periodLabel: string;
  delta: number | null;
}

/** A plotted zero represents a complete measured interval. Missing valuations suppress the monetary series. */
export function EarningOverviewSplineCard({ points, count, value, financials, periodLabel, delta }: EarningOverviewSplineCardProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const active = selected === null ? null : points[selected];
  const max = Math.max(0, ...points.map(point => point.cashVal));
  const available = count !== null && (!financials || value !== null);
  const unit = financials ? "Won deal value" : "Deals won";
  const label = (n: number) => financials ? formatCrmCurrency(n) : `${n} ${n === 1 ? "deal" : "deals"}`;
  return <section className={styles.panel} aria-label="Won deals over time">
    <header><div><h2>Won deals over time</h2><p>{periodLabel} · UTC</p></div>
      {financials && delta !== null && <span className={styles.delta}>{delta > 0 ? "+" : ""}{delta}% vs previous period</span>}
    </header>
    {!available ? <p className={styles.empty}>{unit} unavailable for this period.</p>
      : count === 0 ? <p className={styles.empty}>No deals were won in this period.</p>
      : <><div className={styles.readout} aria-live="polite"><strong>{label(active?.cashVal ?? (financials ? value! : count!))}</strong><span>{active?.fullPeriod ?? periodLabel}</span></div>
        <div className={styles.chart} aria-label={unit + " by interval"}>
          {points.map((point, i) => <button key={point.fullPeriod} type="button" aria-pressed={selected === i} aria-label={point.fullPeriod + ", " + label(point.cashVal)} onClick={() => setSelected(selected === i ? null : i)} title={point.fullPeriod + " · " + label(point.cashVal)}>
            <span className={styles.track}><span className={styles.bar} style={{height: (max ? 100 * point.cashVal / max : 0) + "%"}} /></span>
            <span className={styles.tick}>{point.month}</span></button>)}
        </div>
        {max === 0 && <p>All recorded won deal values are zero.</p>}
      </>}
  </section>;
}
