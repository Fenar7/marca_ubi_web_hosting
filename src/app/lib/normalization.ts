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
  if (trimmed.length === 0) {
    return null;
  }

  // RFC 5322 & IDN Punycode domain normalization
  const atIndex = trimmed.lastIndexOf('@');
  if (atIndex > 0 && atIndex < trimmed.length - 1) {
    const localPart = trimmed.substring(0, atIndex);
    const domainPart = trimmed.substring(atIndex + 1);
    try {
      // URL constructor parses international domains into ASCII Punycode (e.g. münchen -> xn--mnchen-agency-wob)
      const asciiDomain = new URL(`http://${domainPart}`).hostname;
      return `${localPart}@${asciiDomain}`;
    } catch {
      return trimmed;
    }
  }

  return trimmed;
}

/**
 * Normalizes international telephone numbers into canonical ITU-T E.164 format.
 * Intelligently recognizes domestic dialing patterns across core agency commercial markets:
 * - United Arab Emirates (+971): 9 digits with prefix `05x`, `04`, `02`, etc.
 * - Saudi Arabia (+966): 9 digits with mobile prefix `05x` (050, 051, 053-059).
 * - India (+91): 10 digits starting with 6, 7, 8, or 9 (with or without trunk prefix `0`).
 * - United Kingdom (+44): 10 digits with mobile prefix `07`.
 * - North America (+1): 10 digits (with or without country code `1`).
 *
 * @param rawPhone - Raw phone string submitted by user
 * @param countryHint - Optional ISO 3166-1 alpha-2 market hint ('AE', 'SA', 'IN', 'US', 'GB')
 * @returns Structured normalization outcome with E.164 phone string and anomaly warning flag
 */
export function normalizePhone(
  rawPhone?: string | null,
  countryHint?: 'AE' | 'SA' | 'IN' | 'US' | 'GB' | string | null
): PhoneNormalizationResult {
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

  // 1. Direct E.164 or international prefix handling (+...)
  if (hasLeadingPlus) {
    // E.164 standard allows 7 to 15 digits
    if (digitsOnly.length >= 7 && digitsOnly.length <= 15) {
      return { phone: `+${digitsOnly}`, warning: false, raw: trimmed };
    }
    return { phone: `+${digitsOnly}`, warning: true, raw: trimmed };
  }

  // 2. Double-zero international prefix (00971..., 00966..., 0091..., 0044..., etc.)
  if (digitsOnly.startsWith('00') && digitsOnly.length >= 9) {
    const withoutZeroZero = digitsOnly.substring(2);
    if (withoutZeroZero.length >= 7 && withoutZeroZero.length <= 15) {
      return { phone: `+${withoutZeroZero}`, warning: false, raw: trimmed };
    }
  }

  // 3. Full international numbers provided without leading plus
  if (digitsOnly.startsWith('971') && digitsOnly.length === 12) {
    return { phone: `+${digitsOnly}`, warning: false, raw: trimmed };
  }
  if (digitsOnly.startsWith('966') && digitsOnly.length === 12) {
    return { phone: `+${digitsOnly}`, warning: false, raw: trimmed };
  }
  if (digitsOnly.startsWith('44') && digitsOnly.length === 12) {
    return { phone: `+${digitsOnly}`, warning: false, raw: trimmed };
  }
  if (digitsOnly.startsWith('91') && digitsOnly.length === 12) {
    return { phone: `+${digitsOnly}`, warning: false, raw: trimmed };
  }
  if (digitsOnly.startsWith('1') && digitsOnly.length === 11) {
    return { phone: `+${digitsOnly}`, warning: false, raw: trimmed };
  }

  // 4. North American Numbering Plan (NANP / US / Canada +1)
  // Check for domestic US format with standard punctuation: (xxx) xxx-xxxx, xxx-xxx-xxxx, or countryHint = 'US'
  const isNanpFormatted = /^\([2-9]\d{2}\)\s*[2-9]\d{2}[- ]\d{4}$|^[2-9]\d{2}[-. ][2-9]\d{2}[-. ]\d{4}$/.test(trimmed);
  if (isNanpFormatted && digitsOnly.length === 10) {
    return { phone: `+1${digitsOnly}`, warning: false, raw: trimmed };
  }
  if (countryHint?.toUpperCase() === 'US' && digitsOnly.length === 10) {
    return { phone: `+1${digitsOnly}`, warning: false, raw: trimmed };
  }

  // 5. Saudi Arabia (+966) Normalization
  // STC/Mobily/Zain KSA mobile codes: 050, 051, 053, 054, 055, 056, 057, 058, 059
  // Note: 051, 057, and 059 are exclusively Saudi Arabia (UAE does not issue 051, 057, 059).
  const isKsaExclusivePrefix = /^05[179]/.test(digitsOnly);
  if (countryHint?.toUpperCase() === 'SA' || isKsaExclusivePrefix) {
    if (digitsOnly.startsWith('05') && digitsOnly.length === 10) {
      const local = digitsOnly.substring(1);
      return { phone: `+966${local}`, warning: false, raw: trimmed };
    }
    if (digitsOnly.startsWith('5') && digitsOnly.length === 9) {
      return { phone: `+966${digitsOnly}`, warning: false, raw: trimmed };
    }
  }

  // 6. United Arab Emirates (UAE +971) Normalization
  // Domestic UAE mobile (050, 052, 054, 055, 056, 058) or landline (02, 03, 04, 06, 07, 09)
  if (digitsOnly.startsWith('05') && digitsOnly.length === 10) {
    const local = digitsOnly.substring(1);
    return { phone: `+971${local}`, warning: false, raw: trimmed };
  }
  if (digitsOnly.startsWith('0') && digitsOnly.length === 9) {
    const local = digitsOnly.substring(1);
    return { phone: `+971${local}`, warning: false, raw: trimmed };
  }
  if (digitsOnly.startsWith('5') && digitsOnly.length === 9) {
    return { phone: `+971${digitsOnly}`, warning: false, raw: trimmed };
  }

  // 7. United Kingdom (+44) Normalization
  if (digitsOnly.startsWith('07') && digitsOnly.length === 11) {
    const local = digitsOnly.substring(1);
    return { phone: `+44${local}`, warning: false, raw: trimmed };
  }

  // 8. India (+91) Normalization
  // Domestic 11 digits with leading trunk 0 (e.g. 09847012345)
  if (digitsOnly.startsWith('0') && digitsOnly.length === 11) {
    const local = digitsOnly.substring(1);
    if (/^[6-9]/.test(local)) {
      return { phone: `+91${local}`, warning: false, raw: trimmed };
    }
  }
  // Standard 10-digit Indian mobile starting with 6, 7, 8, 9 (if not matched by NANP)
  if (digitsOnly.length === 10 && /^[6-9]/.test(digitsOnly) && !isNanpFormatted) {
    // If countryHint is explicitly US, prioritize US
    if (countryHint?.toUpperCase() === 'US') {
      return { phone: `+1${digitsOnly}`, warning: false, raw: trimmed };
    }
    return { phone: `+91${digitsOnly}`, warning: false, raw: trimmed };
  }

  // 9. Standard 10 digits fallback (US/NANP)
  if (digitsOnly.length === 10) {
    return { phone: `+1${digitsOnly}`, warning: false, raw: trimmed };
  }

  // 10. Fallback for unclassified numbers with standard E.164 length
  if (digitsOnly.length >= 7 && digitsOnly.length <= 15) {
    return { phone: `+${digitsOnly}`, warning: false, raw: trimmed };
  }

  // Preserve cleaned digits and mark warning flag for manual review
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
