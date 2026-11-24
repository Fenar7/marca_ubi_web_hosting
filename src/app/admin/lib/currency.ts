/**
 * @file currency.ts
 * @description Institutional FX peg calculation, dual-currency harmonization, and full-digit
 *              monetary formatting engine for the Marca Ubi Enterprise CRM.
 *              Standardizes INR commercial valuations and institutional foreign pegs.
 * @module admin/lib/currency
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

/**
 * Institutional FX Peg: 1 USD = 83.50 INR.
 * Standardized baseline across all Marca Ubi commercial valuation models.
 */
export const INSTITUTIONAL_USD_TO_INR_PEG = 83.5;

/** Legacy alias retained for backward compatibility across existing KPI ribbon consumers. */
export const USD_TO_INR_RATE = INSTITUTIONAL_USD_TO_INR_PEG;

export interface ReconciledBudgetTier {
  formattedInrRange: string;
  formattedUsdRange?: string;
  isForeignTier: boolean;
  minPaise: number;
  maxPaise: number;
  displayBadge: string;
}

/**
 * Formats numeric INR valuations to compact Indian unit notation (Lakhs, Crores).
 * Ensures clean decimal display without trailing zeroes.
 *
 * @param amount Base INR value
 * @returns Compact Indian representation (e.g. "83.5L", "2.09Cr", "500k")
 */
export function formatIndianUnit(amount: number): string {
  const abs = Math.abs(amount);
  if (abs >= 10_000_000) {
    const cr = amount / 10_000_000;
    const formatted = cr % 1 === 0 ? cr.toFixed(0) : cr.toFixed(2).replace(/\.?0+$/, '');
    return `${formatted}Cr`;
  }
  if (abs >= 100_000) {
    const l = amount / 100_000;
    const formatted = l % 1 === 0 ? l.toFixed(0) : l.toFixed(2).replace(/\.?0+$/, '');
    return `${formatted}L`;
  }
  if (abs >= 1_000) {
    const k = amount / 1_000;
    const formatted = k % 1 === 0 ? k.toFixed(0) : k.toFixed(1).replace(/\.?0+$/, '');
    return `${formatted}k`;
  }
  return String(amount);
}

/**
 * Parses and harmonizes raw budget brackets into verified institutional representations.
 * Handles both domestic INR formats (₹15L - ₹30L, > ₹1.5 Crore) and foreign USD strings ($100k-$250k).
 * Converts foreign tiers to domestic INR via the institutional peg (1 USD = 83.50 INR).
 *
 * @param bracket Raw stored bracket string
 * @returns Normalized institutional budget bracket contract
 */
export function reconcileBudgetBracket(bracket: string | null | undefined): ReconciledBudgetTier {
  if (!bracket || bracket.trim() === '') {
    return {
      formattedInrRange: 'Scope Undetermined',
      isForeignTier: false,
      minPaise: 0,
      maxPaise: 0,
      displayBadge: 'Calculated Scope',
    };
  }

  const trimmed = bracket.trim();

  // 1. Detect USD bracket patterns (e.g. "$100k-$250k", "$100k - $250k", "$100,000 - $250,000", "$50k+")
  const usdRangeMatch = trimmed.match(/\$([0-9.,]+)\s*(k|m)?\s*(?:-|–|to)\s*\$([0-9.,]+)\s*(k|m)?/i);
  if (usdRangeMatch) {
    const rawMin = parseFloat(usdRangeMatch[1].replace(/,/g, ''));
    const unitMin = usdRangeMatch[2]?.toLowerCase();
    const minMultiplier = unitMin === 'm' ? 1_000_000 : unitMin === 'k' || rawMin < 1000 ? 1_000 : 1;
    const minUsd = rawMin * minMultiplier;

    const rawMax = parseFloat(usdRangeMatch[3].replace(/,/g, ''));
    const unitMax = usdRangeMatch[4]?.toLowerCase();
    const maxMultiplier = unitMax === 'm' ? 1_000_000 : unitMax === 'k' || rawMax < 1000 ? 1_000 : 1;
    const maxUsd = rawMax * maxMultiplier;

    const minInr = minUsd * INSTITUTIONAL_USD_TO_INR_PEG;
    const maxInr = maxUsd * INSTITUTIONAL_USD_TO_INR_PEG;

    const usdMinLabel = minUsd >= 1000 ? `${Math.round(minUsd / 1000)}k` : `${minUsd}`;
    const usdMaxLabel = maxUsd >= 1000 ? `${Math.round(maxUsd / 1000)}k` : `${maxUsd}`;

    const formattedInr = `₹${formatIndianUnit(minInr)} – ₹${formatIndianUnit(maxInr)}`;
    const formattedUsd = `$${usdMinLabel} – $${usdMaxLabel} USD`;

    return {
      formattedInrRange: formattedInr,
      formattedUsdRange: formattedUsd,
      isForeignTier: true,
      minPaise: Math.round(minInr * 100),
      maxPaise: Math.round(maxInr * 100),
      displayBadge: `${formattedInr} (${formattedUsd})`,
    };
  }

  // Single-bound USD pattern (e.g. "$100k+", "> $100k")
  const usdSingleMatch = trimmed.match(/(?:>|\+)?\s*\$([0-9.,]+)\s*(k|m)?(?:\+)?/i);
  if (usdSingleMatch && trimmed.includes('$')) {
    const rawVal = parseFloat(usdSingleMatch[1].replace(/,/g, ''));
    const unit = usdSingleMatch[2]?.toLowerCase();
    const multiplier = unit === 'm' ? 1_000_000 : unit === 'k' || rawVal < 1000 ? 1_000 : 1;
    const usdVal = rawVal * multiplier;
    const inrVal = usdVal * INSTITUTIONAL_USD_TO_INR_PEG;
    const usdLabel = usdVal >= 1000 ? `${Math.round(usdVal / 1000)}k` : `${usdVal}`;

    const formattedInr = `> ₹${formatIndianUnit(inrVal)}`;
    const formattedUsd = `> $${usdLabel} USD`;

    return {
      formattedInrRange: formattedInr,
      formattedUsdRange: formattedUsd,
      isForeignTier: true,
      minPaise: Math.round(inrVal * 100),
      maxPaise: Math.round(inrVal * 2 * 100),
      displayBadge: `${formattedInr} (${formattedUsd})`,
    };
  }

  // 2. Domestic INR bracket parsing (e.g. "₹5L - ₹15L", "< ₹5 Lakhs", "> ₹1.5 Crore", "₹25L+")
  let minPaise = 0;
  let maxPaise = 0;

  const inrRangeMatch = trimmed.match(/\u20b9\s*([\d,.]+)\s*(L|Cr|Lakhs?|Crores?)?\s*(?:-|–|to)\s*\u20b9?\s*([\d,.]+)\s*(L|Cr|Lakhs?|Crores?)/i);
  if (inrRangeMatch) {
    const minVal = parseFloat(inrRangeMatch[1].replace(/,/g, ''));
    const minUnit = inrRangeMatch[2] || inrRangeMatch[4];
    const minMult = /^(?:Cr|Crores?)$/i.test(minUnit) ? 10_000_000 : 100_000;
    const minInr = minVal * minMult;

    const maxVal = parseFloat(inrRangeMatch[3].replace(/,/g, ''));
    const maxUnit = inrRangeMatch[4];
    const maxMult = /^(?:Cr|Crores?)$/i.test(maxUnit) ? 10_000_000 : 100_000;
    const maxInr = maxVal * maxMult;

    minPaise = Math.round(minInr * 100);
    maxPaise = Math.round(maxInr * 100);
  }

  return {
    formattedInrRange: trimmed,
    isForeignTier: false,
    minPaise,
    maxPaise,
    displayBadge: formatBudgetTierLabel(trimmed),
  };
}

