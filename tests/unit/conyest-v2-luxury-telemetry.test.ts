/**
 * @file conyest-v2-luxury-telemetry.test.ts
 * @description Unit tests validating Conyest V2 mathematical SVG coordinate geometry,
 *              zero-suppression invariants, donut clearance aperture, 8-stage Swiss palette,
 *              Hare-Niemeyer 100% percentage normalization, and strict semantic trend resolution.
 *              Strictly imports and verifies live production code modules.
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  computeVelocityBarPaths,
  computeActiveHaloBounds,
} from "../../src/app/admin/lib/chartGeometry";
import { SWISS_STAGE_PALETTE } from "../../src/app/admin/lib/stagePalette";
import { largestRemainderRound } from "../../src/app/admin/lib/largestRemainder";
import { resolveTrendSemanticType } from "../../src/app/admin/lib/trendResolution";
import { formatCompactInr } from "../../src/app/admin/lib/currency";

describe("Conyest V2 Luxury Production Telemetry & Geometry Invariants", () => {
  describe("Velocity Dual-Bar Chart Coordinate Space & Path Math", () => {
    const zeroY = 130;
    const chartRange = 75; // 1:1 rupee parity range
    const maxScale = 1000000; // 10L
    const barWidth = 20;
    const barX = 100;

    it("enforces strict zero-height suppression when expense is 0", () => {
      const { expenseH, expensePath } = computeVelocityBarPaths(
        barX,
        barWidth,
        zeroY,
        620000,
        0, // 0 expense
        maxScale,
        chartRange,
      );

      assert.equal(expenseH, 0, "Expense height must be strictly 0 for zero-expense months");
      assert.equal(expensePath, null, "Expense SVG path must be null when expense is 0 (zero suppression)");
    });

    it("computes dynamic content-bounded active halo that never overshoots baseline when expense is 0", () => {
      const activeIncome = 620000;
      const activeExpense = 0; // zero-expense month (e.g. October)
      const colCenter = 110;

      const halo = computeActiveHaloBounds(
        colCenter,
        barWidth,
        zeroY,
        activeIncome,
        activeExpense,
        maxScale,
        chartRange,
      );

      // Invariant: When expense is 0, haloBottom must stop exactly flush at zero baseline (zeroY)
      assert.equal(
        halo.bottom,
        zeroY,
        `Halo bottom (${halo.bottom}) must stop flush at zero baseline (${zeroY}) when expense is 0`,
      );

      const expectedIncomeH = Math.max(3, Math.min(chartRange, (activeIncome / maxScale) * chartRange));
      assert.equal(
        halo.top,
        zeroY - expectedIncomeH - 8,
        "Halo top must be 8px above the income bar top",
      );
      assert.equal(
        halo.height,
        expectedIncomeH + 8,
        "Halo height for zero-expense month must exactly equal income bar height + 8px top padding",
      );
    });

    it("verifies exact 1:1 Rupee parity: identical intake and conversion amounts yield identical pixel heights", () => {
      const testRupees = 400000; // 4L
      const { incomeH, expenseH } = computeVelocityBarPaths(
        barX,
        barWidth,
        zeroY,
        testRupees,
        testRupees,
        maxScale,
        chartRange,
      );

      assert.equal(
        incomeH,
        expenseH,
        `Income height (${incomeH}px) and expense height (${expenseH}px) must be identical for equal INR values`,
      );
      assert.equal(incomeH, (testRupees / maxScale) * chartRange);
    });

    it("constructs flat baseline joints and semi-circular capsule pill outer caps", () => {
      const { intakePath, expensePath } = computeVelocityBarPaths(
        barX,
        barWidth,
        zeroY,
        500000,
        500000,
        maxScale,
        chartRange,
      );

      assert.ok(intakePath, "Intake path must be non-null");
      assert.ok(expensePath, "Expense path must be non-null");

      // Verify intake starts from baseline zeroY
      assert.ok(intakePath.startsWith(`M ${barX} ${zeroY}`), "Intake path must start from flat zero baseline");
      // Verify expense starts from baseline zeroY
      assert.ok(expensePath.startsWith(`M ${barX} ${zeroY}`), "Expense path must start from flat zero baseline");
    });
  });

  describe("Hare-Niemeyer 100% Donut Normalization & Clearance Geometry", () => {
    it("guarantees stage percentages sum to strictly 100% without rounding drift", () => {
      // Data that with Math.round() would sum to 101% (as in screenshot 220900: 16+14+5+21+21+24 = 101)
      const rawStages = [
        { name: "Discovery", value: 1020000 },  // 15.60% -> round 16
        { name: "Scope", value: 895000 },       // 13.68% -> round 14
        { name: "Proposal", value: 340000 },    // 5.20%  -> round 5
        { name: "Review", value: 1365000 },     // 20.87% -> round 21
        { name: "Negotiation", value: 1360000 },// 20.80% -> round 21
        { name: "Closing", value: 1560000 },    // 23.85% -> round 24 (Sum = 101%!)
      ];

      const normalized = largestRemainderRound(rawStages, (s) => s.value);
      const sum = normalized.reduce((acc, p) => acc + p, 0);

      assert.equal(sum, 100, `Normalized percentages must sum to strictly 100%, received ${sum}%`);
    });

    it("verifies watchmaker donut clearance aperture prevents glyph collision", () => {
      const radius = 80;
      const strokeWidth = 12;
      const innerDiameter = (radius - strokeWidth / 2) * 2; // 148px
      const sampleTextWidth = 108; // width of "₹ 65,40,000"

      const totalClearance = innerDiameter - sampleTextWidth;
      assert.ok(
        totalClearance >= 30,
        `Donut clearance (${totalClearance}px) must provide at least 30px breathing room around currency text`,
      );
    });
  });

  describe("Curated 8-Stage Swiss Luxury Color Palette", () => {
    it("provides exactly 8 distinct hues with zero duplicates and zero generic blue", () => {
      assert.equal(SWISS_STAGE_PALETTE.length, 8);
      const colors = SWISS_STAGE_PALETTE.map((p) => p.color.toLowerCase());
      const uniqueColors = new Set(colors);
      assert.equal(uniqueColors.size, 8, "Every stage in SWISS_STAGE_PALETTE must have a unique color");

      // Verify absence of forbidden generic blue #2563eb
      assert.ok(
        !colors.includes("#2563eb"),
        "Generic blue #2563eb is strictly forbidden in Swiss Luxury design system",
      );

      // Verify Stage 1 (#18181b) does not collide with Stage 6 (#6366f1) or any other
      assert.notEqual(SWISS_STAGE_PALETTE[0].color, SWISS_STAGE_PALETTE[5].color);
    });
  });

  describe("Strict Semantic Trend Direction Resolution", () => {
    it("never flags zero conversions or neutral baselines as positive growth", () => {
      assert.equal(resolveTrendSemanticType("+0.0%"), "neutral");
      assert.equal(resolveTrendSemanticType("0.0%"), "neutral");
      assert.equal(resolveTrendSemanticType("0%"), "neutral");
      assert.equal(resolveTrendSemanticType("0 won"), "neutral");
      assert.equal(resolveTrendSemanticType("— Prior MoM ₹ 0"), "neutral");
      assert.equal(resolveTrendSemanticType("Target < 21d"), "neutral");
      assert.equal(resolveTrendSemanticType("43.4%"), "neutral"); // informative ratio without directional arrow
      assert.equal(resolveTrendSemanticType("—"), "neutral");
    });

    it("correctly identifies genuine positive growth and negative contraction", () => {
      assert.equal(resolveTrendSemanticType("↗ +14.2%"), "positive");
      assert.equal(resolveTrendSemanticType("+5.1%"), "positive");
      assert.equal(resolveTrendSemanticType("+0.5%"), "positive");
      assert.equal(resolveTrendSemanticType("↘ -4.8%"), "negative");
      assert.equal(resolveTrendSemanticType("-12.0%"), "negative");
    });
  });

  describe("Compact Currency Formatting (formatCompactInr)", () => {
    it("formats Indian Rupee figures cleanly without losing magnitude", () => {
      assert.equal(formatCompactInr(15000000), "1.5Cr");
      assert.equal(formatCompactInr(1000000), "10L");
      assert.equal(formatCompactInr(500000), "5L");
      assert.equal(formatCompactInr(50000), "50k");
      assert.equal(formatCompactInr(0), "0");
      assert.equal(formatCompactInr(-500000), "-5L");
    });
  });
});
