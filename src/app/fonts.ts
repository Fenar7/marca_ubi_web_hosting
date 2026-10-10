import localFont from "next/font/local";

export const graphik = localFont({
  src: [
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
