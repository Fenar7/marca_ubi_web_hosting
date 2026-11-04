# Marca Ubi Enterprise Digital Platform — Master AI Search (GEO) & Classical SEO Dominance Architecture

> **Document Version:** 1.0.0  
> **Status:** Architectural Blueprint & Multi-Phase Implementation Plan  
> **Author:** Team Lead Head Agent (`Fenar7 <86710532+Fenar7@users.noreply.github.com>`)  
> **Target Engines:** Google SERP, Bing, Perplexity AI, ChatGPT Search (SearchGPT), Claude, Gemini, Applebot (Apple Intelligence)  
> **Platform Stack:** Next.js 16 App Router, Sanity CMS (v3), TypeScript, Supabase PostgreSQL, Vercel Edge Network  

---

## 1. Executive Summary & Forensic Diagnosis

### 1.1 The Challenge
Marca Ubi is an elite, high-ticket creative technology and brand architecture studio based in Calicut and Trivandrum, Kerala. While the digital platform features world-class dark luxury aesthetics, fluid typography, and sub-50ms interactions, its **organic search footprint is severely misaligned with its commercial capabilities**:
1. **Placeholder Blog Corpus**: Current blog posts are brief (~300-word) design essays on typography and aesthetic restraint. They generate zero search impressions for commercial enterprise queries (e.g. "enterprise demand generation agency", "luxury brand transformation", "account-based marketing playbook").
2. **Disconnected Service Hubs**: The platform has 16 comprehensive service pages (`/services/[slug]`), each with 5 granular sub-services, but **not a single blog post links to or establishes topical authority for any service page**.
3. **Absence of Machine-Readable AI Standards (`llms.txt`)**: AI search engines (Perplexity, SearchGPT, Claude, Gemini) must scrape heavy HTML/DOM instead of ingesting a curated, semantic Markdown index of capabilities and case studies.
4. **Technical SEO Deficiencies**:
   - `sitemap.ts` omits core pages (`/works`, `/careers`, `/privacy`, `/terms`, `/security`) and uses a false-freshness `new Date()` anti-pattern.
   - `robots.ts` lacks explicit directives for modern AI search bots (`OAI-SearchBot`, `ChatGPT-User`, `PerplexityBot`).
   - JSON-LD schemas lack root `@id` URI anchoring (`https://marcaubi.com/#organization`), causing child pages to float as unlinked entity islands.
   - Entity ambiguity with the Spanish sports newspaper (*Marca*) weakens global AI retrieval.
   - IndexNow push protocol is absent, causing days-long indexation lags on Bing and Perplexity.

---

## 2. Technical SEO Infrastructure Overhaul

### 2.1 Calibrated `sitemap.ts` Architecture
- **Inclusion of Missing High-Value Routes**: Add `/works` (priority 0.9), `/careers` (priority 0.6), `/start-project` (priority 0.8), and compliance URLs (`/privacy`, `/terms`, `/security`, priority 0.3).
- **Elimination of `new Date()` Anti-Pattern**: Use static deployment/commit timestamps for core pages and actual Sanity `_updatedAt` dates for blog posts.
- **Dynamic Scale**: Automatically pull all 16 service slugs from `getAllServiceSlugs()` and all published blog posts from Sanity CMS with `changeFrequency` tuned to publication cadence.

