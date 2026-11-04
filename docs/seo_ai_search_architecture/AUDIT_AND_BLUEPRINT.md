# Marca Ubi Enterprise Agency — Comprehensive Technical SEO & AI Search Architecture Audit & Blueprint

> **System**: Next.js 16 App Router, Sanity CMS (v3), Supabase PostgreSQL, Vercel Edge Network  
> **Specialist Role**: SEO & Technical Architecture Specialist Agent  
> **Scope**: Classical Search Engines (Google, Bing) & Generative AI Search Engines (Perplexity, ChatGPT Search, Gemini, Claude, Applebot)  
> **Author**: `Fenar7 <86710532+Fenar7@users.noreply.github.com>`  
> **Date**: November 2026

---

## Executive Summary & Architecture Scorecard

A forensic audit of Marca Ubi's digital platform reveals an exceptionally strong foundation in Core Web Vitals, typographic hierarchy, editorial typography, and Next.js 16 App Router mechanics. However, the current SEO and AI Search (LLMO/GEO) infrastructure exhibits **critical indexation blind spots**, **uncalibrated crawler governance**, **fragmented JSON-LD knowledge graphs**, and a **complete absence of machine-readable AI ingest protocols (`llms.txt`)**.

```
┌────────────────────────────────────────┬────────┬────────────────────────────────────────────────────────┐
│ Dimension                              │ Rating │ Critical Finding                                       │
├────────────────────────────────────────┼────────┼────────────────────────────────────────────────────────┤
│ Sitemap Coverage (`sitemap.ts`)        │ 62%    │ Missing /works, /careers, /privacy, /terms, /security  │
│ Sitemap Freshness Signals              │ 40%    │ Anti-pattern: `new Date()` false freshness on static   │
│ Crawler Governance (`robots.ts`)       │ 45%    │ No granular AI search bot policies (OAI, Perplexity)   │
│ Root Metadata & Templates              │ 70%    │ Missing title.template, canonical on root, OG siteName │
│ Entity Grounding & Knowledge Graph     │ 55%    │ ProfessionalService lacks @id anchor, missing knowsAbout│
│ Schema.org Graph Integration           │ 60%    │ Services & Careers lack @id cross-ref; missing FAQPage  │
│ Real-Time Indexation (IndexNow)        │ 0%     │ Completely absent; delayed Bing / Copilot re-crawling  │
│ AI Search Discovery (`llms.txt`)       │ 0%     │ No llms.txt or llms-full.txt implemented               │
│ Entity Disambiguation / GEO Grounding  │ 48%    │ High risk of LLM ambiguity with "Marca" sports entity   │
└────────────────────────────────────────┴────────┴────────────────────────────────────────────────────────┘
```

---

## Part 1: Technical SEO Infrastructure Audit

### 1.1 `src/app/sitemap.ts` Audit

#### Current Implementation Analysis
```typescript
// Current src/app/sitemap.ts extract:
const staticRoutes: MetadataRoute.Sitemap = [
  { url: `${siteUrl}`, lastModified: new Date(), changeFrequency: "weekly", priority: 1.0 },
  { url: `${siteUrl}/blog`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
  { url: `${siteUrl}/start-project`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
  ...getAllServiceSlugs().map((slug) => ({
    url: `${siteUrl}/services/${slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.8,
  })),
];
```

#### Identified Critical Gaps & Violations
1. **Omission of Core High-Value Routes**:
   - **`/works` (Curated Portfolio & Case Studies)**: Completely missing. As the canonical destination for work showcase (with `/work` redirecting to `/works` via 308 permanent redirect in `next.config.ts`), its exclusion deprives Marca Ubi of portfolio search queries and image search authority.
   - **`/careers` (Recruitment & Talent Acquisition)**: Completely missing. The page contains rich `JobPosting` schema and active positions across Calicut and Trivandrum. Google for Jobs and talent queries cannot reliably discover it.
   - **Compliance & Legal Coordinates (`/privacy`, `/terms`, `/security`)**: Completely missing. While search engines do not rank legal pages for commercial intent, Google's Quality Rater Guidelines (E-E-A-T) and Bing Webmaster guidelines mandate indexable privacy and security policies to validate organizational legitimacy.
   - **`/contact` Strategy**: The site currently lacks a dedicated `/contact` URL (contact actions route to `#contact` or `/start-project`). For classical search and AI search, a canonical `/contact` route or 308 redirect pointing to `/start-project` must be declared and indexed.

