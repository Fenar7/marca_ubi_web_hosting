---
name: frontend-design
description: >-
  Creates distinctive, production-grade frontend interfaces with boutique art direction.
  Use when building or styling web components, landing pages, dashboards, and responsive
  layouts. Enforces plan-first visual design, intentional typography and color choices,
  anti-cliché self-critique, and eliminates generic AI slop.
---

# 🎨 Frontend Design — Boutique Art Direction & Anti-Cliché Engineering

> **Core Philosophy**: A user interface must feel **deliberately crafted by an elite design studio**, not assembled by an AI from generic templates. Every design choice (color, typography, layout, density, and animation) must have an explicit rationale and serve the product's identity.

--------------------------------------------------------------------------------

## 1. The 4-Phase Design Workflow

Before writing any HTML, CSS, or TSX code, execute this 4-phase design workflow:

### Phase 1: Grounding in the Subject & Context
1. **Audience & Intent**: Who is using this interface and what is their primary objective? (e.g. Executive CRM triage vs. high-conversion consumer showcase).
2. **Emotional Tone & Stance**: Choose a distinct, deliberate conceptual tone. Never settle for "safe, generic modern SaaS". Examples:
   - *Swiss Luxury / Minimalist Editorial*: Hairline borders, calm surfaces, generous typography, high contrast, near-black ink.
   - *Obsidian Telemetry / Financial Desk*: Graphite depths, 1px specular rims, tabular monospace data, glowing status pulses.
   - *Kinetic Motion / Showcase*: Smooth fluid transitions, rich hero cutouts, spring physics.
3. **Primary Constraints**: Technical boundaries (e.g. Next.js App Router, SCSS Modules, CSS custom properties, zero layout shift).

### Phase 2: The Concrete Design Plan
Declare your design choices across these four vectors:
1. **Restricted Color Palette (4–6 Hex Codes Only)**:
   - *Dominant Surface*: e.g. `#ffffff` (Canvas), `#f5f5f3` (Warm neutral backing)
   - *Core Ink / Text*: e.g. `#111111` (Primary ink), `#475569` (Secondary muted, WCAG AAA 7.58:1)
   - *Brand Primary Accent*: e.g. `#ea002a` (Marca Ubi Red — reserved for primary triggers, active markers, and critical states)
   - *Semantic Telemetry Accent*: e.g. `#10b981` (Executive Emerald — for positive deltas and won contracts)
2. **Typography Hierarchy**:
   - *Display / Headings*: Brand typeface with character (e.g. Circular XX Bold or SF Pro Display) with tight tracking (`-0.025em`).
   - *Body / Labels*: High-legibility neutral sans (e.g. Graphik or SF Pro Text, 14–16px, 1.5 line height).
   - *Telemetry & Numbers*: Tabular monospace figures (`font-variant-numeric: tabular-nums`).
3. **Layout Concept & Spacing Architecture**:
   - Establish an asymmetric, content-driven layout grid (e.g. 68% / 32% asymmetrical split) rather than identical repeated boxes.
   - Maintain intentional white-space rhythm (spacing scale: 4px, 8px, 12px, 16px, 24px, 32px, 48px).
4. **The Signature Memorable Detail**:
   - What is the single unforgettable element that makes this view unmistakable? (e.g. An authentic 260° Open Arc Gauge with inset metrics; a dual-directional 1:1 Rupee parity velocity bar chart; a specular top-rim glass header).

### Phase 3: The Anti-Cliché Self-Critique Review
Audit your design plan against common AI slop patterns:
- ❌ **Did I use overused purple-to-indigo or cyan gradients?** -> Replace with purposeful solid surfaces or subtle radial depth.
- ❌ **Is every card an identical rounded rectangle with a big drop shadow?** -> Replace with clean row strips, tabular columns, or hairline borders.
- ❌ **Are there unmotivated decorations (sparkle icons, floating orbs, decorative mesh grids)?** -> Purge immediately.
- ❌ **Does it look like a generic copy of Linear, Vercel, or Stripe?** -> Root the design in Marca Ubi's distinct identity (`DESIGN.md`).

> If your plan reads like the generic default an AI would produce for any generic page, **revise your plan and state what was changed and why** before proceeding to code.

### Phase 4: Production Execution & Quality Floor
Once the design plan passes critique, write clean, production-grade code adhering to:
- **WCAG 2.1 AA/AAA Contrast**: 4.5:1 minimum for body text, 3:1 for graphical controls and component boundaries.
- **Visible Keyboard Focus**: `:focus-visible` with clean 2px offset rings on all interactive elements.
- **Touch Ergonomics**: Minimum 44×44px hit targets for interactive controls.
- **Fluid Responsiveness**: Design mobile and tablet reflow from the start; zero horizontal scroll overflow.
- **Reduced Motion Support**: Wrap CSS transitions and keyframes in `@media (prefers-reduced-motion: reduce)`.

--------------------------------------------------------------------------------

## 2. Harmonization with Marca Ubi Standards

When operating in the Marca Ubi workspace:
1. **Primary Authority**: `DESIGN.md` governs brand colors, typography, and interface intent.
2. **Anti-Slop Integration**: Complements `.agents/skills/antislop/SKILL.md` (R-01 to R-38). Frontend Design provides the *positive art direction* while antislop enforces the *negative gate filters*.
3. **Component BLUEPRINTS**: Reference `.agents/skills/master-ui-ux-design-system/SKILL.md` for mathematical squircle formulas, concentric border radii ($R_{inner} = R_{outer} - \text{padding}$), and SCSS mixins.
