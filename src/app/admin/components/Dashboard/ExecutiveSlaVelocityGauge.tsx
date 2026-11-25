"use client";

/**
 * @file ExecutiveSlaVelocityGauge.tsx
 * @description Master Executive SLA Velocity & Milestone Delivery Gauge for Marca Ubi CRM.
 *              Harmonizes Tier 3 of the Commercial Cockpit by pairing with UpcomingSlaCard
 *              to eradicate the 360px vertical desert in .cockpitRightColumn.
 *              
 *              Architectural Invariants & Engineering Rationale:
 *              - Renders a calibrated 220° SVG radial open-arc gauge using precision clockwise
 *                polar-to-cartesian trigonometry with sweepFlag = 1.
 *              - Terminates progress with a dynamic luminous jewel pip at the active angle;
 *                anchored securely at -110° baseline when completion is 0.0% to prevent degenerate paths.
 *              - Perimeter micro-cadence notches (9 ticks) remain strictly tangential to the track outer
 *                radius (radii 72px to 76px vs track outer 68.5px), guaranteeing zero intersecting lines.
 *              - Implements a deterministic 3-tier turnaround telemetry resolver to eliminate cognitive
 *                inversion (overdue delivery delays render strictly in crimson with downward chevron).
 *              - Unboxed tabular metrics matrix strictly adheres to anti-bento-inception commandments.
 *              - Action affordance provides a WCAG 2.1 AA/AAA compliant 44px minimum touch target.
 * 
 * @module admin/components/Dashboard/ExecutiveSlaVelocityGauge
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import React, { useId, useMemo } from "react";
import { useRouter } from "next/navigation";
import { formatCrmCurrency } from "@/app/admin/lib/currency";
import type { OverviewRecord } from "./OverviewWorkspace";
import styles from "./ExecutiveSlaVelocityGauge.module.scss";

export interface ExecutiveSlaVelocityGaugeProps {
  /** Array of active RLS-filtered CRM pipeline records */
  records?: OverviewRecord[];
  /** Whether the active user role possesses financial ledger permissions */
  financials?: boolean;
  /** Navigation or drawer callback for record inspection */
  onOpenRecord?: (record: OverviewRecord) => void;
}

export type TurnaroundStatusCategory = "ahead" | "delayed" | "on_target";

export interface TurnaroundDeltaTelemetry {
  readonly rawDays: number;
  readonly category: TurnaroundStatusCategory;
  readonly formattedLabel: string;
}

export interface SlaVelocityMetrics {
  totalMilestones: number;
  onTimeCount: number;
  overdueCount: number;
  dueTodayCount: number;
  onTimePercentage: number;
  averageTurnaroundDeltaDays: number;
  turnaround: TurnaroundDeltaTelemetry;
  totalCommittedValue: number;
  nextCriticalRecord: OverviewRecord | null;
}

interface SlaStatusTheme {
  startColor: string;
  endColor: string;
  pipColor: string;
}

/**
 * Resolves chromatic status tokens based on on-time delivery percentage and critical breach counts.
 * Implements Marca Ubi Editorial Metallic Alloy color standards.
 */
function getSlaStatusTheme(percentage: number, overdueCount: number): SlaStatusTheme {
  if (overdueCount > 0 || percentage < 75) {
    return {
      startColor: "#1e293b",
      endColor: "#ea002a",
      pipColor: "#ea002a",
    };
  }
  if (percentage < 90) {
    return {
      startColor: "#454542",
      endColor: "#d97706",
      pipColor: "#d97706",
    };
  }
  return {
    startColor: "#046c4e",
    endColor: "#10b981",
    pipColor: "#10b981",
  };
}

/**
 * Resolves raw average turnaround delta in days into deterministic operational telemetry.
 * 
 * Business Invariants:
 * - Ahead (> +0.05d): Milestone delivery pace exceeds schedule; rendered with emerald tokens and upward chevron.
 * - Delayed (< -0.05d): Overdue delivery deficit; rendered with absolute day count, crimson tokens, and downward chevron.
 * - On Target (-0.05d to +0.05d): Exactly in spec; rendered with slate tokens and level dash.
 */
function resolveTurnaroundTelemetry(deltaDays: number): TurnaroundDeltaTelemetry {
  if (deltaDays > 0.05) {
    const formattedVal = deltaDays >= 10 ? deltaDays.toFixed(0) : deltaDays.toFixed(1);
    return {
      rawDays: deltaDays,
      category: "ahead",
      formattedLabel: `+${formattedVal}d vs Target SLA`,
    };
  }
  if (deltaDays < -0.05) {
    const absDays = Math.abs(deltaDays);
    const formattedVal = absDays.toFixed(0);
    return {
      rawDays: deltaDays,
      category: "delayed",
      formattedLabel: `${formattedVal}d Overdue vs SLA`,
    };
  }
  return {
    rawDays: deltaDays,
    category: "on_target",
    formattedLabel: "On Target SLA",
  };
}

