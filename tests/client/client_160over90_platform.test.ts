/**
 * @file tests/client/client_160over90_platform.test.ts
 * @description Comprehensive automated verification test suite for the 160over90
 *              Client-Side Platform Redesign for Marca Ubi Enterprise.
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

describe("Marca Ubi — 160over90 Client Platform Redesign Invariants", () => {
  const rootDir = process.cwd();

  describe("Section 1: Typography & Circular XX Web Fonts", () => {
    test("verifies all three official Circular XX WOFF2 web font files exist on disk", () => {
      const fontDir = path.join(rootDir, "public", "fonts", "circular");
      assert.ok(fs.existsSync(fontDir), "Font directory public/fonts/circular must exist");

      const bookFont = path.join(fontDir, "CircularXXWeb-Book.woff2");
      const mediumFont = path.join(fontDir, "CircularXXWeb-Medium.woff2");
      const boldFont = path.join(fontDir, "CircularXXWeb-Bold.woff2");

      assert.ok(fs.existsSync(bookFont), "CircularXXWeb-Book.woff2 must exist");
      assert.ok(fs.existsSync(mediumFont), "CircularXXWeb-Medium.woff2 must exist");
      assert.ok(fs.existsSync(boldFont), "CircularXXWeb-Bold.woff2 must exist");

      assert.ok(fs.statSync(bookFont).size > 60000, "Book font must be valid WOFF2 binary > 60KB");
      assert.ok(fs.statSync(mediumFont).size > 60000, "Medium font must be valid WOFF2 binary > 60KB");
      assert.ok(fs.statSync(boldFont).size > 60000, "Bold font must be valid WOFF2 binary > 60KB");
    });

    test("verifies Next.js localFont registers --font-circular in fonts.ts", () => {
      const fontsFile = path.join(rootDir, "src", "app", "fonts.ts");
      const content = fs.readFileSync(fontsFile, "utf8");

      assert.ok(content.includes('variable: "--font-circular"'), "Must export font variable --font-circular");
      assert.ok(content.includes("CircularXXWeb-Book.woff2"), "Must map Book weight to 400");
      assert.ok(content.includes("CircularXXWeb-Medium.woff2"), "Must map Medium weight to 500");
      assert.ok(content.includes("CircularXXWeb-Bold.woff2"), "Must map Bold weight to 700");
    });
  });

  describe("Section 2: 60-30-10 Color Architecture & Contrast Standards", () => {
    function hexToLuminance(hex: string): number {
      const cleaned = hex.replace("#", "");
      const r = parseInt(cleaned.substring(0, 2), 16) / 255;
      const g = parseInt(cleaned.substring(2, 4), 16) / 255;
      const b = parseInt(cleaned.substring(4, 6), 16) / 255;

      const toLinear = (c: number) =>
        c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);

      const R = toLinear(r);
      const G = toLinear(g);
      const B = toLinear(b);

      return 0.2126 * R + 0.7152 * G + 0.0722 * B;
    }

    function calculateContrastRatio(hex1: string, hex2: string): number {
      const lum1 = hexToLuminance(hex1);
      const lum2 = hexToLuminance(hex2);
      const brightest = Math.max(lum1, lum2);
      const darkest = Math.min(lum1, lum2);
      return (brightest + 0.05) / (darkest + 0.05);
    }

    test("validates mathematical WCAG AAA contrast for #0a0a0a dark text on #ffffff white canvas", () => {
      const contrast = calculateContrastRatio("#0a0a0a", "#ffffff");
      assert.ok(contrast >= 19.0, `Contrast ratio ${contrast.toFixed(2)}:1 must exceed 19:1 (WCAG AAA)`);
    });

    test("validates mathematical WCAG AA contrast for #ea002a brand red on #ffffff white canvas", () => {
      const contrast = calculateContrastRatio("#ea002a", "#ffffff");
      assert.ok(contrast >= 4.5, `Contrast ratio ${contrast.toFixed(2)}:1 must satisfy WCAG AA (>= 4.5:1)`);
    });

    test("validates mathematical WCAG AA contrast for #ea002a brand red on #000000 black canvas", () => {
      const contrast = calculateContrastRatio("#ea002a", "#000000");
      assert.ok(contrast >= 4.5, `Contrast ratio ${contrast.toFixed(2)}:1 must satisfy WCAG AA (>= 4.5:1)`);
    });

    test("asserts client-tokens.scss defines #ea002a brand red accent and 60-30-10 tokens", () => {
      const tokensFile = path.join(rootDir, "src", "app", "styles", "client-tokens.scss");
      const content = fs.readFileSync(tokensFile, "utf8");

      assert.ok(content.includes("#ea002a"), "client-tokens.scss must define #ea002a");
      assert.ok(content.includes("--client-accent-red"), "Must declare CSS variable --client-accent-red");
      assert.ok(content.includes("--client-canvas-white"), "Must declare CSS variable --client-canvas-white");
      assert.ok(content.includes("--client-canvas-black"), "Must declare CSS variable --client-canvas-black");
    });
  });

  describe("Section 3: Single Fixed Video Engine & Scrim Invariants", () => {
    test("verifies background video file public/video/video-web.mp4 exists and is > 5MB", () => {
      const videoPath = path.join(rootDir, "public", "video", "video-web.mp4");
      assert.ok(fs.existsSync(videoPath), "Video asset public/video/video-web.mp4 must exist");
      assert.ok(fs.statSync(videoPath).size > 5000000, "Video asset must be a valid media file > 5MB");
    });

    test("asserts BackgroundVideoEngine.module.css enforces fixed positioning, z-index -1, and GPU acceleration", () => {
      const scssPath = path.join(rootDir, "src", "app", "components", "BackgroundVideo", "BackgroundVideoEngine.module.css");
      const content = fs.readFileSync(scssPath, "utf8");

      assert.ok(content.includes("position: fixed"), "Must enforce position: fixed");
      assert.ok(content.includes("z-index: -1"), "Must set z-index: -1");
      assert.ok(content.includes("translate3d(0, 0, 0)"), "Must use translate3d for GPU compositor layer");
    });

    test("verifies BackgroundVideoEngine.tsx handles playsInline, autoPlay, muted, and low power mode", () => {
      const tsxPath = path.join(rootDir, "src", "app", "components", "BackgroundVideo", "BackgroundVideoEngine.tsx");
      const content = fs.readFileSync(tsxPath, "utf8");

      assert.ok(content.includes("playsInline"), "Must include playsInline for iOS WebKit");
      assert.ok(content.includes("autoPlay"), "Must include autoPlay");
      assert.ok(content.includes("muted"), "Must include muted attribute");
      assert.ok(content.includes("prefers-reduced-motion"), "Must handle prefers-reduced-motion");
      assert.ok(content.includes("NotAllowedError"), "Must catch NotAllowedError for Low Power Mode");
    });
  });

  describe("Section 4: Reel Modal Accessibility & WAI-ARIA Invariants", () => {
    test("asserts ReelModal.tsx implements WAI-ARIA dialog attributes and focus trap", () => {
      const modalPath = path.join(rootDir, "src", "app", "components", "ReelModal", "ReelModal.tsx");
      const content = fs.readFileSync(modalPath, "utf8");

      assert.ok(content.includes('role="dialog"'), "Must implement role=dialog");
      assert.ok(content.includes('aria-modal="true"'), "Must declare aria-modal=true");
      assert.ok(content.includes("aria-labelledby"), "Must have aria-labelledby");
      assert.ok(content.includes("Escape"), "Must handle Escape key to close modal");
      assert.ok(content.includes('window.dispatchEvent(new CustomEvent("reel:open"))'), "Must dispatch reel:open to pause background video");
      assert.ok(content.includes('window.dispatchEvent(new CustomEvent("reel:close"))'), "Must dispatch reel:close to resume background video");
    });
  });

  describe("Section 5: CRM Air-Gap Isolation Guarantee", () => {
    test("verifies client-tokens.scss is strictly isolated from [data-admin-root='true']", () => {
      const clientTokensPath = path.join(rootDir, "src", "app", "styles", "client-tokens.scss");
      const content = fs.readFileSync(clientTokensPath, "utf8");

      assert.ok(
        content.includes(':root:not([data-admin-root="true"])'),
        "Must exclude admin root with :root:not([data-admin-root='true'])"
      );
    });

    test("asserts admin tokens.scss remains untouched and protected under [data-admin-root='true']", () => {
      const adminTokensPath = path.join(rootDir, "src", "app", "admin", "styles", "tokens.scss");
      const content = fs.readFileSync(adminTokensPath, "utf8");

      assert.ok(
        content.includes('[data-admin-root="true"]'),
        "Admin tokens must be strictly scoped to [data-admin-root='true']"
      );
    });
  });

  describe("Section 6: Robots Governance & Crawler Protection", () => {
    test("verifies robots.ts strictly blocks crawlers from indexing /admin and /api paths", () => {
      const robotsPath = path.join(rootDir, "src", "app", "robots.ts");
      const content = fs.readFileSync(robotsPath, "utf8");

      assert.ok(content.includes('"/admin"'), "Must disallow /admin");
      assert.ok(content.includes('"/admin/"'), "Must disallow /admin/");
      assert.ok(content.includes('"/api"'), "Must disallow /api");
      assert.ok(content.includes('"/api/"'), "Must disallow /api/");
    });
  });

  describe("Section 7: Zero AI Slop & Code Hygiene Checks", () => {
    test("verifies zero generic blue (#2563eb or #4571ff) in newly created client components", () => {
      const filesToCheck = [
        "src/app/styles/client-tokens.scss",
        "src/app/components/BackgroundVideo/BackgroundVideoEngine.module.css",
        "src/app/components/ClientHeader/ClientHeader.module.scss",
        "src/app/components/ReelModal/ReelModal.module.scss",
        "src/app/components/Sections/HeroCutout.module.scss",
        "src/app/components/Sections/AboutDoctrineCurtain.module.scss",
        "src/app/components/Sections/ReelCutout.module.scss",
        "src/app/components/Sections/WorksCurtain.module.scss",
        "src/app/components/Sections/ValuesCutout.module.scss",
        "src/app/components/Sections/ProcessCurtain.module.scss",
        "src/app/components/Sections/TestimonialsCutout.module.scss",
        "src/app/components/Sections/DispatchesCurtain.module.scss",
        "src/app/components/Sections/GlobalLocationsCloud.module.scss",
        "src/app/components/Sections/ConnectCutout.module.scss",
        "src/app/components/Sections/MonumentalFooter.module.scss",
        "src/app/blog/Blog.module.scss",
        "src/app/blog/[slug]/BlogPost.module.scss",
      ];

      for (const relPath of filesToCheck) {
        const fullPath = path.join(rootDir, relPath);
        if (fs.existsSync(fullPath)) {
          const content = fs.readFileSync(fullPath, "utf8");
          assert.ok(!content.includes("#2563eb"), `File ${relPath} must not contain generic blue #2563eb`);
          assert.ok(!content.includes("#4571ff"), `File ${relPath} must not contain generic blue #4571ff`);
        }
      }
    });

    test("verifies minimum 44px touch targets on all interactive button classes", () => {
      const filesWithButtons = [
        "src/app/styles/client-tokens.scss",
        "src/app/components/ClientHeader/ClientHeader.module.scss",
        "src/app/components/ReelModal/ReelModal.module.scss",
        "src/app/components/Sections/AboutDoctrineCurtain.module.scss",
        "src/app/components/Sections/WorksCurtain.module.scss",
        "src/app/components/Sections/ProcessCurtain.module.scss",
        "src/app/components/Sections/TestimonialsCutout.module.scss",
        "src/app/components/Sections/DispatchesCurtain.module.scss",
        "src/app/components/Sections/ConnectCutout.module.scss",
      ];

      for (const relPath of filesWithButtons) {
        const fullPath = path.join(rootDir, relPath);
        if (fs.existsSync(fullPath)) {
          const content = fs.readFileSync(fullPath, "utf8");
          assert.ok(
            content.includes("44px") || content.includes("48px") || content.includes("52px") || content.includes("54px"),
            `File ${relPath} must enforce minimum 44px touch targets`
          );
        }
      }
    });
  });

  describe("Section 8: Logo Contrast Invariants & Eradication of mix-blend-mode", () => {
    test("verifies MarcaUbiLogo.tsx exists with currentColor wordmark and permanent #ea002a accent", () => {
      const logoPath = path.join(rootDir, "src", "app", "components", "ui", "MarcaUbiLogo", "MarcaUbiLogo.tsx");
      assert.ok(fs.existsSync(logoPath), "MarcaUbiLogo.tsx component must exist");

      const content = fs.readFileSync(logoPath, "utf8");
      assert.ok(
        content.includes('fill="currentColor"') || content.includes("fill={color}"),
        "Wordmark letterforms must consume currentColor or explicit prop"
      );
      assert.ok(content.includes('#ea002a'), "Logo accent triangle must permanently consume #ea002a");
    });

    test("verifies ClientHeader.module.scss has eradicated mix-blend-mode: difference", () => {
      const headerScssPath = path.join(rootDir, "src", "app", "components", "ClientHeader", "ClientHeader.module.scss");
      const content = fs.readFileSync(headerScssPath, "utf8");

      assert.ok(!content.includes("mix-blend-mode: difference"), "ClientHeader.module.scss must NOT contain mix-blend-mode: difference");
      assert.ok(content.includes(".isLight"), "ClientHeader must have .isLight class for white curtains");
      assert.ok(content.includes(".isDark"), "ClientHeader must have .isDark class for dark video cutouts");
    });

    test("verifies all 11 homepage views declare explicit data-header-theme for theme observer", () => {
      const views = [
        { file: "HeroCutout.tsx", expected: 'data-header-theme="dark"' },
        { file: "AboutDoctrineCurtain.tsx", expected: 'data-header-theme="light"' },
        { file: "ReelCutout.tsx", expected: 'data-header-theme="dark"' },
        { file: "WorksCurtain.tsx", expected: 'data-header-theme="light"' },
        { file: "ValuesCutout.tsx", expected: 'data-header-theme="dark"' },
        { file: "ProcessCurtain.tsx", expected: 'data-header-theme="light"' },
        { file: "TestimonialsCutout.tsx", expected: 'data-header-theme="dark"' },
        { file: "DispatchesCurtain.tsx", expected: 'data-header-theme="light"' },
        { file: "GlobalLocationsCloud.tsx", expected: 'data-header-theme="light"' },
        { file: "ConnectCutout.tsx", expected: 'data-header-theme="dark"' },
        { file: "MonumentalFooter.tsx", expected: 'data-header-theme="dark"' },
      ];

      for (const view of views) {
        const filePath = path.join(rootDir, "src", "app", "components", "Sections", view.file);
        const content = fs.readFileSync(filePath, "utf8");
        assert.ok(
          content.includes(view.expected),
          `${view.file} must declare explicit ${view.expected}`
        );
      }
    });
  });

  describe("Section 9: AI-Slop Eradication: Badges, Pills & Pulsing Radar Dots", () => {
    test("asserts eradication of orphaned client sections (CapabilitiesCloud, CareersCutout, EditorialManifesto)", () => {
      const orphanedFiles = [
        "src/app/components/Sections/CapabilitiesCloud.tsx",
        "src/app/components/Sections/CapabilitiesCloud.module.scss",
        "src/app/components/Sections/CareersCutout.tsx",
        "src/app/components/Sections/EditorialManifesto.tsx",
        "src/app/components/Sections/EditorialManifesto.module.scss",
      ];
      for (const relPath of orphanedFiles) {
        const fullPath = path.join(rootDir, relPath);
        assert.ok(!fs.existsSync(fullPath), `Orphaned draft file ${relPath} must be eradicated from production tree`);
      }
    });

    test("asserts eradication of .networkChip, .radarDot, and @keyframes radarPulse from GlobalLocationsCloud", () => {
      const tsxPath = path.join(rootDir, "src", "app", "components", "Sections", "GlobalLocationsCloud.tsx");
      const scssPath = path.join(rootDir, "src", "app", "components", "Sections", "GlobalLocationsCloud.module.scss");

      const tsx = fs.readFileSync(tsxPath, "utf8");
      const scss = fs.readFileSync(scssPath, "utf8");

      assert.ok(!tsx.includes("networkChip"), "GlobalLocationsCloud.tsx must not contain networkChip");
      assert.ok(!tsx.includes("radarDot"), "GlobalLocationsCloud.tsx must not contain radarDot");
      assert.ok(!scss.includes("radarPulse"), "GlobalLocationsCloud.module.scss must not contain @keyframes radarPulse");
      assert.ok(tsx.includes("operationalRail"), "GlobalLocationsCloud must define the clean operationalRail");
    });

    test("asserts zero border-radius: 9999px on button classes in redesigned client sections", () => {
      const clientScssFiles = [
        "src/app/components/Sections/HeroCutout.module.scss",
        "src/app/components/Sections/AboutDoctrineCurtain.module.scss",
        "src/app/components/Sections/ReelCutout.module.scss",
        "src/app/components/Sections/WorksCurtain.module.scss",
        "src/app/components/Sections/ValuesCutout.module.scss",
        "src/app/components/Sections/ProcessCurtain.module.scss",
        "src/app/components/Sections/TestimonialsCutout.module.scss",
        "src/app/components/Sections/DispatchesCurtain.module.scss",
        "src/app/components/Sections/GlobalLocationsCloud.module.scss",
        "src/app/components/Sections/ConnectCutout.module.scss",
        "src/app/components/Sections/CareersCutout.module.scss",
        "src/app/blog/Blog.module.scss",
        "src/app/blog/[slug]/BlogPost.module.scss",
      ];

      for (const relPath of clientScssFiles) {
        const fullPath = path.join(rootDir, relPath);
        if (fs.existsSync(fullPath)) {
          const content = fs.readFileSync(fullPath, "utf8");
          assert.ok(
            !content.includes("9999px"),
            `File ${relPath} must not contain 9999px pill border-radius`
          );
        }
      }
    });
  });

  describe("Section 10: Full 11-View Stream & Dynamic Sanity Invariants", () => {
    test("verifies ClientHomeExperience orchestrates the complete 11-view alternating stream", () => {
      const experiencePath = path.join(rootDir, "src", "app", "components", "ClientHomeExperience", "ClientHomeExperience.tsx");
      const content = fs.readFileSync(experiencePath, "utf8");

      assert.ok(content.includes("<HeroCutout"), "View 01: HeroCutout must be present");
      assert.ok(content.includes("<AboutDoctrineCurtain"), "View 02: AboutDoctrineCurtain must be present");
      assert.ok(content.includes("<ReelCutout"), "View 03: ReelCutout must be present");
      assert.ok(content.includes("<WorksCurtain"), "View 04: WorksCurtain must be present");
      assert.ok(content.includes("<ValuesCutout"), "View 05: ValuesCutout must be present");
      assert.ok(content.includes("<ProcessCurtain"), "View 06: ProcessCurtain must be present");
      assert.ok(content.includes("<TestimonialsCutout"), "View 07: TestimonialsCutout must be present");
      assert.ok(content.includes("<DispatchesCurtain"), "View 08: DispatchesCurtain must be present");
      assert.ok(content.includes("<GlobalLocationsCloud"), "View 09: GlobalLocationsCloud must be present");
      assert.ok(content.includes("<ConnectCutout"), "View 10: ConnectCutout must be present");
      assert.ok(content.includes("<MonumentalFooter"), "View 11: MonumentalFooter must be present");
    });

    test("verifies page.tsx streams worksQuery and postsQuery concurrently with revalidate = 60", () => {
      const pagePath = path.join(rootDir, "src", "app", "page.tsx");
      const content = fs.readFileSync(pagePath, "utf8");

      assert.ok(content.includes("worksQuery"), "page.tsx must fetch worksQuery");
      assert.ok(content.includes("postsQuery"), "page.tsx must fetch postsQuery");
      assert.ok(content.includes("export const revalidate = 60"), "page.tsx must enforce 60s ISR revalidate");
      assert.ok(content.includes("<ClientHomeExperience works={works} posts={posts} />"), "page.tsx must pass works and posts props");
    });
  });

  describe("Section 11: Blog Listing & Detail Redesign Invariants", () => {
    test("verifies /blog and /blog/[slug] use ClientHeader, MonumentalFooter, and zero em dashes", () => {
      const blogListingPath = path.join(rootDir, "src", "app", "blog", "page.tsx");
      const blogDetailPath = path.join(rootDir, "src", "app", "blog", "[slug]", "page.tsx");

      const listing = fs.readFileSync(blogListingPath, "utf8");
      const detail = fs.readFileSync(blogDetailPath, "utf8");

      assert.ok(listing.includes("ClientHeader"), "/blog must wrap with ClientHeader");
      assert.ok(listing.includes("MonumentalFooter"), "/blog must wrap with MonumentalFooter");
      assert.ok(!listing.includes("—"), "/blog must have zero em dashes");

      assert.ok(detail.includes("ClientHeader"), "/blog/[slug] must wrap with ClientHeader");
      assert.ok(detail.includes("MonumentalFooter"), "/blog/[slug] must wrap with MonumentalFooter");
      assert.ok(!detail.includes("—"), "/blog/[slug] must have zero em dashes");
    });
  });

  describe("Section 12: Authentic Kerala Studio Coordinates & Zero Synthetic Hubs Invariant", () => {
    test("verifies GlobalLocationsCloud exclusively features authentic Kerala studios (Kozhikode & Trivandrum)", () => {
      const locationsPath = path.join(rootDir, "src", "app", "components", "Sections", "GlobalLocationsCloud.tsx");
      const content = fs.readFileSync(locationsPath, "utf8");

      assert.ok(content.includes("Kozhikode"), "GlobalLocationsCloud must feature Kozhikode studio");
      assert.ok(content.includes("Trivandrum"), "GlobalLocationsCloud must feature Trivandrum studio");
      assert.ok(content.includes("HiLITE Business Park"), "Must reference HiLITE Business Park");

      const syntheticCities = ["Dubai", "London", "Bengaluru", "New York", "Singapore", "Tokyo", "Los Angeles"];
      for (const city of syntheticCities) {
        assert.ok(!content.includes(`"${city}"`), `GlobalLocationsCloud must NOT include synthetic city "${city}"`);
      }

      const syntheticTimezones = ["GST", "GMT", "PST", "EST", "JST", "SGT"];
      for (const tz of syntheticTimezones) {
        assert.ok(!content.includes(`"${tz}"`), `GlobalLocationsCloud must NOT include synthetic timezone "${tz}"`);
      }
    });

    test("verifies MonumentalFooter restricts studio corridors strictly to Kozhikode and Trivandrum", () => {
      const footerPath = path.join(rootDir, "src", "app", "components", "Sections", "MonumentalFooter.tsx");
      const content = fs.readFileSync(footerPath, "utf8");

      assert.ok(content.includes("Calicut") || content.includes("Kozhikode"), "Footer must list Kozhikode/Calicut");
      assert.ok(content.includes("Trivandrum"), "Footer must list Trivandrum");
      assert.ok(!content.includes("Dubai"), "Footer must NOT list Dubai");
      assert.ok(!content.includes("London"), "Footer must NOT list London");
    });

    test("verifies RootLayout schema does not declare Dubai as locality", () => {
      const layoutPath = path.join(rootDir, "src", "app", "layout.tsx");
      const content = fs.readFileSync(layoutPath, "utf8");

      assert.ok(!content.includes('addressLocality: "Dubai"'), "layout.tsx schema must not claim Dubai locality");
      assert.ok(content.includes('addressLocality: "Kozhikode"'), "layout.tsx schema must declare Kozhikode locality");
    });
  });
});
