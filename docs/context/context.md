# Current Engineering Context

**Latest work (2026-11-17 14:00):** Phase 18: CRM Follow-Up Queue (`/admin/tasks`), Client Works (`/admin/works`), and Lead Actions Schema Resilience & Directory Fallback Engine. Completely resolved fatal PostgREST `PGRST200` ("relationship between leads and crm_team_directory") and `PGRST205` ("crm_team_directory missing from schema cache") errors. Read [2026-11-17 14:00 register](./2026-11-17_14-00-00.md) first.

**Active work:** CRM Follow-Up Queue Schema Resilience & Directory Fallback Engine (Phase 18).  
**Active branch:** `fix/crm-tasks-directory-schema-resilience`.  
**Target branch:** `redesign/commercial-desk-notion-linear` (Child PR #122 OPEN).  
**Latest handoff:** [2026-11-17_14-00-00.md](./2026-11-17_14-00-00.md). Use that detailed register as current source of truth.

**Task state:** Multi-tier directory resolution implemented (`src/app/admin/lib/crmDirectory.ts`), primary queries decoupled from view joins in `/admin/tasks` and `/admin/works`, Server Actions updated to base table joins, unit tests passing 100%, TypeScript 0 errors, PR created. All PRs remain strictly OPEN awaiting manual human review. NEVER auto-merge.

**Historical registers:** [2026-11-17 14:00 register](./2026-11-17_14-00-00.md), [2026-11-16 15:00 register](./2026-11-16_15-00-00.md), [2026-11-16 14:00 register](./2026-11-16_14-00-00.md), [2026-11-14 21:00 register](./2026-11-14_21-00-00.md), [2026-11-14 19:30 register](./2026-11-14_19-30-00.md), [2026-11-14 14:10 register](./2026-11-14_14-10-00.md), [2026-11-14 12:30 register](./2026-11-14_12-30-00.md), [2026-11-13 16:35 register](./2026-11-13_16-35-00.md), [2026-11-13 13:45 register](./2026-11-13_13-45-00.md), [2026-11-13 10:45 register](./2026-11-13_10-45-00.md), [2026-11-12 00:45 register](./2026-11-12_00-45-00.md), [2026-11-11 03:45 register](./2026-11-11_03-45-00.md), [2026-11-09 20:15 register](./2026-11-09_20-15-00.md), [2026-11-09 18:30 register](./2026-11-09_18-30-00.md), [2026-11-09 14:15 register](./2026-11-09_14-15-00.md), [2026-11-09 23:45 register](./2026-11-09_23-45-00.md), [2026-11-09 23:00 register](./2026-11-09_23-00-00.md), [2026-11-09 19:00 register](./2026-11-09_19-00-00.md), [2026-11-07 15:00 register](./2026-11-07_15-00-00.md), [2026-11-07 11:00 register](./2026-11-07_11-00-00.md), and [2026-11-06 12:00 register](./2026-11-06_12-00-00.md).
