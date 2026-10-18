# Operational Runbook: Enterprise Secret Management & Zero-Downtime Rotation

**Document ID**: `RUNBOOK-SEC-01`  
**Milestone**: Phase 10: QA Engineering, Performance & Release Runbooks  
**Sprint**: Sprint 10.3: Security, Accessibility & Production Runbooks  
**Target Environment**: Staging & Production (Vercel Serverless Edge & Supabase Cloud PostgreSQL 15+)  
**Classification**: Enterprise Confidential  
**Author**: `Fenar7 <86710532+Fenar7@users.noreply.github.com>`  
**Last Verified**: October 18, 2026  

---

## 1. Executive Summary & Purpose

This operational runbook defines the authoritative cryptographic secret hierarchy, security classifications, and step-by-step zero-downtime rotation procedures for the Marca Ubi Enterprise CRM & Sales Intelligence Platform.

Maintaining uninterrupted 24/7 client lead ingestion and agency sales operations requires that all cryptographic keys, database passwords, session signing secrets, and webhook tokens can be rotated safely without downtime, session drops, or packet loss.

---

## 2. Cryptographic Secret Classification Matrix

All environment variables and credentials utilized across the Next.js runtime and Supabase database infrastructure are classified into distinct security tiers:

| Secret Identifier | Classification | Scope & Injection Target | Rotation Impact | Rotation Frequency |
|---|---|---|---|:---:|
| `NEXT_PUBLIC_SUPABASE_URL` | Public Client | Browser & Server Bundles | Requires full frontend rebuild and redeployment. | Infrastructure migration only |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public Client | Browser & API Requests | Low. Governed strictly by PostgreSQL Row Level Security (RLS). | Annual / On suspected leak |
| `SUPABASE_SERVICE_ROLE_KEY` | Highly Confidential | Vercel Server-Side Only | High. Bypasses RLS. Secret leakage exposes raw database records. | Bi-annual (180 days) |
| `SUPABASE_JWT_SECRET` | Highly Confidential | Supabase Auth Engine | Critical. Signs and verifies all active session cookies. Invalidation drops sessions. | Annual (Scheduled maintenance) |
| `SUPABASE_DB_PASSWORD` | Highly Confidential | Supavisor Pooler & CI Runners | High. Direct administrative database connection credential. | Bi-annual (180 days) |
| `INGESTION_WEBHOOK_SECRET` | Confidential | Next.js API Routes (`/api/...`) | Medium. Authenticates inbound briefs and external webhook submissions. | Quarterly (90 days) |
| `CRON_SECRET` | Confidential | Next.js Route Handlers | Medium. Restricts `/api/sales-funnel/cron/*` execution to authorized callers. | Quarterly (90 days) |

---

## 3. Zero-Downtime Secret Rotation Flow

