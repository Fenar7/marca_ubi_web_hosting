# GitHub Copilot Custom Instructions for Marca Ubi Enterprise

## 1. Project Identity & Architecture
- **Framework**: Next.js App Router (React 19, TypeScript, SCSS Modules, Supabase SSR).
- **Core Rules**: Read `AGENTS.md` and `DESIGN.md`. All PRs must remain strictly in an `OPEN` state.

## 2. Design Skills & Quality Guidelines
When writing or reviewing frontend code, strictly follow the skills located in `.agents/skills/`:
- **Frontend Art Direction**: `.agents/skills/frontend-design/SKILL.md` (plan-first, 4–6 colors, anti-cliché review).
- **Design Intelligence**: `.agents/skills/ui-ux-pro-max/SKILL.md` (WCAG 4.5:1 text contrast, 44px touch targets).
- **Next.js Performance**: `.agents/skills/vercel-agent-skills/SKILL.md` (waterfall elimination via Promise.all, Suspense, zero CLS).
- **Anti-Slop Filter**: `.agents/skills/antislop/SKILL.md` (no generic purple gradients, no fake data, no unstyled stacked text).

## 3. Engineering & Authorship
- **Authorship**: All commits must be authored as `Fenar7 <86710532+Fenar7@users.noreply.github.com>`.
- **Validation**: Zero TypeScript errors (`npx tsc --noEmit`), 100% boundary compliance (`npm run test:boundaries`).