/** Alias supporting client dossier ribbon components. */
export const reconcileBudgetTier = reconcileBudgetBracket;

/**
 * Formats CRM monetary values without compact suffixes so users can compare exact amounts.
 * Values are stored in INR; the optional USD presentation uses the institutional peg.
 */
export function formatCrmCurrency(amount: number, currency: 'INR' | 'USD' = 'INR'): string {
  const finiteAmount = Number.isFinite(amount) ? amount : 0;
  const displayAmount = currency === 'USD' ? finiteAmount / INSTITUTIONAL_USD_TO_INR_PEG : finiteAmount;
  const formattedAmount = Math.round(displayAmount).toLocaleString(currency === 'USD' ? 'en-US' : 'en-IN');
  return currency === 'USD' ? `$ ${formattedAmount}` : `\u20b9 ${formattedAmount}`;
}

/**
 * Converts budget-tier text to full localized currency values while preserving stored keys.
 * Harmonizes foreign USD brackets to dual-currency presentation and expands domestic INR tiers.
 */
export function formatBudgetTierLabel(tier: string): string {
  if (!tier) return '';

  // 1. If foreign USD tier (e.g. "$100k-$250k"), reconcile and return dual-currency presentation
  if (tier.includes('$')) {
    const reconciled = reconcileBudgetBracket(tier);
    if (reconciled.isForeignTier && reconciled.formattedUsdRange) {
      return `${reconciled.formattedInrRange} (${reconciled.formattedUsdRange})`;
    }
  }

  // 2. Domestic INR bracket expansion (preserves full backward compatibility with test suites)
  return tier.replace(/\u20b9\s*([\d,]+(?:\.\d+)?)\s*(Lakhs?|Crores?|L|Cr)/gi, (match, rawAmount: string, unit: string) => {
    const amount = Number(rawAmount.replaceAll(',', ''));
    if (!Number.isFinite(amount)) return match;
    const multiplier = /^(?:L|Lakhs?)$/i.test(unit) ? 100_000 : 10_000_000;
    return formatCrmCurrency(amount * multiplier);
  });
}

/** Format currency numbers for compact Y-axis charts without losing clarity */
export function formatCompactInr(amount: number): string {
  if (amount === 0) return '0';
  const abs = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';
  if (abs >= 10000000) {
    return `${sign}${(abs / 10000000).toFixed(1)}Cr`;
  }
  if (abs >= 100000) {
    return `${sign}${(abs / 100000).toFixed(0)}L`;
  }
  if (abs >= 1000) {
    return `${sign}${(abs / 1000).toFixed(0)}k`;
  }
  return `${sign}${abs}`;
}

