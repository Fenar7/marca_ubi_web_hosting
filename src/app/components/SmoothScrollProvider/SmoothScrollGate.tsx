"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";

const SmoothScrollProvider = dynamic(() => import("./SmoothScrollProvider"), {
  ssr: false,
});

/**
 * Skips loading and hydrating Lenis/GSAP smooth-scroll bundles on `/admin/*` and `/studio/*`
 * routes so CRM workspace pages compile faster and retain native browser scrolling.
 */
export default function SmoothScrollGate({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin") || pathname?.startsWith("/studio")) {
    return <>{children}</>;
  }

  return <SmoothScrollProvider>{children}</SmoothScrollProvider>;
}
