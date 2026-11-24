/**
 * @file stagePalette.ts
 * @description Curated Swiss Luxury 8-stage color palette for CRM pipeline visualization.
 *              Guarantees distinct hues, accessible WCAG contrast, and zero forbidden generic blue (#2563eb).
 * @module admin/lib/stagePalette
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

export interface StagePaletteEntry {
  color: string;
  badgeBg: string;
  badgeTextColor: string;
}

export const SWISS_STAGE_PALETTE: StagePaletteEntry[] = [
  { color: "#18181b", badgeBg: "rgba(24, 24, 27, 0.08)", badgeTextColor: "#18181b" },
  { color: "#ea002a", badgeBg: "rgba(234, 0, 42, 0.09)", badgeTextColor: "#ea002a" },
  { color: "#0d9488", badgeBg: "rgba(13, 148, 136, 0.10)", badgeTextColor: "#0d9488" },
  { color: "#10b981", badgeBg: "rgba(16, 185, 129, 0.10)", badgeTextColor: "#047857" },
  { color: "#d97706", badgeBg: "rgba(217, 119, 6, 0.10)", badgeTextColor: "#b45309" },
  { color: "#6366f1", badgeBg: "rgba(99, 102, 241, 0.10)", badgeTextColor: "#4f46e5" },
  { color: "#059669", badgeBg: "rgba(5, 150, 105, 0.10)", badgeTextColor: "#059669" },
  { color: "#71717a", badgeBg: "rgba(113, 113, 122, 0.10)", badgeTextColor: "#52525b" },
];