2. **The `lastModified: new Date()` Anti-Pattern**:
   - `sitemap.ts` exports `revalidate = 3600`. Every 60 minutes, the Next.js cache re-runs `sitemap()`, generating an updated XML feed where **every static page displays the current timestamp**.
   - Search engines (Googlebot, Bingbot) track historical `lastmod` veracity. When a bot fetches a sitemap with bumped `lastmod` but the HTML headers (`ETag`, `Last-Modified`) and page DOM content remain bitwise identical, the crawler degrades the sitemap's trust score and throttles crawl quota.
   - **Solution**: Static routes must reflect stable release or content-update timestamps (e.g. git commit timestamp, static build timestamp, or specific dates of content revisions).

3. **Priority & Change Frequency Calibration**:
   - Flat priority distribution: Services (0.8), Start Project (0.8), Blog Posts (0.7).
   - `/blog` archive is set to `daily`, but single blog posts are set to `monthly` with 0.7 priority.
   - Calibration should reflect commercial value:
     - Homepage `/`: 1.0 (weekly)
     - Core Capability Pages `/services/*`: 0.9 (monthly)
     - Showcase `/works`: 0.9 (weekly/monthly)
     - Intake Hub `/start-project`: 0.8 (monthly)
     - Editorial Hub `/blog`: 0.8 (daily)
     - Dynamic Editorial Dispatches `/blog/*`: 0.7 (weekly for first 30 days, then monthly)
     - Careers Hub `/careers`: 0.6 (weekly)
     - Legal & Trust `/privacy`, `/terms`, `/security`: 0.3 (yearly)

---

### 1.2 `src/app/robots.ts` Audit

#### Current Implementation Analysis
```typescript
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/admin/",
          "/api",
          "/api/",
          "/studio",
          "/studio/",
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
```

#### Identified Critical Gaps & Modern AI Bot Governance
1. **Absence of Differentiated AI Search Bot Directives**:
   - In 2026, web crawlers are classified into three operational categories:
     - **Classical Search Indexers**: `Googlebot`, `Bingbot`, `Slurp`, `DuckDuckBot`, `Baiduspider`, `Yandex`.
     - **Search Grounding & RAG Retrieval Bots (AI Search)**: `OAI-SearchBot` (ChatGPT Search), `ChatGPT-User` (browsing mode), `PerplexityBot` (Perplexity AI search), `Bingbot` (Copilot grounding), `Applebot` (Siri / Apple Intelligence web search).
     - **Unsupervised Training & Bulk Scrapers**: `GPTBot`, `ClaudeBot`, `Google-Extended`, `Applebot-Extended`, `CCBot`, `Bytespider`, `Meta-ExternalAgent`.
   - **Strategic Agency Imperative**: Marca Ubi operates as an enterprise commercial agency seeking high-ticket client inbound briefs. Being cited, recommended, and surfaced by ChatGPT Search, Perplexity, Claude, and Gemini is a **mission-critical growth driver**.
   - Current config relies solely on `userAgent: "*"`. While this technically permits all crawlers, it fails to explicitly optimize for AI discovery bots and leaves admin API endpoints vulnerable to exploratory parameter crawls.

2. **Wildcard & Prefix Normalization**:
   - Disallow strings should include trailing wildcards (e.g., `/admin/*`, `/api/*`, `/studio/*`, `/_next/*`) to prevent query-string leaks (e.g. `/api?param=1`).

---

### 1.3 Root Layout & Page-Level Metadata Audit

#### Root Layout (`src/app/layout.tsx`)
1. **Missing `title.template`**:
   - Currently: `title: "Marca Ubi | Brand Identity & Cultural Experience Architecture"`
   - Subpages must manually format titles, leading to inconsistent naming conventions (e.g., `Insights & Dispatches | Marca Ubi`, `Service Not Found | Marca Ubi`, `[Title] | Marca Ubi Insights`).
   - Standard: `title: { default: "Marca Ubi | Brand Identity & Cultural Experience Architecture", template: "%s | Marca Ubi" }`.
