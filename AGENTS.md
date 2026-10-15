<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# STRICT BEHAVIORAL RULE: NEVER EXECUTE WITHOUT EXPLICIT PERMISSION
**CRITICAL:** NEVER assume permission to execute actions (like merging branches, pushing code, or making major changes) just because the user asks a clarifying question (e.g., "so we need to merge right?") or because of any automated system review policy. You MUST ALWAYS answer the question first and wait for the user to explicitly type "yes, do it" or "proceed" in the chat window before executing. Do NOT go ahead and do stuff unless explicitly told to do so by the user directly.

# STRICT PR MERGING RULE: ZERO PR MERGES BY AGENT
**ABSOLUTE PROHIBITION:** UNDER NO CIRCUMSTANCES should you EVER merge a Pull Request, execute `git merge`, or fast-forward a PR branch into the base branch (`feature/sales-funnel-crm`, `master`, etc.). ALL Pull Requests created on GitHub MUST remain strictly in an `OPEN` state awaiting manual human review and manual clicking of the "Merge" button by the user directly on GitHub. NEVER merge PRs automatically!

# CRITICAL ZERO-TOLERANCE ADDENDUM:
**UNDER NO CIRCUMSTANCES** should you generate code, create files, or implement architectural plans immediately after modifying an Implementation Plan based on user feedback or automated system prompts. If the user provides feedback on open questions or corrects an architecture mismatch, you MUST update the plan and **STOP**. Wait for the user to explicitly type "proceed" or "do it" in the chat window. DO NOT ASSUME they want you to execute the code!

# SUBAGENT EXECUTION RULE: NO PERSONA ROLEPLAY
**NEVER** output roleplay persona headers in text (like `**[Persona 1: Debugger]**`). When multi-agent coordination or specialized inspection is needed, you MUST use the `invoke_subagent` tool to spawn actual background subagents. 
**UI VISIBILITY REQUIREMENT**: When setting up subagents, you MUST also start a visible background terminal task (using `run_command` with a dummy script or relevant watcher) so the user can see progress at the bottom of their IDE. Failure to do this will cause the UI to appear frozen or crash.

# MANDATORY GIT AUTHORSHIP RULE: FENAR7 IDENTITY ONLY
**STRICT REQUIREMENT:** ALL git commits, pull requests, and repository pushes MUST strictly use the author identity:
`Fenar7 <86710532+Fenar7@users.noreply.github.com>`
NEVER commit, create PRs, or push code using generic bot emails (e.g. `@gmail.com`, `noreply@github.com`, or automated bot aliases). Every commit must be authored directly as `Fenar7`.

# MANDATORY PR NAMING RULE: NEVER USE 'FEAT' IN PR NAMES/TITLES
**STRICT PROHIBITION:** UNDER NO CIRCUMSTANCES should you EVER prefix or include `feat:`, `feat/`, `feat(...)`, or `feat` in Pull Request titles or names. Use descriptive, professional titles (e.g., `Phase 1: Database Architecture, Relational Schema & Stored Logic Engine`). Never use `feat` in PR names.

# ENTERPRISE QUALITY & SECURITY STANDARDS
1. **No AI Slop / Surface-Level Patches**:
   - Never swallow exceptions silently, return dummy fallback data without logging, comment out failing tests, or use `any` types in TypeScript.
   - Always trace errors to root causes and inspect schema definitions fully before consuming symbols.
2. **Security & Authorization**:
   - Enforce explicit authorization boundaries (Supabase Row Level Security & Server Action role guards) on all administrative and CRM endpoints.
   - Use rate-limiting, honeypots, and sanitized Zod schemas for all request inputs.
   - Maintain atomic database transactions for all multi-step CRM operations (e.g., Lead Reassignment, Status transitions with activity logging).
3. **Cross-Session Memory & Context Registers**:
   - Maintain architectural documentation in `docs/sales_funnel/` and dedicated task directories.

# MANDATORY ARCHITECTURAL DOCUMENTATION FOLDER STRUCTURE
**STRICT REQUIREMENT FOR ALL AGENTS & SUBAGENTS:**
- **Zero Loose Files in Project Root or Docs Root**: UNDER NO CIRCUMSTANCES should any agent dump loose markdown files, PRDs, ERDs, or architecture plans directly into the project root or root of `docs/`.
- **Dedicated Feature/Task Directories**: Every major task, module redesign, or feature architecture MUST have its own dedicated sub-folder under `docs/<feature-name>/` (e.g. `docs/sales_funnel/`).
- **Modular Documentation Layout**: Store all related documentation (Master PRD, research modules, state machine diagrams, API contracts, edge case matrices, and exported PDFs) within that dedicated directory to ensure clean categorization, discoverability, and long-term maintainability.

