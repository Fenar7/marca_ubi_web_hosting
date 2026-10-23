/**
 * @file revenue-dynamics-and-pipeline-allocation.test.ts
 * @description Unit tests verifying defensive SVG presentation attributes, safe XML identifiers,
 *              Executive Header HUD ribbon, Stepped Funnel Flow ribbon, high-density 2x2 stage cards matrix,
 *              dedicated Closed Won benchmark rail, and WCAG AA color tokens for RevenueDynamicsCard and PipelineAllocationCard.
 * @module tests/unit/revenue-dynamics-and-pipeline-allocation
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

describe('Executive Mid-Tier Analytics Remediation Engine', () => {
  const rdcTsxPath = path.resolve(__dirname, '../../src/app/admin/components/Dashboard/RevenueDynamicsCard.tsx');
  const rdcScssPath = path.resolve(__dirname, '../../src/app/admin/components/Dashboard/RevenueDynamicsCard.module.scss');
  const pacTsxPath = path.resolve(__dirname, '../../src/app/admin/components/Dashboard/PipelineAllocationCard.tsx');
  const pacScssPath = path.resolve(__dirname, '../../src/app/admin/components/Dashboard/PipelineAllocationCard.module.scss');

  const rdcTsx = fs.readFileSync(rdcTsxPath, 'utf8');
  const rdcScss = fs.readFileSync(rdcScssPath, 'utf8');
  const pacTsx = fs.readFileSync(pacTsxPath, 'utf8');
  const pacScss = fs.readFileSync(pacScssPath, 'utf8');

  describe('Section 1: RevenueDynamicsCard Defensive SVG & Presentation Architecture', () => {
    test('enforces defensive inline fill and stroke on spline curve path to prevent black blob anomaly', () => {
      assert.ok(
        rdcTsx.includes('fill="none"'),
        'Spline curve path must explicitly declare fill="none" inline'
      );
      assert.ok(
        rdcTsx.includes('stroke="#ff6100"'),
        'Spline curve path must explicitly declare stroke="#ff6100" inline'
      );
      assert.ok(
        rdcTsx.includes('strokeWidth={2.5}'),
        'Spline curve path must explicitly declare strokeWidth={2.5} inline'
      );
    });

    test('enforces architectural vertical gradients on Quota and Cash bars with defensive fallbacks', () => {
      assert.ok(
        rdcTsx.includes('gradQuotaId') && rdcTsx.includes('gradCashId'),
        'Target Quota and Actual Cash bars must bind to linear gradients'
      );
      assert.ok(
        rdcScss.includes('.barQuota') && rdcScss.includes('.barCash'),
        'SCSS must declare .barQuota and .barCash'
      );
    });

    test('sanitizes React 19 useId() tokens into valid XML NCName identifiers', () => {
      assert.ok(
        rdcTsx.includes('.replace(/[^a-zA-Z0-9_-]/g'),
        'Must sanitize useId() string to strip colon delimiters for safe SVG gradient IDs'
      );
      assert.ok(
        rdcTsx.includes('rdc-grad-'),
        'Gradient ID must use rdc-grad- prefix'
      );
      assert.ok(
        rdcTsx.includes('rdc-glow-'),
        'Filter ID must use rdc-glow- prefix'
      );
    });

    test('enforces obsidian glassmorphic tooltip styling and bounds clamping', () => {
      assert.ok(
        rdcTsx.includes('styles.obsidianTooltip'),
        'TSX must bind to styles.obsidianTooltip'
      );
      assert.ok(
        rdcScss.includes('.obsidianTooltip'),
        'SCSS must define obsidian glassmorphic tooltip'
      );
      assert.ok(
        rdcScss.includes('backdrop-filter: blur('),
        'Tooltip must enforce backdrop-filter blur for glassmorphism'
      );
      assert.ok(
        rdcTsx.includes('Math.max(10, Math.min(90, rawLeftPercent))'),
        'Tooltip horizontal coordinate must be clamped between 10% and 90% to prevent canvas overflow'
      );
    });

    test('enforces Executive Header HUD Ribbon with cumulative telemetry', () => {
      assert.ok(
        rdcTsx.includes('styles.hudRibbon'),
        'TSX must bind to styles.hudRibbon'
      );
      assert.ok(
        rdcTsx.includes('Cash Realized') && rdcTsx.includes('Target Quota') && rdcTsx.includes('Attainment Rate'),
        'HUD Ribbon must display Cash Realized, Target Quota, and Attainment Rate'
      );
      assert.ok(
        rdcScss.includes('.hudRibbon'),
        'SCSS must declare .hudRibbon styles'
      );
    });
  });

  describe('Section 2: PipelineAllocationCard Symmetrical Architecture & WCAG Standards', () => {
    test('enforces symmetrical 2x2 active stages partition eliminating layout orphans', () => {
      assert.ok(
        pacTsx.includes("normalizedStages.filter((s) => s.id !== 'stage-won'"),
        'Must partition pipeline into active stages (excluding stage-won) to eliminate orphan layout hole'
      );
      assert.ok(
        pacScss.includes('grid-template-columns: repeat(2, 1fr)'),
        'SCSS must specify a 2-column grid for active stages'
      );
    });

    test('enforces Stepped Milestone Funnel Flow Ribbon with pass-through telemetry', () => {
      assert.ok(
        pacTsx.includes('styles.funnelRibbonWrapper'),
        'TSX must bind to styles.funnelRibbonWrapper'
      );
      assert.ok(
        pacTsx.includes('styles.funnelStep'),
        'TSX must render individual funnel steps'
      );
      assert.ok(
        pacScss.includes('.funnelRibbonWrapper'),
        'SCSS must style .funnelRibbonWrapper'
      );
    });

    test('enforces High-Density 2x2 Stage Cards with 3px accent tokens and Raycast deal badges', () => {
      assert.ok(
        pacTsx.includes('styles.stageMatrixGrid'),
        'TSX must bind to styles.stageMatrixGrid'
      );
      assert.ok(
        pacTsx.includes('styles.cardAccentToken'),
        'Stage cards must render top 3px solid accent tokens'
      );
      assert.ok(
        pacTsx.includes('styles.dealCountBadge'),
        'Stage cards must render deal count badges'
      );
      assert.ok(
        pacTsx.includes('velocityDays'),
        'Stage cards must display velocity in stage duration'
      );
    });

    test('elevates Closed Won into a dedicated conversion benchmark rail', () => {
      assert.ok(
        pacTsx.includes('styles.conversionBenchmarkRail'),
        'TSX must render dedicated .conversionBenchmarkRail footer'
      );
      assert.ok(
        pacTsx.includes('benchmarkWonDot'),
        'Conversion rail must render pulsing radar status dot'
      );
      assert.ok(
        pacTsx.includes('conversionWinRate'),
        'Conversion rail must display realized win rate percentage'
      );
      assert.ok(
        pacTsx.includes('averageSalesCycleDays'),
        'Conversion rail must display average cycle duration'
      );
    });

    test('enforces WCAG AA compliant high-contrast color tokens and strictly zero generic blue (#2563eb)', () => {
      // Must not contain #2563eb anywhere
      assert.strictEqual(
        pacTsx.includes('#2563eb'),
        false,
        'PipelineAllocationCard TSX must NEVER contain generic blue #2563eb'
      );
      assert.strictEqual(
        pacScss.includes('#2563eb'),
        false,
        'PipelineAllocationCard SCSS must NEVER contain generic blue #2563eb'
      );
      assert.strictEqual(
        rdcTsx.includes('#2563eb'),
        false,
        'RevenueDynamicsCard TSX must NEVER contain generic blue #2563eb'
      );
      assert.strictEqual(
        rdcScss.includes('#2563eb'),
        false,
        'RevenueDynamicsCard SCSS must NEVER contain generic blue #2563eb'
      );

      // Verify Deep Ocean Sky #0284c7 (4.54:1 WCAG AA) is declared
      assert.ok(
        pacTsx.includes('#0284c7'),
        'Discovery stage must use high-contrast Deep Ocean Sky #0284c7'
      );
      assert.ok(
        pacTsx.includes('#d97706'),
        'Negotiation stage must use high-contrast Executive Amber #d97706'
      );
      assert.ok(
        pacTsx.includes('#059669'),
        'Review stage must use high-contrast Mint Emerald #059669'
      );
    });

    test('integrates bi-directional interactive hover illumination and keyboard accessibility', () => {
      assert.ok(
        pacTsx.includes('hoveredStageId'),
        'Must track hoveredStageId for synchronized illumination'
      );
      assert.ok(
        pacTsx.includes('tabIndex={0}'),
        'Stage cards must support keyboard focus'
      );
      assert.ok(
        pacTsx.includes('role="listitem"'),
        'Stage cards must announce as listitems for accessibility'
      );
    });
  });
});