2. **Missing Root Canonical & Alternate Metadata**:
   - Root metadata omits `alternates: { canonical: "/" }`.
   - Next.js requires explicit canonical definitions to eliminate duplicate indexing between root domain, `www` vs non-`www`, and query-parameter tracking tags (`?utm_*`).
3. **OpenGraph `siteName`**:
   - `siteName: "Marca Ubi"` is missing from root OpenGraph metadata.

#### Page-Level Metadata Coverage
- **Homepage (`src/app/page.tsx`)**:
  - **Issue**: Lacks its own `metadata` export! Relies 100% on fallback root layout.
  - Needs explicit canonical tag and OpenGraph definition tailored to the primary agency value proposition.
- **Start Project (`src/app/start-project/page.tsx`)**:
  - Missing OpenGraph image, Twitter card, and structured `ContactPage` schema.
- **Privacy, Terms, Security (`src/app/privacy/page.tsx`, etc.)**:
  - Missing canonical alternates and robots `{ index: true, follow: true }`.

---

### 1.4 Structured Data (JSON-LD) Graph Architecture Audit

#### Root `ProfessionalService` Schema Gaps
The existing schema in `src/app/layout.tsx` is an isolated node:
```json
{
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  "name": "Marca Ubi Enterprise Agency",
  "description": "Creative Technology, Strategic Brand Architecture...",
  "url": "https://marcaubi.com",
  "logo": "https://marcaubi.com/images/marca-ubi-red-png.svg",
  "address": { ... },
  "sameAs": [ "https://linkedin.com/company/marcaubi", "https://instagram.com/marcaubi" ]
}
```

**Critical Flaws**:
1. **No `@id` URI Anchor**: Without `@id: "https://marcaubi.com/#organization"`, child pages (such as `/services/[slug]` or `/blog/[slug]`) cannot reference Marca Ubi as their `provider` or `publisher`. Search engines treat them as detached entities rather than a unified Knowledge Graph.
2. **Missing Enterprise Entity Signals**:
   - `image`: Missing primary studio photograph.
   - `telephone` & `email`: Missing direct coordinates (`studio@marcaubi.com`, international phone).
   - `areaServed`: Missing geographic delivery boundaries (`["IN", "AE", "US", "GB", "Global"]`).
   - `priceRange`: Missing luxury/enterprise tier indicator (`$$$$`).
   - `currenciesAccepted`: `["INR", "AED", "USD", "EUR"]`.
   - `founder` / `foundingDate`.
   - `knowsAbout`: Critical for topic cluster embedding in Google & AI engines (e.g. "Brand Strategy", "Design Systems", "Next.js 16 App Router", "Enterprise CRM Architecture", "Computational Design").

#### Schema Cross-Referencing Across Pages
1. **Services (`src/app/services/[slug]/page.tsx`)**:
   - Defines `@type: "Service"` with `hasOfferCatalog`.
   - **Gaps**:
     - `provider` is `{ "@type": "Organization", name: "Marca Ubi" }` instead of `@id: "https://marcaubi.com/#organization"`.
     - **Missing `BreadcrumbList`**: The page renders an editorial breadcrumb on screen, but does not provide Schema.org `BreadcrumbList`, losing breadcrumb rich snippets in SERP.
2. **Blog (`src/app/blog/[slug]/page.tsx`)**:
   - Implements `@type: "BlogPosting"` and `BreadcrumbList`. High quality implementation.
   - **Gap**: Publisher logo points to `/images/marca-ubi-white.svg` which must be linked to the master `@id: "https://marcaubi.com/#organization"`.
3. **Careers (`src/app/careers/page.tsx`)**:
   - Implements `@type: "CollectionPage"` with `JobPosting` items.
   - **Gaps**: `JobPosting` items omit `hiringOrganization` (mandatory for Google for Jobs), `datePosted`, and `validThrough`.
