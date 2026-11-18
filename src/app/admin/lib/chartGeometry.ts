/**
 * @file chartGeometry.ts
 * @description Coordinate math and SVG path geometry calculations for Marca Ubi CRM charts.
 *              Eliminates stalactite negative bars, provides clustered upward dual bars,
 *              watchmaker donut geometry with 148px inner clearance, and segmented progress models.
 * @module admin/lib/chartGeometry
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import { formatCompactInr } from "./currency";

export interface HaloBounds {
  top: number;
  bottom: number;
  height: number;
  width: number;
  x: number;
}

export interface BarPathResult {
  intakePath: string | null;
  expensePath: string | null;
  incomeH: number;
  expenseH: number;
}

export interface VelocityBarCluster {
  month: string;
  fullName: string;
  xCenter: number;
  intakeX: number;
  wonX: number;
  barWidth: number;
  intakeHeight: number;
  wonHeight: number;
  intakePath: string | null;
  wonPath: string | null;
  isSelected: boolean;
}

export interface ClusteredVelocityChartLayout {
  svgWidth: number;
  svgHeight: number;
  zeroY: number;
  chartRange: number;
  maxScale: number;
  clusters: VelocityBarCluster[];
  activeHalo: {
    x: number;
    y: number;
    width: number;
    height: number;
  } | null;
  clampedTooltipPercentX: number;
  arrowShiftPx: number;
  yTicks: Array<{ label: string; y: number; isZero: boolean }>;
}

export interface DonutSegmentGeometry {
  label: string;
  percentage: number;
  color: string;
  strokeDasharray: string;
  strokeDashoffset: number;
}

export interface DonutLayout {
  cx: number;
  cy: number;
  radius: number;
  strokeWidth: number;
  circumference: number;
  innerDiameter: number;
  segments: DonutSegmentGeometry[];
}

/**
 * Generates an upward-growing SVG path starting at flat baseline zeroY
 * with 3px rounded caps on top outer corners and flush 90-degree joints at baseline.
 */
export function generateUpwardBarPath(
  barX: number,
  barWidth: number,
  zeroY: number,
  height: number,
  maxRadius: number = 3,
): string | null {
  if (height <= 0) return null;

  const topY = zeroY - height;
  const r = Math.min(maxRadius, height / 2, barWidth / 2);

  return (
    `M ${barX} ${zeroY} ` +
    `L ${barX} ${topY + r} ` +
    `Q ${barX} ${topY} ${barX + r} ${topY} ` +
    `L ${barX + barWidth - r} ${topY} ` +
    `Q ${barX + barWidth} ${topY} ${barX + barWidth} ${topY + r} ` +
    `L ${barX + barWidth} ${zeroY} ` +
    `Z`
  );
}

/**
 * Legacy compatibility wrapper: Calculates SVG path strings for intake and won bars.
 * Enforces upward growth for both bars on flat baseline zeroY with 1:1 rupee parity.
 */
export function computeVelocityBarPaths(
  barX: number,
  barWidth: number,
  zeroY: number,
  income: number,
  expense: number,
  maxScale: number,
  chartRange: number,
): BarPathResult {
  const incomeH =
    income > 0 ? Math.max(3, Math.min(chartRange, (income / maxScale) * chartRange)) : 0;
  const expenseH =
    expense > 0 ? Math.max(3, Math.min(chartRange, (expense / maxScale) * chartRange)) : 0;

  const intakePath = generateUpwardBarPath(barX, barWidth, zeroY, incomeH);
  const expensePath = generateUpwardBarPath(barX, barWidth, zeroY, expenseH);

  return { intakePath, expensePath, incomeH, expenseH };
}

/**
 * Calculates dynamic content-bounded active halo rectangle dimensions.
 * Invariant: When expense is 0, haloBottom must stop exactly flush at zero baseline (zeroY).
 */
export function computeActiveHaloBounds(
  activeColCenter: number,
  barWidth: number,
  zeroY: number,
  activeIncome: number,
  activeExpense: number,
  maxScale: number,
  chartRange: number,
): HaloBounds {
  const activeIncomeH =
    activeIncome > 0
      ? Math.max(3, Math.min(chartRange, (activeIncome / maxScale) * chartRange))
      : 0;
  const activeExpenseH =
    activeExpense > 0
      ? Math.max(3, Math.min(chartRange, (activeExpense / maxScale) * chartRange))
      : 0;

  // Zero-height guard: Prevent ghost halo rectangle when values are 0
  if (activeIncomeH === 0 && activeExpenseH === 0) {
    return { top: zeroY, bottom: zeroY, height: 0, width: 0, x: activeColCenter };
  }

  const maxH = Math.max(activeIncomeH, activeExpenseH);
  const haloTop = zeroY - maxH - 8;
  const haloBottom = zeroY;
  const haloHeight = maxH + 8;
  const haloWidth = barWidth * 2 + 16;
  const haloX = activeColCenter - haloWidth / 2;

  return {
    top: haloTop,
    bottom: haloBottom,
    height: haloHeight,
    width: haloWidth,
    x: haloX,
  };
}

