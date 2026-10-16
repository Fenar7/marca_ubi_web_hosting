/**
 * @file auth-rate-limit.ts
 * @description In-memory defense-in-depth progressive rate limiter for administrative authentication.
 *              Enforces progressive latency throttling, credential-stuffing defense, and temporary account lockout.
 * @module lib/auth-rate-limit
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 * @see Master PRD Section 7.4.3 (Progressive Brute-Force Lockout Engine)
 */

export interface RateLimitEntry {
  attempts: number;
  firstAttemptAt: number;
  lastAttemptAt: number;
  lockoutUntil: number | null;
}

export interface RateLimitCheckResult {
  allowed: boolean;
  attempts: number;
  delayMs: number;
  isLocked: boolean;
  remainingLockoutSeconds: number;
}

export interface RateLimitRecordResult {
  attempts: number;
  delayMs: number;
  isLocked: boolean;
  remainingLockoutSeconds: number;
}

/** Threshold of failed attempts triggering temporary lockout (Attempt 6+ per PRD Section 7.4.3) */
export const MAX_FAILED_ATTEMPTS = 5;
export const LOCKOUT_TRIGGER_ATTEMPTS = 6;

/** Lockout cooldown duration in milliseconds (15 minutes per PRD Section 7.4.3 & Sprint 2.2) */
export const LOCKOUT_DURATION_MS = 15 * 60 * 1000;

/** Lower bound attempt index where artificial latency is injected (Attempt 4 per PRD Section 7.4.3) */
export const THROTTLE_MIN_ATTEMPTS = 4;

/** Upper bound attempt index where artificial latency is injected (Attempt 5 per PRD Section 7.4.3) */
export const THROTTLE_MAX_ATTEMPTS = 5;

/** Artificial latency duration injected on attempts 4 and 5 (1,500ms per PRD Section 7.4.3) */
export const THROTTLE_DELAY_MS = 1500;

/** In-memory store indexing rate limit records by normalized client identifier */
const rateLimitStore = new Map<string, RateLimitEntry>();

/** Maximum number of tracked keys to prevent heap exhaustion under distributed attacks */
const MAX_STORE_SIZE = 10000;

/**
 * Prunes expired lockout entries to prevent memory leaks.
 */
function pruneExpiredEntries(): void {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.lockoutUntil !== null && now > entry.lockoutUntil) {
      rateLimitStore.delete(key);
    } else if (entry.lockoutUntil === null && now - entry.lastAttemptAt > LOCKOUT_DURATION_MS) {
      rateLimitStore.delete(key);
    }
  }
}

/**
 * Normalizes an authentication rate limit key (e.g. IP + lowercase email).
 *
 * @param {string} identifier Raw IP address, email, or composite identifier.
 * @returns {string} Sanitized lookup key.
 */
export function normalizeRateLimitKey(identifier: string): string {
  return identifier.trim().toLowerCase();
}

/**
 * Calculates whether artificial latency throttling applies based on attempts count.
 * Per PRD Section 7.4.3: Attempts 1-3 have 0 delay; Attempts 4-5 have 1,500ms delay.
 */
function calculateThrottleDelay(attempts: number): number {
  if (attempts >= THROTTLE_MIN_ATTEMPTS && attempts <= THROTTLE_MAX_ATTEMPTS) {
    return THROTTLE_DELAY_MS;
  }
  return 0;
}

/**
 * Inspects whether an identifier is permitted to attempt authentication.
 *
 * Evaluation Rules (PRD Section 7.4.3):
 * 1. Attempts 1–3: Standard error response; delayMs: 0.
 * 2. Attempts 4–5: Enforced artificial latency of 1,500ms injected into response pipeline.
 * 3. Attempt 6+: Temporary account lockout triggered; allowed: false, 15-minute cooldown.
 *
 * @param {string} rawIdentifier IP address or email identity.
 * @returns {RateLimitCheckResult} Current enforcement status.
 */
export function checkRateLimit(rawIdentifier: string): RateLimitCheckResult {
  const key = normalizeRateLimitKey(rawIdentifier);
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry) {
    return {
      allowed: true,
      attempts: 0,
      delayMs: 0,
      isLocked: false,
      remainingLockoutSeconds: 0,
    };
  }

  // Active lockout evaluation
  if (entry.lockoutUntil !== null) {
    if (now < entry.lockoutUntil) {
      const remainingSeconds = Math.ceil((entry.lockoutUntil - now) / 1000);
      return {
        allowed: false,
        attempts: entry.attempts,
        delayMs: 0,
        isLocked: true,
        remainingLockoutSeconds: remainingSeconds,
      };
    }

    // Cooldown elapsed; clear stale entry
    rateLimitStore.delete(key);
    return {
      allowed: true,
      attempts: 0,
      delayMs: 0,
      isLocked: false,
      remainingLockoutSeconds: 0,
    };
  }

  const delayMs = calculateThrottleDelay(entry.attempts);

  return {
    allowed: true,
    attempts: entry.attempts,
    delayMs,
    isLocked: false,
    remainingLockoutSeconds: 0,
  };
}

/**
 * Records a failed authentication attempt, escalating lockout status if threshold is breached.
 *
 * @param {string} rawIdentifier IP address or email identity.
 * @returns {RateLimitRecordResult} Updated rate limit state post-increment.
 */
export function recordFailedAttempt(rawIdentifier: string): RateLimitRecordResult {
  if (rateLimitStore.size >= MAX_STORE_SIZE) {
    pruneExpiredEntries();
  }

  const key = normalizeRateLimitKey(rawIdentifier);
  const now = Date.now();
  let entry = rateLimitStore.get(key);

  if (!entry) {
    entry = {
      attempts: 1,
      firstAttemptAt: now,
      lastAttemptAt: now,
      lockoutUntil: null,
    };
  } else {
    // If previous lockout expired, reset attempts count
    if (entry.lockoutUntil !== null && now > entry.lockoutUntil) {
      entry.attempts = 1;
      entry.firstAttemptAt = now;
      entry.lockoutUntil = null;
    } else {
      entry.attempts += 1;
    }
    entry.lastAttemptAt = now;
  }

  // Check if threshold reached for temporary lockout (Attempt 6+)
  if (entry.attempts >= LOCKOUT_TRIGGER_ATTEMPTS) {
    entry.lockoutUntil = now + LOCKOUT_DURATION_MS;
    rateLimitStore.set(key, entry);

    return {
      attempts: entry.attempts,
      delayMs: 0,
      isLocked: true,
      remainingLockoutSeconds: Math.ceil(LOCKOUT_DURATION_MS / 1000),
    };
  }

  rateLimitStore.set(key, entry);
  const delayMs = calculateThrottleDelay(entry.attempts);

  return {
    attempts: entry.attempts,
    delayMs,
    isLocked: false,
    remainingLockoutSeconds: 0,
  };
}

/**
 * Resets the rate limit counter upon successful cryptographic authentication.
 *
 * @param {string} rawIdentifier IP address or email identity.
 */
export function resetRateLimit(rawIdentifier: string): void {
  const key = normalizeRateLimitKey(rawIdentifier);
  rateLimitStore.delete(key);
}

/**
 * Clears the entire rate limit store. Exclusively intended for automated test harnesses.
 */
export function clearAllRateLimits(): void {
  rateLimitStore.clear();
}
