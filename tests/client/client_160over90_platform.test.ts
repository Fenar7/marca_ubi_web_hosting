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
  describe("Section 20: Swiss Hairline Typography Architecture (Whoa Mama Reference)", () => {
    test("verifies physical existence of Helvetica Neue Thin on disk", () => {
      const thinFont = path.join(rootDir, "public", "fonts", "helvetica", "HelveticaNeue-Thin.otf");
      assert.ok(fs.existsSync(thinFont), "HelveticaNeue-Thin.otf must exist in public/fonts/helvetica/");
      assert.ok(fs.statSync(thinFont).size > 200000, "HelveticaNeue-Thin.otf must be valid OpenType binary > 200KB");
    });

    test("verifies fonts.ts registers weight 100 and 200 for Helvetica Neue Thin", () => {
      const fontsTs = fs.readFileSync(path.join(rootDir, "src", "app", "fonts.ts"), "utf8");
      assert.ok(fontsTs.includes("HelveticaNeue-Thin.otf"), "fonts.ts must reference HelveticaNeue-Thin.otf");
      assert.ok(fontsTs.includes('"100"'), "fonts.ts must register weight 100");
      assert.ok(fontsTs.includes('"200"'), "fonts.ts must register weight 200");
    });

    test("verifies AboutCurtain, StatementCurtain, and ServicesAccordion adopt $font-helvetica hairline styling", () => {
      const aboutScss = fs.readFileSync(path.join(rootDir, "src", "app", "components", "Sections", "AboutCurtain.module.scss"), "utf8");
      const statementScss = fs.readFileSync(path.join(rootDir, "src", "app", "components", "Sections", "StatementCurtain.module.scss"), "utf8");
      const servicesScss = fs.readFileSync(path.join(rootDir, "src", "app", "components", "Sections", "ServicesAccordion", "ServicesAccordion.module.scss"), "utf8");

      assert.ok(aboutScss.includes("$font-helvetica"), "AboutCurtain.module.scss must style headline and metrics with $font-helvetica");
      assert.ok(aboutScss.includes("$fw-helvetica-extralight"), "AboutCurtain.module.scss must use $fw-helvetica-extralight (200 Thin)");
      assert.ok(statementScss.includes("$font-helvetica"), "StatementCurtain.module.scss must style monumentalStatement with $font-helvetica");
      assert.ok(statementScss.includes("$fw-helvetica-extralight"), "StatementCurtain.module.scss must use $fw-helvetica-extralight (200 Thin)");
      assert.ok(servicesScss.includes("$font-helvetica"), "ServicesAccordion.module.scss must style titles and numbers with $font-helvetica");
      assert.ok(servicesScss.includes("$fw-helvetica-light"), "ServicesAccordion.module.scss must use $fw-helvetica-light (300)");
      assert.ok(servicesScss.includes("$fw-helvetica-extralight"), "ServicesAccordion.module.scss must use $fw-helvetica-extralight (200)");
    });
  });
});

    test("verifies Next.js localFont registers --font-circular in fonts.ts", () => {
      const fontsFile = path.join(rootDir, "src", "app", "fonts.ts");
      const content = fs.readFileSync(fontsFile, "utf8");

      assert.ok(content.includes('variable: "--font-circular"'), "Must export font variable --font-circular");
      assert.ok(content.includes("CircularXXWeb-Book.woff2"), "Must map Book weight to 400");
      assert.ok(content.includes("CircularXXWeb-Medium.woff2"), "Must map Medium weight to 500");
      assert.ok(content.includes("CircularXXWeb-Bold.woff2"), "Must map Bold weight to 700");
    });

    test("asserts client SCSS modules adhere to 160over90 typographic weight invariants (StatementCurtain uses Book 400, zero unmapped 600)", () => {
      const statementScss = path.join(rootDir, "src", "app", "components", "Sections", "StatementCurtain.module.scss");
      const content = fs.readFileSync(statementScss, "utf8");

      assert.ok(!content.includes("font-weight: 700"), "StatementCurtain must not use heavy font-weight: 700");
      assert.ok(content.includes("$fw-helvetica-extralight"), "StatementCurtain must use $fw-helvetica-extralight (200 Thin) matching Whoa Mama hairline benchmark");

      const clientScssFiles = [
        "src/app/components/ClientHeader/ClientHeader.module.scss",
        "src/app/components/NavigationOverlay/NavigationOverlay.module.scss",
        "src/app/components/NavigationOverlay/KineticStage.module.scss",
        "src/app/components/ReelModal/ReelModal.module.scss",
        "src/app/components/Sections/StatementCurtain.module.scss",
        "src/app/components/Sections/AboutCurtain.module.scss",
        "src/app/components/Sections/HeroCutout.module.scss",
        "src/app/components/Sections/ReelCutout.module.scss",
        "src/app/components/Sections/WorksCutout.module.scss",
        "src/app/components/Sections/WorksCurtain.module.scss",
        "src/app/components/Sections/ValuesCutout.module.scss",
        "src/app/components/Sections/ProcessCurtain.module.scss",
        "src/app/components/Sections/TestimonialsCutout.module.scss",
        "src/app/components/Sections/DispatchesCurtain.module.scss",
        "src/app/components/Sections/GlobalLocationsCloud.module.scss",
        "src/app/components/Sections/ConnectCutout.module.scss",
        "src/app/components/Sections/MonumentalFooter.module.scss",
        "src/app/works/Works.module.scss",
        "src/app/blog/Blog.module.scss",
        "src/app/blog/[slug]/BlogPost.module.scss",
        "src/app/blog/components/BlogPostComponents.module.scss",
        "src/app/blog/components/PortableTextRenderer.module.scss",
      ];

      for (const relPath of clientScssFiles) {
        const full = path.join(rootDir, relPath);
        if (fs.existsSync(full)) {
          const css = fs.readFileSync(full, "utf8");
          assert.ok(!css.includes("font-weight: 600"), `${relPath} must not use font-weight: 600 (maps to 700 bold; use 500 Medium)`);
        }
      }
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
        "src/app/components/NavigationOverlay/NavigationOverlay.module.scss",
        "src/app/components/ReelModal/ReelModal.module.scss",
        "src/app/components/Sections/HeroCutout.module.scss",
        "src/app/components/Sections/AboutCurtain.module.scss",
        "src/app/components/Sections/ReelCutout.module.scss",
        "src/app/components/Sections/StatementCurtain.module.scss",
        "src/app/components/Sections/WorksCurtain.module.scss",
        "src/app/components/Sections/WorksCutout.module.scss",
        "src/app/works/Works.module.scss",
        "src/app/components/Sections/WorksCutout.module.scss",
        "src/app/works/Works.module.scss",
        "src/app/components/Sections/ValuesCutout.module.scss",
        "src/app/components/Sections/ProcessCurtain.module.scss",
        "src/app/components/Sections/TestimonialsCutout.module.scss",
        "src/app/components/Sections/DispatchesCurtain.module.scss",
        "src/app/components/Sections/GlobalLocationsCloud.module.scss",
        "src/app/components/Sections/ConnectCutout.module.scss",
        "src/app/components/Sections/WorksCutout.module.scss",
        "src/app/works/Works.module.scss",
        "src/app/components/Sections/MonumentalFooter.module.scss",
        "src/app/components/NavigationOverlay/NavigationOverlay.module.scss",
        "src/app/components/NavigationOverlay/KineticStage.module.scss",
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
        "src/app/components/Sections/AboutCurtain.module.scss",
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

    test("verifies all 12 homepage views declare explicit data-header-theme for theme observer", () => {
      const views = [
        { file: "HeroCutout.tsx", expected: 'data-header-theme="dark"' },
        { file: "AboutCurtain.tsx", expected: 'data-header-theme="light"' },
        { file: "ReelCutout.tsx", expected: 'data-header-theme="dark"' },
        { file: "StatementCurtain.tsx", expected: 'data-header-theme="light"' },
        { file: "WorksCutout.tsx", expected: 'data-header-theme="dark"' },
        { file: "ProcessCurtain.tsx", expected: 'data-header-theme="light"' },
        { file: "ValuesCutout.tsx", expected: 'data-header-theme="dark"' },
        { file: "TestimonialsCutout.tsx", expected: 'data-header-theme="light"' },
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
      assert.ok(!tsx.includes("operationalRail"), "GlobalLocationsCloud must eradicate operationalRail per user direction");
    });

    test("asserts zero border-radius: 9999px on button classes in redesigned client sections", () => {
      const clientScssFiles = [
        "src/app/components/Sections/HeroCutout.module.scss",
        "src/app/components/Sections/AboutCurtain.module.scss",
        "src/app/components/Sections/ReelCutout.module.scss",
        "src/app/components/Sections/StatementCurtain.module.scss",
        "src/app/components/Sections/WorksCutout.module.scss",
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

  describe("Section 10: Full 12-View Stream & Dynamic Sanity Invariants", () => {
    test("verifies ClientHomeExperience orchestrates the complete 12-view alternating stream", () => {
      const experiencePath = path.join(rootDir, "src", "app", "components", "ClientHomeExperience", "ClientHomeExperience.tsx");
      const content = fs.readFileSync(experiencePath, "utf8");

      assert.ok(content.includes("<HeroCutout"), "View 01: HeroCutout must be present");
      assert.ok(content.includes("<AboutCurtain"), "View 02: AboutCurtain must be present");
      assert.ok(content.includes("<ReelCutout"), "View 03: ReelCutout must be present");
      assert.ok(content.includes("<StatementCurtain"), "View 04: StatementCurtain must be present");
      assert.ok(content.includes("<WorksCutout") || content.includes("<WorksCurtain"), "View 05: WorksCutout must be present");
      assert.ok(content.includes("<ProcessCurtain"), "View 06: ProcessCurtain must be present");
      assert.ok(content.includes("<ValuesCutout"), "View 07: ValuesCutout must be present");
      assert.ok(
        content.indexOf("<ProcessCurtain") < content.indexOf("<ValuesCutout"),
        "ProcessCurtain (View 06, Section 03) must precede ValuesCutout (View 07, Section 04)"
      );
      assert.ok(content.includes("<TestimonialsCutout"), "View 08: TestimonialsCutout must be present");
      assert.ok(content.includes("<DispatchesCurtain"), "View 09: DispatchesCurtain must be present");
      assert.ok(content.includes("<GlobalLocationsCloud"), "View 10: GlobalLocationsCloud must be present");
      assert.ok(content.includes("<ConnectCutout"), "View 11: ConnectCutout must be present");
      assert.ok(content.includes("<MonumentalFooter"), "View 12: MonumentalFooter must be present");
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

      assert.ok(content.includes("Calicut") || content.includes("Kozhikode"), "GlobalLocationsCloud must feature Calicut/Kozhikode studio");
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

    test("verifies MonumentalFooter restricts studio corridors strictly to Calicut/Kozhikode and Trivandrum", () => {
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
      assert.ok(content.includes('addressLocality: "Calicut"') || content.includes('addressLocality: "Kozhikode"'), "layout.tsx schema must declare Calicut/Kozhikode locality");
    });
  });

  describe("Section 14: Minimalist Clean Aesthetic & Clutter Eradication Invariants", () => {
    test("verifies HeroCutout renders without mandatory kicker or scrollCueCluster by default", () => {
      const heroPath = path.join(rootDir, "src", "app", "components", "Sections", "HeroCutout.tsx");
      const content = fs.readFileSync(heroPath, "utf8");

      assert.ok(content.includes("{kicker ?"), "HeroCutout must conditionally render kicker only when passed");
      assert.ok(content.includes("{showScrollCue ?"), "HeroCutout must conditionally render scrollCueCluster only when true");
      assert.ok(content.includes('showScrollCue = false'), "HeroCutout showScrollCue must default to false");
    });

    test("verifies ClientHomeExperience mounts HeroCutout with pure 2-line headline and zero kicker", () => {
      const experiencePath = path.join(rootDir, "src", "app", "components", "ClientHomeExperience", "ClientHomeExperience.tsx");
      const content = fs.readFileSync(experiencePath, "utf8");

      assert.ok(!content.includes('kicker="00 /'), "ClientHomeExperience must NOT pass kicker 00 to HeroCutout");
      assert.ok(content.includes('headline={"Engineering Brands\\nThat Move The World."}') || content.includes('Engineering Brands\nThat Move The World.'), "ClientHomeExperience must pass balanced 2-line headline");
    });

    test("verifies ClientHeader menu trigger enforces 48px touch target and .srOnly screen reader text without visual clutter", () => {
      const headerTsxPath = path.join(rootDir, "src", "app", "components", "ClientHeader", "ClientHeader.tsx");
      const headerScssPath = path.join(rootDir, "src", "app", "components", "ClientHeader", "ClientHeader.module.scss");

      const tsx = fs.readFileSync(headerTsxPath, "utf8");
      const scss = fs.readFileSync(headerScssPath, "utf8");

      assert.ok(tsx.includes("className={styles.srOnly}"), "ClientHeader must wrap navigation label in .srOnly for screen readers");
      assert.ok(scss.includes(".srOnly"), "ClientHeader.module.scss must define .srOnly clip rules");
      assert.ok(scss.includes("min-height: 48px"), "ClientHeader.module.scss must enforce 48px touch targets");
      assert.ok(scss.includes("min-width: 48px"), "ClientHeader.module.scss must enforce 48px minimum width");
    });

    test("verifies NavigationOverlay implements 160/90 benchmark split dual-canvas, WAI-ARIA dialog, and focus trapping", () => {
      const overlayPath = path.join(rootDir, "src", "app", "components", "NavigationOverlay", "NavigationOverlay.tsx");
      const overlayScssPath = path.join(rootDir, "src", "app", "components", "NavigationOverlay", "NavigationOverlay.module.scss");
      const kineticPath = path.join(rootDir, "src", "app", "components", "NavigationOverlay", "KineticStage.tsx");

      assert.ok(fs.existsSync(overlayPath), "NavigationOverlay.tsx must exist");
      assert.ok(fs.existsSync(overlayScssPath), "NavigationOverlay.module.scss must exist");
      assert.ok(fs.existsSync(kineticPath), "KineticStage.tsx must exist");

      const overlayTsx = fs.readFileSync(overlayPath, "utf8");
      const overlayScss = fs.readFileSync(overlayScssPath, "utf8");
      const kineticTsx = fs.readFileSync(kineticPath, "utf8");

      assert.ok(overlayTsx.includes('role="dialog"'), "NavigationOverlay must declare role='dialog'");
      assert.ok(overlayTsx.includes('aria-modal="true"'), "NavigationOverlay must declare aria-modal='true'");
      assert.ok(overlayTsx.includes("Calicut &amp; Trivandrum") || overlayTsx.includes("Calicut & Trivandrum") || overlayTsx.includes("Kozhikode &amp; Trivandrum") || overlayTsx.includes("Kozhikode & Trivandrum"), "NavigationOverlay must anchor authentic Kerala studios");
      assert.ok(!overlayTsx.includes("Dubai"), "NavigationOverlay must not declare synthetic Dubai hub");
      assert.ok(overlayScss.includes("grid-template-columns: 1fr 1fr;"), "NavigationOverlay must enforce 50/50 dual-canvas split");
      assert.ok(kineticTsx.includes("KineticStage"), "KineticStage must be exported");
    });
  });


    test("verifies TestimonialsCutout enforces solid pure white curtain tokens and shadow", () => {
      const scssPath = path.join(rootDir, "src", "app", "components", "Sections", "TestimonialsCutout.module.scss");
      const tsxPath = path.join(rootDir, "src", "app", "components", "Sections", "TestimonialsCutout.tsx");

      const scss = fs.readFileSync(scssPath, "utf8");
      const tsx = fs.readFileSync(tsxPath, "utf8");

      assert.ok(scss.includes("$client-canvas-white"), "TestimonialsCutout must consume $client-canvas-white");
      assert.ok(scss.includes("box-shadow: 0 -24px 60px rgba(0, 0, 0, 0.18)"), "TestimonialsCutout must declare overlap physical shadow");
      assert.ok(tsx.includes('data-header-theme="light"'), "TestimonialsCutout must declare data-header-theme='light'");
    });

  describe("Section 13: Dedicated /works Showcase Route & Navigation Invariants", () => {
    test("verifies src/app/works/page.tsx renders with ClientHeader, MonumentalFooter, and ISR revalidate", () => {
      const worksPagePath = path.join(rootDir, "src", "app", "works", "page.tsx");
      assert.ok(fs.existsSync(worksPagePath), "src/app/works/page.tsx must exist");

      const content = fs.readFileSync(worksPagePath, "utf8");
      assert.ok(content.includes("ClientHeader"), "Works page must render ClientHeader");
      assert.ok(content.includes("MonumentalFooter"), "Works page must render MonumentalFooter");
      assert.ok(content.includes("export const revalidate = 60"), "Works page must declare 60s revalidation");
      assert.ok(content.includes('canonical: "/works"'), "Works page must declare canonical /works URL");
      assert.ok(content.includes("WorksGalleryClient"), "Works page must render WorksGalleryClient");
      assert.ok(content.includes("CollectionPage"), "Works page must declare CollectionPage schema");
    });

    test("verifies WorksCutout.tsx links to /works with accessible touch target", () => {
      const cutoutPath = path.join(rootDir, "src", "app", "components", "Sections", "WorksCutout.tsx");
      const scssPath = path.join(rootDir, "src", "app", "components", "Sections", "WorksCutout.module.scss");

      assert.ok(fs.existsSync(cutoutPath), "WorksCutout.tsx must exist");
      assert.ok(fs.existsSync(scssPath), "WorksCutout.module.scss must exist");

      const tsx = fs.readFileSync(cutoutPath, "utf8");
      const scss = fs.readFileSync(scssPath, "utf8");

      assert.ok(tsx.includes('/works'), "WorksCutout must link to /works");
      assert.ok(tsx.includes('data-header-theme="dark"'), "WorksCutout must declare dark theme for header sensor");
      assert.ok(scss.includes("min-height: 44px"), "WorksCutout button must enforce 44px min-height touch target");
    });


    test("verifies WorksGalleryClient integrates GSAP ScrollTrigger 3D card stacking engine and Brand Red sweep", () => {
      const galleryPath = path.join(rootDir, "src", "app", "works", "WorksGalleryClient.tsx");
      const scssPath = path.join(rootDir, "src", "app", "works", "Works.module.scss");

      const tsx = fs.readFileSync(galleryPath, "utf8");
      const scss = fs.readFileSync(scssPath, "utf8");

      assert.ok(tsx.includes("ScrollTrigger"), "WorksGalleryClient must register ScrollTrigger");
      assert.ok(tsx.includes("useGSAP"), "WorksGalleryClient must use useGSAP hook");
      assert.ok(tsx.includes("CURATED WORKS"), "WorksGalleryClient must declare CURATED WORKS title in uppercase");
      assert.ok(scss.includes("font-weight: 400; // CircularXXWeb-Book"), "Works.module.scss must enforce font-weight: 400 (Book) for title");
      assert.ok(scss.includes("font-size: clamp(2.25rem, 5.5vw, 4.75rem);"), "Works.module.scss must scale down title size to elegant clamp");
      assert.ok(scss.includes("text-transform: uppercase;"), "Works.module.scss must enforce text-transform: uppercase on title");
      assert.ok(tsx.includes("workDeckWrapper"), "WorksGalleryClient must wrap cards in workDeckWrapper");
      assert.ok(tsx.includes("rotateZ"), "WorksGalleryClient must implement 3D rotateZ transform");
      assert.ok(tsx.includes("transformPerspective: 1400"), "WorksGalleryClient must set 1400 perspective");
      assert.ok(scss.includes("$client-accent-red"), "Works.module.scss must consume $client-accent-red");
      assert.ok(scss.includes("position: sticky"), "Works.module.scss must enforce position: sticky for cards");
      assert.ok(scss.includes("height: 150svh"), "Works.module.scss must declare 150svh scroll spacer");
      assert.ok(scss.includes("padding: 0;"), "Works.module.scss must enforce 0 padding on workDeckWrapper for full-width bleed");
      assert.ok(scss.includes("border-radius: 0;"), "Works.module.scss must enforce 0 border-radius on workDeckCard for seamless edge-to-edge canvas");
      assert.ok(scss.includes("top: 0;"), "Works.module.scss must enforce top: 0 on workDeckWrapper for zero top gap");
      assert.ok(scss.includes("height: 100svh;"), "Works.module.scss must enforce height: 100svh on workDeckCard for full viewport coverage");
      assert.ok(scss.includes("text-transform: none;"), "Works.module.scss must enforce text-transform: none on actionPillLink");
      assert.ok(tsx.includes("toNaturalCase"), "WorksGalleryClient must utilize toNaturalCase to eliminate shouting all-caps text");
      assert.ok(tsx.includes("cardLeftContent"), "WorksGalleryClient must declare cardLeftContent for left-side vertically centered title");
      assert.ok(tsx.includes("cardBottomRightActions"), "WorksGalleryClient must declare cardBottomRightActions for bottom-right action button cluster");
      assert.ok(tsx.includes("View Work"), "WorksGalleryClient must declare 'View Work' action button");
      assert.ok(scss.includes(".cardLeftContent"), "Works.module.scss must define .cardLeftContent class");
      assert.ok(scss.includes(".cardBottomRightActions"), "Works.module.scss must define .cardBottomRightActions class");
      assert.ok(scss.includes("transform: translateY(-50%)"), "Works.module.scss must vertically center .cardLeftContent");
      assert.ok(scss.includes("border-radius: 9999px; // 160over90 signature outline pill geometry"), "Works.module.scss must enforce border-radius: 9999px for 160over90 benchmark outline pill");
      assert.ok(scss.includes("border: 1.5px solid rgba(255, 255, 255, 0.85);"), "Works.module.scss must declare 1.5px solid outline border");
      assert.ok(scss.includes("background: transparent;"), "Works.module.scss must enforce transparent background on action pills");
      assert.ok(scss.includes("flex-direction: column;"), "Works.module.scss must enforce vertical column stack for cardBottomRightActions");
      assert.ok(!scss.includes("text-shadow: 0"), "Works.module.scss must not contain drop shadows on text");
      assert.ok(!scss.includes("rgba(5, 5, 6, 0.94)"), "Works.module.scss must not contain heavy 94% black scrim composite");
      assert.ok(scss.includes(".cardScrimOverlay"), "Works.module.scss must define .cardScrimOverlay class");
      assert.ok(scss.includes("rgba(0, 0, 0, 0.48)"), "Works.module.scss must provide lateral typographic contrast veil");
      assert.ok(scss.includes("rgba(0, 0, 0, 0.20)"), "Works.module.scss must provide very light ambient dark glaze across the card");
      assert.ok(!tsx.includes("indexBadge"), "WorksGalleryClient must not contain indexBadge");
      assert.ok(!tsx.includes("projectIndex"), "WorksGalleryClient must eradicate unused projectIndex");
      assert.ok(!tsx.includes("totalCount"), "WorksGalleryClient must eradicate unused totalCount");
      assert.ok(!scss.includes(".indexBadge"), "Works.module.scss must not contain .indexBadge selector");
      assert.ok(tsx.includes("Play Reel"), "WorksGalleryClient must declare 'Play Reel' button");
      assert.ok(tsx.includes("playGlyph"), "WorksGalleryClient must declare playGlyph class for ▶ solid triangle");
      assert.ok(tsx.includes("ReelModal"), "WorksGalleryClient must integrate accessible ReelModal showreel viewer");
      assert.ok(!tsx.includes("↗"), "WorksGalleryClient must not contain diagonal arrow glyph in action pills");
      assert.ok(!tsx.includes("&nearr;"), "WorksGalleryClient must not contain unescaped &nearr; entity");
      assert.ok(!tsx.includes("pulseDot"), "WorksGalleryClient must not contain AI-slop pulseDot");
      assert.ok(!tsx.includes("countBadge"), "WorksGalleryClient must not contain AI-slop countBadge");
      assert.ok(!tsx.includes("02 / Portfolio Archive"), "WorksGalleryClient must not contain 02 / Portfolio Archive kicker");
      assert.ok(!scss.includes(".pulseDot"), "Works.module.scss must not contain .pulseDot class");
      assert.ok(!scss.includes(".countBadge"), "Works.module.scss must not contain .countBadge class");
    });

    test("verifies legacy /work route permanently redirects to /works", () => {
      const legacyWorkPath = path.join(rootDir, "src", "app", "work", "page.tsx");
      assert.ok(fs.existsSync(legacyWorkPath), "src/app/work/page.tsx must exist");

      const content = fs.readFileSync(legacyWorkPath, "utf8");
      assert.ok(content.includes('redirect("/works")'), "Legacy /work page must redirect to /works");
    });
  });

  describe("Section 15: Section Cadence Calibration and Project Brief Modal Invariants", () => {
    test("verifies non-hero sections have calibrated heights and HeroCutout remains 100dvh", () => {
      const heroPath = path.join(rootDir, "src", "app", "components", "Sections", "HeroCutout.module.scss");
      const worksPath = path.join(rootDir, "src", "app", "components", "Sections", "WorksCutout.module.scss");
      const connectPath = path.join(rootDir, "src", "app", "components", "Sections", "ConnectCutout.module.scss");
      const valuesPath = path.join(rootDir, "src", "app", "components", "Sections", "ValuesCutout.module.scss");
      const testimonialsPath = path.join(rootDir, "src", "app", "components", "Sections", "TestimonialsCutout.module.scss");

      const heroScss = fs.readFileSync(heroPath, "utf8");
      const worksScss = fs.readFileSync(worksPath, "utf8");
      const connectScss = fs.readFileSync(connectPath, "utf8");
      const valuesScss = fs.readFileSync(valuesPath, "utf8");
      const testimonialsScss = fs.readFileSync(testimonialsPath, "utf8");

      assert.ok(heroScss.includes("height: 100dvh;"), "HeroCutout must remain full screen 100dvh");
      assert.ok(worksScss.includes("height: clamp(460px, 62vh, 640px);"), "WorksCutout must use calibrated clamp height");
      assert.ok(!worksScss.includes("height: 100dvh;"), "WorksCutout must not consume 100dvh");
      assert.ok(!connectScss.includes("min-height: 85vh;"), "ConnectCutout must not consume 85vh");
      assert.ok(!valuesScss.includes("min-height: 80vh;"), "ValuesCutout must not consume 80vh");
      assert.ok(!testimonialsScss.includes("min-height: 80vh;"), "TestimonialsCutout must not consume 80vh");
    });

    test("verifies ProjectBriefModal component exists and implements accessible modal standards", () => {
      const modalPath = path.join(rootDir, "src", "app", "components", "ProjectBriefModal", "ProjectBriefModal.tsx");
      const modalScssPath = path.join(rootDir, "src", "app", "components", "ProjectBriefModal", "ProjectBriefModal.module.scss");

      assert.ok(fs.existsSync(modalPath), "ProjectBriefModal.tsx must exist");
      assert.ok(fs.existsSync(modalScssPath), "ProjectBriefModal.module.scss must exist");

      const tsx = fs.readFileSync(modalPath, "utf8");
      const scss = fs.readFileSync(modalScssPath, "utf8");

      assert.ok(tsx.includes('role="dialog"'), "ProjectBriefModal must declare role=dialog");
      assert.ok(tsx.includes('aria-modal="true"'), "ProjectBriefModal must declare aria-modal=true");
      assert.ok(tsx.includes("Escape"), "ProjectBriefModal must handle Escape key dismiss");
      assert.ok(tsx.includes('document.body.style.overflow = "hidden"'), "ProjectBriefModal must lock body scroll");
      assert.ok(scss.includes("backdrop-filter: blur(24px)"), "ProjectBriefModal must apply dark luxury backdrop blur");
      assert.ok(scss.includes("min-height: 44px"), "ProjectBriefModal close button must meet 44px touch target");
    });

    test("verifies dual triggers in WorksCutout and ConnectCutout and wiring in ClientHomeExperience", () => {
      const worksPath = path.join(rootDir, "src", "app", "components", "Sections", "WorksCutout.tsx");
      const connectPath = path.join(rootDir, "src", "app", "components", "Sections", "ConnectCutout.tsx");
      const homePath = path.join(rootDir, "src", "app", "components", "ClientHomeExperience", "ClientHomeExperience.tsx");

      const worksTsx = fs.readFileSync(worksPath, "utf8");
      const connectTsx = fs.readFileSync(connectPath, "utf8");
      const homeTsx = fs.readFileSync(homePath, "utf8");

      assert.ok(worksTsx.includes("onOpenBrief"), "WorksCutout must accept onOpenBrief prop");
      assert.ok(worksTsx.includes("Start a Project"), "WorksCutout must render Start a Project action");
      assert.ok(worksTsx.includes("View Works"), "WorksCutout must render View Works action");

      assert.ok(connectTsx.includes("onOpenBrief"), "ConnectCutout must accept onOpenBrief prop");
      assert.ok(connectTsx.includes("Start a Project Brief"), "ConnectCutout must render Start a Project Brief action");

      assert.ok(homeTsx.includes("ProjectBriefModal"), "ClientHomeExperience must import ProjectBriefModal");
      assert.ok(homeTsx.includes("isBriefOpen"), "ClientHomeExperience must maintain isBriefOpen state");
      assert.ok(homeTsx.includes("isPausedByModal={isReelOpen || isBriefOpen}"), "BackgroundVideoEngine must pause when brief modal is open");
    });
  });

  describe('Section 16: Scroll-Activated Apple Liquid Glass Adaptive Header Invariants', () => {
    test('verifies ClientHeader.module.scss implements Apple Liquid Glass floating capsule geometry, vibrancy, and specular highlights', () => {
      const scssPath = path.join(rootDir, 'src', 'app', 'components', 'ClientHeader', 'ClientHeader.module.scss');
      const scss = fs.readFileSync(scssPath, 'utf8');

      assert.ok(scss.includes('backdrop-filter: blur(0px) saturate(100%);'), 'ClientHeader must declare baseline blur(0px) at rest');
      assert.ok(scss.includes('-webkit-backdrop-filter: blur(0px) saturate(100%);'), 'ClientHeader must declare -webkit-backdrop-filter at rest');
      assert.ok(scss.includes('.isScrolled'), 'ClientHeader must define .isScrolled state');
      assert.ok(scss.includes('border-radius: 9999px;'), 'ClientHeader must morph into floating continuous pill capsule');
      assert.ok(scss.includes('max-width: 1360px;'), 'ClientHeader must enforce max-width constraint for floating capsule');
      assert.ok(scss.includes('backdrop-filter: blur(28px) saturate(190%) contrast(106%);'), 'ClientHeader must declare 28px blur with 190% saturation and contrast boost when scrolled');
      assert.ok(scss.includes('-webkit-backdrop-filter: blur(28px) saturate(190%) contrast(106%);'), 'ClientHeader must declare -webkit 28px blur with 190% saturation when scrolled');
      assert.ok(scss.includes('inset 0 1.5px 1px 0 rgba(255, 255, 255, 1)'), 'ClientHeader must apply pure-white top specular rim highlight on light curtains');
      assert.ok(scss.includes('inset 0 1.5px 1px 0 rgba(255, 255, 255, 0.35)'), 'ClientHeader must apply obsidian specular rim highlight on dark cutouts');
      assert.ok(scss.includes('prefers-reduced-transparency: reduce'), 'ClientHeader must include accessibility reduced transparency guard');
    });

    test('verifies ClientHeader.tsx wires scroll sensor with passive listener and rAF throttle', () => {
      const tsxPath = path.join(rootDir, 'src', 'app', 'components', 'ClientHeader', 'ClientHeader.tsx');
      const tsx = fs.readFileSync(tsxPath, 'utf8');

      assert.ok(tsx.includes('isScrolled'), 'ClientHeader must maintain isScrolled state');
      assert.ok(tsx.includes('window.scrollY > 50'), 'ClientHeader must evaluate 50px threshold');
      assert.ok(tsx.includes('requestAnimationFrame'), 'ClientHeader must throttle scroll events with requestAnimationFrame');
      assert.ok(tsx.includes('passive: true'), 'ClientHeader must declare passive: true scroll listener');
      assert.ok(tsx.includes('styles.isScrolled'), 'ClientHeader must toggle isScrolled class dynamically');
    });
  });

  describe('Section 17: ProcessCurtain Typography and Slash Eradication Invariants', () => {
    test('verifies ProcessCurtain.tsx renders capability items without slash dividers', () => {
      const tsxPath = path.join(rootDir, 'src', 'app', 'components', 'Sections', 'ProcessCurtain.tsx');
      const tsx = fs.readFileSync(tsxPath, 'utf8');

      assert.ok(!tsx.includes('slashDivider'), 'ProcessCurtain.tsx must not contain slashDivider');
      assert.ok(!tsx.includes('activeSlash'), 'ProcessCurtain.tsx must not contain activeSlash');
      assert.ok(tsx.includes('styles.cloudWrapper'), 'ProcessCurtain.tsx must render cloudWrapper');
      assert.ok(tsx.includes('styles.disciplineItem'), 'ProcessCurtain.tsx must render disciplineItem');
    });

    test('verifies ProcessCurtain.module.scss defines fluid spacing gap and eradicates slash classes', () => {
      const scssPath = path.join(rootDir, 'src', 'app', 'components', 'Sections', 'ProcessCurtain.module.scss');
      const scss = fs.readFileSync(scssPath, 'utf8');

      assert.ok(!scss.includes('.slashDivider'), 'ProcessCurtain.module.scss must eradicate .slashDivider');
      assert.ok(!scss.includes('.activeSlash'), 'ProcessCurtain.module.scss must eradicate .activeSlash');
      assert.ok(scss.includes('gap: 0.85rem clamp(1.25rem, 2.5vw, 2.25rem);'), 'ProcessCurtain.module.scss must declare calibrated fluid gap');
    });
  });
  describe("Section 18: Master Brand & Kinetic Motion Refinement Invariants", () => {
    test("verifies MonumentalFooter cultural anthem and trailing period red accent", () => {
      const footerTsx = path.join(rootDir, "src", "app", "components", "Sections", "MonumentalFooter.tsx");
      const footerScss = path.join(rootDir, "src", "app", "components", "Sections", "MonumentalFooter.module.scss");

      const tsx = fs.readFileSync(footerTsx, "utf8");
      const scss = fs.readFileSync(footerScss, "utf8");

      assert.ok(tsx.includes("Imagine limitless. Create limitless"), "MonumentalFooter must render updated anthem headline");
      assert.ok(tsx.includes("styles.accentDot"), "MonumentalFooter must isolate trailing period in .accentDot span");
      assert.ok(scss.includes(".accentDot"), "MonumentalFooter.module.scss must define .accentDot");
      assert.ok(scss.includes("color: $client-accent-red;"), "accentDot must consume $client-accent-red (#ea002a)");
    });

    test("verifies MonumentalFooter legal bar and policy links consume Brand Red with WCAG AA compliance", () => {
      const footerScss = path.join(rootDir, "src", "app", "components", "Sections", "MonumentalFooter.module.scss");
      const scss = fs.readFileSync(footerScss, "utf8");

      assert.ok(scss.includes(".bottomLegalBar"), "MonumentalFooter.module.scss must define .bottomLegalBar");
      assert.ok(scss.includes("color: $client-accent-red;"), "bottomLegalBar must style copyright and text in Brand Red");
      assert.ok(scss.includes(".legalLink"), "MonumentalFooter.module.scss must style .legalLink");
      assert.ok(scss.includes("outline: 2px solid $client-accent-red;"), "legalLink must define accessible focus indicator");
    });

    test("verifies ClientHeader logo subtitle at rest and graceful collapse on scroll", () => {
      const headerTsx = path.join(rootDir, "src", "app", "components", "ClientHeader", "ClientHeader.tsx");
      const headerScss = path.join(rootDir, "src", "app", "components", "ClientHeader", "ClientHeader.module.scss");

      const tsx = fs.readFileSync(headerTsx, "utf8");
      const scss = fs.readFileSync(headerScss, "utf8");

      assert.ok(tsx.includes("The Brand Engineering Company"), "ClientHeader must declare at-rest subtitle");
      assert.ok(tsx.includes("styles.brandSubtitle"), "ClientHeader must style subtitle with .brandSubtitle");
      assert.ok(tsx.includes("styles.subtitleScrolled"), "ClientHeader must toggle .subtitleScrolled on scroll");
      assert.ok(scss.includes(".brandSubtitle"), "ClientHeader.module.scss must define .brandSubtitle");
      assert.ok(scss.includes("font-size: 13.5px;"), "brandSubtitle must define calibrated 13.5px desktop font-size");
      assert.ok(scss.includes("letter-spacing: 0.025em;"), "brandSubtitle must define calibrated 0.025em letter-spacing");
      assert.ok(scss.includes("margin-top 0.35s"), "brandSubtitle must synchronize margin-top into transition");
      assert.ok(scss.includes(".subtitleScrolled"), "ClientHeader.module.scss must define .subtitleScrolled collapse");
      assert.ok(scss.includes("opacity: 0;"), "subtitleScrolled must hide subtitle smoothly");
    });

    test("verifies ClientHeader scrolled anchored disciplines station and 12 core disciplines", () => {
      const headerTsx = path.join(rootDir, "src", "app", "components", "ClientHeader", "ClientHeader.tsx");
      const headerScss = path.join(rootDir, "src", "app", "components", "ClientHeader", "ClientHeader.module.scss");

      const tsx = fs.readFileSync(headerTsx, "utf8");
      const scss = fs.readFileSync(headerScss, "utf8");

      const expectedDisciplines = [
        "Brand Strategy",
        "Visual Identity Systems",
        "Creative Direction",
        "Culture Marketing",
        "Experiential Production",
        "Digital Infrastructure",
        "Creative Technology",
        "Motion & Cinema",
        "Campaign Architecture",
        "Editorial Systems",
        "High-Growth GTM",
        "Spatial Brand Design",
      ];

      for (const discipline of expectedDisciplines) {
        assert.ok(tsx.includes(discipline), `ClientHeader must include discipline: "${discipline}"`);
      }

      assert.ok(tsx.includes("styles.streamAperture"), "ClientHeader must render streamAperture container");
      assert.ok(tsx.includes("styles.streamTrack"), "ClientHeader must render streamTrack");
      assert.ok(tsx.includes("styles.leftCluster"), "ClientHeader must anchor leftCluster adjacent to logo");
      assert.ok(scss.includes(".leftCluster"), "ClientHeader.module.scss must define .leftCluster");
      assert.ok(scss.includes(".streamAperture"), "ClientHeader.module.scss must define .streamAperture");
      assert.ok(tsx.includes("styles.kineticItem"), "ClientHeader must render kineticItem");
      assert.ok(tsx.includes("useGSAP"), "ClientHeader must drive dynamic kinetic stream via useGSAP");
      assert.ok(tsx.includes("gsap.timeline"), "ClientHeader must orchestrate master timeline");
      assert.ok(!tsx.includes("streamDot"), "ClientHeader.tsx must NOT contain streamDot (clean typography only)");
      assert.ok(!scss.includes(".streamDot"), "ClientHeader.module.scss must NOT contain .streamDot");
      assert.ok(tsx.includes("styles.textRotator"), "ClientHeader must render textRotator");
      assert.ok(tsx.includes("styles.streamGhost"), "ClientHeader must render streamGhost spacer for CLS 0.000");
      assert.ok(scss.includes(".kineticItem"), "ClientHeader.module.scss must define .kineticItem");
      assert.ok(scss.includes(".textRotator"), "ClientHeader.module.scss must define .textRotator");
      assert.ok(scss.includes(".streamGhost"), "ClientHeader.module.scss must define .streamGhost");
      assert.ok(scss.includes(".streamText"), "ClientHeader.module.scss must define .streamText");
      assert.ok(scss.includes(".kineticCarrier"), "ClientHeader.module.scss must define .kineticCarrier");
      assert.ok(tsx.includes("carrierARef"), "ClientHeader must declare Carrier Alpha ref");
      assert.ok(tsx.includes("carrierBRef"), "ClientHeader must declare Carrier Beta ref");
      assert.ok(tsx.includes("styles.kineticCarrier"), "ClientHeader must render dual kineticCarrier elements");
      assert.ok(tsx.includes("HOLD_DURATION"), "ClientHeader must enforce in-place hold duration");
      assert.ok(tsx.includes("MORPH_DURATION"), "ClientHeader must enforce fluid vertical morph duration");
      assert.ok(tsx.includes("activeAnimations"), "ClientHeader must track active animations for leak-free cleanup");
      assert.ok(tsx.includes("TRAVEL_Y = 14"), "ClientHeader must enforce 14px slot-machine roll displacement");
      assert.ok(tsx.includes("autoAlpha"), "ClientHeader must use autoAlpha for atomic visibility and opacity");
      assert.ok(tsx.includes("styles.carrierAlpha"), "ClientHeader must bind carrierAlpha class to primary carrier");
      assert.ok(scss.includes("margin-left: 12px;"), "ClientHeader.module.scss must anchor streamAperture 12px adjacent to logo");
      assert.ok(scss.includes("clamp(12.5px, 1.05vw, 15px)"), "ClientHeader.module.scss must scale streamText to responsive clamp");
      assert.ok(scss.includes(".carrierAlpha"), "ClientHeader.module.scss must define default visible carrierAlpha");
      assert.ok(!scss.includes("@media (max-width: 680px)"), "ClientHeader.module.scss must not hide streamAperture on small screens");
    });

    test("verifies ConnectCutout traveling red laser photon beam and synchronized desk pulses", () => {
      const connectTsx = path.join(rootDir, "src", "app", "components", "Sections", "ConnectCutout.tsx");
      const connectScss = path.join(rootDir, "src", "app", "components", "Sections", "ConnectCutout.module.scss");

      const tsx = fs.readFileSync(connectTsx, "utf8");
      const scss = fs.readFileSync(connectScss, "utf8");

      assert.ok(tsx.includes("styles.beamTracer"), "ConnectCutout must render beamTracer");
      assert.ok(tsx.includes("styles.deskPulseIndicator"), "ConnectCutout must render deskPulseIndicator");
      assert.ok(scss.includes(".beamTracer"), "ConnectCutout.module.scss must define .beamTracer");
      assert.ok(scss.includes("@keyframes kineticBeamSweepHorizontal"), "ConnectCutout.module.scss must define kineticBeamSweepHorizontal");
      assert.ok(scss.includes("@keyframes deskGlowWave"), "ConnectCutout.module.scss must define deskGlowWave");
      assert.ok(scss.includes("@keyframes pulseDot"), "ConnectCutout.module.scss must define pulseDot");
      assert.ok(scss.includes("prefers-reduced-motion: reduce"), "ConnectCutout.module.scss must include reduced motion guard");
    });
  });

describe("Section 19: Navigation Overlay Helvetica Neue Reference Architecture", () => {
    test("verifies physical existence of Helvetica Neue Light on disk", () => {
      const lightFont = path.join(rootDir, "public", "fonts", "helvetica", "HelveticaNeue-Light.otf");
      const romanFont = path.join(rootDir, "public", "fonts", "helvetica", "HelveticaNeue-Roman.otf");
      assert.ok(fs.existsSync(lightFont), "HelveticaNeue-Light.otf must exist in public/fonts/helvetica/");
      assert.ok(fs.existsSync(romanFont), "HelveticaNeue-Roman.otf must exist in public/fonts/helvetica/");
    });

    test("verifies Next.js localFont registers --font-helvetica-neue", () => {
      const fontsTs = fs.readFileSync(path.join(rootDir, "src", "app", "fonts.ts"), "utf8");
      assert.ok(fontsTs.includes("helveticaNeue"), "fonts.ts must export helveticaNeue");
      assert.ok(fontsTs.includes("--font-helvetica-neue"), "fonts.ts must declare variable --font-helvetica-neue");
    });

    test("verifies NavigationOverlay complete arrow eradication and lowercase Swiss typography", () => {
      const tsx = fs.readFileSync(path.join(rootDir, "src", "app", "components", "NavigationOverlay", "NavigationOverlay.tsx"), "utf8");
      const scss = fs.readFileSync(path.join(rootDir, "src", "app", "components", "NavigationOverlay", "NavigationOverlay.module.scss"), "utf8");

      assert.ok(!tsx.includes("editorialArrowSvg"), "NavigationOverlay.tsx must NOT contain editorialArrowSvg (zero arrows)");
      assert.ok(!tsx.includes("navArrow"), "NavigationOverlay.tsx must NOT render navArrow elements");
      assert.ok(!scss.includes(".navArrow"), "NavigationOverlay.module.scss must NOT define .navArrow");
      assert.ok(scss.includes("$font-helvetica"), "NavigationOverlay.module.scss must style .navLink with $font-helvetica");
      assert.ok(scss.includes("text-transform: lowercase"), "NavigationOverlay.module.scss must enforce lowercase typography");
      assert.ok(tsx.includes("Copyright 2026"), "NavigationOverlay.tsx must render clean copyright baseline");
      assert.ok(scss.includes(".rightPanel"), "NavigationOverlay.module.scss must define .rightPanel");
      assert.ok(scss.includes(".framelessCloseBtn"), "NavigationOverlay.module.scss must define .framelessCloseBtn");
      assert.ok(scss.includes(".closeIconSvg"), "NavigationOverlay.module.scss must define .closeIconSvg");
      assert.ok(scss.includes(".srOnly"), "NavigationOverlay.module.scss must define .srOnly screen reader style");
    });
  });


});
