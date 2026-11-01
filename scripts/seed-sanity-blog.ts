import { createClient } from "next-sanity";
import fs from "fs";
import path from "path";

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

if (!projectId || !token) {
  console.error("Missing Sanity projectId or SANITY_API_EDIT_TOKEN.");
  process.exit(1);
}

const client = createClient({
  projectId,
  dataset,
  apiVersion,
  token,
  useCdn: false,
});

async function uploadImage(relPath: string) {
  const fullPath = path.resolve(process.cwd(), relPath);
  if (!fs.existsSync(fullPath)) {
    console.warn(`File does not exist: ${fullPath}`);
    return null;
  }
  console.log(`Uploading asset: ${relPath}...`);
  const stream = fs.createReadStream(fullPath);
  const asset = await client.assets.upload("image", stream, {
    filename: path.basename(fullPath),
  });
  return asset._id;
}

async function seed() {
  console.log(`\n--- Seeding Sanity dataset: "${dataset}" (Project: ${projectId}) ---`);

  // Upload Assets
  const avatarAssetId = await uploadImage("public/images/marca-ubi.png");
  const img1AssetId = await uploadImage("public/images/bg-cover-image-2.png");
  const img2AssetId = await uploadImage("public/images/how-we-work1.png");
  // bg-cover-image-3.png is the same building shot as bg-cover-image-2.png;
  // post 3 would duplicate post 1's cover on the listing grid.
  const img3AssetId = await uploadImage("public/images/work-image.png");
  const img4AssetId = await uploadImage("public/images/what-we-stand-for.png");

  // 1. Author
  const authorId = "author-fenar-saleem";
  console.log(`Creating author: ${authorId}...`);
  await client.createOrReplace({
    _id: authorId,
    _type: "author",
    name: "Fenar Saleem",
    slug: { _type: "slug", current: "fenar-saleem" },
    role: "Founder & Creative Technologist",
    bio: "Directing brand architecture, design systems, and digital engineering at Marca Ubi. Exploring the nexus of editorial pacing, tactile typography, and performant web systems.",
    avatar: avatarAssetId
      ? {
          _type: "image",
          asset: { _type: "reference", _ref: avatarAssetId },
          alt: "Fenar Saleem — Marca Ubi",
        }
      : undefined,
    socialLinks: [
      { platform: "linkedin", url: "https://linkedin.com/company/marcaubi" },
      { platform: "twitter", url: "https://x.com/marcaubi" },
      { platform: "website", url: "https://marcaubi.com" },
    ],
  });

  // 2. Categories
  const categories = [
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

  for (const cat of categories) {
    console.log(`Creating category: ${cat.title}...`);
    await client.createOrReplace({
      _id: cat._id,
      _type: "category",
      title: cat.title,
      slug: { _type: "slug", current: cat.slug },
      description: cat.description,
      color: cat.color,
    });
  }

  // 3. Posts
  const posts = [
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
      mainAssetId: img1AssetId,
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
      mainAssetId: img2AssetId,
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
      mainAssetId: img3AssetId,
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
      mainAssetId: img4AssetId,
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

  for (const post of posts) {
    console.log(`Creating post: "${post.title}"...`);
    await client.createOrReplace({
      _id: post._id,
      _type: "post",
      title: post.title,
      slug: { _type: "slug", current: post.slug },
      publishedAt: post.publishedAt,
      excerpt: post.excerpt,
      estimatedReadingTime: post.estimatedReadingTime,
      featured: post.featured,
      author: { _type: "reference", _ref: authorId },
      category: { _type: "reference", _ref: post.categoryId },
      mainImage: post.mainAssetId
        ? {
            _type: "image",
            asset: { _type: "reference", _ref: post.mainAssetId },
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

  console.log("\n Sanity dataset successfully populated with dummy blog content!");
  console.log(`- 1 Author: Fenar Saleem`);
  console.log(`- 3 Categories: Digital Craft, Brand Systems, Strategy & Field Notes`);
  console.log(`- 4 High-Craft Dispatches with Rich Blocks, Images, Code & Headings`);
}

seed().catch((err) => {
  console.error("Seeding error:", err);
  process.exit(1);
});
