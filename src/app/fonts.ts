import localFont from "next/font/local";

/**
 * Signature Editorial Typeface: Circular XX (160over90 Benchmark).
 * Loaded via Next.js localFont for sub-millisecond local edge delivery and zero layout shift.
 */
export const circularXX = localFont({
  src: [
    {
      path: "../../public/fonts/circular/CircularXXWeb-Book.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/fonts/circular/CircularXXWeb-Medium.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../public/fonts/circular/CircularXXWeb-Bold.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-circular",
  display: "swap",
  fallback: [
    "-apple-system",
    "BlinkMacSystemFont",
    "Segoe UI",
    "Roboto",
    "Helvetica Neue",
    "Arial",
    "sans-serif",
  ],
});

/**
 * Secondary Body Typeface: Graphik.
 */
export const graphik = localFont({
  src: [
    {
      path: "../../public/fonts/grphik-font-family/Graphik-Thin.ttf",
      weight: "100",
      style: "normal",
    },
    {
      path: "../../public/fonts/grphik-font-family/Graphik-Extralight.ttf",
      weight: "200",
      style: "normal",
    },
    {
      path: "../../public/fonts/grphik-font-family/Graphik-Light.ttf",
      weight: "300",
      style: "normal",
    },
    {
      path: "../../public/fonts/grphik-font-family/Graphik-Regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/fonts/grphik-font-family/Graphik-Medium.ttf",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../public/fonts/grphik-font-family/Graphik-Semibold.ttf",
      weight: "600",
      style: "normal",
    },
    {
      path: "../../public/fonts/grphik-font-family/Graphik-Bold.ttf",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-graphik",
  display: "swap",
  fallback: [
    "system-ui",
    "-apple-system",
    "BlinkMacSystemFont",
    "Segoe UI",
    "Roboto",
    "Helvetica",
    "Arial",
    "sans-serif",
  ],
});
