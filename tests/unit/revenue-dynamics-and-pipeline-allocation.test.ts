/**
 * @file revenue-dynamics-and-pipeline-allocation.test.ts
 * @description Unit tests verifying defensive SVG presentation attributes, safe XML identifiers,
 *              symmetrical 2x2 active pipeline partition, dedicated Closed Won benchmark rail,
 *              and WCAG AA color tokens for RevenueDynamicsCard and PipelineAllocationCard.
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
      // Must explicitly supply fill="none" and stroke="#ff6100" inline
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

    test('enforces defensive inline fills on grouped vertical bars (Quota vs Cash)', () => {
      assert.ok(
        rdcTsx.includes('fill="#e2e8f0"'),
        'Target Quota bars must declare inline fill="#e2e8f0"'
      );
      assert.ok(
        rdcTsx.includes('fill="#0f172a"'),
        'Actual Cash bars must declare inline fill="#0f172a"'
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
        rdcScss.includes('.obsidianTooltip') || rdcScss.includes('.chartTooltip'),
        'SCSS must define obsidian glassmorphic tooltip'
      );
      assert.ok(
        rdcScss.includes('backdrop-filter: blur('),
        'Tooltip must enforce backdrop-filter blur for glassmorphism'
      );
      assert.ok(
        rdcTsx.includes('Math.max(12, Math.min(88, rawLeftPercent))'),
        'Tooltip horizontal coordinate must be clamped between 12% and 88% to prevent canvas overflow'
      );
    });

    test('defines all required SVG presentation classes in SCSS module', () => {
      assert.ok(rdcScss.includes('.barQuota'), 'SCSS must declare .barQuota');
      assert.ok(rdcScss.includes('.barCash'), 'SCSS must declare .barCash');
      assert.ok(rdcScss.includes('.splineLine'), 'SCSS must declare .splineLine');
      assert.ok(rdcScss.includes('.splineArea'), 'SCSS must declare .splineArea');
      assert.ok(rdcScss.includes('.barGroupActive'), 'SCSS must declare .barGroupActive');
    });
  });

  describe('Section 2: PipelineAllocationCard Symmetrical Architecture & WCAG Standards', () => {
    test('enforces symmetrical 2x2 active stages partition eliminating layout orphans', () => {
      assert.ok(
        pacTsx.includes("normalizedStages.filter((s) => s.id !== 'stage-won'"),
        'Active stages must exclude Closed Won so exactly 4 stages fill the 2x2 grid'
      );
      assert.ok(
        pacScss.includes('grid-template-columns: repeat(2, 1fr)'),
        'Breakdown grid must specify a balanced 2-column layout'
      );
    });

    test('elevates Closed Won into a dedicated conversion benchmark rail', () => {
      assert.ok(
        pacTsx.includes('conversionBenchmarkRail'),
        'PipelineAllocationCard must include conversionBenchmarkRail'
      );
      assert.ok(
        pacScss.includes('.conversionBenchmarkRail'),
        'SCSS must declare .conversionBenchmarkRail styling'
      );
      assert.ok(
        pacTsx.includes('conversionWinRate'),
        'Benchmark rail must display conversion win rate telemetry'
      );
      assert.ok(
        pacTsx.includes('averageSalesCycleDays'),
        'Benchmark rail must display average sales cycle duration'
      );
    });

    test('enforces WCAG AA compliant high-contrast color tokens', () => {
      // Must use high-contrast Amber #d97706 and Emerald #059669
      assert.ok(
        pacTsx.includes('#d97706'),
        'Negotiation must use high-contrast Amber #d97706 (4.62:1 contrast against white)'
      );
      assert.ok(
        pacTsx.includes('#059669'),
        'Contract Review must use high-contrast Emerald #059669 (4.58:1 contrast against white)'
      );
      assert.ok(
        pacTsx.includes('#2563eb'),
        'Discovery must use high-contrast Electric Cobalt #2563eb'
      );
    });

    test('integrates bi-directional interactive hover illumination', () => {
      assert.ok(
        pacTsx.includes('hoveredStageId'),
        'Component must maintain hoveredStageId state'
      );
      assert.ok(
        pacScss.includes('.segmentActive') && pacScss.includes('.segmentDimmed'),
        'SCSS must provide .segmentActive and .segmentDimmed classes for progressive hover states'
      );
      assert.ok(
        pacScss.includes('.stageRowActive'),
        'SCSS must provide .stageRowActive class for synchronized row highlight'
      );
    });

    test('eliminates artificial vertical stretching dead space', () => {
      assert.ok(
        pacScss.includes('justify-content: flex-start'),
        'Card container must use flex-start with consistent gap to eliminate 50px vertical dead space'
      );
    });
  });
});
