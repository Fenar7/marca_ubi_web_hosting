/** Institutional FX peg retained for the CRM's existing USD display mode. */
export const USD_TO_INR_RATE = 83.5;

/**
 * Formats CRM monetary values without compact suffixes so users can compare exact amounts.
 * Values are stored in INR; the optional USD presentation uses the KPI ribbon's configured peg.
 */
export function formatCrmCurrency(amount: number, currency: 'INR' | 'USD' = 'INR'): string {
  const finiteAmount = Number.isFinite(amount) ? amount : 0;
  const displayAmount = currency === 'USD' ? finiteAmount / USD_TO_INR_RATE : finiteAmount;
  const formattedAmount = Math.round(displayAmount).toLocaleString(currency === 'USD' ? 'en-US' : 'en-IN');
  return currency === 'USD' ? `$ ${formattedAmount}` : `\u20b9 ${formattedAmount}`;
}

/** Converts legacy compact budget-tier text to full values while preserving its stored key. */
export function formatBudgetTierLabel(tier: string): string {
  return tier.replace(/\u20b9\s*([\d,]+(?:\.\d+)?)\s*(Lakhs?|Crores?|L|Cr)/gi, (match, rawAmount: string, unit: string) => {
    const amount = Number(rawAmount.replaceAll(',', ''));
    if (!Number.isFinite(amount)) return match;
    const multiplier = /^(?:L|Lakhs?)$/i.test(unit) ? 100_000 : 10_000_000;
    return formatCrmCurrency(amount * multiplier);
  });
}
