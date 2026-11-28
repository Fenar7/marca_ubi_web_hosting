/**
 * @file next.config.ts
 * @description Next.js 16 configuration with defense-in-depth security headers,
 *              Sanity CDN remote image optimization patterns, and Sass global design tokens.
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import type { NextConfig } from "next";
import path from "node:path";
import { validateEnv } from "./src/app/lib/env";

// Stop a Vercel production build before it can publish a login page with missing public configuration.
if (process.env.VERCEL_ENV === "production") {
  validateEnv();
}

/**
 * Resolves an optional workspace-relative Next.js build output directory for
 * isolated tool runs (such as Playwright E2E) while forcing Vercel deployments
 * to keep the standard `.next` output path.
 */
function resolveDistDir(): string | undefined {
  if (process.env.VERCEL) {
    return undefined;
  }

  const candidate = process.env.NEXT_DIST_DIR?.trim();
  if (!candidate) {
    return undefined;
  }

  if (
    path.isAbsolute(candidate) ||
    path.win32.isAbsolute(candidate) ||
    /^[A-Za-z]:/.test(candidate)
  ) {
    throw new Error(
      `Invalid NEXT_DIST_DIR "${candidate}": must be a relative workspace directory.`
    );
  }

  const normalized = path.posix.normalize(candidate.replace(/\\/g, "/"));
  const segments = normalized.split("/").filter(Boolean);
  if (segments.length === 0 || segments[0] === "." || segments.includes("..")) {
    throw new Error(
      `Invalid NEXT_DIST_DIR "${candidate}": path traversal or root references are not permitted.`
    );
  }

  return normalized;
}

const distDir = resolveDistDir();

/**
 * Enterprise Defense-in-Depth Security Headers.
 * Enforces strict CSP, anti-clickjacking frame denial, TLS transport security,
 * MIME-sniffing prevention, and privacy-preserving referrer policies.
 */
const securityHeaders = [
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.sanity.io",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' blob: data: https://cdn.sanity.io https://*.supabase.co https://images.unsplash.com",
      "media-src 'self' blob: data: https://*.amazonaws.com",
      "font-src 'self' data:",
      "connect-src 'self' https://*.supabase.co https://*.sanity.io wss://*.supabase.co",
      "frame-ancestors 'none'",
      "object-src 'none'",
      "base-uri 'self'",
    ].join("; "),
  },
];

const isProductionBuild =
  process.argv.includes("build") || process.env.npm_lifecycle_event === "build";

const nextConfig: NextConfig = {
  ...(distDir ? { distDir } : {}),
  ...(isProductionBuild || Boolean(distDir)
    ? {
        // Isolate production builds and isolated distDir sessions (e.g. `.next-e2e`) from transient dev types and `tsconfig.json` auto-rewrites
        typescript: {
          tsconfigPath: "./tsconfig.typecheck.json",
        },
      }
    : {}),
  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion", "gsap"],
    // Prevent Turbopack persistent dev LSM cache from cross-contaminating CSS Modules with globals.css Preflight selectors
    turbopackFileSystemCacheForDev: false,
  },
  images: {
    qualities: [75, 82],
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.sanity.io",
        pathname: "/images/**",
      },
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: "/work",
        destination: "/works",
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
  sassOptions: {
    additionalData: `
$white: #fff;
$black: #000;
$cta-orange: #ff6100;
$hash-grey: #7c7c7c;
$light-grey: #2b2b2b;

// 160over90 Benchmark Tokens
$client-accent-red: #ea002a;
$font-circular: var(--font-circular), -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
$font-graphik: var(--font-graphik), -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
$font-sf-pro: $font-circular;
$font-movatif: $font-circular;

// Typography Token Variables
$type-display-giant: var(--type-display-giant);
$type-display: var(--type-display);
$type-h2: var(--type-h2);
$type-h3: var(--type-h3);
$type-h4: var(--type-h4);
$type-tag: var(--type-tag);
$type-stat-number: var(--type-stat-number);
$type-stat-symbol: var(--type-stat-symbol);
$type-body-lead: var(--type-body-lead);
$type-body: var(--type-body);
$type-caption: var(--type-caption);
$type-micro: var(--type-micro);
$lh-tight: var(--lh-tight);
$lh-heading: var(--lh-heading);
$lh-subheading: var(--lh-subheading);
$lh-body-lead: var(--lh-body-lead);
$lh-body: var(--lh-body);
$lh-caption: var(--lh-caption);
`,
  },
};

export default nextConfig;
