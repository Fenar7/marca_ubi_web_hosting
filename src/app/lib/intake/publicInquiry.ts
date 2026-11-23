import { randomUUID } from "node:crypto";
import { after } from "next/server";
import { z } from "zod";
import { dispatchStudioLeadAlert } from "@/app/lib/notifications";
import { sanitizeHtml } from "@/app/lib/normalization";
import { getAdminClient } from "@/app/lib/supabase/admin";

const actionSchema = z.enum([
  "NEW_LEAD",
  "MERGE_INQUIRY",
  "REACTIVATE_LEAD",
  "CREATE_NEW_REENGAGEMENT",
  "NEEDS_REVIEW",
]);

const receiptSchema = z.object({
  id: z.string().uuid(),
  inquiry_ref: z.string().min(1),
  lead_id: z.string().uuid().nullable(),
  lead_ref: z.string().nullable(),
  outcome: z.enum(["created", "linked", "needs_review"]),
  replayed: z.boolean(),
  action: actionSchema,
});

export type PublicInquiryOrigin =
  | "contact"
  | "start_project"
  | "chat_pod"
  | "website";

interface PublicInquiryInput {
  origin: PublicInquiryOrigin;
  idempotency_key: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  company_website?: string | null;
  industry?: string | null;
  preferred_channel: string;
  service_category: string;
  budget_bracket: string | null;
  expected_value: number;
  summary: string;
  source_detail: string;
  brief: Record<string, string | string[]>;
}

const publicInquirySources = {
  contact: "Contact Page",
  start_project: "Start Project",
  chat_pod: "Chat Pod",
  website: "Website Form",
} as const;

// Keep the projected brief under the database's 32 KiB JSONB bound, including JSONB's separator spaces.
const MAX_BRIEF_BYTES = 30 * 1024;

export class PublicInquiryError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

/** Correlation keys are bounded opaque client tokens. Legacy callers without a key get a new intent. */
export function publicInquiryKey(value: string | null): string {
  if (value === null) return randomUUID();
  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{7,127}$/.test(value)) {
    throw new PublicInquiryError(400, "Invalid inquiry request identifier.");
  }
  return value;
}

/** The shared browser endpoint accepts only documented surface markers. These are attribution hints. */
export function resolvePublicOrigin(
  source: string,
  detail: string | null,
): {
  origin: PublicInquiryOrigin;
  detail: string;
} {
  if (
    source === "Chat Pod" &&
    (detail === "Conversational intake (chat pod)" ||
      detail === "Service enquiry and optional deliverables (chat pod v2)")
  ) {
    return { origin: "chat_pod", detail };
  }
  if (
    source === "Website Form" &&
    detail === "Start Project Brief Wizard (Multi-Service)"
  ) {
    return { origin: "start_project", detail };
  }
  if (
    source === "Modal Company Profile" &&
    detail === "Hero Company Profile Download Modal"
  ) {
    return { origin: "website", detail };
  }
  return { origin: "website", detail: "Website Form" };
}

const briefFields = [
  "category",
  "service",
  "services",
  "categories",
  "language",
  "projectName",
  "projectDescription",
  "industry",
  "website",
  "agencyStatus",
  "referral",
  "timeline",
  "inspirationLinks",
  "showcasePermission",
  "extraNotes",
  "instagram",
  "combinedNotes",
  "businessType",
  "instagramId",
  "message",
] as const;

/** Preserve known brief answers and drop caller-supplied metadata such as actor, flags and IP. */
export function collectPublicBrief(
  payload: Record<string, unknown>,
  origin: PublicInquiryOrigin,
): PublicInquiryInput["brief"] {
  const result: PublicInquiryInput["brief"] = {};
  for (const key of briefFields) {
    const value = payload[key];
    if (typeof value === "string") {
      const sanitized = sanitizeHtml(
        value.replaceAll("\0", "").trim().slice(0, 8000),
      );
      if (sanitized) result[key] = sanitized;
    } else if (
      (key === "services" || key === "categories") &&
      Array.isArray(value)
    ) {
      result[key] = value
        .filter((item): item is string => typeof item === "string")
        .slice(0, 40)
        .flatMap(
          (item) =>
            sanitizeHtml(item.replaceAll("\0", "").trim().slice(0, 200)) ?? [],
        );
    }
  }
  const chat = payload.chatPod;
  if (
    origin === "chat_pod" &&
    chat &&
    typeof chat === "object" &&
    "version" in chat &&
    chat.version === 2 &&
    "serviceInterests" in chat &&
    Array.isArray(chat.serviceInterests)
  ) {
    const labels = chat.serviceInterests
      .slice(0, 40)
      .flatMap((interest: unknown) => {
        if (
          !interest ||
          typeof interest !== "object" ||
          !("label" in interest) ||
          typeof interest.label !== "string"
        )
          return [];
        return (
          sanitizeHtml(
            interest.label.replaceAll("\0", "").trim().slice(0, 200),
          ) ?? []
        );
      });
    if (labels.length) result.serviceInterests = labels;
  }
  if (Buffer.byteLength(JSON.stringify(result), "utf8") > MAX_BRIEF_BYTES) {
    throw new PublicInquiryError(
      413,
      "Please shorten your inquiry brief and try again.",
    );
  }
  return result;
}

/** An acknowledgement requires a committed RPC result. Only new events schedule a studio alert. */
export async function persistPublicInquiry(input: PublicInquiryInput) {
  const { data, error } = await getAdminClient().rpc("record_inquiry", {
    p_input: input,
  });
  if (error) {
    if (error.code === "23505") {
      throw new PublicInquiryError(
        409,
        "This request identifier has already been used.",
      );
    }
    if (error.code === "22023") {
      console.warn("[inquiry-capture] Database rejected inquiry input", {
        origin: input.origin,
      });
      throw new PublicInquiryError(
        400,
        "Check your inquiry details and try again.",
      );
    }
    console.error("[inquiry-capture] Persistence failed", {
      origin: input.origin,
      code: error.code,
    });
    throw new PublicInquiryError(
      503,
      "Could not save your inquiry. Please try again.",
    );
  }

  const result = receiptSchema.safeParse(data);
  if (!result.success) {
    console.error("[inquiry-capture] Unrecognized receipt", {
      origin: input.origin,
    });
    throw new PublicInquiryError(
      503,
      "Could not confirm your inquiry. Please try again.",
    );
  }
  const receipt = result.data;
  const action = receipt.action;
  if (!receipt.replayed) {
    try {
      after(async () => {
        try {
          const alert = await dispatchStudioLeadAlert({
            leadId: receipt.lead_ref ?? receipt.inquiry_ref,
            action,
            name: input.name,
            company: input.company,
            email: input.email,
            phone: input.phone,
            source: publicInquirySources[input.origin],
            serviceCategory: input.service_category,
            expectedValue: input.expected_value,
            isDuplicate: action === "MERGE_INQUIRY",
            notes: input.summary,
          });
          if (!alert.success) {
            console.error("[inquiry-capture] Studio alert delivery failed", {
              receipt: receipt.inquiry_ref,
            });
          }
        } catch {
          console.error("[inquiry-capture] Studio alert dispatch failed", {
            receipt: receipt.inquiry_ref,
          });
        }
      });
    } catch {
      // The receipt is already committed. Scheduling failure must never invite a duplicate retry.
      console.error("[inquiry-capture] Studio alert scheduling failed", {
        receipt: receipt.inquiry_ref,
      });
    }
  }
  return receipt;
}
