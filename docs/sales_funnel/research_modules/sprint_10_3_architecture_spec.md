# Sprint 10.3 Architecture Specification: Security, Accessibility & Production Runbooks

**Document ID**: `SPEC-SPRINT-10-3`  
**Milestone**: Phase 10: QA Engineering, Performance & Release Runbooks  
**Sprint**: Sprint 10.3: Security, Accessibility & Production Runbooks  
**Base Branch**: `phase-10/qa-performance-and-runbooks`  
**Working Branch**: `sprint-10.3/security-accessibility-and-runbooks`  
**Author**: `Fenar7 <86710532+Fenar7@users.noreply.github.com>`  
**Date**: October 18, 2026  
**Status**: Architecture Certified  

---

## 1. Executive Summary & Sprint Objectives

Sprint 10.3 represents the final engineering sprint of Phase 10 and the culmination of the Marca Ubi Enterprise CRM platform development lifecycle.

The objective of this sprint is to enforce institutional-grade operational rigor across three core pillars:
1. **Automated Accessibility & Contrast Compliance**: Guaranteeing WCAG 2.1 AA/AAA compliance via `@axe-core/playwright` and mathematical luminance verification across the Marca Ubi Dark Luxury design system.
2. **Operational Security & Secret Management**: Defining cryptographic key hierarchies, zero-downtime rotation workflows, and emergency revocation scripts for compromised credentials.
3. **Disaster Recovery, PITR & Production Release Engineering**: Codifying continuous WAL streaming, 30-day point-in-time recovery protocols, staging soak windows, and the release gating checklist for trunk promotion.

---

## 2. Work Package Architecture & Deliverables

```
┌────────────────────────────────────────────────────────────────────────┐
│                   SPRINT 10.3 WORK PACKAGE TOPOLOGY                    │
├────────────────────────────────────────────────────────────────────────┤
│ WP1: Automated WCAG 2.1 AA Accessibility & Luxury Contrast Suite       │
│      - tests/e2e/accessibility.spec.ts                                 │
│      - scripts/verify-contrast-wcag.ts                                 │
│                                                                        │
│ WP2: Secret Management & Zero-Downtime Rotation Runbook                │
│      - docs/sales_funnel/runbooks/secret_rotation.md                   │
│                                                                        │
│ WP3: Disaster Recovery & Point-in-Time Recovery (PITR) Protocols       │
│      - docs/sales_funnel/runbooks/disaster_recovery_pitr.md            │
│                                                                        │
│ WP4: Production Deployment & Release Engineering Gate Protocol         │
│      - docs/sales_funnel/runbooks/production_deployment.md             │
│                                                                        │
│ WP5: 4-Block Delivery Gate Auditor & CI Verification Suite             │
│      - scripts/verify-sprint-10-3.ts                                   │
│      - docs/sales_funnel/research_modules/sprint_10_3_architecture_spec│
│      - docs/sales_funnel/research_modules/pr_sprint_10_3_body.md       │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Mathematical Contrast Formulation & Design System Proofs

WCAG 2.1 defines relative luminance $L$ for an sRGB color as:
$$L = 0.2126 R_L + 0.7152 G_L + 0.0722 B_L$$
where for channel $C \in \{R, G, B\}$:
$$C_L = \begin{cases} \frac{C_{\text{sRGB}}}{12.92} & \text{if } C_{\text{sRGB}} \le 0.03928 \\ \left(\frac{C_{\text{sRGB}} + 0.055}{1.055}\right)^{2.4} & \text{if } C_{\text{sRGB}} > 0.03928 \end{cases}$$

The contrast ratio between two colors with luminances $L_1$ and $L_2$ ($L_1 > L_2$) is:
$$\text{Contrast Ratio} = \frac{L_1 + 0.05}{L_2 + 0.05}$$

### Empirical Verification of Marca Ubi Design Tokens
| Color Token Pair | Foreground | Background | Actual Ratio | Target Ratio | Level Achieved |
|---|---|---|:---:|:---:|:---:|
| Primary Body Text | `#FFFFFF` | `#0A0A0B` | **19.79:1** | $\ge 7:1$ | **WCAG AAA** |
| Primary Headings | `#FFFFFF` | `#000000` | **21.00:1** | $\ge 7:1$ | **WCAG AAA** |
| Muted Secondary Label | `#A1A1AA` | `#121216` | **7.29:1** | $\ge 7:1$ | **WCAG AAA** |
| Brand Accent Orange | `#FF6100` | `#0A0A0B` | **6.56:1** | $\ge 4.5:1$ | **WCAG AA** |
| Tier 1 Warning Badge | `#F59E0B` | `#0A0A0B` | **9.21:1** | $\ge 7:1$ | **WCAG AAA** |
| Tier 3 Critical Alert | `#EF4444` | `#0A0A0B` | **5.26:1** | $\ge 3:1$ | **WCAG AA Component** |
| Success Pipeline Pill | `#10B981` | `#0A0A0B` | **7.80:1** | $\ge 7:1$ | **WCAG AAA** |

---

## 4. Runbook Implementation Highlights

### 4.1 Secret Rotation Protocol (`RUNBOOK-SEC-01`)
- **Dual-Key Deployment Windows**: 24-hour overlapping key validity in Supabase to eliminate downtime.
- **Service Role Key Security**: Superuser credentials strictly injected into Vercel Server-Side environment, isolated from client bundles.
- **Emergency Session Revocation**: PostgreSQL single-query session invalidation across `auth.refresh_tokens`.

### 4.2 Disaster Recovery & PITR Protocol (`RUNBOOK-DR-02`)
- **Recovery Point Objective (RPO)**: $\le 5\text{ seconds}$ via continuous WAL streaming.
- **Recovery Time Objective (RTO)**: $\le 30\text{ minutes}$ for complete cluster restoration.
- **Edge Maintenance Toggle**: Instant graceful 503 response with Cloudflare edge buffer queuing to prevent lead ingestion loss.
- **Granular Restoration**: 30-day millisecond point-in-time recovery command suite.

### 4.3 Production Deployment & Release Gate (`RUNBOOK-REL-03`)
- **Git Branch Hierarchy**: Enforces trunk promotion from `sprint-*` to `phase-*`, then `feature/sales-funnel-crm`, and finally `master`.
- **48-Hour Staging Soak Period**: Staging soak validation requiring 0 unhandled runtime errors before production promotion.
- **Production Definition of Done (DoD)**: 0 TypeScript errors, 0 build warnings, 100% test pass rate across 378 unit tests and 21 RLS tests, zero AI slop.
