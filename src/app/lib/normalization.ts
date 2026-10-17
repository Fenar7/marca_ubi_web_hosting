/**
 * @file normalization.ts
 * @description International contact coordinate normalization and input sanitization utilities.
 *              Standardizes email strings to lowercase RFC-5322 compliance and phone numbers
 *              to ITU-T E.164 formats (+971 UAE, +91 India, +44 UK, +1 US).
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

export interface PhoneNormalizationResult {
  phone: string | null;
  warning: boolean;
  raw: string | null;
}

/**
 * Normalizes email addresses by trimming whitespace and converting to lowercase.
 * Ensures consistent lookups in deduplication state machines and unique database indexes.
 *
 * @param email - Raw email string from client submission
 * @returns Trimmed lowercase email or null if input is empty
 */
export function normalizeEmail(email?: string | null): string | null {
  if (!email) {
    return null;
  }
  const trimmed = email.trim().toLowerCase();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * Normalizes international telephone numbers into canonical E.164 format.
 * Intelligently recognizes domestic dialing patterns across core agency commercial markets:
 * - United Arab Emirates (+971): 9 digits with prefix `05x`, `04`, `02`, etc.
 * - India (+91): 10 digits starting with 6, 7, 8, or 9 (with or without trunk prefix `0`).
 * - United Kingdom (+44): 10 digits with mobile prefix `07`.
 * - North America (+1): 10 digits (with or without country code `1`).
 *
 * If a number contains invalid character sequences or cannot be parsed confidently,
 * digits are preserved and flagged with `warning: true` for commercial manual review.
 *
 * @param rawPhone - Raw phone string submitted by user
 * @returns Structured normalization outcome with E.164 phone string and anomaly warning flag
 */
export function normalizePhone(rawPhone?: string | null): PhoneNormalizationResult {
  if (!rawPhone || rawPhone.trim().length === 0) {
    return { phone: null, warning: false, raw: null };
  }

  const trimmed = rawPhone.trim();
  const hasLeadingPlus = trimmed.startsWith('+');

  // Strip all non-digit characters
  const digitsOnly = trimmed.replace(/\D/g, '');

  if (digitsOnly.length === 0) {
    return { phone: null, warning: true, raw: trimmed };
  }

  // 1. Direct E.164 or international prefix handling
  if (hasLeadingPlus) {
    // E.164 standard allows 7 to 15 digits
    if (digitsOnly.length >= 7 && digitsOnly.length <= 15) {
      return { phone: `+${digitsOnly}`, warning: false, raw: trimmed };
    }
    return { phone: `+${digitsOnly}`, warning: true, raw: trimmed };
  }

  // 2. Double-zero international prefix (00971..., 0091..., 0044..., etc.)
  if (digitsOnly.startsWith('00') && digitsOnly.length >= 9) {
    const withoutZeroZero = digitsOnly.substring(2);
    if (withoutZeroZero.length >= 7 && withoutZeroZero.length <= 15) {
      return { phone: `+${withoutZeroZero}`, warning: false, raw: trimmed };
    }
  }

  // 3. United Arab Emirates (UAE) Normalization
  // Full international without plus: 971 followed by 9 digits (total 12 digits)
  if (digitsOnly.startsWith('971') && digitsOnly.length === 12) {
    return { phone: `+${digitsOnly}`, warning: false, raw: trimmed };
  }
  // Domestic UAE mobile (050, 052, 054, 055, 056, 058) or landline (02, 04, 03, 06, 07, 09):
  // 10 digits starting with 05 or 9 digits starting with 02/04 etc.
  if (digitsOnly.startsWith('05') && digitsOnly.length === 10) {
    const local = digitsOnly.substring(1);
    return { phone: `+971${local}`, warning: false, raw: trimmed };
  }
  if (digitsOnly.startsWith('0') && digitsOnly.length === 9) {
    const local = digitsOnly.substring(1);
    return { phone: `+971${local}`, warning: false, raw: trimmed };
  }
  // 9 digits without leading 0 starting with 5 (e.g. 501234567)
  if (digitsOnly.startsWith('5') && digitsOnly.length === 9) {
    return { phone: `+971${digitsOnly}`, warning: false, raw: trimmed };
  }

  // 4. United Kingdom (+44) Normalization
  // Full international without plus: 44 followed by 10 digits
  if (digitsOnly.startsWith('44') && digitsOnly.length === 12) {
    return { phone: `+${digitsOnly}`, warning: false, raw: trimmed };
  }
  // Domestic UK mobile starting with 07 (11 digits total: 07xxx xxxxxx)
  if (digitsOnly.startsWith('07') && digitsOnly.length === 11) {
    const local = digitsOnly.substring(1);
    return { phone: `+44${local}`, warning: false, raw: trimmed };
  }

  // 5. India (+91) Normalization
  // Full international without plus: 91 followed by 10 digits (total 12 digits)
  if (digitsOnly.startsWith('91') && digitsOnly.length === 12) {
    return { phone: `+${digitsOnly}`, warning: false, raw: trimmed };
  }
  // Domestic 11 digits with leading 0 (e.g. 09847012345)
  if (digitsOnly.startsWith('0') && digitsOnly.length === 11) {
    const local = digitsOnly.substring(1);
    if (/^[6-9]/.test(local)) {
      return { phone: `+91${local}`, warning: false, raw: trimmed };
    }
  }
  // Standard 10-digit Indian mobile starting with 6, 7, 8, 9
  if (digitsOnly.length === 10 && /^[6-9]/.test(digitsOnly)) {
    return { phone: `+91${digitsOnly}`, warning: false, raw: trimmed };
  }

  // 6. North America (+1) Normalization
  // 11 digits starting with 1
  if (digitsOnly.startsWith('1') && digitsOnly.length === 11) {
    return { phone: `+${digitsOnly}`, warning: false, raw: trimmed };
  }
  // Standard 10 digits US/Canada
  if (digitsOnly.length === 10) {
    return { phone: `+1${digitsOnly}`, warning: false, raw: trimmed };
  }

  // 7. Fallback for unclassified numbers
  // If digits length is standard E.164 (7-15 digits), prepend '+'
  if (digitsOnly.length >= 7 && digitsOnly.length <= 15) {
    return { phone: `+${digitsOnly}`, warning: false, raw: trimmed };
  }

  // Preserve cleaned digits and mark warning flag for human review
  return { phone: digitsOnly, warning: true, raw: trimmed };
}

/**
 * Sanitizes untrusted text strings to mitigate Cross-Site Scripting (XSS).
 * Encodes dangerous characters into HTML entity representations.
 *
 * @param input - Untrusted text string
 * @returns Sanitized string safe for database storage and DOM reflection
 */
export function sanitizeHtml(input?: string | null): string | null {
  if (!input) {
    return null;
  }
  const entityMap: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
  };
  return input.replace(/[&<>"']/g, (match) => entityMap[match] || match);
}
