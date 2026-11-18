/**
 * @file largestRemainder.ts
 * @description Largest Remainder Method (Hare-Niemeyer Algorithm).
 *              Ensures rounded integer percentages sum to strictly 100% without rounding drift.
 * @module admin/lib/largestRemainder
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

export interface RemainderItem<T> {
  item: T;
  value: number;
}

/**
 * Calculates integer percentages guaranteed to sum to strictly 100%.
 * Uses the Hare-Niemeyer / Hamilton largest remainder method to distribute rounding remainders
 * to the items with the largest fractional components.
 *
 * @param items Array of items with numeric values
 * @param getValue Function to extract numeric weight from an item
 * @returns Array of integer percentages corresponding 1:1 with input items
 */
export function largestRemainderRound<T>(
  items: T[],
  getValue: (item: T) => number,
): number[] {
  if (!items || items.length === 0) return [];

  const total = items.reduce((sum, item) => sum + Math.max(0, getValue(item)), 0);
  if (total <= 0) {
    // If all values are 0, return 0 for all items
    return items.map(() => 0);
  }

  const rawPercentages = items.map((item) => {
    const val = Math.max(0, getValue(item));
    return (val / total) * 100;
  });

  const floors = rawPercentages.map((pct) => Math.floor(pct));
  const floorSum = floors.reduce((sum, f) => sum + f, 0);
  const remainderToDistribute = Math.round(100 - floorSum);

  if (remainderToDistribute <= 0) {
    return floors;
  }

  // Calculate fractions and rank by descending fraction
  const fractionsWithIndex = rawPercentages.map((raw, index) => ({
    index,
    fraction: raw - floors[index],
  }));

  fractionsWithIndex.sort((a, b) => b.fraction - a.fraction);

  const result = [...floors];
  for (let i = 0; i < remainderToDistribute && i < fractionsWithIndex.length; i++) {
    result[fractionsWithIndex[i].index] += 1;
  }

  return result;
}