/**
 * Polar to Cartesian coordinate converter for SVG horological arcs.
 * Measures angles clockwise with 0° oriented at 12 o'clock.
 */
function polarToCartesian(
  centerX: number,
  centerY: number,
  radius: number,
  angleInDegrees: number
): { x: number; y: number } {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
  return {
    x: Math.round((centerX + radius * Math.cos(angleInRadians)) * 100) / 100,
    y: Math.round((centerY + radius * Math.sin(angleInRadians)) * 100) / 100,
  };
}

/**
 * Computes an SVG Path d-string for a circular arc swept clockwise between two angles.
 * Uses sweepFlag = 1 for natural clockwise horology dial progression.
 * Returns an empty string when endAngle <= startAngle to prevent degenerate browser path blips.
 */
function describeClockwiseArc(
  x: number,
  y: number,
  radius: number,
  startAngle: number,
  endAngle: number
): string {
  if (endAngle <= startAngle) {
    return "";
  }
  const start = polarToCartesian(x, y, radius, startAngle);
  const end = polarToCartesian(x, y, radius, endAngle);
  const angleDelta = endAngle - startAngle;
  const largeArcFlag = angleDelta > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`;
}

export const ExecutiveSlaVelocityGauge: React.FC<ExecutiveSlaVelocityGaugeProps> = ({
  records,
  financials = true,
  onOpenRecord,
}) => {
  const router = useRouter();
  const gradientId = useId();

  // Aggregate metrics calculation with honest empty states when no milestones exist
  const metrics: SlaVelocityMetrics = useMemo(() => {
    if (!records || records.length === 0) {
      return {
        totalMilestones: 0,
        onTimeCount: 0,
        overdueCount: 0,
        dueTodayCount: 0,
        onTimePercentage: 0,
        averageTurnaroundDeltaDays: 0,
        turnaround: resolveTurnaroundTelemetry(0),
        totalCommittedValue: 0,
        nextCriticalRecord: null,
      };
    }

    const now = Date.now();
    const startOfToday = new Date().setHours(0, 0, 0, 0);
    const endOfToday = new Date().setHours(23, 59, 59, 999);

    let overdue = 0;
    let dueToday = 0;
    let onTime = 0;
    let totalCommitted = 0;
    let totalDaysDelta = 0;
    let recordsWithValidDue = 0;

    // Filter candidate records: terminal states (converted or lost) do not require milestone escalation
    const activeCandidates = records.filter(
      (rec) => rec.stageBucket !== "converted" && rec.stageBucket !== "lost"
    );

    const sortedByUrgency = [...activeCandidates].sort((a, b) => {
      const timeA = a.due ? new Date(a.due).getTime() : Infinity;
      const timeB = b.due ? new Date(b.due).getTime() : Infinity;
      return timeA - timeB;
    });

    records.forEach((rec) => {
      if (rec.stageBucket !== "lost") {
        totalCommitted += rec.expectedValue ?? 0;
      }

      if (rec.due) {
        const dueDate = new Date(rec.due).getTime();
        if (!isNaN(dueDate)) {
          recordsWithValidDue++;
          const deltaDays = (dueDate - now) / (1000 * 60 * 60 * 24);
          totalDaysDelta += deltaDays;

          if (dueDate < now && rec.stageBucket !== "converted") {
            overdue++;
          } else if (dueDate >= startOfToday && dueDate <= endOfToday) {
            dueToday++;
            onTime++;
          } else {
            onTime++;
          }
        }
      }
    });

    const calculatedPercentage =
      recordsWithValidDue > 0
        ? Math.min(100, Math.max(0, ((recordsWithValidDue - overdue) / recordsWithValidDue) * 100))
        : 0;

    const avgDelta =
      recordsWithValidDue > 0
        ? Math.round((totalDaysDelta / recordsWithValidDue) * 10) / 10
        : 0;

    return {
      totalMilestones: records.length,
      onTimeCount: onTime,
      overdueCount: overdue,
      dueTodayCount: dueToday,
      onTimePercentage: calculatedPercentage,
      averageTurnaroundDeltaDays: avgDelta,
      turnaround: resolveTurnaroundTelemetry(avgDelta),
      totalCommittedValue: totalCommitted,
      nextCriticalRecord: sortedByUrgency[0] || null,
    };
  }, [records]);

  // Swiss Horology Gauge Geometry: 220° open arc, radius 64, center (100, 84), stroke 9
  const arcRadius = 64;
  const centerX = 100;
  const centerY = 84;
  const startAngle = -110;
  const totalArcSpan = 220;

  // Clamped progress percentage mapped to clockwise angular sweep
  const clampedPercentage = Math.min(100, Math.max(0, metrics.onTimePercentage));
  const activeSweepAngle = startAngle + (clampedPercentage / 100) * totalArcSpan;

  // Memoized paths and status styling
  const bgTrackPath = useMemo(
    () => describeClockwiseArc(centerX, centerY, arcRadius, startAngle, startAngle + totalArcSpan),
    [centerX, centerY, arcRadius, startAngle, totalArcSpan]
  );

  const activeMeterPath = useMemo(
    () => (clampedPercentage > 0 ? describeClockwiseArc(centerX, centerY, arcRadius, startAngle, activeSweepAngle) : ""),
    [centerX, centerY, arcRadius, startAngle, activeSweepAngle, clampedPercentage]
  );

  const terminalPipCoords = useMemo(
    () => polarToCartesian(centerX, centerY, arcRadius, activeSweepAngle),
    [centerX, centerY, arcRadius, activeSweepAngle]
  );

  const statusTheme = useMemo(
    () => getSlaStatusTheme(metrics.onTimePercentage, metrics.overdueCount),
    [metrics.onTimePercentage, metrics.overdueCount]
  );

  // 9 perimeter micro-notches positioned tangentially outside track (radii 72px to 76px)
  const perimeterNotches = useMemo(() => {
    const ticks: Array<{ inner: { x: number; y: number }; outer: { x: number; y: number }; isKey: boolean }> = [];
    const notchStep = totalArcSpan / 8; // 8 segments produce 9 distinct ticks across 220°
    for (let i = 0; i <= 8; i++) {
      const angle = startAngle + i * notchStep;
      const isKey = i === 0 || i === 4 || i === 8;
      ticks.push({
        inner: polarToCartesian(centerX, centerY, 72, angle),
        outer: polarToCartesian(centerX, centerY, 76, angle),
        isKey,
      });
    }
    return ticks;
  }, [centerX, centerY, startAngle, totalArcSpan]);

  const handleActionClick = () => {
    if (metrics.nextCriticalRecord && onOpenRecord) {
      onOpenRecord(metrics.nextCriticalRecord);
    }
  };

  const actionButtonText = metrics.nextCriticalRecord
    ? metrics.overdueCount > 0
      ? `Review Urgent: ${metrics.nextCriticalRecord.name}`
      : `Review Next: ${metrics.nextCriticalRecord.name}`
    : "All Milestones In Spec";

  return (
    <article
      className={styles.gaugeCard}
      aria-label="Executive SLA Velocity and Milestone Delivery Health"
    >
      <header className={styles.header}>
        <div className={styles.titleGroup}>
          <h2 className={styles.title}>SLA Velocity & Delivery Health</h2>
          <p className={styles.subtitle}>
            Live Milestone Cadence • {metrics.totalMilestones} Monitored
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            router.push(
              metrics.overdueCount > 0 ? "/admin/tasks?queue=overdue" : "/admin/tasks"
            )
          }
          className={
            metrics.overdueCount > 0
              ? styles.alertBadge
              : metrics.onTimePercentage < 90
              ? styles.cautionBadge
              : styles.healthyBadge
          }
          title={metrics.overdueCount > 0 ? "Requires Executive Action" : "Commitments On Target"}
          aria-label={metrics.overdueCount > 0 ? "View overdue tasks" : "View all tasks"}
        >
          {metrics.totalMilestones === 0
            ? "No Active Commitments"
            : metrics.overdueCount > 0
            ? `${metrics.overdueCount} Critical Overdue`
            : metrics.onTimePercentage < 90
            ? "Cadence Caution"
            : "Cadence Optimal"}
        </button>
      </header>

      {/* 220° Clockwise Radial Horology Instrument Gauge */}
      <div
        className={styles.gaugeStage}
        role="button"
        tabIndex={0}
        onClick={() => router.push("/admin/analytics")}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            router.push("/admin/analytics");
          }
        }}
        title="View SLA Delivery Analytics"
        aria-label="SLA delivery gauge, click to view analytics"
      >
        <svg
          viewBox="0 0 200 120"
          className={styles.gaugeSvg}
          role="img"
          aria-label={`SLA velocity gauge indicating ${metrics.onTimePercentage.toFixed(1)}% on-time completion`}
        >
          <defs>
            <linearGradient id={`sla-metallic-${gradientId}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={statusTheme.startColor} />
              <stop offset="100%" stopColor={statusTheme.endColor} />
            </linearGradient>
            <filter id={`sla-pip-shadow-${gradientId}`} x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor="#111111" floodOpacity="0.22" />
            </filter>
          </defs>

          {/* Background Inactive Arc Track */}
          <path
            d={bgTrackPath}
            fill="none"
            stroke="#efefed"
            strokeWidth="9"
            strokeLinecap="round"
          />

          {/* Active Metallic Progress Arc (Gracefully omitted at exact 0.0%) */}
          {activeMeterPath ? (
            <path
              d={activeMeterPath}
              fill="none"
              stroke={`url(#sla-metallic-${gradientId})`}
              strokeWidth="9"
              strokeLinecap="round"
            />
          ) : null}

          {/* Perimeter Micro-Notches: strictly outside the stroke rail */}
          {perimeterNotches.map((tick, idx) => (
            <line
              key={idx}
              x1={tick.inner.x}
              y1={tick.inner.y}
              x2={tick.outer.x}
              y2={tick.outer.y}
              stroke={tick.isKey ? "rgba(17, 17, 17, 0.28)" : "rgba(17, 17, 17, 0.12)"}
              strokeWidth="1"
              strokeLinecap="round"
            />
          ))}

          {/* Dynamic Luminous Jewel Pip: rests at -110° baseline when at 0.0% */}
          <circle
            cx={terminalPipCoords.x}
            cy={terminalPipCoords.y}
            r="5.5"
            fill="#ffffff"
            filter={`url(#sla-pip-shadow-${gradientId})`}
          />
          <circle
            cx={terminalPipCoords.x}
            cy={terminalPipCoords.y}
            r="2.5"
            fill={statusTheme.pipColor}
          />
        </svg>

        {/* Center Readout Telemetry */}
        <div className={styles.centerTelemetry}>
          <span className={styles.metricValue}>
            {metrics.totalMilestones === 0 ? "—" : metrics.onTimePercentage.toFixed(1)}
            {metrics.totalMilestones > 0 && <span className={styles.percentSymbol}>%</span>}
          </span>
          <span className={styles.metricLabel}>
            {metrics.totalMilestones === 0 ? "NO SLA COMMITMENTS" : "ON-TIME COMMITMENT"}
          </span>
          <span
            className={`${styles.turnaroundDelta} ${
              metrics.turnaround.category === "ahead"
                ? styles.deltaAhead
                : metrics.turnaround.category === "delayed"
                ? styles.deltaDelayed
                : styles.deltaOnTarget
            }`}
          >
            {metrics.turnaround.category === "ahead" ? (
              <svg
                className={styles.deltaIcon}
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <polyline points="18 15 12 9 6 15" />
              </svg>
            ) : metrics.turnaround.category === "delayed" ? (
              <svg
                className={styles.deltaIcon}
                width="10"
                height="10"
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
            ) : (
              <svg
                className={styles.deltaIcon}
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            )}
            {metrics.turnaround.formattedLabel}
          </span>
        </div>
      </div>

      {/* Borderless Tabular Telemetry Matrix (Commandment 1: Anti-Bento Inception) */}
      <div className={styles.metricsStrip}>
        <button
          type="button"
          className={styles.metricCellBtn}
          onClick={() => router.push("/admin/tasks")}
          aria-label="View active scope in tasks"
        >
          <span className={styles.cellLabel}>Active Scope</span>
          <span className={styles.cellVal}>{metrics.totalMilestones} Milestones</span>
        </button>
        <div className={styles.metricDivider} aria-hidden="true" />
        <div className={styles.metricCell}>
          <span className={styles.cellLabel}>Committed Value</span>
          <span className={styles.cellVal}>
            {financials ? formatCrmCurrency(metrics.totalCommittedValue) : "Confidential"}
          </span>
        </div>
        <div className={styles.metricDivider} aria-hidden="true" />
        <button
          type="button"
          className={styles.metricCellBtn}
          onClick={() => router.push("/admin/tasks?queue=overdue")}
          aria-label="View critical overdue tasks"
        >
          <span className={styles.cellLabel}>Critical Overdue</span>
          <span
            className={metrics.overdueCount > 0 ? styles.cellValAlert : styles.cellValHealthy}
          >
            {metrics.overdueCount} Items
          </span>
        </button>
      </div>

      {/* Interactive Milestone Dispatch CTA */}
      <footer className={styles.footerRow}>
        {metrics.nextCriticalRecord ? (
          <button
            type="button"
            onClick={handleActionClick}
            className={`${styles.dispatchBtn} ${
              metrics.overdueCount > 0 ? styles.dispatchBtnUrgent : ""
            }`.trim()}
            aria-label={`Review milestone: ${metrics.nextCriticalRecord.name}`}
          >
            <span>{actionButtonText}</span>
            <svg
              className={styles.btnChevron}
              width="14"
              height="14"
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
          </button>
        ) : (
          <button
            type="button"
            onClick={() => router.push("/admin/analytics")}
            className={styles.dispatchBtn}
            aria-label="Review SLA Delivery Log in analytics"
          >
            <span>Review SLA Delivery Log ↗</span>
            <svg
              className={styles.btnChevron}
              width="14"
              height="14"
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
          </button>
        )}
      </footer>
    </article>
  );
};
