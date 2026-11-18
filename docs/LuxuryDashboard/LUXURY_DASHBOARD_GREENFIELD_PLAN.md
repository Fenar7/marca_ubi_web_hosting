# Luxury Dashboard Greenfield Implementation Plan

> **Feature Directory:** `src/app/admin/components/LuxuryDashboard/`  
> **Reference Design:** `CONYEST` Dashboard (`uploaded_media_1794342207825.webp` / `Screenshot 2026-11-11 013315.png`)  
> **Status:** IMPLEMENTATION PHASE

---

## 1. Executive Vision & Alignment
As per the Greenfield mandate, this specification translates the CONYEST design system into the **Marca Ubi Luxury Dashboard** component architecture.

### Key Aesthetic & Architectural Anchors:
1. **Ultra-Clean Soft Canvas (`#f8f8f8`) with Floating Pure-White Cards (`#ffffff`)**:
   - Generous `20px-24px` card border radii.
2. **Iconic Navigation Sidebar**:
   - Minimalist vertical layout with the **electric lime-green active pill button** (`#94e622`).
3. **4-Card Top Metrics Row**:
   - Virtual Card Widget + 3 Pure White Scorecards.
4. **Middle Asymmetric Visual Row (68% / 32% Split)**:
   - "Cashflow" Dual-Directional Bar Chart & "Statistic" Donut Card.
5. **Bottom Commercial Transactions / Deals Ledger Table**.

---

## 2. Reverse-Engineered Visual Tokens
(See `docs/crm_conyest_redesign/CONYEST_LUXURY_DASHBOARD_REDESIGN_PLAN.md` for full token definitions).

---

## 3. Implementation Steps
- **Phase A: Shell & Tokens** (Set up directory, SCSS modules, basic sidebar/header layout).
- **Phase B: Components** (Implement Metrics Grid, Cashflow Chart, Donut Chart, Transactions Table).
- **Phase C: Charts** (DataViz integration).
- **Phase D: Integration & Security** (Supabase Server Action wiring, RLS checks).

---

## 4. Execution
Follow phase-by-phase strict adherence to this plan, ensuring 8px grid, circular XX, and brand color palette (`#ea002a`, etc).