/**
 * Computes complete coordinate layout for the Clustered Dual-Bar Velocity Chart.
 * Invariant: Both Deal Intake and Won Contracts grow UPWARDS from flat baseline zeroY.
 */
export function computeVelocityChartLayout(
  data: Array<{ month: string; fullName: string; income: number; expense: number }>,
  selectedIndex: number,
  svgWidth: number = 720,
  svgHeight: number = 240,
): ClusteredVelocityChartLayout {
  const leftMargin = 55;
  const rightMargin = 20;
  const zeroY = 190;
  const topMargin = 25;
  const chartRange = zeroY - topMargin; // 165px
  const barWidth = 14;
  const clusterGap = 4;
  const clusterWidth = barWidth * 2 + clusterGap; // 32px

  const chartWidth = svgWidth - leftMargin - rightMargin;
  const count = Math.max(1, data.length);
  const colWidth = chartWidth / count;

  // Compute dynamic scale ceiling
  const rawMax = Math.max(
    ...data.map((d) => Math.max(d.income, d.expense)),
    100000,
  );
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawMax)));
  const maxScale = Math.ceil(rawMax / magnitude) * magnitude;

  const clusters: VelocityBarCluster[] = data.map((d, index) => {
    const xCenter = leftMargin + (index + 0.5) * colWidth;
    const clusterX = xCenter - clusterWidth / 2;
    const intakeX = clusterX;
    const wonX = clusterX + barWidth + clusterGap;

    const intakeH =
      d.income > 0 ? Math.max(3, Math.min(chartRange, (d.income / maxScale) * chartRange)) : 0;
    const wonH =
      d.expense > 0 ? Math.max(3, Math.min(chartRange, (d.expense / maxScale) * chartRange)) : 0;

    return {
      month: d.month,
      fullName: d.fullName,
      xCenter,
      intakeX,
      wonX,
      barWidth,
      intakeHeight: intakeH,
      wonHeight: wonH,
      intakePath: generateUpwardBarPath(intakeX, barWidth, zeroY, intakeH),
      wonPath: generateUpwardBarPath(wonX, barWidth, zeroY, wonH),
      isSelected: index === selectedIndex,
    };
  });

  // Active month capsule halo & popover coordinates
  const validIdx = Math.max(0, Math.min(clusters.length - 1, selectedIndex));
  const activeCluster = clusters[validIdx];

  let activeHalo = null;
  let clampedTooltipPercentX = 50;
  let arrowShiftPx = 0;

  if (activeCluster) {
    const maxBarH = Math.max(activeCluster.intakeHeight, activeCluster.wonHeight);
    const haloX = activeCluster.intakeX - 6;
    const haloWidth = clusterWidth + 12;
    const haloTop = maxBarH > 0 ? zeroY - maxBarH - 8 : zeroY - 8;
    const haloBottom = zeroY + 28;

    activeHalo = {
      x: haloX,
      y: haloTop,
      width: haloWidth,
      height: haloBottom - haloTop,
    };

    const rawPercentX = (activeCluster.xCenter / svgWidth) * 100;
    clampedTooltipPercentX = Math.max(12, Math.min(88, rawPercentX));
    arrowShiftPx = (rawPercentX - clampedTooltipPercentX) * (svgWidth / 100);
  }

  // Y-Axis Ticks
  const yTicks = [
    { label: formatCompactInr(maxScale), y: zeroY - chartRange, isZero: false },
    { label: formatCompactInr((maxScale * 2) / 3), y: zeroY - (chartRange * 2) / 3, isZero: false },
    { label: formatCompactInr(maxScale / 3), y: zeroY - chartRange / 3, isZero: false },
    { label: "0", y: zeroY, isZero: true },
  ];

  return {
    svgWidth,
    svgHeight,
    zeroY,
    chartRange,
    maxScale,
    clusters,
    activeHalo,
    clampedTooltipPercentX,
    arrowShiftPx,
    yTicks,
  };
}

/**
 * Computes precision Donut geometry for 220x220 coordinate space with watchmaker butt joints.
 */
export function computeDonutLayout(
  items: Array<{ label: string; percentage: number; color: string }>,
  radius: number = 80,
  strokeWidth: number = 14,
  gapPx: number = 3.0,
): DonutLayout {
  const cx = 110;
  const cy = 110;
  const circumference = 2 * Math.PI * radius;
  const innerDiameter = (radius - strokeWidth / 2) * 2; // 146px

  let accumulatedArcLength = 0;

  const segments: DonutSegmentGeometry[] = items
    .filter((item) => item.percentage > 0)
    .map((item) => {
      const arcLength = (item.percentage / 100) * circumference;
      const dashLength = Math.max(0, arcLength - gapPx);
      const strokeDasharray = `${dashLength} ${circumference - dashLength}`;
      const strokeDashoffset = -(accumulatedArcLength + gapPx / 2);

      accumulatedArcLength += arcLength;

      return {
        label: item.label,
        percentage: item.percentage,
        color: item.color,
        strokeDasharray,
        strokeDashoffset,
      };
    });

  return {
    cx,
    cy,
    radius,
    strokeWidth,
    circumference,
    innerDiameter,
    segments,
  };
}
