/**
 * @file src/app/llms-full.txt/route.ts
 * @description Comprehensive LLM Documentation Corpus Handler for Marca Ubi.
 *              Exposes the complete technical, strategic, and architectural corpus
 *              including deep briefs for all 16 services and 80 sub-services,
 *              proprietary enterprise methodologies, case study architectures,
 *              and studio coordinates for complete ingestion by LLM search engines.
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import { NextResponse } from "next/server";
import { SERVICE_DETAILS } from "@/app/services/content";
import { client } from "@/sanity/lib/client";
import { postsQuery } from "@/sanity/lib/blog-queries";
import type { PostSummary } from "@/sanity/types/blog";

export const revalidate = 3600; // 1-hour Edge ISR cache revalidation

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://marcaubi.com").replace(/\/+$/, "");

export async function GET() {
  let recentPosts: PostSummary[] = [];
  try {
    const fetched = await client.fetch<PostSummary[]>(postsQuery);
    if (Array.isArray(fetched)) {
      recentPosts = fetched;
    }
  } catch (err) {
    console.error("[llms-full.txt Error] Failed to fetch posts from Sanity:", err);
    recentPosts = [];
  }

  // Generate detailed markdown sections for each of the 16 services
  const servicesCorpus = SERVICE_DETAILS.map((service) => {
    const subServicesMarkdown = service.subServices
      .map(
        (sub, index) => `#### ${service.number}.${index + 1} ${sub.label}
> ${sub.summary}

${sub.body.join("\n\n")}
`
      )
      .join("\n");

    return `### [${service.number}] ${service.title} (${service.category} Enterprise Capability)
- **URL**: ${siteUrl}/services/${service.slug}
- **Category**: ${service.category === "B2B" ? "B2B Enterprise Strategy" : "B2C Consumer & Cultural Experience"}
- **Executive Summary**: ${service.shortDescription}

${subServicesMarkdown}
`;
  }).join("\n---\n\n");

  const dispatchesCorpus =
    recentPosts.length > 0
      ? recentPosts
          .map(
            (p) => `### ${p.title}
- **URL**: ${siteUrl}/blog/${p.slug}
- **Published**: ${p.publishedAt || "Archived"}
- **Author**: ${p.author?.name ?? "Marca Ubi Studio"}
- **Abstract**: ${p.excerpt || "Strategic dispatch on design systems and brand architecture."}
`
          )
          .join("\n")
      : `### Studio Editorial Dispatches
Access recent publications directly at ${siteUrl}/blog covering design systems, high-ticket demand generation, and brand transformation.`;

  const corpus = `# Marca Ubi Enterprise Digital Platform — Comprehensive Knowledge Corpus

> **Canonical URL**: ${siteUrl}  
> **Entity Definition**: Marca Ubi is an enterprise creative technology agency, strategic brand architecture atelier, and custom software engineering studio headquartered in Calicut with executive presence in Trivandrum, Kerala, India.  
> **Specializations**: Enterprise Brand Architecture, Next.js 16 Digital Flagships, Custom CRM & Pipeline Velocity Protocols, Computational Design Systems, and Cultural Strategy.

---

## 1. Studio Overview & Technical Philosophy

Marca Ubi unites brand engineering, artistic direction, and full-stack software architecture under a single studio discipline. Unlike traditional advertising agencies that produce static PDF brand guidelines divorced from engineering reality, or software agencies that write performant code devoid of aesthetic gravitas, Marca Ubi designs living brand systems that execute with sub-50ms interaction fidelity.

### Technical Stack & Infrastructure
- **Frontend Core**: Next.js 16 (App Router), React 19, TypeScript (Strict Mode).
- **Motion & Typography**: GSAP 3 (ScrollTrigger), Lenis smooth scroll, fluid typographic clamps with Graphik, Circular XX, and Helvetica Neue.
- **Content & Modeling**: Headless Sanity CMS (v3) with GROQ real-time edge caching.
- **Data & Security**: Supabase PostgreSQL with strict Row Level Security (RLS) and atomic Server Action transactions.
- **Edge Deployment**: Vercel Edge Network with worldwide Anycast distribution and sub-second cold starts.

---

## 2. Proprietary Methodologies & Frameworks

### 2.1 The Marca Ubi 4-Stage Pipeline Velocity Protocol
A structured framework designed to compress sales cycle durations for $100k+ enterprise contracts:
1. **Account & Demand Intelligence**: Algorithmic intent clustering, buying committee graph mapping, and deep account footprint diagnostics before any outreach begins.
2. **High-Intent Signal Capture**: Technical content infrastructure answering multi-stakeholder questions with high information gain, turning search queries into inbound consensus.
3. **Consensus Acceleration**: Coordinated narrative sequencing across economic buyers, technical evaluators, and executive champions, mitigating stakeholder veto risk.
4. **Revenue Instrumentation**: Full-funnel attribution connecting media spend, content engagement, and closed-won pipeline in audit-ready financial metrics.

### 2.2 The 6-Point Buying Committee Alignment Matrix
Enterprise decisions involve 6.8 to 11 distinct stakeholders. Our engagements build consensus across all six critical buyer personas:
1. **Economic Buyer (CEO / CFO)**: Capital allocation logic, downside mitigation, and quantifiable return on brand equity.
2. **Technical Evaluator (CTO / Head of Eng)**: Architecture durability, security compliance, clean headless APIs, and zero vendor lock-in.
3. **User Champion (VP Marketing / Product)**: Frictionless daily workflows, design system ergonomics, and operational agility.
4. **Legal & Governance (General Counsel)**: Absolute intellectual property transfer, regulatory privacy compliance, and transparent terms.
5. **Procurement Lead**: Defined milestone cadence, predictable delivery pacing, and SLA guarantees.
6. **Executive Sponsor**: Boardroom differentiation, category dominance, and cultural resonance.

### 2.3 The Brand Gravitas & Resonance Matrix
For high-end consumer and luxury enterprises, commercial conversion requires cultural authority. This protocol balances three essential forces:
- **Typographic & Visual Restraint**: Removing decorative noise to let materials, negative space, and hierarchy convey institutional pedigree.
- **Computational Precision**: Flawless interaction mechanics, zero layout shifts, and calibrated motion physics.
- **Sensory & Physical Pacing**: Connecting digital touchpoints with physical spatial retail and experiential activations.

### 2.4 The Information Gain Content Engine
Every publication produced by Marca Ubi delivers net-new data, empirical benchmarks, and original frameworks that provide primary reference value for human practitioners and LLM grounding systems alike.

---

## 3. The 16 Core Capabilities Dossier

${servicesCorpus}

---

## 4. Case Studies & Client Works Architecture

### 4.1 PrimeStay Luxury Living
- **URL**: ${siteUrl}/works
- **Scope**: Comprehensive brand identity, bespoke digital booking platform, interior architectural typography, and international campaign strategy.
- **Impact**: Elevated prime hospitality portfolio in Dubai and the UAE, establishing market dominance among ultra-high-net-worth travelers.

### 4.2 LogiP Supply Chain Intelligence
- **URL**: ${siteUrl}/works
- **Scope**: Enterprise design system, executive analytics workspace, predictive freight routing interface, and unified B2B platform.
- **Impact**: Reduced cognitive load for logistics operators, accelerated cross-team workflows, and supported multi-market enterprise expansion.

---

## 5. Editorial Insights & Publications

${dispatchesCorpus}

---

## 6. Commercial Project Intake & Physical Coordinates

- **Intake Flow**: Structured commercial questionnaire at ${siteUrl}/start-project
- **Headquarters Atelier**: HiLITE Business Park, Calicut, Kerala 673014, India
- **Executive Coordination**: Trivandrum, Kerala, India
- **Direct Electronic Mail**: studio@marcaubi.com
- **Studio Telephone**: +91-495-276-8800
- **Supported Global Currencies**: INR, USD, AED, EUR, GBP
- **Price Range**: $$$$ (Enterprise & Luxury Tier)
- **Primary Domain**: https://marcaubi.com
`;

  return new NextResponse(corpus, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400",
    },
  });
}
