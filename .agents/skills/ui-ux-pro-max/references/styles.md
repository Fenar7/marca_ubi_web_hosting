# UI UX Pro Max — Visual Style Profiles

This guide provides calibrated style profiles for building distinctive user interfaces while adhering to the Marca Ubi design language and anti-slop rules.

---

## 1. Swiss Luxury Editorial (Default Workspace Mode)

* **Best For:** Agency CRM, lead dossiers, analytical dashboards, settings, documentation.
* **Surface Hierarchy:**
  - Page Background: `#f5f5f3` (Warm neutral canvas)
  - Card Containers: `#ffffff` (Solid paper-white, no transparency)
  - Borders: `1px solid #e7e7e4` (Clean hairline)
  - Text Ink: `#111111` (Primary headings/amounts), `#475569` (Secondary descriptors, WCAG AAA 7.58:1)
* **Geometry:** `border-radius: 16px` to `20px` for cards, `9999px` for pill badges and buttons.
* **Shadows:** Minimal, ambient ambient contact shadows (`0 1px 3px rgba(12, 12, 13, 0.03), 0 6px 16px -4px rgba(12, 12, 13, 0.04)`). Never heavy black drop-shadows.

---

## 2. Obsidian Radial HUD (Telemetry & Highlights)

* **Best For:** Executive commercial account cards, summary hero widgets, radar monitors.
* **Surface Hierarchy:**
  - Background: `radial-gradient(ellipse at 80% 0%, #28282d 0%, #18181b 50%, #101012 100%)`
  - Specular Rim: `box-shadow: inset 0 1px 0 0 rgba(255, 255, 255, 0.18)`
  - Watermark Details: Geometric concentric arcs (`stroke: rgba(255, 255, 255, 0.08)`)
  - Accent Indicator: Pulsing emerald telemetry badge (`#10b981`)
* **Typography:** High-contrast white (`#ffffff`), tabular numbers (`font-variant-numeric: tabular-nums`).

---

## 3. Bento Grid (Multi-Metric Overview Mode)

* **Best For:** Top-level executive dashboards and asymmetric metric summaries.
* **Rules & Constraints:**
  - **Asymmetric Proportions:** Mix 2-column or 3-column rows (e.g. 68% velocity dual-bar chart / 32% open arc gauge).
  - **Dose Cap:** Use for the top dashboard section only. Do not make the entire page a mosaic.
  - **Single Outer Container:** Never nest bordered bento cards inside other bordered cards ("Nested Bento Inception").

---

## 4. Frosted Glass / Vibrancy (Overlay Mode)

* **Best For:** Fixed headers, drawer sidebars, modal dialogs, and popovers.
* **Rules & Constraints:**
  - Background: `rgba(255, 255, 255, 0.85)` in light mode, with `backdrop-filter: blur(20px)`.
  - Border: `1px solid rgba(226, 232, 240, 0.8)`.
  - **Dose Cap:** Restrict to at most 1–2 elements on a screen. Never apply full-page blur.
