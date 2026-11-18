# UI UX Pro Max — Semantic Palettes & Telemetry Harmonization

This module defines accessible color harmonies for commercial CRM, telemetry, and status indicators. All colors are calibrated for WCAG AA compliance (4.5:1 text, 3:1 graphical elements).

---

## 1. Primary Brand Palette (Immutable Authority: `DESIGN.md`)

| Token Name | Hex Code | Purpose & Application |
| :--- | :--- | :--- |
| **Brand Red** | `#ea002a` | Primary CTA buttons, active navigation markers, high-priority badges |
| **Brand Ink** | `#111111` | Primary headings, monetary amounts, active state text |
| **Muted Slate** | `#475569` | Secondary descriptors, subtitles, axis labels (WCAG AAA 7.58:1 on white) |
| **Hairline Border** | `#e7e7e4` | Clean 1px structural container and table borders |
| **Paper Canvas** | `#ffffff` | Primary card surface and data tables |
| **Neutral Scaffolding** | `#f5f5f3` | Page backing, sidebar hover states, subtle pill backgrounds |

---

## 2. Commercial Status & Telemetry Palettes

| State / Funnel Stage | Stroke / Fill | Soft Badge Background | Badge Text Color | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **New Lead** | `#18181b` | `rgba(24, 24, 27, 0.08)` | `#18181b` | Inbound uncontacted leads |
| **Contacted** | `#ea002a` | `rgba(234, 0, 42, 0.09)` | `#ea002a` | Outreach initiated / first call |
| **Qualified** | `#0d9488` | `rgba(13, 148, 136, 0.10)` | `#0d9488` | Scope verified / budget confirmed |
| **Proposal Sent** | `#6366f1` | `rgba(99, 102, 241, 0.10)` | `#4f46e5` | Commercial proposal delivered |
| **Negotiation** | `#d97706` | `rgba(217, 119, 6, 0.10)` | `#b45309` | Contract review / closing stage |
| **Won / Closed** | `#10b981` | `rgba(16, 185, 129, 0.10)` | `#047857` | Converted contracts / revenue |
| **On Hold / Disqualified** | `#71717a` | `rgba(113, 113, 122, 0.10)` | `#52525b` | Dormant, paused, or disqualified |

---

## 3. Directional Trend Semantics

* **Positive Growth (`↗ +14.2%`)**:
  - Text & Icon: `#047857` (Deep Emerald, contrast 4.8:1)
  - Background Pill: `#ecfdf5`
  - Border: `1px solid #a7f3d0`
* **Negative Contraction (`↘ -5.2%`)**:
  - Text & Icon: `#b91c1c` (Crimson, contrast 5.1:1)
  - Background Pill: `#fef2f2`
  - Border: `1px solid #fecaca`
* **Neutral / Zero Baseline (`0 won`, `Target < 21d`, `—`)**:
  - Text & Icon: `#475569` (Quiet Slate)
  - Background Pill: `#f1f5f9`
  - Border: `1px solid #e2e8f0`
  - **Invariant:** Never color a zero or non-growth baseline in positive green.
