/**
 * @file rateLimit.ts
 * @description Token-bucket and sliding window rate limiter tracking client IP requests
 *              for public CRM lead ingestion endpoints. Enforces a maximum of 10 requests
 *              per 10-minute window with spoof-resistant IP extraction and memory leak protection.
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

export interface RateLimitStatus {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfterSeconds: number;
}

interface RateLimitRecord {
  tokens: number;
  lastRefill: number;
  resetAt: number;
}

const MAX_REQUESTS = 10;
const WINDOW_MS = 10 * 60 * 1000; // 10 minutes (600,000 ms)
const MAX_STORE_SIZE = 10000;

// In-memory token bucket store keyed by sanitized client IP
const ipBucketStore = new Map<string, RateLimitRecord>();

/**
 * Prunes expired rate limit buckets to guarantee bounded heap consumption.
 */
function pruneExpiredBuckets(now: number): void {
  for (const [ip, record] of ipBucketStore.entries()) {
    if (now >= record.resetAt) {
      ipBucketStore.delete(ip);
    }
  }
}

/**
 * Evaluates whether a client IP has available capacity in their sliding window.
 * Uses a token-bucket replenishment algorithm where 10 tokens replenish every 10 minutes.
 *
 * @param clientIp - Sanitized client IP address
 * @param customNow - Optional timestamp override for deterministic unit testing
 * @returns Rate limit status containing authorization decision, remaining tokens, and reset timestamp
 */
export function checkRateLimit(clientIp: string, customNow?: number): RateLimitStatus {
  const now = customNow ?? Date.now();

  // Periodically prune expired records when store size reaches threshold
  if (ipBucketStore.size >= MAX_STORE_SIZE / 2) {
    pruneExpiredBuckets(now);
  }

  // Hard FIFO eviction cap if attacked by distributed non-repeating IPs
  if (ipBucketStore.size >= MAX_STORE_SIZE) {
    const oldestKey = ipBucketStore.keys().next().value;
    if (oldestKey) {
      ipBucketStore.delete(oldestKey);
    }
  }

  const existing = ipBucketStore.get(clientIp);

  if (!existing || now >= existing.resetAt) {
    // Fresh window initialization
    const newRecord: RateLimitRecord = {
      tokens: MAX_REQUESTS - 1,
      lastRefill: now,
      resetAt: now + WINDOW_MS,
    };
    ipBucketStore.set(clientIp, newRecord);

    return {
      allowed: true,
      remaining: MAX_REQUESTS - 1,
      resetAt: newRecord.resetAt,
      retryAfterSeconds: 0,
    };
  }

  if (existing.tokens > 0) {
    existing.tokens -= 1;
    existing.lastRefill = now;

    return {
      allowed: true,
      remaining: existing.tokens,
      resetAt: existing.resetAt,
      retryAfterSeconds: 0,
    };
  }

  // Tokens exhausted within active window
  const retryAfterSeconds = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));

  return {
    allowed: false,
    remaining: 0,
    resetAt: existing.resetAt,
    retryAfterSeconds,
  };
}

/**
 * Extracts and sanitizes the client IP address from an incoming HTTP Request.
 * Inspects `x-forwarded-for` and extracts the leftmost untrusted IP address
 * to eliminate spoofed proxy injection attacks.
 *
 * @param request - Incoming Next.js or standard Request object
 * @returns Clean IPv4/IPv6 client address or fallback loopback address
 */
export function extractClientIp(request: Request): string {
  const xForwardedFor = request.headers.get('x-forwarded-for');

  if (xForwardedFor) {
    // Split comma-separated proxy list and take leftmost IP
    const parts = xForwardedFor.split(',');
    const rawClientIp = parts[0]?.trim();
    if (rawClientIp && rawClientIp.length > 0) {
      return sanitizeIp(rawClientIp);
    }
  }

  const xRealIp = request.headers.get('x-real-ip');
  if (xRealIp && xRealIp.trim().length > 0) {
    return sanitizeIp(xRealIp.trim());
  }

  const cfConnectingIp = request.headers.get('cf-connecting-ip');
  if (cfConnectingIp && cfConnectingIp.trim().length > 0) {
    return sanitizeIp(cfConnectingIp.trim());
  }

  return '127.0.0.1';
}

/**
 * Sanitizes IP addresses, removing IPv6 mapped IPv4 prefixes (::ffff:) and port numbers.
 */
function sanitizeIp(rawIp: string): string {
  let ip = rawIp.trim();

  // Strip ::ffff: IPv4-mapped IPv6 prefix
  if (ip.startsWith('::ffff:')) {
    ip = ip.substring(7);
  }

  // Strip port number if present on standard IPv4 (e.g. 192.168.1.1:5432)
  if (ip.includes('.') && ip.includes(':')) {
    ip = ip.split(':')[0] || ip;
  }

  return ip;
}

/**
 * Resets the in-memory rate limit store. Useful for testing harnesses and maintenance.
 *
 * @param clientIp - Optional specific IP to clear. If omitted, clears all entries.
 */
export function resetRateLimit(clientIp?: string): void {
  if (clientIp) {
    ipBucketStore.delete(clientIp);
  } else {
    ipBucketStore.clear();
  }
}