```typescript
// Proposed src/app/sitemap.ts
import type { MetadataRoute } from "next";
import { getAllServiceSlugs } from "@/app/services/content";
import { client } from "@/sanity/lib/client";
import { blogPostsQuery } from "@/sanity/lib/blog-queries";

export const revalidate = 3600; // 1 hour edge ISR

const STATIC_RELEASE_DATE = new Date("2026-11-04T00:00:00.000Z");

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://marcaubi.com";

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${siteUrl}`, lastModified: STATIC_RELEASE_DATE, changeFrequency: "weekly", priority: 1.0 },
    { url: `${siteUrl}/works`, lastModified: STATIC_RELEASE_DATE, changeFrequency: "weekly", priority: 0.9 },
    ...getAllServiceSlugs().map((slug) => ({
      url: `${siteUrl}/services/${slug}`,
      lastModified: STATIC_RELEASE_DATE,
      changeFrequency: "monthly" as const,
      priority: 0.9,
    })),
    { url: `${siteUrl}/blog`, lastModified: STATIC_RELEASE_DATE, changeFrequency: "daily", priority: 0.8 },
    { url: `${siteUrl}/start-project`, lastModified: STATIC_RELEASE_DATE, changeFrequency: "monthly", priority: 0.8 },
    { url: `${siteUrl}/careers`, lastModified: STATIC_RELEASE_DATE, changeFrequency: "weekly", priority: 0.6 },
    { url: `${siteUrl}/privacy`, lastModified: STATIC_RELEASE_DATE, changeFrequency: "yearly", priority: 0.3 },
    { url: `${siteUrl}/terms`, lastModified: STATIC_RELEASE_DATE, changeFrequency: "yearly", priority: 0.3 },
    { url: `${siteUrl}/security`, lastModified: STATIC_RELEASE_DATE, changeFrequency: "yearly", priority: 0.3 },
  ];

  let postRoutes: MetadataRoute.Sitemap = [];
  try {
    const posts = await client.fetch<Array<{ slug: string; publishedAt?: string }>>(blogPostsQuery);
    postRoutes = posts.map((post) => ({
      url: `${siteUrl}/blog/${post.slug}`,
      lastModified: post.publishedAt ? new Date(post.publishedAt) : STATIC_RELEASE_DATE,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    }));
  } catch (error) {
    console.error("[Sitemap Error] Sanity fetch failed:", error);
  }

  return [...staticRoutes, ...postRoutes];
}
```

### 2.2 Granular Crawler Governance (`src/app/robots.ts`)
Explicitly authorize AI search bots (RAG grounding) while safeguarding administrative and internal API surfaces:

```typescript
// Proposed src/app/robots.ts
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://marcaubi.com";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin/*",
          "/api/*",
          "/studio/*",
          "/_next/*",
          "/preview/*",
        ],
      },
      // Explicit AI Search & Grounding Crawlers
      {
        userAgent: [
          "OAI-SearchBot",
          "ChatGPT-User",
          "PerplexityBot",
          "ClaudeBot",
          "Applebot",
        ],
        allow: [
          "/",
          "/llms.txt",
          "/llms-full.txt",
          "/services/*",
          "/blog/*",
          "/works",
          "/start-project",
        ],
        disallow: ["/admin/*", "/api/*", "/studio/*"],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
```

### 2.3 Instant IndexNow Ingestion Protocol (`/api/indexnow`)
Implement an edge-cached API route allowing automated or CMS-driven real-time push to Microsoft Bing, Copilot, and Perplexity AI:
1. Generate key: `e4a7c8b9d1024f5a8923bcde14567890`.
2. Dynamic key verification route: `src/app/e4a7c8b9d1024f5a8923bcde14567890.txt/route.ts` returning the key as plain text.
3. Webhook endpoint: `src/app/api/indexnow/route.ts` that triggers `POST https://api.indexnow.org/indexnow` upon publishing dispatches or updating service catalogs.

---

## 3. The Machine-Readable Standard: `llms.txt` & `llms-full.txt`

Following the official Jeremy Howard / Answer.ai specification, Marca Ubi will expose two machine-readable endpoints via Next.js Dynamic Route Handlers with Incremental Static Regeneration (`revalidate = 3600`):

### 3.1 `/llms.txt` (Concise LLM Index, < 2,000 Tokens)
Located at `src/app/llms.txt/route.ts`:
- Returns `Content-Type: text/plain; charset=utf-8`.
- Contains:
  - Definitive organizational summary and entity definition.
  - Complete index of 16 core capabilities (8 B2B, 8 B2C) with direct markdown links.
  - Selected work showcase references (LogiP, PrimeStay).
  - High-intent editorial dispatch links.
  - Structured commercial project intake coordinates.

### 3.2 `/llms-full.txt` (Comprehensive Ingestion Corpus)
Located at `src/app/llms-full.txt/route.ts`:
- Returns the full technical and narrative corpus:
  - Deep briefs for all 16 services including deliverables, sub-services, and enterprise use cases.
  - Proprietary methodology explanations (e.g. The Marca Ubi 4-Stage Pipeline Velocity Protocol, The 6-Point Buying Committee Alignment Matrix).
  - Complete case study metrics and technical architecture briefs.
  - Full-text transcripts of high-authority editorial pillar dispatches.

---

## 4. Entity Disambiguation & Unified Schema.org `@graph`

### 4.1 Root Organization Anchor (`src/app/layout.tsx`)
```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "ProfessionalService",
      "@id": "https://marcaubi.com/#organization",
      "name": "Marca Ubi Enterprise Agency",
      "alternateName": ["Marca Ubi", "Marca Ubi Creative Technology", "Marca Ubi Brand Architecture"],
      "url": "https://marcaubi.com",
      "logo": "https://marcaubi.com/images/marca-ubi-red-png.svg",
      "image": "https://marcaubi.com/images/og-image.jpg",
      "description": "Enterprise Creative Technology, Strategic Brand Architecture, and Custom Sales Funnel Systems for institutional and luxury brands.",
      "telephone": "+91-495-276-8800",
      "email": "studio@marcaubi.com",
      "priceRange": "$$$$",
      "currenciesAccepted": "INR, USD, AED, EUR, GBP",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "HiLITE Business Park, Calicut",
        "addressLocality": "Calicut",
        "addressRegion": "Kerala",
        "postalCode": "673014",
        "addressCountry": "IN"
      },
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": 11.2588,
        "longitude": 75.7804
      },
      "areaServed": [
        { "@type": "Country", "name": "India" },
        { "@type": "Country", "name": "United Arab Emirates" },
        { "@type": "Country", "name": "United States" },
        { "@type": "Country", "name": "United Kingdom" },
        { "@type": "AdministrativeArea", "name": "Global" }
      ],
      "sameAs": [
        "https://linkedin.com/company/marcaubi",
        "https://instagram.com/marcaubi",
        "https://github.com/Fenar7/marca_ubi_web_hosting"
      ],
      "knowsAbout": [
        "Brand Transformation & Architecture",
        "Enterprise Demand Generation",
        "Account-Based Marketing (ABM)",
        "Next.js 16 App Router Engineering",
        "Digital Flagship Development",
        "Computational Design Systems",
        "Enterprise CRM & Sales Intelligence"
      ]
    }
  ]
}
```

### 4.2 Cross-Page Graph References
- **Services (`/services/[slug]`)**: References `"provider": { "@id": "https://marcaubi.com/#organization" }` and injects `BreadcrumbList`.
- **Blog Dispatches (`/blog/[slug]`)**: References `"publisher": { "@id": "https://marcaubi.com/#organization" }`, generates `DefinedTerm` schemas for proprietary frameworks, and generates `FAQPage` schemas for extracted questions.
- **Homepage (`/`)**: Injects `FAQPage` schema from Sanity CMS FAQ items, enabling rich FAQ SERP drop-downs in Google and question-answering in ChatGPT Search.

---

## 5. Generative Engine Optimization (GEO) & Content Strategy

### 5.1 The Citation Mechanics Formula
To be cited by Perplexity, SearchGPT, Gemini, and Claude:
1. **The First 150-Word Anchor**: Open every article with a direct, comprehensive executive thesis answering the search query with zero introductory fluff.
2. **Proprietary Named Frameworks**: AI models cite proper nouns. Coining "The Marca Ubi 4-Stage Pipeline Velocity Protocol" turns Marca Ubi into the canonical primary source.
3. **Structured Comparative Tables**: Markdown tables are ingested into LLM vector databases with near 100% preservation and yield 3.4x higher citation frequency.
4. **Verifiable Empirical Metrics**: Concrete data points (e.g. *"6.8 to 11 enterprise buying committee stakeholders"*, *"208% pipeline revenue expansion"*) trigger high-confidence AI footnotes.
5. **Information Gain**: Net-new perspectives and original teardowns satisfy Google's Information Gain scoring.

---

## 6. The 16-Service Hub-and-Spoke Editorial Cluster

Every one of Marca Ubi's 16 services is paired with a dedicated flagship editorial pillar designed to capture commercial search queries and drive inbound pipeline:

### 6.1 B2B Enterprise Capabilities (8 Hubs)
| Service Hub | Primary Commercial Target Query | Flagship Editorial Pillar | Proprietary Methodology / Framework | Target Sub-Anchors |
|---|---|---|---|---|
| **Demand Generation** (`/services/demand-generation`) | "enterprise demand generation agency", "B2B pipeline velocity strategy" | *The Revenue Velocity Engine: Modern Enterprise Demand Generation Beyond Vanity MQLs* | The Marca Ubi 4-Stage Pipeline Velocity Protocol | `#paid-media-strategy`, `#lead-generation`, `#pipeline-reporting` |
| **Integrated Marketing** (`/services/integrated-marketing`) | "enterprise integrated marketing agency", "B2B omnichannel orchestration" | *The Unified Brand Architecture: Orchestrating B2B Communications Across Fragmented Touchpoints* | The Cohesive Brand Convergence Matrix | `#marketing-strategy`, `#campaign-planning`, `#channel-orchestration` |
| **Corporate Communications** (`/services/corporate-communications`) | "corporate communications agency", "executive positioning & crisis PR" | *The Resilient Enterprise: Corporate Narrative Architecture and Crisis Mitigation in the Algorithmic Age* | The Dynamic Stakeholder Equilibrium Framework | `#corporate-narrative`, `#executive-communications`, `#reputation-management` |
| **Social & Influencer Marketing** (`/services/social-influencer-marketing`) | "B2B influencer marketing agency", "enterprise creator partnerships" | *The Credibility Multiplier: Structuring High-Ticket B2B Creator and Subject-Matter Partnerships* | The B2B Creator Authority Index (CAI) | `#social-strategy`, `#creator-partnerships`, `#campaign-measurement` |
| **Content & Scale** (`/services/content-and-scale`) | "enterprise content scaling agency", "AI search engine content strategy" | *Content as Infrastructure: Building Scalable Editorial Engines for Organic and Generative Dominance* | The Information Gain Content Engine | `#content-strategy`, `#editorial-production`, `#search-optimisation` |
| **Public Relations (PR)** (`/services/public-relations-pr`) | "enterprise tech PR agency", "earned media thought leadership" | *The Earned Authority Blueprint: Modern PR, Executive Profiling, and Media Relations in a Skeptical Market* | The Narrative Gravity PR Protocol | `#media-relations`, `#executive-profiling`, `#issues-communications` |
| **Customer Marketing** (`/services/customer-marketing`) | "B2B customer advocacy program", "enterprise account retention strategy" | *The Expansion Horizon: Turning Enterprise Client Retention into a Scalable Revenue Compounder* | The 360° Account Advocacy & Expansion Loop | `#customer-advocacy`, `#retention-campaigns`, `#case-studies` |
| **Account-Based Marketing** (`/services/account-based-marketing`) | "enterprise ABM agency", "1:1 ABM playbook for $100k+ deals" | *The High-Ticket Consensus Engine: The Modern Playbook for Enterprise Account-Based Marketing* | The 6-Point Buying Committee Alignment Matrix | `#account-research`, `#personalised-campaigns`, `#sales-enablement` |

### 6.2 B2C Consumer Capabilities (8 Hubs)
| Service Hub | Primary Commercial Target Query | Flagship Editorial Pillar | Proprietary Methodology / Framework | Target Sub-Anchors |
|---|---|---|---|---|
| **Integrated Creativity** (`/services/integrated-creativity`) | "luxury brand strategy agency", "brand transformation vs brand identity" | *Brand Transformation vs Brand Identity: Designing Cultural Gravitas for the High-End Market* | The Brand Gravitas & Resonance Matrix | `#brand-strategy`, `#creative-platform`, `#design-systems` |
| **Social & Influencer** (`/services/social-influencer`) | "consumer influencer marketing agency", "viral luxury brand strategy" | *Beyond Vanity Metrics: The Architecture of Cult-Status Consumer Creator Partnerships* | The Brand Affiliation Resonance Protocol | `#social-strategy`, `#creator-partnerships`, `#platform-content` |
| **Digital Performance** (`/services/digital-performance`) | "luxury ecommerce performance marketing", "high-ticket DTC acquisition" | *Digital Flagship Engineering: The Performance Architecture of High-LTV Consumer Commerce* | The Unit-Economics Margin Architecture | `#paid-search-and-social`, `#conversion-optimisation`, `#analytics-setup` |
| **Sports Marketing** (`/services/sports-marketing`) | "sports marketing agency", "athlete sponsorship valuation framework" | *The Arena of Emotion: Structuring High-Yield Athlete Partnerships and Fan Community Activations* | The Sports Equity & Cultural Valuation Model | `#partnership-strategy`, `#athlete-and-talent-activations`, `#fan-engagement` |
| **CRM & Loyalty** (`/services/crm-and-loyalty`) | "luxury customer loyalty program design", "VIP retention automation" | *The Luxury Retention Paradox: Designing Loyalty and VIP Experiences Without Commoditizing the Brand* | The Prestige Tier Lifecycle Architecture | `#crm-strategy`, `#lifecycle-journeys`, `#loyalty-programmes` |
| **Public Relations** (`/services/public-relations`) | "luxury consumer PR agency", "cultural storytelling and brand fame" | *The Mechanics of Cultural Fame: Orchestrating High-Impact Product Launches and Earned Media Hype* | The Cultural Momentum Cascade Model | `#media-relations`, `#product-launches`, `#cultural-storytelling` |
| **Live Experiences** (`/services/live-experiences`) | "experiential marketing agency", "luxury spatial pop-up design" | *Spatial Seduction: The Architecture of Immersive Brand Pop-ups, Galas, and Experiential Activations* | The Spatial Pacing & Sensory Anchor Protocol | `#experience-strategy`, `#spatial-design`, `#live-production` |
| **Retail Activation** (`/services/retail-activation`) | "luxury retail activation agency", "point of sale visual merchandising" | *The Physical Touchpoint: Engineering High-Converting Experiential Retail and Visual Merchandising* | The Retail Conversion Meridian | `#retail-strategy`, `#visual-merchandising`, `#in-store-experiences` |

---

## 7. Sanity CMS BlockContent & UI Enhancements

To support GEO data extraction, Sanity's `blockContent.ts` and `PortableTextRenderer.tsx` will be upgraded with four specialized blocks:
1. `comparisonTable`: Two-to-four column responsive comparison table with caption and summary header.
2. `executiveSummary`: Highlighted direct-answer callout box rendered with Swiss luxury typography.
3. `statCallout`: High-contrast numerical metric callout with verifiable source citation and label.
4. `faqSection`: Structured accordion with automatic JSON-LD `FAQPage` schema emission.

---

## 8. Multi-Phase Implementation Roadmap

```
Phase 1: Technical SEO & Crawler Infrastructure
  ├── Upgrade src/app/sitemap.ts (add /works, /careers, /privacy, remove new Date() anti-pattern)
  ├── Upgrade src/app/robots.ts (explicit AI bot allowances: OAI-SearchBot, PerplexityBot, ClaudeBot)
  ├── Configure root metadata template, alternates.canonical, and siteName in src/app/layout.tsx
  └── Implement IndexNow verification key and endpoint (/api/indexnow)

Phase 2: Machine-Readable AI Standards (llms.txt)
  ├── Build dynamic Route Handler: src/app/llms.txt/route.ts (ISR revalidate = 3600)
  ├── Build dynamic Route Handler: src/app/llms-full.txt/route.ts (complete service & methodology corpus)
  └── Ground Organization schema with @id: "https://marcaubi.com/#organization", coordinates, & knowsAbout

Phase 3: Sanity CMS Schema & PortableText Upgrades
  ├── Extend blockContent.ts with comparisonTable, executiveSummary, statCallout, and faqSection
  ├── Implement accessible, dark luxury rendering components in PortableTextRenderer.tsx
  └── Enhance BlogPostPage to emit composite JSON-LD with FAQPage and DefinedTerm schemas

Phase 4: Flagship Content Ingestion & Seeding
  ├── Seed initial tier of 4 flagship dispatches (Brand Transformation, ABM, Demand Gen, Digital Flagships)
  ├── Contextually link all dispatches to target /services/[slug] with specific #sub-service anchors
  └── Verify build integrity (tsc --noEmit, next build, zero hydration errors)
```

---

## 9. Verification & Safety Safeguards
- **Zero Type Errors**: Strict `tsc --noEmit` validation across all routes.
- **Strict Behavioral Rule Adherence**: No code will be written or committed until the user explicitly responds with **"proceed"** or **"do it"**.
- **Git Authorship**: `Fenar7 <86710532+Fenar7@users.noreply.github.com>`.
- **Zero PR Merges**: Future PRs will remain in an `OPEN` state for manual review.