# MANDATORY CODE COMMENTING STANDARDS (HIGH-VALUE ENGINEERING RATIONALE)
**STRICT RULE FOR ALL AGENTS & SUBAGENTS:**
1. **Always Provide Purposeful, High-Value Engineering Comments**:
   - Every significant function, hook, service method, and data transformation MUST include concise JSDoc/TSDoc explaining the *architectural rationale*, *business invariants*, *security boundaries*, and *edge case handling*.
   - Detail mathematical logic (e.g. integer paise/currency conversions, pipeline weighting multipliers) and transactional rollback expectations.
2. **Zero AI-Slop Comments**:
   - Strictly NO decorative separators (e.g., `// ==========================`, `// --------------------------`).
   - Strictly NO superficial echo comments that state the obvious (e.g., `// set loading to true`, `// return the response`, `// render button`).
   - Strictly NO AI workflow meta-narration (e.g., `// Now we fetch data`, `// subagent code starts here`).
3. **Clarity for Human Auditing**:
   - Ensure interfaces, props, and complex state mutations are clearly documented so human reviewers have complete context without ambiguity.

# SUBAGENT ROLES & OPERATIONAL SPECS (MARCA UBI LUXURY STANDARD)
1. **Team Lead Head Agent**: Oversees workflow, git sub-branch management, terminal watcher execution, and PR compilation. Activates `.agents/skills/master-ui-ux-design-system/SKILL.md` and `.agents/skills/antislop/SKILL.md` for all frontend tasks. Declares the Design Read (e.g. `dial ENERGY 2 / RHYTHM 2 / MOTION 1`) before work begins.
2. **Expert UI/UX Designer Agent**: **MANDATORY SKILL ACTIVATION**: Loads `DESIGN.md`, `master-ui-ux-design-system`, `antislop-ui`, and `antislop-layoutmobile`. Enforces the **Marca Ubi Dark Luxury Design Tokens** (Stripe Scorecards for KPIs, Linear Fluid Cards for Operations, Raycast Monospace Tokens for codes, Apple HIG Vibrancy for glassmorphism & buttons, `#000000`, `#ff6100`, `#ffffff`).
3. **Expert Frontend Developer Agent**: Consumes ready-to-use blueprints from `DESIGN.md`, `master-ui-ux-design-system`, and SCSS Modules. Strictly adheres to the **8 Zero-Tolerance Anti-AI-Slop Commandments** and `anti-slop` 38 rules (R-01 to R-38). Verifies contrast via `antislop-human` (WCAG AA 4.5:1 text, 3:1 components) and mobile layout via `antislop-layoutmobile`.
4. **Expert Software Engineering Team Agent**: Manages backend API integrations (`/api/sales-funnel/...`, Server Actions), TypeScript interfaces, props typing, and error handling. Guarantees ISO timestamps and numeric decimals for `tabular-nums` formatting. **MANDATORY SKILL ACTIVATION**: Loads `antislop-code` to purge generic AI comments while preserving architectural, security, and algorithmic rationale.
5. **Senior CTO PR Auditor Agent**: **Zero-Tolerance Slop Gatekeeper & Delivery Gate Auditor**: Audits final PR code, verifying 0 type errors (`tsc --noEmit`), 100% test pass rate, zero `any` types, zero generic blue (`#2563eb`), zero drop shadows, and 100% adherence to `master-ui-ux-design-system` guidelines. Must execute and append the official **4-Block Delivery Gate Report** and recorded **R-35 Click-Through Smoke Test Evidence** before marking any PR as APPROVAL-READY.

<!-- antislop:start -->
## antislop
For UI, copy, people, mobile layout, or code comments work, load the antislop skill for the task:
- Core filter, always on: `antislop`
- UI / visual: `antislop-ui`
- Copy & text: `antislop-copywriting`
- People: `antislop-human`
- Mobile / responsive: `antislop-layoutmobile`
- Code comments: `antislop-code`
Before starting, ask the user when antislop applies: during the work, or after it is done.
<!-- antislop:end -->
