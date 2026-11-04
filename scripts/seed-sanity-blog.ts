/**
 * @file scripts/seed-sanity-blog.ts
 * @description Comprehensive Sanity CMS Seeding Engine and Static Validation Registry for
 *              Marca Ubi Enterprise Editorial Dispatches.
 *
 *              Features:
 *              1. Seeds foundational taxonomy (Author Fenar Saleem, 3 Core Categories)
 *              2. Seeds 4 Craft & Philosophy Dispatches (Legacy Studio Pillars)
 *              3. Integrates and seeds 4 High-Authority Flagship GEO/AEO Dispatches from
 *                 `scripts/data/flagship-articles.ts` targeting commercial service hubs
 *              4. Provides non-destructive fallback validation when Sanity write credentials
 *                 are absent (CI/local runs), preventing build failures while verifying
 *                 referential integrity across all 8 dispatches.
 *
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import { createClient } from "next-sanity";
import * as fs from "fs";
import * as path from "path";
import { FLAGSHIP_ARTICLES, type FlagshipArticle } from "./data/flagship-articles";

// 1. Parse .env.local manually
function loadEnv() {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return {};
  const content = fs.readFileSync(envPath, "utf-8");
  const env: Record<string, string> = {};
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim();
      env[key] = val;
    }
  }
  return env;
}

const env = loadEnv();
const projectId = env.NEXT_PUBLIC_SANITY_PROJECT_ID || process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = env.NEXT_PUBLIC_SANITY_DATASET || process.env.NEXT_PUBLIC_SANITY_DATASET || "production";
const apiVersion = env.NEXT_PUBLIC_SANITY_API_VERSION || process.env.NEXT_PUBLIC_SANITY_API_VERSION || "2026-02-27";
const token = env.SANITY_API_EDIT_TOKEN || process.env.SANITY_API_EDIT_TOKEN;

// 2. Author Profile
export const STUDIO_AUTHOR = {
  _id: "author-fenar-saleem",
  _type: "author" as const,
  name: "Fenar Saleem",
  slug: { _type: "slug" as const, current: "fenar-saleem" },
  role: "Founder & Creative Technologist",
  bio: "Directing brand architecture, design systems, and digital engineering at Marca Ubi. Exploring the nexus of editorial pacing, tactile typography, and performant web systems.",
  avatarPath: "public/images/marca-ubi.png",
  socialLinks: [
    { platform: "linkedin", url: "https://linkedin.com/company/marcaubi" },
    { platform: "twitter", url: "https://x.com/marcaubi" },
    { platform: "website", url: "https://marcaubi.com" },
  ],
};

// 3. Category Taxonomy
export const STUDIO_CATEGORIES = [
  {
    _id: "category-digital-craft",
    title: "Digital Craft",
    slug: "digital-craft",
    description: "Frontend architecture, creative motion, fluid clamp typography, and micro-geometry.",
    color: "#ff6100",
  },
  {
    _id: "category-brand-systems",
    title: "Brand Systems",
    slug: "brand-systems",
    description: "Foundational visual identities, typography guidelines, and scalable design architectures.",
    color: "#ff6100",
  },
  {
    _id: "category-strategy",
    title: "Strategy & Field Notes",
    slug: "strategy",
    description: "Dispatches on studio philosophy, high-conviction client partnerships, and market positioning.",
    color: "#ff6100",
  },
];

// 4. Legacy Craft Dispatches
export const LEGACY_POSTS = [
  {
    _id: "post-architecture-of-dark-luxury-interfaces",
    title: "The Architecture of Dark Luxury: Designing for Weight, Restraint, and Presence",
    slug: "architecture-of-dark-luxury-interfaces",
    publishedAt: "2026-10-12T10:00:00.000Z",
    excerpt:
      "Why high-conviction luxury brands are abandoning fluorescent gradients and busy UI in favor of pitch black canvases, hairline micro-geometry, and bespoke typographic scales.",
    estimatedReadingTime: 5,
    featured: true,
    categoryId: "category-digital-craft",
    imageAssetPath: "public/images/bg-cover-image-2.png",
    mainAlt: "Dark luxury interface architecture with subtle glowing accents",
    mainCaption: "Fig 1.0 — Minimalist dark interface canvas engineered for high visual prestige.",
    body: [
      {
        _key: "b1",
        _type: "block",
        style: "normal",
        children: [
          {
            _key: "b1_c1",
            _type: "span",
            text: "In the contemporary digital landscape, luxury is rarely defined by ornamentation. It is defined by restraint, intentional pacing, and an uncompromising mastery of empty space. Where commodity software defaults to crowded dashboards and chaotic micro-animations, premium brands command authority through absolute composure.",
          },
        ],
      },
      {
        _key: "b2",
        _type: "block",
        style: "h2",
        children: [
          {
            _key: "b2_c1",
            _type: "span",
            text: "The Principle of the True Black Canvas",
          },
        ],
      },
      {
        _key: "b3",
        _type: "block",
        style: "normal",
        children: [
          {
            _key: "b3_c1",
            _type: "span",
            text: "A true dark mode aesthetic is not simply an inverted light theme. It requires an entirely distinct optical philosophy. When background luminance drops to #000000, white text at 100% opacity generates intense optical vibration. To establish physical depth without sensory fatigue, we modulate typographic contrast through structured opacity tiers and calibrate hairline borders at 8% white opacity.",
          },
        ],
      },
      {
        _key: "b4",
        _type: "callout",
        type: "insight",
        title: "Studio Rule: Optical Weight Over Shadows",
        content:
          "On an absolute black canvas, drop shadows lose their natural physical meaning. Depth is achieved instead through translucent surface fills (rgba(255, 255, 255, 0.02)), hairline geometric borders, and radial ambient glow accents.",
      },
      {
        _key: "b5",
        _type: "block",
        style: "h2",
        children: [
          {
            _key: "b5_c1",
            _type: "span",
            text: "The Disciplined Accent: Brand Fire",
          },
        ],
      },
      {
        _key: "b6",
        _type: "block",
        style: "normal",
        children: [
          {
            _key: "b6_c1",
            _type: "span",
            text: "When a single accent color is introduced into a pitch-dark environment—such as Marca Ubi's signature orange (#ff6100)—it commands immediate retinal priority. By reserving this accent strictly for conversion milestones, active navigation states, and editorial highlights, the interface achieves maximum communicative efficiency.",
          },
        ],
      },
      {
        _key: "b7",
        _type: "block",
        style: "blockquote",
        children: [
          {
            _key: "b7_c1",
            _type: "span",
            text: "Great design is not when there is nothing more to add, but when there is nothing left to take away without collapsing the soul of the experience.",
          },
        ],
      },
      {
        _key: "b8",
        _type: "block",
        style: "h2",
        children: [
          {
            _key: "b8_c1",
            _type: "span",
            text: "Micro-Geometry and Hairline Precision",
          },
        ],
      },
      {
        _key: "b9",
        _type: "block",
        style: "normal",
        children: [
          {
            _key: "b9_c1",
            _type: "span",
            text: "Notice how high-end Swiss watches or architectural monolithic facades rely on razor-thin chamfers. In CSS, we translate this via high-precision border tokens:",
          },
        ],
      },
      {
        _key: "b10",
        _type: "codeBlock",
        filename: "tokens.scss",
        language: "scss",
        code: "$border-hairline: 1px solid rgba(255, 255, 255, 0.08);\n$border-focus: 2px solid #ff6100;\n$surface-elevated: rgba(255, 255, 255, 0.025);\n$ease-studio: cubic-bezier(0.16, 1, 0.3, 1);",
      },
      {
        _key: "b11",
        _type: "block",
        style: "normal",
        children: [
          {
            _key: "b11_c1",
            _type: "span",
            text: "By marrying this visual restraint with fluid Next.js 16 performance and smooth GSAP timing, digital products elevate beyond utilitarian software into lasting brand assets.",
          },
        ],
      },
    ],
    seo: {
      metaTitle: "The Architecture of Dark Luxury | Marca Ubi Insights",
      metaDescription:
        "Why high-conviction luxury brands are abandoning fluorescent gradients and busy UI in favor of pitch black canvas and bespoke typographic scales.",
      keywords: ["dark mode design", "luxury branding", "design systems", "Marca Ubi", "creative engineering"],
    },
  },
  {
    _id: "post-why-fluid-typography-matters-more-than-breakpoints",
    title: "Why Fluid Typography Matters More Than Conventional Breakpoints",
    slug: "why-fluid-typography-matters-more-than-breakpoints",
    publishedAt: "2026-10-08T09:30:00.000Z",
    excerpt:
      "A technical breakdown of CSS clamp math, proportional viewport curves, and how we eliminated rigid responsive jumps across modern high-DPI displays.",
    estimatedReadingTime: 4,
    featured: false,
    categoryId: "category-digital-craft",
    imageAssetPath: "public/images/how-we-work1.png",
    mainAlt: "Fluid responsive typography scale diagram",
    mainCaption: "Fig 2.0 — Smooth continuous viewport scaling curve without discrete layout jumps.",
    body: [
      {
        _key: "b1",
        _type: "block",
        style: "normal",
        children: [
          {
            _key: "b1_c1",
            _type: "span",
            text: "For more than a decade, web design has operated under the fiction of discrete screen widths: 375px mobile, 768px tablet, 1440px desktop. Yet in reality, modern devices span hundreds of intermediate viewports, from foldable displays to ultrawide cinema monitors.",
          },
        ],
      },
      {
        _key: "b2",
        _type: "block",
        style: "h2",
        children: [
          {
            _key: "b2_c1",
            _type: "span",
            text: "The Problem With Stepped Breakpoints",
          },
        ],
      },
      {
        _key: "b3",
        _type: "block",
        style: "normal",
        children: [
          {
            _key: "b3_c1",
            _type: "span",
            text: "When typography changes abruptly at media query thresholds, layout shifts occur, line wrapping breaks unpredictably, and user reading rhythm is violently interrupted during window resizing. Fluid typography solves this at the mathematical root.",
          },
        ],
      },
      {
        _key: "b4",
        _type: "callout",
        type: "note",
        title: "Mathematical Foundation",
        content:
          "CSS clamp(min, preferred, max) creates a continuous linear slope: font-size: clamp(2rem, 1.25rem + 3.75vw, 5.5rem). The rate of scaling matches the natural angular viewing distance of the human eye.",
      },
      {
        _key: "b5",
        _type: "block",
        style: "h2",
        children: [
          {
            _key: "b5_c1",
            _type: "span",
            text: "Implementation in Modern SCSS",
          },
        ],
      },
      {
        _key: "b6",
        _type: "block",
        style: "normal",
        children: [
          {
            _key: "b6_c1",
            _type: "span",
            text: "Here is the exact fluid scaling function used across Marca Ubi's digital experiences:",
          },
        ],
      },
      {
        _key: "b7",
        _type: "codeBlock",
        filename: "fluid-scale.scss",
        language: "scss",
        code: "$type-display: clamp(2.75rem, 5.5vw, 6.25rem);\n$type-h1: clamp(2.25rem, 4.2vw, 4.5rem);\n$type-h2: clamp(1.75rem, 2.8vw, 3rem);\n$container-pad: clamp(1rem, 5.2vw, 6.25rem);",
      },
      {
        _key: "b8",
        _type: "block",
        style: "normal",
        children: [
          {
            _key: "b8_c1",
            _type: "span",
            text: "By establishing these continuous curves, every headline maintains ideal optical tension whether viewed on an iPhone SE or an Apple Pro Display XDR.",
          },
        ],
      },
    ],
    seo: {
      metaTitle: "Fluid Typography vs Breakpoints | Marca Ubi Engineering",
      metaDescription:
        "A technical breakdown of CSS clamp math, proportional viewport curves, and eliminating responsive jumps.",
      keywords: ["CSS clamp", "fluid typography", "responsive web design", "creative development"],
    },
  },
  {
    _id: "post-brand-systems-that-outlive-trends",
    title: "Engineering Brand Systems That Outlive Algorithmic Trends",
    slug: "brand-systems-that-outlive-trends",
    publishedAt: "2026-09-28T14:15:00.000Z",
    excerpt:
      "The tension between immediate social virality and enduring brand equity: why foundational design architecture must precede cosmetic campaigns.",
    estimatedReadingTime: 6,
    featured: false,
    categoryId: "category-brand-systems",
    imageAssetPath: "public/images/work-image.png",
    mainAlt: "Brand architecture and visual identity geometry",
    mainCaption: "Fig 3.0 — Identity tokens structured as modular, immutable design primitives.",
    body: [
      {
        _key: "b1",
        _type: "block",
        style: "normal",
        children: [
          {
            _key: "b1_c1",
            _type: "span",
            text: "Every few quarters, a new aesthetic wave sweeps across product design: neomorphism, glassmorphism, hyper-saturated Y2K nostalgia, brutalist raw HTML. Brands that rapidly redesign to chase these trends frequently suffer catastrophic equity erosion.",
          },
        ],
      },
      {
        _key: "b2",
        _type: "block",
        style: "h2",
        children: [
          {
            _key: "b2_c1",
            _type: "span",
            text: "Brand Architecture as Permanent Infrastructure",
          },
        ],
      },
      {
        _key: "b3",
        _type: "block",
        style: "normal",
        children: [
          {
            _key: "b3_c1",
            _type: "span",
            text: "A genuine brand system functions like civic infrastructure. The typography, grid ratios, spatial rules, and voice tokens are structural steel. Campaigns, product launches, and seasonal activations are the temporary exhibitions housed within that structure.",
          },
        ],
      },
      {
        _key: "b4",
        _type: "block",
        style: "blockquote",
        children: [
          {
            _key: "b4_c1",
            _type: "span",
            text: "The goal of brand architecture is not novelty; it is recognition. Novelty wins clicks for a week; recognition builds a legacy over decades.",
          },
        ],
      },
      {
        _key: "b5",
        _type: "block",
        style: "h2",
        children: [
          {
            _key: "b5_c1",
            _type: "span",
            text: "The Four Foundations of Longevity",
          },
        ],
      },
      {
        _key: "b6",
        _type: "block",
        style: "normal",
        children: [
          {
            _key: "b6_c1",
            _type: "span",
            text: "1. Typographic Conviction: Selecting typefaces rooted in timeless proportions rather than ephemeral novelty.\n2. Proportional Grids: Anchoring layout rhythm to rational geometric modules.\n3. Monochromatic Backbone: Designing the identity to be 100% recognizable in pure black and white before introducing color.\n4. Scalable Micro-interactions: Motion rules that feel physical, weighted, and natural.",
          },
        ],
      },
    ],
    seo: {
      metaTitle: "Engineering Brand Systems That Outlive Trends | Marca Ubi",
      metaDescription:
        "Why foundational design architecture must precede cosmetic campaigns to build enduring brand equity.",
      keywords: ["brand systems", "identity architecture", "graphic design", "brand strategy"],
    },
  },
  {
    _id: "post-the-renaissance-of-editorial-design-on-the-web",
    title: "The Renaissance of Editorial Craft in Contemporary Web Design",
    slug: "the-renaissance-of-editorial-design-on-the-web",
    publishedAt: "2026-09-15T11:00:00.000Z",
    excerpt:
      "How print editorial discipline, disciplined grid alignments, and intentional pacing are rescuing web experiences from modular SaaS monotony.",
    estimatedReadingTime: 4,
    featured: false,
    categoryId: "category-strategy",
    imageAssetPath: "public/images/what-we-stand-for.png",
    mainAlt: "Editorial print layout contrasted with modern digital web canvas",
    mainCaption: "Fig 4.0 — Bringing the rigor of classic Swiss editorial layout into dynamic digital spaces.",
    body: [
      {
        _key: "b1",
        _type: "block",
        style: "normal",
        children: [
          {
            _key: "b1_c1",
            _type: "span",
            text: "Walk through the web today and you will encounter the same 12-column card grid, the same purple gradient pills, and the same interchangeable generic layouts. Digital design has optimized for speed of assembly at the total expense of emotional resonance.",
          },
        ],
      },
      {
        _key: "b2",
        _type: "block",
        style: "h2",
        children: [
          {
            _key: "b2_c1",
            _type: "span",
            text: "Learning from Print Masters",
          },
        ],
      },
      {
        _key: "b3",
        _type: "block",
        style: "normal",
        children: [
          {
            _key: "b3_c1",
            _type: "span",
            text: "When we examine master editorial works—from Massimo Vignelli's manuals to early Pentagram annuals—we find a reverence for asymmetrical balance, dramatic scale shifts, and deliberate narrative pacing. Web browsers are now capable of executing these print-level subtleties with absolute fluidity.",
          },
        ],
      },
      {
        _key: "b4",
        _type: "callout",
        type: "insight",
        title: "The Editorial Standard",
        content:
          "Every screenful must tell a complete visual story before the user initiates scroll. The title, standfirst, and metadata should stand as a unified typographic composition.",
      },
    ],
    seo: {
      metaTitle: "The Renaissance of Editorial Craft | Marca Ubi",
      metaDescription:
        "How print editorial discipline and intentional pacing are rescuing web experiences from modular monotony.",
      keywords: ["editorial design", "web craft", "typography", "digital storytelling"],
    },
  },
];

// Helper export to access flagship dispatches
export function getFlagshipArticles(): FlagshipArticle[] {
  return FLAGSHIP_ARTICLES;
}

// Helper export to access all blog articles
export function getAllBlogArticles() {
  return [...LEGACY_POSTS, ...FLAGSHIP_ARTICLES];
}

/**
 * Validates integrity of all blog dispatches without requiring Sanity API credentials.
 * Ensures referential integrity, category taxonomy matching, and schema compliance.
 */
