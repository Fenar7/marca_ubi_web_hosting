/**
 * @file auth-redirect.ts
 * @description Centralized destination sanitization utility defending against Open Redirect vulnerabilities (CWE-601).
 *              Ensures all redirect destinations remain strictly within the internal administrative routing hierarchy.
 * @module lib/auth-redirect
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

/**
 * Sanitizes a candidate redirect target to guarantee it represents a safe, relative internal path.
 *
 * Security Invariants:
 * 1. Protocol Schemes: Rejects absolute URLs (`https://evil.com`), scheme attacks (`javascript:`, `data:`, `vbscript:`).
 * 2. Protocol-Relative URLs: Rejects double slashes (`//evil.com`) which browsers parse as protocol-relative network roots.
 * 3. Backslash Path Traversal: Rejects backslash escapes (`/\\evil.com`, `\\evil.com`) parsed as network shares by Windows/IE.
 * 4. Control Characters: Rejects newline/carriage return injections designed to trigger HTTP response splitting (CRLF).
 * 5. Relative Boundary: Parses against an internal dummy origin to guarantee that hostname traversal cannot occur.
 *
 * @param {string | null | undefined} targetUrl The raw destination query parameter or route string.
 * @param {string} [defaultFallback='/admin'] Safe fallback path when the target is invalid or untrusted.
 * @returns {string} A normalized, safe relative path preserving query parameters and hash fragments.
 */
export function sanitizeRedirectUrl(targetUrl?: string | null, defaultFallback: string = '/admin'): string {
  if (!targetUrl || typeof targetUrl !== 'string') {
    return defaultFallback;
  }

  const trimmed = targetUrl.trim();

  if (!trimmed) {
    return defaultFallback;
  }

  // Reject CRLF injection vectors
  if (/[\r\n]/.test(trimmed)) {
    return defaultFallback;
  }

  // Must begin with a single forward slash and reject protocol-relative or backslash escape patterns
  if (
    !trimmed.startsWith('/') ||
    trimmed.startsWith('//') ||
    trimmed.startsWith('/\\') ||
    trimmed.startsWith('\\')
  ) {
    return defaultFallback;
  }

  try {
    const dummyOrigin = 'http://localhost';
    const parsed = new URL(trimmed, dummyOrigin);

    // Origin must strictly equal the dummy origin, confirming absence of domain or userinfo components
    if (parsed.origin !== dummyOrigin) {
      return defaultFallback;
    }

    // Reject scheme mutations if present in parsed components
    if (parsed.protocol !== 'http:') {
      return defaultFallback;
    }

    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return defaultFallback;
  }
}
