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
`,
  },
};

export default nextConfig;
