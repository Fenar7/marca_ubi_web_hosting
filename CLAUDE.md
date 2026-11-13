# Marca Ubi Enterprise — Claude Agent Guidelines

> **Project Identity**: Marca Ubi Enterprise Agency CRM & Sales Intelligence Platform.
> **Architecture & Multi-Agent Hierarchy**: Read `AGENTS.md` for strict behavioral rules, authorship requirements, and branch workflows.
> **Visual Direction & Brand Soul**: Read `DESIGN.md` for editorial light palette (`#ffffff`, `#f5f5f3`, `#111111`, `#ea002a`, Circular XX, Graphik).

---

## 🎨 Design & Frontend Engineering Skills Suite
All design, UI, and performance tasks must leverage the skills in `.agents/skills/`:

1. **Boutique Art Direction & Anti-Cliché**:
   - Skill: `.agents/skills/frontend-design/SKILL.md`
   - Plan-first design thinking, 4–6 specific hex colors, distinctive typography, and anti-cliché self-critique before coding.
2. **Design Intelligence & UX Guardrails**:
   - Skill: `.agents/skills/ui-ux-pro-max/SKILL.md`
   - Style profiles (Swiss Luxury, Bento Grid, Frosted Glass), domain telemetry palettes, Priority 1 (WCAG AA 4.5:1 text, 3:1 components) and Priority 2 (44px touch targets) checklists.
3. **Next.js & React 19 Performance**:
   - Skill: `.agents/skills/vercel-agent-skills/SKILL.md`
   - Request waterfall elimination (`Promise.all`, Suspense streaming), bundle hygiene, atomic Server Actions, and zero CLS.
4. **Brand Tokens & Component Archetypes**:
   - Guidelines: `DESIGN.md` & `.agents/skills/master-ui-ux-design-system/SKILL.md`
5. **Anti-Slop Quality Gate (Core Filter)**:
   - Filter: `.agents/skills/antislop/SKILL.md` (R-01 to R-38)

---

## 🔒 Strict Behavioral Invariants
- **NEVER merge pull requests automatically.** All PRs must remain strictly in an OPEN state.
- **Git Authorship**: Strictly authored as `Fenar7 <86710532+Fenar7@users.noreply.github.com>`.
- **Quality Gates**: Every change must pass `npx tsc --noEmit` (0 errors) and `npm run test:boundaries` (100% compliant).
- **Knowledge Graph**: Run `graphify update .` after modifying code files.
