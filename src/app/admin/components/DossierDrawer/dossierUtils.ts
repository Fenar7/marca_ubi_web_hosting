/**
 * @file dossierUtils.ts
 * @description Pure utility and formatting functions for the Client 360° Dossier Drawer.
 *              Separated from React JSX/SCSS modules to enable high-speed Node.js test execution
 *              without CSS preprocessor bundling requirements.
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

/**
 * Formats numeric currency values into Indian Lakhs (L) and Crores (Cr) with tabular precision.
 * @param value Valuation amount
 */
export function formatDossierCurrency(value: number): string {
  if (!value || isNaN(value) || value <= 0) {
    return '₹0.00';
  }
  if (value >= 10000000) {
    return `₹${(value / 10000000).toFixed(2)} Cr`;
  }
  if (value >= 100000) {
    return `₹${(value / 100000).toFixed(2)} L`;
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Strict RFC 3966 telephone coordinate sanitization.
 * @param phone Raw phone string
 */
export function sanitizeTelUri(phone: string | null): string | null {
  if (!phone) return null;
  const cleaned = phone.replace(/[^\d+]/g, '');
  return cleaned.length >= 7 ? `tel:${cleaned}` : null;
}

/**
 * WhatsApp deep-link generation with prefilled reference text.
 * @param phone Raw phone string
 * @param leadId Human-readable deal ID token
 * @param name Client full name
 */
export function createWhatsAppUri(
  phone: string | null,
  leadId: string,
  name: string
): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  if (!digits || digits.length < 7) return null;
  const encodedText = encodeURIComponent(
    `Hello ${name}, this is regarding your inquiry with Marca Ubi (Ref: ${leadId}).`
  );
  return `https://wa.me/${digits}?text=${encodedText}`;
}

/**
 * Formats snake_case or camelCase object keys into clean human titles.
 * @param key Raw key from brief questionnaire payload
 */
export function formatBriefLabel(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .trim()
    .toUpperCase();
}

/**
 * Formats heterogeneous values into readable string representations.
 * @param value Raw brief answer value
 */
export function formatBriefValue(value: unknown): string {
  if (value === null || value === undefined || value === '') {
    return 'Not Specified';
  }
  if (Array.isArray(value)) {
    return value.map((item) => (typeof item === 'object' ? JSON.stringify(item) : String(item))).join(', ');
  }
  if (typeof value === 'object') {
    return JSON.stringify(value, null, 2);
  }
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }
  return String(value);
}

/**
 * Filters out internal timestamps and non-informative empty keys from brief payloads.
 * @param payload Raw brief payload JSONB
 */
export function extractBriefEntries(
  payload: Record<string, unknown> | null
): [string, unknown][] {
  if (!payload || typeof payload !== 'object') return [];
  return Object.entries(payload).filter(
    ([key, val]) =>
      val !== null &&
      val !== undefined &&
      val !== '' &&
      !['submitted_at', '_timestamp'].includes(key)
  );
}
