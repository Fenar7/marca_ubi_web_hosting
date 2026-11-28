/**
 * @file phone-countries.ts
 * @description Canonical international country dial-code catalog and E.164 composition/parsing
 *              utilities for the Marca Ubi CRM and public intake forms. Ensures pasted E.164
 *              numbers auto-detect the matching country code without double-prefixing and
 *              empty national inputs never emit stray dial-code prefixes.
 * @module lib/phone-countries
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

export interface PhoneCountry {
  /** ISO 3166-1 alpha-2 country code. */
  iso: string;
  /** Human-readable country or region name. */
  name: string;
  /** ITU-T E.164 country calling code with leading `+`. */
  dialCode: string;
  /** National format placeholder shown next to the selected code. */
  example: string;
  /** Whether a single leading domestic trunk `0` should be stripped when composing E.164. */
  stripTrunkZero?: boolean;
}

/**
 * Curated global calling code catalog ordered with core agency commercial markets
 * first, followed alphabetically by key international regions.
 */
export const PHONE_COUNTRIES: readonly PhoneCountry[] = [
  { iso: 'AE', name: 'United Arab Emirates', dialCode: '+971', example: '50 123 4567' },
  { iso: 'IN', name: 'India', dialCode: '+91', example: '98765 43210' },
  { iso: 'SA', name: 'Saudi Arabia', dialCode: '+966', example: '50 123 4567' },
  { iso: 'US', name: 'United States', dialCode: '+1', example: '(415) 555-0199' },
  { iso: 'GB', name: 'United Kingdom', dialCode: '+44', example: '7700 900077' },
  { iso: 'SG', name: 'Singapore', dialCode: '+65', example: '8123 4567' },
  { iso: 'QA', name: 'Qatar', dialCode: '+974', example: '5512 3456' },
  { iso: 'KW', name: 'Kuwait', dialCode: '+965', example: '5001 2345' },
  { iso: 'BH', name: 'Bahrain', dialCode: '+973', example: '3600 1234' },
  { iso: 'OM', name: 'Oman', dialCode: '+968', example: '9212 3456' },
  { iso: 'AU', name: 'Australia', dialCode: '+61', example: '412 345 678' },
  { iso: 'AT', name: 'Austria', dialCode: '+43', example: '664 1234567' },
  { iso: 'BE', name: 'Belgium', dialCode: '+32', example: '470 12 34 56' },
  { iso: 'BR', name: 'Brazil', dialCode: '+55', example: '11 91234 5678' },
  { iso: 'CA', name: 'Canada', dialCode: '+1', example: '(416) 555-0199' },
  { iso: 'CN', name: 'China', dialCode: '+86', example: '138 0013 8000' },
  { iso: 'DK', name: 'Denmark', dialCode: '+45', example: '20 12 34 56' },
  { iso: 'EG', name: 'Egypt', dialCode: '+20', example: '100 123 4567' },
  { iso: 'FR', name: 'France', dialCode: '+33', example: '6 12 34 56 78' },
  { iso: 'DE', name: 'Germany', dialCode: '+49', example: '151 23456789' },
  { iso: 'HK', name: 'Hong Kong', dialCode: '+852', example: '9123 4567' },
  { iso: 'ID', name: 'Indonesia', dialCode: '+62', example: '812 3456 789' },
  { iso: 'IE', name: 'Ireland', dialCode: '+353', example: '87 123 4567' },
  { iso: 'IL', name: 'Israel', dialCode: '+972', example: '50 123 4567' },
  { iso: 'IT', name: 'Italy', dialCode: '+39', example: '312 345 6789', stripTrunkZero: false },
  { iso: 'JP', name: 'Japan', dialCode: '+81', example: '90 1234 5678' },
  { iso: 'JO', name: 'Jordan', dialCode: '+962', example: '79 123 4567' },
  { iso: 'KE', name: 'Kenya', dialCode: '+254', example: '712 345678' },
  { iso: 'LB', name: 'Lebanon', dialCode: '+961', example: '71 123 456' },
  { iso: 'MY', name: 'Malaysia', dialCode: '+60', example: '12 345 6789' },
  { iso: 'MX', name: 'Mexico', dialCode: '+52', example: '55 1234 5678' },
  { iso: 'NL', name: 'Netherlands', dialCode: '+31', example: '6 12345678' },
  { iso: 'NZ', name: 'New Zealand', dialCode: '+64', example: '21 123 4567' },
  { iso: 'NG', name: 'Nigeria', dialCode: '+234', example: '802 123 4567' },
  { iso: 'NO', name: 'Norway', dialCode: '+47', example: '412 34 567' },
  { iso: 'PK', name: 'Pakistan', dialCode: '+92', example: '300 1234567' },
  { iso: 'PH', name: 'Philippines', dialCode: '+63', example: '917 123 4567' },
  { iso: 'PL', name: 'Poland', dialCode: '+48', example: '501 234 567' },
  { iso: 'PT', name: 'Portugal', dialCode: '+351', example: '912 345 678' },
  { iso: 'ZA', name: 'South Africa', dialCode: '+27', example: '82 123 4567' },
  { iso: 'KR', name: 'South Korea', dialCode: '+82', example: '10 1234 5678' },
  { iso: 'ES', name: 'Spain', dialCode: '+34', example: '612 34 56 78' },
  { iso: 'SE', name: 'Sweden', dialCode: '+46', example: '70 123 45 67' },
  { iso: 'CH', name: 'Switzerland', dialCode: '+41', example: '79 123 45 67' },
  { iso: 'TH', name: 'Thailand', dialCode: '+66', example: '81 234 5678' },
  { iso: 'TR', name: 'Turkey', dialCode: '+90', example: '532 123 45 67' },
  { iso: 'VN', name: 'Vietnam', dialCode: '+84', example: '91 234 56 78' },
] as const;