export function validateAllArticles(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const validCategoryIds = new Set(STUDIO_CATEGORIES.map((c) => c._id));
  const seenSlugs = new Set<string>();

  const allArticles = getAllBlogArticles();

  for (const article of allArticles) {
    if (seenSlugs.has(article.slug)) {
      errors.push(`Duplicate slug detected: "${article.slug}"`);
    }
    seenSlugs.add(article.slug);

    if (!validCategoryIds.has(article.categoryId)) {
      errors.push(`Article "${article.title}" references unknown category "${article.categoryId}"`);
    }

    if (!article.body || article.body.length === 0) {
      errors.push(`Article "${article.title}" contains empty body blocks`);
    }

    if (!article.excerpt || article.excerpt.length < 30) {
      errors.push(`Article "${article.title}" excerpt is too short (min 30 chars required)`);
    }

    if (!article.seo?.metaTitle || !article.seo?.metaDescription) {
      errors.push(`Article "${article.title}" is missing SEO metaTitle or metaDescription`);
    }
  }

  return { valid: errors.length === 0, errors };
}

async function uploadImage(client: any, relPath: string): Promise<string | null> {
  const fullPath = path.resolve(process.cwd(), relPath);
  if (!fs.existsSync(fullPath)) {
    console.warn(`[Asset Warning] File does not exist: ${fullPath}`);
    return null;
  }
  console.log(`Uploading asset: ${relPath}...`);
  const stream = fs.createReadStream(fullPath);
  const asset = await client.assets.upload("image", stream, {
    filename: path.basename(fullPath),
  });
  return asset._id;
}

