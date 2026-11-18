---
name: ui-ux-pro-max
description: >-
  Design intelligence and searchable UX reference engine. Provides curated luxury and
  operational style guides, semantic status palettes, and strict Priority 1 (WCAG AA/AAA)
  and Priority 2 (44px touch, keyboard navigation) guardrails. Use for comprehensive
  UI/UX architecture, styling decisions, and design reviews.
---

# ⚡ UI UX Pro Max — Design Intelligence & Reference Engine

> **Core Philosophy**: Deliver high-precision, context-adaptive design systems and UX guardrails to eliminate AI guesswork. Provides searchable style profiles, domain-specific palettes, and strict accessibility checklists.

--------------------------------------------------------------------------------

## 1. Quick Navigation Matrix

| Reference Module | Purpose | Location |
| :--- | :--- | :--- |
| **Aesthetic Styles** | Curated visual profiles (Swiss Luxury, Bento Grid, Apple HIG Glass, Obsidian HUD) | [`references/styles.md`](./references/styles.md) |
| **Semantic Palettes** | Domain-mapped palettes (Fintech/CRM, Operations, Telemetry, Risk) | [`references/semantic-palettes.md`](./references/semantic-palettes.md) |
| **UX Guardrails** | Priority 1 (Accessibility & Contrast) & Priority 2 (Touch & Interaction) | [`references/ux-checklists.md`](./references/ux-checklists.md) |

--------------------------------------------------------------------------------

## 2. Priority 1: Critical Accessibility Guardrails (Absolute Floor)

Before completing any frontend surface, verify these non-negotiable rules:

1. **Color Contrast Ratios (WCAG 2.1 AA/AAA)**:
   - Primary text against surface: Minimum **4.5:1** (Target **7:1+** for body prose).
   - Secondary / muted text: Minimum **4.5:1** (In Marca Ubi, `#475569` against `#ffffff` yields **7.58:1**).
   - Interactive component boundaries, active states, and icons: Minimum **3.0:1**.
2. **Keyboard Navigation & Focus Management**:
   - Every clickable element (`<button>`, `<a>`, `<input>`, tabs) must be reachable via `Tab` key.
   - Interactive custom widgets (tabs, dialogs, dropdowns) must use proper WAI-ARIA roles (`role="tablist"`, `role="tab"`, `role="tabpanel"`, `role="dialog"`).
   - Never suppress outline rings without providing an explicit replacement. Use `:focus-visible` with a 2px offset brand ring.
3. **Screen Reader Semantic Hierarchy**:
   - Proper landmark structure: `<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, `<footer>`.
   - Form inputs must have programmatic `<label>` associations or `aria-label`.
   - Meaningful iconography must include `aria-hidden="true"` when accompanied by text, or `aria-label` when icon-only.

--------------------------------------------------------------------------------

## 3. Priority 2: Interaction & Touch Ergonomics

1. **Touch Hit Targets**:
   - Minimum tap target size on mobile/touch viewports: **44 × 44 CSS pixels** (even if visual icon is 16px, pad container to 44px).
2. **Interactive States Floor**:
   - Every control must provide visible feedback across all 5 states:
     - `Default`: Rest state with crisp contrast.
     - `Hover`: Subtle elevation lift (-1px) or tint shift.
     - `Active / Pressed`: Physical spring response (`transform: scale(0.98)`).
     - `Focus`: High-contrast `:focus-visible` outline.
     - `Disabled`: Reduced opacity (0.5), `cursor: not-allowed`, and `aria-disabled="true"`.
3. **Tactile Loading & Optimistic Feedback**:
   - Buttons performing async mutations must show an inline spinner or pulse, preventing duplicate submissions.

--------------------------------------------------------------------------------

## 4. Visual Styles & Archetype Scoping

1. **Swiss Luxury Editorial (Primary Workspace Mode)**:
   - Paper-white backgrounds (`#ffffff`), warm neutral scaffolding (`#f5f5f3`), near-black ink (`#111111`), hairline dividers (`1px solid #e7e7e4`).
   - Clean whitespace, large bold typography (Circular XX), compact operational rows.
2. **Obsidian Commercial HUD (Card Mode)**:
   - Radial graphite depth (`#232326` to `#101012`), specular top rim (`box-shadow: inset 0 1px 0 rgba(255,255,255,0.18)`), glowing status indicators.
3. **Bento Grid Dose Cap**:
   - Permitted **only** when displaying asymmetric, multi-metric dashboard overviews.
   - Strictly forbidden to nest bento cards inside other bordered cards ("Nested Bento Inception").
4. **Glassmorphism Dose Cap**:
   - Permitted exclusively as an accent on floating headers, popovers, or slide-over backdrops (`backdrop-filter: blur(20px)`). Never apply full-page blur to every card.

--------------------------------------------------------------------------------

## 5. Marca Ubi Brand Guardrails

- **Brand Primary Accent**: Marca Ubi Red (`#ea002a`) — reserved for primary CTA buttons, active tab indicators, and critical status markers.
- **Conversion Emerald**: Executive Emerald (`#10b981` to `#047857`) — reserved for positive trend deltas and won pipeline contracts.
- **Banned Aesthetics**: Flat generic blue buttons (`#2563eb`), Neumorphic sunken emboss, raw Brutalism, and toy emoji chips.
