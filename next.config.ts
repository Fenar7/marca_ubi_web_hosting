import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
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

$font-sf-pro: "SF Pro Display", sans-serif;
$font-movatif: "Movatif", sans-serif;
`,
  },
};

export default nextConfig;