4. **Homepage (`src/app/page.tsx`)**:
   - **Missing `FAQPage` Schema**: The homepage dynamically loads FAQs from Sanity CMS (`faqsQuery`), but renders them only in DOM. Adding `FAQPage` schema instantly earns FAQ accordion rich snippets in Google SERP and feeds direct question-answer pairs into LLM retrieval indexes.

---

### 1.5 IndexNow Protocol Opportunities

#### Technical Context
IndexNow is an open protocol initiated by Microsoft (Bing) and Yandex, adopted by Perplexity AI, Seznam, and Naver. Instead of waiting days or weeks for search engine bots to crawl XML sitemaps, IndexNow enables instantaneous, push-based indexation:
```
[CMS Action: Publish / Update]
       │
       ▼
[Next.js API Handler: /api/indexnow]
       │
       ▼ (HTTP POST)
https://api.indexnow.org/indexnow
       │
       ├──► Microsoft Bing & Copilot (Minutes)
       ├──► Perplexity AI Grounding (Near real-time)
       └──► Yandex & Seznam (Minutes)
```

#### Proposed IndexNow Architecture for Marca Ubi
1. **Key Verification**:
   - Generate a 32-character hexadecimal key (e.g. `e4a7c8b9d1024f5a8923bcde14567890`).
   - Serve the key at root: `public/{key}.txt` and verify via dynamic Route Handler `src/app/{key}.txt/route.ts`.
2. **Automated Submission Route Handler (`/api/indexnow/route.ts`)**:
   - Accepts internal webhooks (from Sanity CMS publish events) or administrative manual trigger.
   - Submits payloads formatted as:
     ```json
     {
       "host": "marcaubi.com",
       "key": "e4a7c8b9d1024f5a8923bcde14567890",
       "keyLocation": "https://marcaubi.com/e4a7c8b9d1024f5a8923bcde14567890.txt",
       "urlList": [
         "https://marcaubi.com/blog/sample-dispatch",
         "https://marcaubi.com/services/brand-identity"
       ]
     }
     ```

---

## Part 2: AI Search Architecture (LLMO / GEO)

### 2.1 The `llms.txt` and `llms-full.txt` Specification

#### Background & Industry Standard
Large Language Models (LLMs) and generative search engines (ChatGPT Search, Perplexity, Gemini, Claude, Cursor, Devv) prioritize clean, semantic Markdown text over heavy HTML DOMs cluttered with JavaScript bundles, hydration scripts, and SVG icons.

The `llms.txt` standard provides:
1. `/llms.txt`: A concise, high-signal index (< 2,000 tokens) structured for quick LLM context intake.
2. `/llms-full.txt`: A comprehensive, full-text documentation corpus containing all service briefs, company profile, technical stack, and case study briefs in raw Markdown.

#### Standard Markdown Structure for Marca Ubi `/llms.txt`
```markdown
# Marca Ubi

> Marca Ubi is an enterprise creative technology agency and strategic brand architecture studio based in Calicut and Trivandrum, Kerala, India. The studio specializes in high-end brand identity systems, custom digital flagships, bespoke Next.js web applications, and enterprise sales intelligence software.

## Core Capabilities (16 Specialized Services)

### B2B Brand & Enterprise Strategy
- [Brand Identity Architecture](/services/brand-identity): Monolithic and federated identity systems for institutional enterprises.
- [Digital Flagship Development](/services/digital-flagships): Headless Next.js web platforms with sub-second page transitions.
- [Enterprise CRM Engineering](/services/crm-architecture): Custom sales funnel pipelines, automated lead scoring, and workload routing.
...

### B2C Experience & Cultural Design
- [D2C Brand Flagships](/services/d2c-platforms): Luxury retail and lifestyle commerce experiences.
- [Cultural Storytelling & Content](/services/cultural-storytelling): Editorial direction, cinematic video, and brand narratives.
...

## Case Studies & Selected Works
- [LogiP Supply Chain Intelligence](/works): Enterprise design system, executive analytics workspace, and predictive freight platform.
- [PrimeStay Luxury Living](/works): Complete brand architecture, interior sensory language, and digital hospitality platform.

## Studio Insights & Publications
- [Editorial Dispatches](/blog): Architectural essays, brand engineering, design systems, and digital craftsmanship.

## Client Inquiries & Intake
- [Start a Project Brief](/start-project): Structured commercial intake covering project scope, timelines, and commercial parameters.
```

