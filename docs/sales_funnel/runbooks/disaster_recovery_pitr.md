# Operational Runbook: Disaster Recovery & Point-in-Time Recovery (PITR)

**Document ID**: `RUNBOOK-DR-02`  
**Milestone**: Phase 10: QA Engineering, Performance & Release Runbooks  
**Sprint**: Sprint 10.3: Security, Accessibility & Production Runbooks  
**Target Environment**: Staging & Production (Supabase Managed PostgreSQL 15+ Cluster & Vercel Edge)  
**Classification**: Enterprise Operational Standard  
**Author**: `Fenar7 <86710532+Fenar7@users.noreply.github.com>`  
**Last Verified**: October 18, 2026  

---

## 1. Executive Summary & Continuity Objectives

The Marca Ubi Enterprise CRM manages critical commercial agency deals, prospective client briefs, and financial pipeline valuations. An outage, data corruption event, or accidental schema destruction represents unacceptable business risk.

This runbook establishes:
1. **Continuous Write-Ahead Log (WAL) Streaming & Physical Backup Architecture**.
2. **Point-in-Time Recovery (PITR)** protocols with guaranteed **RPO $\le 5\text{ seconds}$** and **RTO $\le 30\text{ minutes}$**.
3. **Bi-Weekly Automated Restoration Drills** in isolated sandbox environments.
4. **Deterministic Incident Rollback Procedures** across application edge, database migrations, and transaction logs.

---

## 2. Backup Topology & Service Level Objectives

```
┌────────────────────────────────────────────────────────────────────────┐
│                   PRODUCTION DISASTER RECOVERY TOPOLOGY                │
├────────────────────────────────────────────────────────────────────────┤
│ 1. Continuous Write-Ahead Logging (WAL):                               │
│    - Committed transactions streamed in real time to encrypted storage.│
│    - Recovery Point Objective (RPO): <= 5 seconds.                     │
│    - Recovery Time Objective (RTO): <= 30 minutes.                     │
│                                                                        │
│ 2. Point-in-Time Recovery (PITR) Window:                               │
│    - Granular millisecond timestamp recovery for 30 rolling days.      │
│                                                                        │
│ 3. Daily Physical Base Backups:                                        │
│    - Full physical snapshots captured at 02:00 UTC daily.              │
│    - Cross-region cloud storage replication with 90-day retention.     │
│                                                                        │
│ 4. Bi-Weekly Restoration Drills:                                       │
│    - Automated restore drills on the 1st and 15th of every month.      │
│    - Validates schema parity, foreign keys, and sequence continuity.   │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Incident Severity & Escalation Matrix

| Severity Level | Definition & Symptoms | Maximum Triage Time | Primary Action Protocol |
|---|---|:---:|---|
| **Severity 1 (Critical Outage)** | Complete CRM unavailability, database failure, data loss, or RLS bypass. | **< 15 minutes** | Immediate Edge Maintenance Mode, rollback to immutable Vercel deployment, PITR database restore. |
| **Severity 2 (Degraded State)** | Core functional failure (e.g. `/api/sales-funnel/ingest` 500 errors, scheduler locks). | **< 30 minutes** | Targeted hotfix deployment or non-destructive database down-migration. |
| **Severity 3 (Non-Critical Defect)** | Minor visual defects, non-blocking UI alignment issues. | Next Sprint Cycle | Standard backlog triage and patch release. |

---

## 4. Step-by-Step Production Rollback & PITR Restoration Procedure

When a production incident requires rolling back application code or restoring database state, execute the following steps in sequence:

### Step 1: Engage Maintenance Mode at the Edge (< 2 minutes)
To prevent users from interacting with corrupt state and to buffer incoming public website briefs, activate Edge Maintenance Mode via Vercel Edge Config:

```bash
vercel edge-config set maintenance_mode=true
```

*Outcome: Edge Middleware immediately intercepts web requests, serving a branded 503 Maintenance page to dashboard users while queuing incoming `/api/sales-funnel/ingest` submissions in Cloudflare edge buffers to prevent data loss.*

---

### Step 2: Roll Back Application Frontend Code (< 5 minutes)
Identify the previous stable, immutable Vercel deployment hash and promote it immediately:

```bash
# List recent production deployments
vercel ls --prod

# Shift the production alias immediately to the stable deployment
vercel rollback dpl_previous_stable_hash --token=$VERCEL_TOKEN
```

*Outcome: The frontend and Server Actions instantly revert to the verified stable release.*

---

### Step 3: Handle Database Schema Reversal or PITR Restoration

Evaluate the nature of the database issue:

#### Scenario A: Non-Destructive Schema Change (Clean Down-Migration)
If the deployment added columns or non-breaking indexes that caused query plan regression, execute the verified down-migration SQL file:

```bash
# Execute down-migration on direct administrative port 5432
supabase db execute --file supabase/migrations/down/20261015120000_performance_indexing_down.sql
```

#### Scenario B: Data Corruption, Data Loss, or Broken Foreign Keys (PITR Restore)
If data corruption, destructive drops, or bad cascade deletes occurred, trigger Point-in-Time Recovery to the exact millisecond immediately preceding the deployment:

```bash
# Example target timestamp: 2026-10-18T10:15:00.000Z
supabase restore \
  --project-ref $SUPABASE_PROD_PROJECT_REF \
  --pitr-timestamp "2026-10-18T10:15:00.000Z"
```

*Outcome: Supabase pulls the closest preceding base backup and replays WAL transaction logs up to the exact specified millisecond, restoring the database with zero data corruption.*

---

### Step 4: System Health & Relational Parity Verification (< 5 minutes)
Execute the comprehensive integrity verification suite against the restored database:

```sql
-- 1. Verify foreign key integrity across core relations
SELECT count(*) AS orphan_activities
FROM public.lead_activities a
LEFT JOIN public.leads l ON a.lead_id = l.id
WHERE l.id IS NULL;
-- Expected: 0

-- 2. Verify lead code sequence continuity
SELECT last_value FROM public.lead_code_seq;
-- Expected: >= current maximum LD-XXXX numeric value

-- 3. Verify Row Level Security is fully active on all tables
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('leads', 'lead_activities', 'profiles', 'team_audit_logs');
-- Expected: true for all tables
```

Execute the automated test suites against the database instance:
```bash
npm run test:rls
npm run test:unit
```

---

### Step 5: Drain Buffered Queues & Disable Maintenance Mode (< 3 minutes)
Once database integrity is certified:

1. Re-enable production edge traffic:
   ```bash
   vercel edge-config set maintenance_mode=false
   ```
2. Replay buffered inbound briefs from Cloudflare edge queue into `/api/sales-funnel/ingest`.
3. Verify that new briefs appear in `public.leads` without errors.

---

### Step 6: Post-Incident Review (PIR) Protocol
Within 24 hours of incident mitigation:
1. Conduct an incident post-mortem with the engineering lead and CTO.
2. Publish an incident report detailing root cause, incident timeline, time to detect (TTD), time to resolve (TTR), and preventive backlog tasks.
3. Archive logs and metrics in `docs/sales_funnel/incident_reviews/`.