const COUNTRY_BY_ISO = new Map<string, PhoneCountry>(
  PHONE_COUNTRIES.map((country) => [country.iso, country])
);

/**
 * Dial codes sorted descending by digit length so `+971` and `+852` match
 * before shorter shared prefixes such as `+1` or `+8`. Preserves catalog
 * order within equal length (so `US` resolves before `CA` for `+1`).
 */
const COUNTRIES_BY_DIAL_DESC = [...PHONE_COUNTRIES].sort(
  (a, b) => b.dialCode.length - a.dialCode.length
);

/**
 * Resolves a country descriptor by ISO code, safely falling back to UAE (+971).
 */
export function getPhoneCountryByIso(iso?: string): PhoneCountry {
  if (iso) {
    const found = COUNTRY_BY_ISO.get(iso.toUpperCase());
    if (found) return found;
  }
  return PHONE_COUNTRIES[0];
}

/**
 * Matches a leading international dial code (`+...` or `00...`) against the catalog.
 * Returns the matched country and the remaining local portion, or `null` when
 * the text is not yet unambiguously formatted as a full international prefix.
 */
export function detectCountryFromInternationalInput(
  rawInput: string
): { country: PhoneCountry; nationalNumber: string } | null {
  const trimmed = rawInput.trim();
  let candidateDigits = '';
  let remainderSource = '';

  if (trimmed.startsWith('+')) {
    remainderSource = trimmed.slice(1).trimStart();
    candidateDigits = remainderSource.replace(/\D/g, '');
  } else if (trimmed.startsWith('00')) {
    remainderSource = trimmed.slice(2).trimStart();
    candidateDigits = remainderSource.replace(/\D/g, '');
  } else {
    return null;
  }

  if (candidateDigits.length === 0) {
    return null;
  }

  for (const country of COUNTRIES_BY_DIAL_DESC) {
    const codeDigits = country.dialCode.slice(1);
    if (!candidateDigits.startsWith(codeDigits)) continue;

    // Require either a separator after the dial code (e.g. "+91 98...") or enough
    // national digits following it so partially typed prefixes don't jump early.
    const restAfterDigits = candidateDigits.slice(codeDigits.length);
    const hasExplicitSeparator =
      remainderSource.startsWith(codeDigits) &&
      /^[\s\-()]/.test(remainderSource.slice(codeDigits.length));

    if (!hasExplicitSeparator && restAfterDigits.length < 6) {
      return null;
    }

    // Strip the matched dial code plus immediate punctuation from the visible local value.
    const dialPattern = new RegExp(
      `^(?:\\+|00)\\s*${codeDigits}[\\s\\-()]*`
    );
    const nationalNumber = trimmed.replace(dialPattern, '').trimStart();
    return { country, nationalNumber };
  }

  return null;
}

