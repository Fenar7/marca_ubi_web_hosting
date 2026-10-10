import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.sanity.io",
        pathname: "/images/**",
      },
    ],
  },
  sassOptions: {
    additionalData: `
$white: #fff;
$black: #000;
$cta-orange: #ff6100;
$hash-grey: #7c7c7c;
$light-grey: #2b2b2b;

$font-graphik: var(--font-graphik), -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
$font-sf-pro: $font-graphik;
$font-movatif: $font-graphik;

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
