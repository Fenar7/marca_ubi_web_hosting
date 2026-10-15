# Marca Ubi — Design Direction & Brand Soul (`DESIGN.md`)

> **Design Direction Authority**: This document provides the product identity, aesthetic soul, color tokens, and liveliness dials for **Marca Ubi**. It serves as the primary direction provider required by `anti-slop` (Rule R-37) and pairs with `.agents/skills/master-ui-ux-design-system/`.

---

## 1. Brand Identity & Product Character

- **Brand**: Marca Ubi (Creative Technology, Luxury Digital Infrastructure, Enterprise Agency CRM & Sales Pipeline Platform)
- **Domain**: High-ticket creative client acquisition, luxury branding proposals, commercial negotiations, and deal velocity tracking.
- **Personality**: Monolithic, dark-mode native, ultra-sharp, architectural, tactile, high-contrast luxury with Stripe-grade operational precision.
- **Design Philosophy**: High density with absolute typographical restraint. Hairline borders, deep obsidian surfaces, tabular numerals, zero generic blue (`#2563eb`), zero toy emojis, and zero decorative AI fluff.

---

## 2. Liveliness Dials (Default)

```yaml
Dial: ENERGY 2 / RHYTHM 2 / MOTION 1
```

- **ENERGY 2 (Balanced — Luxury Precision)**: Bold Marca Orange (`#ff6100`) accents on an obsidian canvas with specular top highlights (`1px solid rgba(255, 255, 255, 0.08)`). No neon blowout, no sterile grey defaults.
- **RHYTHM 2 (Structured Fluidity)**: Consistent vertical grid rhythm with deliberate architectural breaks for KPI ribbons, virtualized data grids, and slide-out client dossiers.
- **MOTION 1 (Subtle & Tactile)**: Tactile spring button feedback (`active: scale(0.98)`), 1px elevation lift on card hover, zero looping animations or disorienting full-page fades.

---

## 3. Master Color Palette & Surface Physics

### A. Core Palette (Max 3 Cores + 1 Accent per Rule R-29)
- **Canvas Base**: `#000000` / `#0b0b0b` (Deep obsidian black canvas)
- **Primary Card Container**: `#111111` / `#141418` (Surface base with top specular gradient `rgba(255, 255, 255, 0.08)`)
- **Hairline Border**: `1px solid rgba(255, 255, 255, 0.08)` / `#2b2b2b`
- **Brand Accent**: **Marca Orange** (`#ff6100` / gradient `linear-gradient(135deg, #ff6100 0%, #e05500 100%)`)

### B. Semantic Status Tokens (Strictly Paired with Semantic Vector Icons)
- **Converted / Active**: `#22c55e` (Emerald green)
- **Potential / On Hold**: `#f59e0b` (Amber gold)
- **Negotiation / In Review**: `#ff6100` (Marca Orange)
- **Lost / Overdue**: `#ef4444` (High-contrast red)
- **Muted Metadata**: `#888888` / `#7c7c7c` (Secondary labels & timestamps)

---

## 4. Typography & Numeric Precision

- **Headings**: `$font-movatif`, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif.
- **Body**: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif.
- **Technical Monospace**: `SF Mono`, `Fira Code`, Menlo, Consolas, monospace.
- **Micro-Labels**: 10.5px / 11px uppercase with `letter-spacing: 0.06em` (tracking), font weight 600.
- **Financial & Pipeline Numerals**: Mandatory `font-variant-numeric: tabular-nums; font-feature-settings: "tnum" 1;` for zero-jitter layout stability during number transitions.
- **Currency Formatting**: Dual-currency support: INR (Lakhs/Crores: `₹ 48.5L`, `₹ 1.2Cr`) and USD (`$ 35,000`).

---

## 5. Context-Adaptive Visual Archetypes

| Domain / Context | Visual Archetype | Aesthetic Formula |
|---|---|---|
| **Executive Analytics** | **Stripe Scorecards** | Deep container (`#111111`), 1px top specular highlight, 26–30px tabular values, delta pills |
| **Pipeline Table** | **Linear Fluid Cards** | Hairline borders (`rgba(255, 255, 255, 0.08)`), virtualized 72px row rhythm, zero nested cards |
| **Workspace Navigation** | **Apple HIG Vibrancy** | Frosted glass capsules (`rgba(17, 17, 17, 0.75)`), `backdrop-blur(16px)`, specular top-rim highlight |
| **Lead Identifiers & Codes** | **Raycast Monospace Tokens** | Compact 6px rounded chips, 11px monospace, semantic radar dot |
| **Touchpoints & Audit Logs**| **Notion Callouts** | Warm neutral background (`rgba(255, 255, 255, 0.03)`), 2px solid quote left accent, relaxed leading |

---

## 6. Anti-AI-Slop Governance

In accordance with `anti-slop`:
1. **Zero AI Buzzwords**: Never use *unlock*, *elevate*, *seamless*, *revolutionary*, or *next-generation*. State concrete product features directly.
2. **Zero Em-Dashes (`—`) in UI copy**: Use commas, periods, colons, or parentheses in user-facing UI copy.
3. **Zero Fake Realism**: Every metric, revenue figure, and status derives from real PostgreSQL/Supabase queries; never fabricate mock curves or placeholder numbers.
4. **Resilient Functional Completeness**: Every button, pill, modal, and drawer must have a working click/navigation handler.
