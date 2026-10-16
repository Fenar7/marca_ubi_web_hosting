/**
 * @file team-utils.ts
 * @description Utility functions for commercial personnel governance, high-entropy password generation,
 *              currency valuation formatting, and UI form state evaluation.
 * @module lib/team-utils
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

/**
 * Generates a 16-character cryptographically secure high-entropy temporary passphrase.
 * Guarantees inclusion of uppercase, lowercase, numeric digits, and special characters.
 *
 * @returns {string} 16-character high-entropy passphrase.
 */
export function generateHighEntropyPassword(): string {
  const uppers = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lowers = 'abcdefghijkmnopqrstuvwxyz';
  const digits = '23456789';
  const symbols = '!@#$%^&*()-_=+';

  const allChars = uppers + lowers + digits + symbols;
  const array = new Uint32Array(16);

  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(array);
  } else {
    for (let i = 0; i < 16; i++) {
      array[i] = Math.floor(Math.random() * 1000000000);
    }
  }

  // Guarantee at least 2 characters from each category
  const guaranteed = [
    uppers[array[0] % uppers.length],
    uppers[array[1] % uppers.length],
    lowers[array[2] % lowers.length],
    lowers[array[3] % lowers.length],
    digits[array[4] % digits.length],
    digits[array[5] % digits.length],
    symbols[array[6] % symbols.length],
    symbols[array[7] % symbols.length],
  ];

  const remaining = [];
  for (let i = 8; i < 16; i++) {
    remaining.push(allChars[array[i] % allChars.length]);
  }

  // Shuffle together
  const combined = [...guaranteed, ...remaining];
  for (let i = combined.length - 1; i > 0; i--) {
    const j = array[i] % (i + 1);
    const temp = combined[i];
    combined[i] = combined[j];
    combined[j] = temp;
  }

  return combined.join('');
}

/**
 * Formats monetary amounts into clean Indian Lakhs/Crores or base currency with tabular precision.
 *
 * @param {number} value Raw numeric currency value.
 * @returns {string} Formatted currency string.
 */
export function formatDealValuation(value: number): string {
  if (!value || value <= 0) return '₹0';
  if (value >= 10000000) {
    return `₹${(value / 10000000).toFixed(1)}Cr`;
  }
  if (value >= 100000) {
    return `₹${(value / 100000).toFixed(1)}L`;
  }
  return `₹${value.toLocaleString('en-IN')}`;
}

/**
 * Extracts 1-2 letter uppercase monogram from full name.
 *
 * @param {string} name Personnel full name.
 * @returns {string} 1-2 letter monogram.
 */
export function getInitials(name: string): string {
  if (!name) return 'MU';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Evaluates whether the Add Team Member drawer form contains unsaved user modifications.
 *
 * @param {string} fullName Current full name input.
 * @param {string} email Current email input.
 * @param {string} jobTitle Current job title input.
 * @param {string} phone Current phone input.
 * @param {string} role Current role selection.
 * @returns {boolean} True if any field differs from pristine default state.
 */
export function isDrawerDirty(
  fullName: string,
  email: string,
  jobTitle: string,
  phone: string,
  role: string
): boolean {
  return Boolean(
    fullName.trim() ||
      email.trim() ||
      jobTitle.trim() ||
      phone.trim() ||
      role !== 'sales_executive'
  );
}
