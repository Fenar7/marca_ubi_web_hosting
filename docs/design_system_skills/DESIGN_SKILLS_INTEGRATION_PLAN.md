# Architectural Plan: Installing & Configuring Elite Frontend Design Skills

**Target Directory:** `docs/design_system_skills/DESIGN_SKILLS_INTEGRATION_PLAN.md`  
**Date:** 2026-11-13  
**Status:** PROPOSED & READY FOR APPROVAL  
**Author:** `Fenar7 <86710532+Fenar7@users.noreply.github.com>`

---

## 1. Executive Summary & Objective

The objective is to install, configure, and integrate three industry-leading AI Agent Skills into the Marca Ubi workspace (`.agents/skills/`):
1. **Frontend Design – Anthropic (`frontend-design`)**: Boutique art direction, intentional typography/color choices, and anti-cliché self-critique before coding.
2. **UI UX Pro Max (`ui-ux-pro-max`)**: Deep design intelligence engine with searchable UI styles (Glassmorphism, Minimalist, Luxury, Bento), 150+ domain-mapped color palettes, font pairings, and strict UX/accessibility checklists.
3. **Vercel Agent Skills (`vercel-agent-skills`)**: Next.js App Router performance, React 19 best practices, waterfall elimination, composition patterns, and Web Vitals / accessibility hygiene.

These three skills will be harmonized with our existing brand design system (`master-ui-ux-design-system` and `antislop`) to guarantee that all future frontend implementations are visually stunning, mathematically rigorous, accessible, and fast.

---

## 2. Research & Architecture Breakdown

### Skill 1: Anthropic Frontend Design (`frontend-design`)
- **Source:** Official `anthropics/skills/skills/frontend-design` repository.
- **Role:** Design Director / Aesthetic Guardian.
- **Key Capabilities:**
  - **Plan-First Workflow:** Enforces design grounding before code: target audience, aesthetic tone, visual hierarchy, and 4–6 hex colors.
  - **Anti-AI-Slop Filter:** Explicitly prevents generic AI tropes: purple-to-indigo gradients, cookie-cutter rounded cards, Inter/Roboto monoculture, and uniform padding.
  - **Standout Element:** Mandates defining the "unforgettable" focal element that gives each page or component a distinct soul.
  - **Self-Critique Review:** Evaluates the generated plan against the brief before implementation begins.
- **Workspace Location:** `.agents/skills/frontend-design/SKILL.md`.

---

### Skill 2: UI UX Pro Max (`ui-ux-pro-max`)
- **Source:** Open-source `nextlevelbuilder/ui-ux-pro-max-skill` (CLI: `ui-ux-pro-max-cli` / `uipro`).
- **Role:** Design Intelligence Engine & Searchable Reference Library.
- **Key Capabilities:**
  - **Curated UI Styles:** Ready-to-use profiles for Glassmorphism, Luxury Editorial, Bento Grid, Neumorphism, Brutalism, and AI-Native interfaces.
  - **Industry Palette Mapping:** Over 150 curated palettes categorized by domain (Fintech, Luxury, SaaS, Health, Developer Tools).
  - **Typography Pairings:** Intentional pairings for display, body, and monospace telemetry.
  - **Prioritized UX Guardrails:**
    - *Priority 1 (Critical):* WCAG AA/AAA contrast ratios (4.5:1 text, 3:1 components), visible focus rings, keyboard tab navigation, explicit button labels.
    - *Priority 2 (Touch & Interaction):* 44×44px minimum touch targets, hover/focus/active states, tactile loading feedback.
- **Workspace Location:** `.agents/skills/ui-ux-pro-max/SKILL.md` (with bundled reference tables).

---

### Skill 3: Vercel Agent Skills (`vercel-agent-skills`)
- **Source:** Official `vercel-labs/agent-skills` (`vercel-react-best-practices`, `vercel-composition-patterns`).
- **Role:** Senior Frontend Architect & Performance Auditor.
- **Key Capabilities:**
  - **Waterfall Eradication (Critical):** Eliminating sequential blocking requests via `Promise.all`, Suspense streaming, and deferred awaits.
  - **Bundle Optimization (Critical):** Barrel file avoidance, tree-shaking verification, code-splitting with `next/dynamic`.
  - **Server Actions & App Router Security:** Strict boundary enforcement, atomic mutations, and error handling.
  - **Re-render Minimization:** Proper state collocation, memoization of expensive geometry, and avoiding derived state antipatterns in effects.
  - **Accessibility & Web Vitals Audit:** Cumulative Layout Shift (CLS) prevention, responsive fluid units, and semantic landmarks.
- **Workspace Location:** `.agents/skills/vercel-agent-skills/SKILL.md`.

---

## 3. Workspace Integration & Multi-Layer Synergy

When installed into `.agents/skills/`, Antigravity will discover them automatically via progressive disclosure (reading YAML frontmatter and injecting full instructions on-demand).

```
┌────────────────────────────────────────────────────────────────────────┐
│                      MARCA UBI DESIGN & CODE MATRIX                    │
├────────────────────────────────────────────────────────────────────────┤
│ Layer 1: Art Direction & Anti-Cliché  │ frontend-design (Anthropic)    │
│ Layer 2: Design Intelligence & Styles │ ui-ux-pro-max                  │
│ Layer 3: Performance & Best Practices │ vercel-agent-skills (Vercel)   │
│ Layer 4: Brand Identity & Tokens      │ master-ui-ux-design-system     │
│ Layer 5: Slop Purge & Code Hygiene    │ antislop + antislop-code       │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Step-by-Step Implementation Plan

### Step 1: Create `.agents/skills/frontend-design/SKILL.md`
- Adapt Anthropic's official `frontend-design` skill into Antigravity YAML frontmatter.
- Include the 4-phase workflow: Subject Grounding -> Design Planning -> Anti-Cliché Critique -> Production Execution.

### Step 2: Create `.agents/skills/ui-ux-pro-max/SKILL.md`
- Structure the UI UX Pro Max design intelligence reference.
- Include style profiles (Bento, Glass, Luxury, Swiss), industry color palettes, typography guidelines, and Priority 1 & 2 UX checklists.

### Step 3: Create `.agents/skills/vercel-agent-skills/SKILL.md`
- Compile Vercel's React & Next.js performance rules: waterfall elimination, bundle size, server-action boundaries, and re-render prevention.

### Step 4: Register & Reference in `AGENTS.md` and `GEMINI.md`
- Add activation guidelines in `AGENTS.md` and `GEMINI.md` so that UI/UX and Frontend subagents automatically leverage these three skills for all future frontend and dashboard work.

### Step 5: Verification Gate
- Run `npx tsc --noEmit` and `npm run test:boundaries` to ensure workspace integrity.
- Run `graphify update .` to index the new skill nodes in the knowledge graph.
- Record session context in `docs/context/`.

---

## 5. Verification & Approval Gate

Per project behavioral guidelines:
- **No files or code will be generated until the user explicitly reviews this plan and gives permission ("proceed" or "do it").**
