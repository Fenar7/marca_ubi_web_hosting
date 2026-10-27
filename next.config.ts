/**
 * @file next.config.ts
 * @description Next.js 16 configuration with defense-in-depth security headers,
 *              Sanity CDN remote image optimization patterns, and Sass global design tokens.
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import type { NextConfig } from "next";

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

const nextConfig: NextConfig = {
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
