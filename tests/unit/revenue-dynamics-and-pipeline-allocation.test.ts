/**
 * @file revenue-dynamics-and-pipeline-allocation.test.ts
 * @description Unit tests verifying Logip-benchmarked dual-spline performance chart,
 *              translucent gradient area wash, obsidian glassmorphic tooltip clamping,
 *              continuous 8px segmented progress bar, borderless stage ledger rows,
 *              zero nested bento cards, and strict anti-slop color tokens.
 * @module tests/unit/revenue-dynamics-and-pipeline-allocation
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

describe('Logip-Benchmarked Mid-Tier Analytics Engine', () => {
  const rdcTsxPath = path.resolve(__dirname, '../../src/app/admin/components/Dashboard/RevenueDynamicsCard.tsx');
  const rdcScssPath = path.resolve(__dirname, '../../src/app/admin/components/Dashboard/RevenueDynamicsCard.module.scss');
  const pacTsxPath = path.resolve(__dirname, '../../src/app/admin/components/Dashboard/PipelineAllocationCard.tsx');
  const pacScssPath = path.resolve(__dirname, '../../src/app/admin/components/Dashboard/PipelineAllocationCard.module.scss');

  const rdcTsx = fs.readFileSync(rdcTsxPath, 'utf8');
  const rdcScss = fs.readFileSync(rdcScssPath, 'utf8');
  const pacTsx = fs.readFileSync(pacTsxPath, 'utf8');
  const pacScss = fs.readFileSync(pacScssPath, 'utf8');

  describe('Section 1: RevenueDynamicsCard Logip Performance Spline Architecture', () => {
    test('enforces defensive inline fill and stroke on spline curve paths', () => {
      assert.ok(
        rdcTsx.includes('fill="none"'),
        'Spline curve path must explicitly declare fill="none" inline'
      );
      assert.ok(
        rdcTsx.includes('strokeWidth={2.5}'),
        'Primary spline curve path must declare strokeWidth={2.5} inline'
      );
      assert.ok(
        rdcTsx.includes('strokeLinecap="round"'),
        'Spline paths must specify rounded caps'
      );
    });

    test('enforces dual-spline curves with translucent area wash and eliminates vertical bars', () => {
      assert.ok(
        rdcTsx.includes('cashSpline') && rdcTsx.includes('quotaSpline'),
        'Must render dual splines for Realized Cash and Target Quota'
      );
      assert.ok(
        rdcTsx.includes('cashAreaPath') && rdcScss.includes('.areaWashPath'),
        'Must render translucent area wash path beneath primary curve'
      );
      assert.strictEqual(
        rdcScss.includes('.barQuota') || rdcScss.includes('.barCash'),
        false,
        'Must completely eliminate heavy vertical pillar bars (.barQuota, .barCash)'
      );
      assert.strictEqual(
        rdcScss.includes('.hudRibbon'),
        false,
        'Must eliminate noisy 4-cell HUD ribbon box'
      );
    });

    test('sanitizes React 19 useId() tokens into valid XML NCName identifiers', () => {
      assert.ok(
        rdcTsx.includes('.replace(/[^a-zA-Z0-9_-]/g'),
        'Must sanitize useId() string to strip colon delimiters for safe SVG gradient IDs'
      );
      assert.ok(
        rdcTsx.includes('rdc-area-grad-'),
        'Gradient ID must use rdc-area-grad- prefix'
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

    test('enforces clean integrated performance headline', () => {
      assert.ok(
        rdcTsx.includes('styles.headlineRow'),
        'TSX must bind to styles.headlineRow'
      );
      assert.ok(
        rdcTsx.includes('styles.headlineCash'),
        'Must render primary cash headline amount'
      );
      assert.ok(
        rdcTsx.includes('styles.deltaPill'),
        'Must render attainment delta pill'
      );
    });
  });

  describe('Section 2: PipelineAllocationCard Logip Borderless Stage Ledger Architecture', () => {
    test('eliminates nested bento inception in favor of clean borderless rows', () => {
      assert.strictEqual(
        pacScss.includes('.stageMatrixGrid') || pacTsx.includes('stageMatrixGrid'),
        false,
        'Must strictly eliminate 2x2 nested cards matrix'
      );
      assert.strictEqual(
        pacScss.includes('.conversionBenchmarkRail') || pacTsx.includes('conversionBenchmarkRail'),
        false,
        'Must eliminate separate conversion benchmark rail container'
      );
      assert.ok(
        pacTsx.includes('styles.stageLedgerList') && pacTsx.includes('styles.stageLedgerRow'),
        'Must render clean borderless stage rows matching Logip Current Tasks architecture'
      );
      assert.ok(
        pacScss.includes('.stageLedgerRow'),
        'SCSS must define .stageLedgerRow'
      );
    });

    test('enforces single continuous 8px segmented progress bar', () => {
      assert.ok(
        pacTsx.includes('styles.segmentedBarTrack') && pacTsx.includes('styles.segmentedBarSlice'),
        'TSX must render continuous segmented progress bar track'
      );
      assert.ok(
        pacScss.includes('.segmentedBarTrack') && pacScss.includes('height: 8px'),
        'SCSS must style .segmentedBarTrack with 8px height and rounded ends'
      );
    });

    test('eliminates faux-terminal bracketed badges in favor of natural typography', () => {
      // Must not contain hardcoded bracketed chips like [DISC-01], [ 06 DEALS ], [ CLOSED WON ]
      assert.strictEqual(
        pacTsx.includes('[DISC-01]'),
        false,
        'Must eliminate bracketed codes like [DISC-01]'
      );
      assert.strictEqual(
        pacTsx.includes('[ 06 DEALS ]'),
        false,
        'Must eliminate bracketed deal badges like [ 06 DEALS ]'
      );
      assert.strictEqual(
        pacTsx.includes('[ CLOSED WON ]'),
        false,
        'Must eliminate bracketed [ CLOSED WON ]'
      );
      assert.ok(
        pacTsx.includes('stage.dealCount') && pacTsx.includes('deals'),
        'Must render natural deal count: e.g. 6 deals'
      );
    });

    test('enforces circular soft category avatars and micro progress tracks', () => {
      assert.ok(
        pacTsx.includes('styles.circularAvatar') && pacTsx.includes('styles.avatarDot'),
        'Must render circular avatar with central glowing status dot'
      );
      assert.ok(
        pacTsx.includes('styles.microProgressTrack') && pacTsx.includes('styles.microProgressFill'),
        'Must render micro progress track for proportional share'
      );
      assert.ok(
        pacScss.includes('.circularAvatar') && pacScss.includes('border-radius: 50%'),
        'Circular avatar must have 50% border radius'
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
        'Stage rows must support keyboard focus'
      );
      assert.ok(
        pacTsx.includes('role="listitem"'),
        'Stage rows must announce as listitems for accessibility'
      );
    });
  });
});
