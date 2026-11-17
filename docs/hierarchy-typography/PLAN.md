# Phase 4: Hierarchy & Typography Implementation Plan

## Overview
This phase enforces the Marca Ubi brand design tokens and typography hierarchy across the dashboard.

## Tasks
1. **Hero Headers**: Update headers in `ExecutiveMasthead.tsx` and other dashboard components to use `Circular XX Bold 32px` via SCSS tokens.
2. **Metrics**: Refactor metrics in `ConyestMetricsGrid.tsx` to `Graphik Regular 24px` with `tabular-nums` class.
3. **Metadata**: Apply Minimalist Metadata (12px, Uppercase, Graphik) to all dashboard metadata labels.
4. **Token Enforcement**: Ensure all font-sizes, weights, and families are pulled from `src/styles/tokens.scss`.
5. **Quality Gate**: 
    - Remove all generic comments.
    - Purge `any` types.
    - Ensure clean code adherence.
6. **Verification**: Visual audit of the dashboard for hierarchy and balance.

## Proposed Changes
- Modify `src/styles/tokens.scss` if required (add new token definitions if missing).
- Update component-level SCSS/CSS Modules for `ExecutiveMasthead` and `ConyestMetricsGrid`.
- Perform a final visual check.

## Risk Management
- No breaking changes to existing layout logic.
- Atomic updates per component.
- Performance: Ensure `tabular-nums` does not impact layout shift (CLS).