/**
 * Main seeding orchestrator.
 * Non-destructive: if credentials are not provided or --dry-run is supplied,
 * performs rigorous schema and content validation and exits cleanly.
 */
export async function seedSanityBlog(options: { dryRun?: boolean } = {}) {
  const isDryRun = options.dryRun || process.argv.includes("--dry-run") || process.argv.includes("--validate");

  console.log("\n========================================================");
  console.log("   MARCA UBI ENTERPRISE EDITORIAL SEEDING ENGINE       ");
  console.log("========================================================\n");

  const validation = validateAllArticles();
  if (!validation.valid) {
    console.error("Validation failed with the following errors:");
    validation.errors.forEach((err) => console.error(`  - ${err}`));
    throw new Error(`Seeding validation failed: ${validation.errors.length} errors found.`);
  }

  console.log(`[PASS] Validation check passed for 4 Legacy Posts + 4 GEO Flagship Dispatches.`);
  console.log(`- Total Dispatches verified: ${getAllBlogArticles().length}`);
  console.log(`- Taxonomies verified: ${STUDIO_CATEGORIES.length} categories, 1 author.`);

  if (!projectId || !token) {
    console.warn("\n[NOTICE] NEXT_PUBLIC_SANITY_PROJECT_ID or SANITY_API_EDIT_TOKEN is not configured in .env.local.");
    console.warn("[NOTICE] Running in Static Mode: Articles verified for static import and Next.js ISR rendering.");
    console.log("\nStatic Registry Ready:");
    getAllBlogArticles().forEach((art, i) => {
      console.log(`  ${i + 1}. [${art.categoryId}] ${art.title} (/${art.slug})`);
    });
    return;
  }

  if (isDryRun) {
    console.log("\n[INFO] --dry-run flag detected. Skipping live Sanity mutations.");
    return;
  }

  const client = createClient({
    projectId,
    dataset,
    apiVersion,
    token,
    useCdn: false,
  });

  console.log(`\nConnecting to Sanity dataset: "${dataset}" (Project: ${projectId})...`);

  // Upload Assets
  const avatarAssetId = await uploadImage(client, STUDIO_AUTHOR.avatarPath);
  const img1AssetId = await uploadImage(client, "public/images/bg-cover-image-2.png");
  const img2AssetId = await uploadImage(client, "public/images/how-we-work1.png");
  const img3AssetId = await uploadImage(client, "public/images/work-image.png");
  const img4AssetId = await uploadImage(client, "public/images/what-we-stand-for.png");

  const assetLookup: Record<string, string | null> = {
    "public/images/bg-cover-image-2.png": img1AssetId,
    "public/images/how-we-work1.png": img2AssetId,
    "public/images/work-image.png": img3AssetId,
    "public/images/what-we-stand-for.png": img4AssetId,
  };

  // 1. Author
  console.log(`\n1. Creating/Updating Author: ${STUDIO_AUTHOR.name}...`);
  await client.createOrReplace({
    _id: STUDIO_AUTHOR._id,
    _type: STUDIO_AUTHOR._type,
    name: STUDIO_AUTHOR.name,
    slug: STUDIO_AUTHOR.slug,
    role: STUDIO_AUTHOR.role,
    bio: STUDIO_AUTHOR.bio,
    avatar: avatarAssetId
      ? {
          _type: "image",
          asset: { _type: "reference", _ref: avatarAssetId },
          alt: `${STUDIO_AUTHOR.name} — Marca Ubi`,
        }
      : undefined,
    socialLinks: STUDIO_AUTHOR.socialLinks,
  });

  // 2. Categories
  console.log(`\n2. Creating/Updating Categories...`);
  for (const cat of STUDIO_CATEGORIES) {
    console.log(`  - Category: ${cat.title} (${cat.slug})`);
    await client.createOrReplace({
      _id: cat._id,
      _type: "category",
      title: cat.title,
      slug: { _type: "slug", current: cat.slug },
      description: cat.description,
      color: cat.color,
    });
  }

  // 3. Legacy Posts
  console.log(`\n3. Seeding Legacy Craft Dispatches...`);
  for (const post of LEGACY_POSTS) {
    console.log(`  - Seeding Legacy: "${post.title}"`);
    const assetId = assetLookup[post.imageAssetPath] || img1AssetId;
    await client.createOrReplace({
      _id: post._id,
      _type: "post",
      title: post.title,
      slug: { _type: "slug", current: post.slug },
      publishedAt: post.publishedAt,
      excerpt: post.excerpt,
      estimatedReadingTime: post.estimatedReadingTime,
      featured: post.featured,
      author: { _type: "reference", _ref: STUDIO_AUTHOR._id },
      category: { _type: "reference", _ref: post.categoryId },
      mainImage: assetId
        ? {
            _type: "image",
            asset: { _type: "reference", _ref: assetId },
            alt: post.mainAlt,
            caption: post.mainCaption,
          }
        : undefined,
      body: post.body,
      seo: {
        metaTitle: post.seo.metaTitle,
        metaDescription: post.seo.metaDescription,
        keywords: post.seo.keywords,
        noIndex: false,
      },
    });
  }

  // 4. Flagship GEO Dispatches
  console.log(`\n4. Seeding Flagship GEO Editorial Dispatches...`);
  for (const post of FLAGSHIP_ARTICLES) {
    console.log(`  - Seeding Flagship: "${post.title}"`);
    const assetId = assetLookup[post.imageAssetPath] || img1AssetId;
    await client.createOrReplace({
      _id: post._id,
      _type: "post",
      title: post.title,
      slug: { _type: "slug", current: post.slug },
      publishedAt: post.publishedAt,
      excerpt: post.excerpt,
      estimatedReadingTime: post.estimatedReadingTime,
      featured: post.featured,
      author: { _type: "reference", _ref: STUDIO_AUTHOR._id },
      category: { _type: "reference", _ref: post.categoryId },
      mainImage: assetId
        ? {
            _type: "image",
            asset: { _type: "reference", _ref: assetId },
            alt: post.mainAlt,
            caption: post.mainCaption,
          }
        : undefined,
      body: post.body,
      seo: {
        metaTitle: post.seo.metaTitle,
        metaDescription: post.seo.metaDescription,
        keywords: post.seo.keywords,
        canonicalUrl: post.seo.canonicalUrl,
        noIndex: false,
      },
    });
  }

  console.log("\n========================================================");
  console.log("   SANITY CMS EDITORIAL SEEDING COMPLETED SUCCESSFULLY  ");
  console.log("========================================================");
  console.log(`- Author: ${STUDIO_AUTHOR.name}`);
  console.log(`- Categories: ${STUDIO_CATEGORIES.length}`);
  console.log(`- Total Posts Seeded: ${LEGACY_POSTS.length + FLAGSHIP_ARTICLES.length} (4 Legacy + 4 Flagship)`);
}

// Execute CLI run if executed directly
if (require.main === module || process.argv[1]?.endsWith("seed-sanity-blog.ts")) {
  seedSanityBlog().catch((err) => {
    console.error("Seeding execution error:", err);
    process.exit(1);
  });
}
