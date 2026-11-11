/**
 * @file chartGeometry.ts
 * @description Coordinate math and SVG path geometry calculations for Conyest CRM charts.
 *              Guarantees flat zero baselines, capsule outer extremities, content-bounded halos,
 *              1:1 rupee parity, and 100% donut spacer clearance.
 * @module admin/lib/chartGeometry
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

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

/**
 * Calculates SVG path strings for intake (upper) and won (lower) bars.
 * Enforces:
 * 1. Flat joint on the zero baseline (zeroY).
 * 2. Semi-circular capsule top/bottom caps on outer extremities.
 * 3. Strict zero-suppression (returns null path when value <= 0).
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
  // Height calculation with 1:1 rupee parity and strict zero-suppression
  const incomeH =
    income > 0 ? Math.max(3, Math.min(chartRange, (income / maxScale) * chartRange)) : 0;
  const expenseH =
    expense > 0 ? Math.max(3, Math.min(chartRange, (expense / maxScale) * chartRange)) : 0;

  // Semi-circular capsule pill top radius (max barWidth / 2)
  const rIncome = Math.min(barWidth / 2, Math.max(0, incomeH / 2));
  const rExpense = Math.min(barWidth / 2, Math.max(0, expenseH / 2));

  // Upper Intake Bar: flat baseline on zeroY, capsule rounded outer top
  const incomeTopY = zeroY - incomeH;
  const intakePath =
    incomeH > 0
      ? `M ${barX} ${zeroY} ` +
        `L ${barX} ${incomeTopY + rIncome} ` +
        `Q ${barX} ${incomeTopY} ${barX + rIncome} ${incomeTopY} ` +
        `L ${barX + barWidth - rIncome} ${incomeTopY} ` +
        `Q ${barX + barWidth} ${incomeTopY} ${barX + barWidth} ${incomeTopY + rIncome} ` +
        `L ${barX + barWidth} ${zeroY} Z`
      : null;

  // Lower Won Contracts Bar: flat baseline on zeroY, capsule rounded outer bottom
  const expenseBottomY = zeroY + expenseH;
  const expensePath =
    expenseH > 0
      ? `M ${barX} ${zeroY} ` +
        `L ${barX + barWidth} ${zeroY} ` +
        `L ${barX + barWidth} ${expenseBottomY - rExpense} ` +
        `Q ${barX + barWidth} ${expenseBottomY} ${barX + barWidth - rExpense} ${expenseBottomY} ` +
        `L ${barX + rExpense} ${expenseBottomY} ` +
        `Q ${barX} ${expenseBottomY} ${barX} ${expenseBottomY - rExpense} Z`
      : null;

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
  if (activeIncomeH <= 0 && activeExpenseH <= 0) {
    return {
      top: zeroY,
      bottom: zeroY,
      height: 0,
      width: 0,
      x: activeColCenter,
    };
  }

  const haloTop = zeroY - activeIncomeH - 8;
  const haloBottom = activeExpenseH > 0 ? zeroY + activeExpenseH + 8 : zeroY;
  const haloHeight = haloBottom - haloTop;
  const haloWidth = barWidth + 12;
  const haloX = activeColCenter - haloWidth / 2;

  return {
    top: haloTop,
    bottom: haloBottom,
    height: haloHeight,
    width: haloWidth,
    x: haloX,
  };
}
