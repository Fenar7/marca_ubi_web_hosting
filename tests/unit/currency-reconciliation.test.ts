/**
 * @file currency-reconciliation.test.ts
 * @description Unit tests for Marca Ubi dual-currency reconciliation engine and institutional FX peg.
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  INSTITUTIONAL_USD_TO_INR_PEG,
  reconcileBudgetBracket,
  formatBudgetTierLabel,
  formatIndianUnit,
  formatCrmCurrency,
} from '../../src/app/admin/lib/currency';

describe('Dual-Currency Harmonization Engine', () => {
  it('enforces the official institutional peg of 1 USD = 83.50 INR', () => {
    assert.strictEqual(INSTITUTIONAL_USD_TO_INR_PEG, 83.5);
  });

  it('formats Indian units correctly (Lakhs and Crores)', () => {
    assert.strictEqual(formatIndianUnit(8350000), '83.5L');
    assert.strictEqual(formatIndianUnit(20875000), '2.09Cr');
    assert.strictEqual(formatIndianUnit(500000), '5L');
    assert.strictEqual(formatIndianUnit(10000000), '1Cr');
    assert.strictEqual(formatIndianUnit(250000), '2.5L');
  });

  it('reconciles foreign USD budget brackets into verified institutional INR equivalents', () => {
    const result = reconcileBudgetBracket('$100k-$250k');
    assert.strictEqual(result.isForeignTier, true);
    assert.strictEqual(result.formattedInrRange, '₹83.5L – ₹2.09Cr');
    assert.strictEqual(result.formattedUsdRange, '$100k – $250k USD');
    assert.strictEqual(result.minPaise, 8350000 * 100);
    assert.strictEqual(result.maxPaise, 20875000 * 100);
  });

  it('handles space variations in USD brackets', () => {
    const result = reconcileBudgetBracket('$100k - $250k');
    assert.strictEqual(result.isForeignTier, true);
    assert.strictEqual(result.formattedInrRange, '₹83.5L – ₹2.09Cr');
    assert.strictEqual(result.formattedUsdRange, '$100k – $250k USD');
  });

  it('handles empty or undetermined budget brackets gracefully', () => {
    const resultNull = reconcileBudgetBracket(null);
    assert.strictEqual(resultNull.isForeignTier, false);
    assert.strictEqual(resultNull.formattedInrRange, 'Scope Undetermined');
    assert.strictEqual(resultNull.minPaise, 0);

    const resultEmpty = reconcileBudgetBracket('');
    assert.strictEqual(resultEmpty.isForeignTier, false);
    assert.strictEqual(resultEmpty.formattedInrRange, 'Scope Undetermined');
  });

  it('reconciles domestic INR brackets while preserving original strings', () => {
    const result = reconcileBudgetBracket('₹5L - ₹15L');
    assert.strictEqual(result.isForeignTier, false);
    assert.strictEqual(result.formattedInrRange, '₹5L - ₹15L');
    assert.strictEqual(result.minPaise, 500000 * 100);
    assert.strictEqual(result.maxPaise, 1500000 * 100);
  });

  it('harmonizes formatBudgetTierLabel to present dual-currency badges for USD brackets', () => {
    assert.strictEqual(
      formatBudgetTierLabel('$100k-$250k'),
      '₹83.5L – ₹2.09Cr ($100k – $250k USD)'
    );
  });

  it('maintains strict backward compatibility for domestic INR formatBudgetTierLabel', () => {
    assert.strictEqual(
      formatBudgetTierLabel('₹5L - ₹15L'),
      '₹ 5,00,000 - ₹ 15,00,000'
    );
    assert.strictEqual(
      formatBudgetTierLabel('> ₹1.5 Crore'),
      '> ₹ 1,50,00,000'
    );
  });
});
