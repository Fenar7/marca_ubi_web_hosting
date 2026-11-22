import { formatCrmCurrency } from "@/app/admin/lib/currency";
import { TIMEFRAME_SLUG_LABELS, type TimeframeSlug } from "@/app/admin/lib/timeframeUtils";
import type { OverviewData } from "./OverviewWorkspace";
import styles from "./ExecutiveTelemetryMasthead.module.scss";

export interface ExecutiveTelemetryMastheadProps {
  data: OverviewData;
  pending: boolean;
  onTimeframeChange: (slug: TimeframeSlug) => void;
  onExportSummary: () => void;
}

/** Scope labels distinguish live inventory from conversions inside the selected UTC period. */
export function ExecutiveTelemetryMasthead({ data, pending, onTimeframeChange, onExportSummary }: ExecutiveTelemetryMastheadProps) {
  const { financials, pipelineCount, convertedCount, weightedPotential, averageCycleDays } = data;
  const missing = "Unavailable";
  const money = (value: number | null) => value === null ? missing : formatCrmCurrency(value);
  const inventory = pipelineCount === null ? "Current snapshot" : `${pipelineCount} open ${pipelineCount === 1 ? "opportunity" : "opportunities"}`;
  const period = data.periodLabel.toLowerCase();
  const metrics = [
    { name: financials ? "Open pipeline" : "Open opportunities", value: financials ? money(data.pipelineValue) : pipelineCount ?? missing, scope: financials ? inventory + " · now" : "Current snapshot" },
    ...(financials ? [{ name: "Weighted pipeline", value: money(weightedPotential), scope: "Potential stages · now" }] : []),
    { name: financials ? "Won deal value" : "Deals won", value: financials ? money(data.convertedValue) : convertedCount ?? missing, scope: convertedCount === null || !financials ? period : `${convertedCount} won · ${period}` },
    { name: "Average time to win", value: averageCycleDays === null ? (convertedCount === 0 ? "No wins" : missing) : `${averageCycleDays.toLocaleString("en-IN", { maximumFractionDigits: 1 })} days`, scope: period },
  ];
  const updatedAt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "UTC" }).format(new Date(data.generatedAt));

  return <header className={styles.masthead}>
    <div className={styles.heading}>
      <div><h1>Commercial overview</h1><p>Updated <time dateTime={data.generatedAt}>{updatedAt} UTC</time></p></div>
      <div className={styles.actions}>
        <label className={styles.period}><span>Reporting period</span><select value={data.timeframe} disabled={pending} onChange={event => onTimeframeChange(event.target.value as TimeframeSlug)}>
          {Object.entries(TIMEFRAME_SLUG_LABELS).map(([slug, option]) => <option key={slug} value={slug}>{option.label}</option>)}
        </select></label>
        {data.canExport && <button type="button" onClick={onExportSummary} disabled={pending || !data.pipelineReady || !data.outcomesReady}><svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M12 3v12m-5-5 5 5 5-5M4 16v4h16v-4"/></svg>Export CSV</button>}
      </div>
    </div>
    <dl className={styles.metrics}>{metrics.map(metric => <div key={metric.name}><dt>{metric.name}</dt><dd data-missing={metric.value === missing || metric.value === "No wins"}>{metric.value}</dd><dd className={styles.scope}>{metric.scope}</dd></div>)}</dl>
  </header>;
}
