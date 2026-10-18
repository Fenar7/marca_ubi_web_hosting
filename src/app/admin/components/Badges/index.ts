/**
 * @file index.ts
 * @description Barrel export for admin badges.
 * @module admin/components/Badges
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

export { OverdueBadge, type OverdueBadgeProps } from './OverdueBadge';
export {
  calculateOverdueTier,
  getOverdueBadgeTheme,
  type OverdueTier,
  type OverdueCalculationOptions,
  type OverdueCalculationResult,
} from './badgeUtils';