/**
 * Splits a persisted or full phone string into `{ countryIso, nationalNumber }`
 * so edit dialogs initialize the selector cleanly without losing formatting.
 */
export function splitPhoneValue(
  rawPhone?: string | null,
  defaultIso = 'AE'
): { countryIso: string; nationalNumber: string } {
  const fallbackIso = getPhoneCountryByIso(defaultIso).iso;
  if (!rawPhone || rawPhone.trim().length === 0) {
    return { countryIso: fallbackIso, nationalNumber: '' };
  }

  const trimmed = rawPhone.trim();
  const detected = detectCountryFromInternationalInput(trimmed);
  if (detected) {
    return {
      countryIso: detected.country.iso,
      nationalNumber: detected.nationalNumber,
    };
  }

  // Handle stored E.164 values even when they have short test fixtures (e.g. +91 98...)
  if (trimmed.startsWith('+')) {
    const rawDigits = trimmed.slice(1).replace(/\D/g, '');
    for (const country of COUNTRIES_BY_DIAL_DESC) {
      const codeDigits = country.dialCode.slice(1);
      if (rawDigits.startsWith(codeDigits)) {
        const dialPattern = new RegExp(`^\\+\\s*${codeDigits}[\\s\\-()]*`);
        return {
          countryIso: country.iso,
          nationalNumber: trimmed.replace(dialPattern, '').trimStart(),
        };
      }
    }
    return { countryIso: fallbackIso, nationalNumber: trimmed };
  }

  // Handle legacy unprefixed full numbers for primary markets matching `normalization.ts`
  const digits = trimmed.replace(/\D/g, '');
  const legacyPrefixRules: Array<{ prefix: string; totalLen: number; iso: string }> = [
    { prefix: '971', totalLen: 12, iso: 'AE' },
    { prefix: '966', totalLen: 12, iso: 'SA' },
    { prefix: '91', totalLen: 12, iso: 'IN' },
    { prefix: '44', totalLen: 12, iso: 'GB' },
  ];
  for (const rule of legacyPrefixRules) {
    if (digits.startsWith(rule.prefix) && digits.length === rule.totalLen) {
      const localDigits = digits.slice(rule.prefix.length);
      return { countryIso: rule.iso, nationalNumber: localDigits };
    }
  }

  return { countryIso: fallbackIso, nationalNumber: trimmed };
}

/**
 * Composes an international phone value from a selected country ISO and local input.
 * Returns `''` when the national box contains no digits so optional fields and dirty
 * checks never emit bare dial codes like `"+971"`.
 */
export function composePhoneValue(countryIso: string, rawLocalInput: string): string {
  const trimmed = rawLocalInput.trim();
  const anyDigits = trimmed.replace(/\D/g, '');
  if (anyDigits.length === 0) {
    return '';
  }

  // If the caller typed/pasted an explicit international prefix that wasn't auto-split
  // yet, never double-prefix `+971 +91 ...`.
  if (trimmed.startsWith('+')) {
    return trimmed;
  }

  const country = getPhoneCountryByIso(countryIso);
  let normalizedLocal = trimmed;

  // Strip a single domestic trunk `0` (e.g. UAE `050 123 4567` -> `+971 50 123 4567`)
  // so E.164 normalization produces `+971501234567` rather than `+9710501234567`.
  if (country.stripTrunkZero !== false && normalizedLocal.startsWith('0') && !normalizedLocal.startsWith('00')) {
    normalizedLocal = normalizedLocal.slice(1).trimStart();
  }

  if (normalizedLocal.replace(/\D/g, '').length === 0) {
    return '';
  }

  return `${country.dialCode} ${normalizedLocal}`;
}
