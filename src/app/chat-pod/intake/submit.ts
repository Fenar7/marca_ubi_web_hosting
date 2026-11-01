/**
 * @file submit.ts
 * @description The network half of intake: one POST to `/api/sales-funnel/ingest` with retries, and a
 *              translation layer from what the route returns to what the pod says.
 *
 *              Reuse of the wizard's endpoint is the whole design. The route already enforces size
 *              and rate ceilings, Zod validation, deduplication against existing leads, and the
 *              internal alert; a pod-specific endpoint would have to re-implement all of it and would
 *              drift the first time one side changed. Nothing here writes to a database.
 *
 *              Retry policy is deliberately narrow. Only a transport failure or a 5xx is retried, with
 *              the same idempotency key. A 400 validation refusal retried is the same refusal three
 *              times, and a 429 retried makes the rate limiter worse for everyone on that IP.
 * @author Fenar Khan <86710532+Fenar7@users.noreply.github.com>
 */

import { NOTES_MAX_CHARS } from "@/app/lib/intake/ingestPayload";
import type { IngestPayload } from "@/app/lib/intake/ingestPayload";
import type { SlotId } from "../types";

/** Transport-level retries inside a single submission round. The wizard uses the same count. */
export const MAX_NETWORK_ATTEMPTS = 3;

export interface SubmitOutcome {
  ok: boolean;
  status: number;
  /** Copy the pod prints. Already in the studio's voice; the panel renders it without editing. */
  message: string;
  /** Set when the route named a field, so the FSM can jump back to that one question. */
  slot?: SlotId;
  /** True when retrying could plausibly help (transport failure or 5xx). */
  retryable: boolean;
  /** From the route's `Retry-After` header on a 429, when it sent one. */
  retryAfterSeconds?: number;
}

/**
 * Route field name to pod slot. The payload keys are the CRM's, not the visitor's, so a 400 on
 * `company_website` has to land the visitor back on the website question.
 */
const FIELD_TO_SLOT: Record<string, SlotId> = {
  name: "name",
  email: "email",
  phone: "phone",
  company: "projectName",
  company_website: "website",
  industry: "industry",
  notes: "extraNotes",
  budget_bracket: "timeline",
  service_category: "categories",
};

type Wait = (ms: number) => Promise<void>;

const defaultWait: Wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * The route returns the first problem it finds as a `details` map of field to messages. The pod can
 * only re-ask one question at a time, so the first recognised field wins and its message is read
 * aloud; an unrecognised field still produces a specific sentence rather than a generic failure.
 */
function fromValidation(details: unknown): { message: string; slot?: SlotId } {
  if (!details || typeof details !== "object") {
    return { message: "Our system refused the brief. Check the answers and send it again." };
  }
  const entries = Object.entries(details as Record<string, unknown>);
  const first = entries.find(([, messages]) => Array.isArray(messages) && messages.length > 0);
  const field = first?.[0];
  const detail = first && Array.isArray(first[1]) ? String(first[1][0] ?? "") : "";

  const slot = field ? FIELD_TO_SLOT[field] : undefined;
  if (field === "notes") {
    return { message: `That was longer than the ${NOTES_MAX_CHARS} characters we can carry. Can you shorten it?`, slot };
  }
  if (detail.length > 0) return { message: detail, slot };
  return { message: "Our system refused the brief. Check the answers and send it again." };
}

function createIdempotencyKey(): string {
  return typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `pod-${Date.now()}`;
}

export interface SubmitOptions {
  /** Reused across every attempt of every round. Mint it once with `createIdempotencyKey`. */
  idempotencyKey: string;
  wait?: Wait;
  signal?: AbortSignal;
}

/** `Retry-After` arrives as a delta-seconds string; anything unparseable is treated as unknown. */
function parseRetryAfter(header: string | null): number | undefined {
  if (!header) return undefined;
  const seconds = Number.parseInt(header, 10);
  return Number.isFinite(seconds) && seconds > 0 ? seconds : undefined;
}

/**
 * Sends the brief. Returns the outcome rather than throwing, because every failure here has a copy
 * attached to it and the panel's job is to say that copy, not to catch an exception.
 */
export async function submitBrief(payload: IngestPayload, options: SubmitOptions): Promise<SubmitOutcome> {
  const wait = options.wait ?? defaultWait;
  let lastStatus = 0;
  let lastMessage = "We could not reach the studio. Check your connection and try again.";

  for (let attempt = 1; attempt <= MAX_NETWORK_ATTEMPTS; attempt += 1) {
    if (options.signal?.aborted) {
      return { ok: false, status: 0, message: "Stopped. Nothing was sent.", retryable: true };
    }

    try {
      const response = await fetch("/api/sales-funnel/ingest", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Idempotency-Key": options.idempotencyKey,
        },
        body: JSON.stringify(payload),
        signal: options.signal,
      });

      if (response.ok) return { ok: true, status: response.status, message: "", retryable: false };

      lastStatus = response.status;
      const body: unknown = await response.json().catch(() => ({}));
      const record = (body ?? {}) as { error?: unknown; details?: unknown };

      if (lastStatus === 400 || lastStatus === 422) {
        const mapped = fromValidation(record.details ?? null);
        if (!mapped.slot && typeof record.error === "string") {
          return { ok: false, status: lastStatus, message: record.error, retryable: false };
        }
        return { ok: false, status: 422, message: mapped.message, slot: mapped.slot, retryable: false };
      }

      if (lastStatus === 429) {
        // No copy here on purpose. The honest sentence names the studio's phone and email, and this
        // module does not hold the knowledge base. The panel builds that line from `kb.studio` when it
        // sees a 429, and keeps the draft.
        return {
          ok: false,
          status: 429,
          message: "",
          retryable: false,
          retryAfterSeconds: parseRetryAfter(response.headers.get("Retry-After")),
        };
      }

      if (lastStatus === 413) {
        // The route's ceiling is 64KB and a brief is a few kilobytes, so reaching this line means the
        // payload is not what this module built. Loud on purpose: a silent fallback here would hide a
        // broken builder behind a message telling the visitor to shorten their notes.
        console.error("[chat-pod] ingest rejected the payload as too large:", lastStatus);
        return {
          ok: false,
          status: 413,
          message: "That brief came out larger than our system can carry. Use the full form instead.",
          retryable: false,
        };
      }

      lastMessage =
        lastStatus >= 500
          ? "The studio's service did not answer. I will keep your answers and you can send it again."
          : `Our system responded with status ${lastStatus}. Nothing was recorded twice.`;
    } catch (error) {
      if (options.signal?.aborted) {
        return { ok: false, status: 0, message: "Stopped. Nothing was sent.", retryable: true };
      }
      // A rejected `fetch` carries no status, and its message is a browser string the visitor cannot
      // act on. The cause is logged; the copy stays about what they can do next.
      console.warn("[chat-pod] ingest request failed:", error);
      lastStatus = 0;
      lastMessage = "We could not reach the studio. Check your connection and try again.";
    }

    if (attempt < MAX_NETWORK_ATTEMPTS) await wait(attempt * 1000);
  }

  return { ok: false, status: lastStatus, message: lastMessage, retryable: true };
}

export { createIdempotencyKey };