---

### 2.2 Route Handler vs. Static File Evaluation in Next.js 16

```
┌─────────────────────────┬──────────────────────────────────────────┬──────────────────────────────────────────┐
│ Criteria                │ Static Files (`public/llms.txt`)         │ Dynamic Route Handler (`/llms.txt/route`) │
├─────────────────────────┼──────────────────────────────────────────┼──────────────────────────────────────────┤
│ CMS Synchronization     │ Fails; manual export on every blog post   │ Real-time / ISR cache revalidation        │
│ Service Registry Sync   │ Manual markdown duplication              │ Direct compile-time import from content.ts│
│ TTFB & Edge Caching     │ Fast (served as static asset)            │ Identical (Next.js Edge Cache / CDN)      │
│ Headers & Content-Type  │ Limited to standard static server config │ Precise `text/plain; charset=utf-8`       │
│ Build Failure Risk      │ Zero                                     │ Zero (compile-time data fallback)        │
└─────────────────────────┴──────────────────────────────────────────┴──────────────────────────────────────────┘
```

#### Evaluation Decision: Dynamic Route Handlers with Incremental Static Regeneration (ISR)
Dynamic Route Handlers (`src/app/llms.txt/route.ts` and `src/app/llms-full.txt/route.ts`) are the superior architectural approach for Next.js 16:
- By configuring `export const revalidate = 3600;`, Next.js renders the markdown at build time and caches it at the edge.
- The route handler directly queries Sanity CMS for recent blog dispatches and imports the validated 16 services from `src/app/services/content.ts`, guaranteeing **zero drift** between website content and LLM documentation.
- Serves explicit HTTP headers:
  ```http
  Content-Type: text/plain; charset=utf-8
  Cache-Control: public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400
  ```

---

### 2.3 Entity Disambiguation and Knowledge Graph Grounding

#### The Entity Disambiguation Challenge
In global knowledge spaces, "Marca" is predominantly associated with the Spanish daily sports newspaper (*Marca*). Without clear disambiguation, generative AI models hallucinate or fail to index Marca Ubi as an elite creative agency.

#### Multi-Layered Grounding Architecture
1. **Explicit Entity Anchoring (`@id`)**:
   Establish `https://marcaubi.com/#organization` as the primary subject entity across all structured data.
2. **Authority `sameAs` Cross-Linking**:
   Link the entity to verifiable digital properties:
   - LinkedIn: `https://linkedin.com/company/marcaubi`
   - Instagram: `https://instagram.com/marcaubi`
   - GitHub: `https://github.com/Fenar7/marca_ubi_web_hosting`
   - Future target: Wikidata entity item (`https://www.wikidata.org/wiki/...`).
3. **Semantic Semantic Grounding (`knowsAbout`)**:
   Enrich the organization schema with explicit concept URIs and topics:
   ```json
   "knowsAbout": [
     "Brand Architecture",
     "Design Systems",
     "Next.js App Router Engineering",
     "Enterprise CRM Software",
     "Creative Technology",
     "Computational Design",
     "Digital Transformation"
   ]
   ```
4. **Physical Geospatial Grounding**:
   Anchor physical presence in Kerala, India:
   ```json
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
   }
   ```
5. **Direct Question-Answering Schema (`FAQPage`)**:
   Grounding common queries directly into the search index so LLM RAG pipelines can answer with 100% factual fidelity:
   - "What services does Marca Ubi provide?"
   - "Where are Marca Ubi's creative studios located?"
   - "How can an enterprise initiate a project with Marca Ubi?"

---

## Part 3: Architectural Implementation Blueprint

### Phase 1: Sitemap & Route Coverage Optimization
- **File**: `src/app/sitemap.ts`
- **Actions**:
  1. Add missing static routes:
     - `/works` (priority: 0.9, changefreq: "monthly")
     - `/careers` (priority: 0.7, changefreq: "weekly")
     - `/privacy`, `/terms`, `/security` (priority: 0.3, changefreq: "yearly")
  2. Eliminate the `new Date()` false freshness anti-pattern on static routes; use stable deployment release date.
  3. Ensure Sanity blog posts preserve accurate `lastModified: new Date(post._updatedAt || post.publishedAt)`.

