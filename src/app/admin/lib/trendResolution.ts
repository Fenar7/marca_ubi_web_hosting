/**
 * @file trendResolution.ts
 * @description Semantic trend direction and status resolver for CRM financial telemetry.
 *              Strictly enforces that zero states, informative baselines, and neutral ratios
 *              never receive positive growth styling.
 * @module admin/lib/trendResolution
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

export type TrendSemanticType = "positive" | "negative" | "neutral";

/**
 * Resolves the semantic trend category for a delta string or metric value.
 *
 * Invariants:
 * 1. Zero values (e.g. "+0.0%", "0%", "0 won", "— Prior MoM ₹ 0") strictly resolve to "neutral".
 * 2. Informative non-delta figures (e.g. "Target < 21d", "42.5%") strictly resolve to "neutral".
 * 3. Genuine positive growth requires an explicit positive signal (↗ or +) and a value > 0.
 * 4. Genuine contraction/loss requires an explicit negative signal (↘ or -) and a value < 0.
 */
export function resolveTrendSemanticType(delta: string): TrendSemanticType {
  const trimmed = delta.trim();

  // Baseline non-comparative placeholders
  if (
    trimmed === "" ||
    trimmed === "—" ||
    trimmed.includes("Prior MoM") ||
    trimmed.includes("Target") ||
    trimmed.includes("won") ||
    trimmed.includes("cohort")
  ) {
    return "neutral";
  }

  // Detect explicit positive or negative directional intent
  const hasPositiveSignal = trimmed.includes("↗") || trimmed.includes("+");
  const hasNegativeSignal = trimmed.includes("↘") || trimmed.includes("-");

  // If neither directional signal is present, treat as neutral informational ratio/count
  if (!hasPositiveSignal && !hasNegativeSignal) {
    return "neutral";
  }

  // Extract the numeric portion to distinguish authentic non-zero change from zero baselines
  const numericMatch = trimmed.match(/([+-]?\d+(?:\.\d+)?)/);
  if (numericMatch) {
    const val = parseFloat(numericMatch[1]);
    if (val === 0) {
      return "neutral";
    }
    if (hasNegativeSignal && val < 0) {
      return "negative";
    }
    if (hasPositiveSignal && val > 0) {
      return "positive";
    }
  }

  if (hasNegativeSignal) return "negative";
  if (hasPositiveSignal) return "positive";
  return "neutral";
}