```
┌────────────────────────────────────────────────────────────────────────┐
│                 ZERO-DOWNTIME SECRET ROTATION ARCHITECTURE             │
├────────────────────────────────────────────────────────────────────────┤
│ Step 1: Provision Secondary Credential in Supabase Management Console   │
│         (Both Old Key and New Key valid concurrently for 24 hours)     │
│                                   │                                    │
│ Step 2: Inject New Key into Vercel Staging & Production Environments   │
│         vercel env add SUPABASE_SERVICE_ROLE_KEY production            │
│                                   │                                    │
│ Step 3: Trigger Zero-Downtime Production Deployment & Edge Warmup       │
│         vercel --prod --force                                          │
│                                   │                                    │
│ Step 4: Execute Post-Deployment Health Check & Ingestion Test          │
│         curl -f https://crm.marcaubi.com/api/sales-funnel/health       │
│                                   │                                    │
│ Step 5: Verify Active Ingestion & Multi-Role Query Routing             │
│         npm run test:rls && npm run test:unit                          │
│                                   │                                    │
│ Step 6: Revoke Deprecated Old Credential in Supabase Console           │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Step-by-Step Rotation Procedures

### 4.1 Rotating `SUPABASE_SERVICE_ROLE_KEY`

The service role key possesses superuser database privileges and bypasses RLS. Rotating this key requires strict dual-key concurrency:

1. **Generate Secondary Service Role Key**:
   - Access the Supabase Project Settings: `Project Settings -> API -> Project API Keys`.
   - Click **Generate New Key** under `service_role`.
   - Select **Enable Dual-Key Grace Period (24 Hours)** so both keys remain valid simultaneously.

2. **Update Vercel Staging Environment**:
   ```bash
   echo "<NEW_SERVICE_ROLE_KEY>" | vercel env add SUPABASE_SERVICE_ROLE_KEY preview --force
   vercel redeploy <staging-deployment-url>
   ```

3. **Validate Staging Integrity**:
   - Execute the automated RLS isolation suite against staging:
     ```bash
     npm run test:rls
     ```

4. **Promote to Vercel Production Environment**:
   ```bash
   echo "<NEW_SERVICE_ROLE_KEY>" | vercel env add SUPABASE_SERVICE_ROLE_KEY production --force
   vercel --prod --force
   ```

5. **Verify Production Health**:
   - Query the administrative health endpoint:
     ```bash
     curl -i -H "Authorization: Bearer <CRON_SECRET>" https://crm.marcaubi.com/api/sales-funnel/cron/reactivate-on-hold
     ```
   - Confirm HTTP 200 response and JSON health payload.

6. **Revoke Previous Key**:
   - Return to Supabase Console `Project Settings -> API` and delete the deprecated key.

---

### 4.2 Rotating `SUPABASE_DB_PASSWORD` & Pooler Credentials

The database password secures direct PostgreSQL connections (Port 5432) and Supavisor Transaction Pooler connections (Port 6543):

1. **Select Maintenance Window**:
   - Schedule during low-traffic window (Sunday 02:00–03:00 UTC).

2. **Generate High-Entropy Password**:
   - Generate a 32-character cryptographic string:
     ```bash
     openssl rand -base64 24
     ```

3. **Update Database Password in Supabase**:
   - In Supabase Console: `Database -> Database Settings -> Database Password -> Reset Password`.
   - Note: Supabase pooler connections are updated automatically in Supavisor within 30 seconds.

4. **Update Application Connection String**:
   - Construct the new transaction pooler URI:
     `postgresql://postgres:[NEW_PASSWORD]@db.[PROJECT_REF].supabase.co:6543/postgres?pgbouncer=true`
   - Inject into Vercel production:
     ```bash
     vercel env add DATABASE_URL production --force
     vercel --prod
     ```

5. **Verify Pooler Health**:
   - Execute query profiler to verify sub-millisecond connection response:
     ```bash
     npm run test:load
     ```

---

### 4.3 Rotating `INGESTION_WEBHOOK_SECRET` & `CRON_SECRET`

1. **Generate New Secret**:
   ```bash
   NEW_SECRET=$(openssl rand -hex 32)
   echo "Generated secret: $NEW_SECRET"
   ```

2. **Deploy to Vercel**:
   ```bash
   echo "$NEW_SECRET" | vercel env add CRON_SECRET production --force
   vercel --prod
   ```

3. **Update External Schedulers (Vercel Cron / GitHub Actions)**:
   - Update repository secrets in GitHub: `Settings -> Secrets and variables -> Actions -> CRON_SECRET`.
   - Update Vercel Cron headers in `vercel.json` if configured.

4. **Verify Route Authorization**:
   - Attempt unauthenticated request (must return HTTP 401 Unauthorized):
     ```bash
     curl -s -o /dev/null -w "%{http_code}" https://crm.marcaubi.com/api/sales-funnel/cron/reactivate-on-hold
     # Expected: 401
     ```
   - Attempt authenticated request (must return HTTP 200 OK):
     ```bash
     curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $NEW_SECRET" https://crm.marcaubi.com/api/sales-funnel/cron/reactivate-on-hold
     # Expected: 200
     ```

---

## 5. Emergency Compromised Key Revocation Protocol

If a production secret is accidentally committed to public version control or leaked:

1. **Immediate Revocation (< 5 minutes)**:
   - Execute emergency revocation script to immediately invalidate the compromised key in Supabase Console.
   - Flush all active JWT sessions in PostgreSQL:
     ```sql
     -- Revoke all active user refresh tokens immediately
     UPDATE auth.refresh_tokens SET revoked = true WHERE revoked = false;
     ```

2. **Audit Access Logs (< 15 minutes)**:
   - Query `public.team_audit_logs` for any anomalies or unauthorized privilege escalations:
     ```sql
     SELECT * FROM public.team_audit_logs 
     WHERE created_at >= NOW() - INTERVAL '24 hours' 
     ORDER BY created_at DESC;
     ```

3. **Deploy Replacement Key (< 30 minutes)**:
   - Follow Section 4.1 to inject and deploy the new key across Vercel production.
   - Force all active administrative users to re-authenticate.

4. **Publish Post-Incident Review (PIR)** within 24 hours.