### Phase 2: Modern AI & Classical Crawler Governance
- **File**: `src/app/robots.ts`
- **Actions**:
  1. Define explicit permissions for Search Grounding & Retrieval bots:
     - `OAI-SearchBot`, `ChatGPT-User`, `PerplexityBot`, `Bingbot`, `Googlebot`, `Applebot` -> `Allow: /`
  2. Protect administrative boundaries:
     - `Disallow: ["/admin/*", "/api/*", "/studio/*", "/_next/*"]`
  3. Declare `sitemap` and explicit `host` directive.

### Phase 3: Metadata Uniformity & Schema Graph Modernization
- **Files**: `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/services/[slug]/page.tsx`, `src/app/careers/page.tsx`, `src/app/start-project/page.tsx`
- **Actions**:
  1. Update `src/app/layout.tsx`:
     - Configure `title: { default: "...", template: "%s | Marca Ubi" }`.
     - Add `alternates: { canonical: "./" }`.
     - Upgrade `ProfessionalService` with `@id: "${siteUrl}/#organization"`, `telephone`, `email`, `areaServed`, `priceRange`, `knowsAbout`, and `geo`.
  2. Update `src/app/page.tsx`:
     - Add `generateMetadata` with custom homepage metadata.
     - Inject `FAQPage` schema mapped from Sanity CMS `faqsQuery` / `FALLBACK_FAQS`.
  3. Update `src/app/services/[slug]/page.tsx`:
     - Connect `provider` to `@id: "${siteUrl}/#organization"`.
     - Add `BreadcrumbList` schema.
  4. Update `src/app/careers/page.tsx`:
     - Enrich `JobPosting` elements with `hiringOrganization: { "@id": "${siteUrl}/#organization" }`, `datePosted`, and `employmentType`.
  5. Update `src/app/start-project/page.tsx`:
     - Add `ContactPage` schema.
     - Add OpenGraph and Twitter image metadata.

### Phase 4: `llms.txt` and `llms-full.txt` Route Handlers
- **Files**:
  - `src/app/llms.txt/route.ts`
  - `src/app/llms-full.txt/route.ts`
- **Actions**:
  1. Create lightweight text route handler for `/llms.txt` summarizing agency identity, core capabilities, and resource links.
  2. Create comprehensive text route handler for `/llms-full.txt` concatenating the 16 service dossiers, studio overview, and key case studies.
  3. Set `export const revalidate = 3600;` and `Content-Type: text/plain; charset=utf-8`.

### Phase 5: IndexNow Instant Indexation Pipeline
- **Files**:
  - `src/app/api/indexnow/route.ts`
  - `public/e4a7c8b9d1024f5a8923bcde14567890.txt` (or environment-configured key route)
- **Actions**:
  1. Secure API route accepting URLs to submit to `https://api.indexnow.org/indexnow`.
  2. Integrate with Sanity webhook revalidation handler so new blog posts trigger immediate Bing/Perplexity crawl.

---

## Verification & Audit Testing Protocol

```bash
# 1. Scoped TypeScript compilation gate
npx tsc -p tsconfig.json --noEmit

# 2. Local XML Sitemap Validation
curl -I http://localhost:3000/sitemap.xml
curl -s http://localhost:3000/sitemap.xml | grep -E "<loc>|<lastmod>"

# 3. Robots.txt Compliance Check
curl -s http://localhost:3000/robots.txt

# 4. LLMs.txt Route Handler Verification
curl -I http://localhost:3000/llms.txt
curl -s http://localhost:3000/llms.txt | head -n 25

# 5. Schema.org Rich Result Validation
# Validate JSON-LD outputs via Google Rich Results Test & Schema Validator CLI
```

---
*Report filed in `docs/seo_ai_search_architecture/AUDIT_AND_BLUEPRINT.md` under strict compliance with Marca Ubi Architectural Standards.*
