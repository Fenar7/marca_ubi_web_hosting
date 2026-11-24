"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/app/lib/supabase/server";
import {
  addInquirySchema,
  inquiryCaptureResultSchema,
  inquiryContactSchema,
  inquiryLeadMatchesSchema,
  inquiryTriageResultSchema,
  linkInquirySchema,
  updateInquirySchema,
} from "@/app/lib/inquiry-schemas";

type Failure = { success: false; error: string };
type Result<T> = Failure | { success: true; data: T };
type LeadMatch = {
  id: string;
  lead_ref: string;
  name: string;
  company: string | null;
};

const failure = (error: string): Failure => ({ success: false, error });

/** Authenticate each entry point. The inquiry RPC independently enforces the same boundary. */
async function inquiryOperator() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) return null;
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role,status,allowed_tabs")
    .eq("id", user.id)
    .maybeSingle();
  if (error)
    console.error("[inquiry] Operator lookup failed", { code: error.code });
  if (!profile || profile.status !== "active") return null;
  const tabs: unknown = profile.allowed_tabs;
  const canWrite =
    profile.role === "admin" ||
    (profile.role === "sales_manager" &&
      (!Array.isArray(tabs) ||
        tabs.length === 0 ||
        tabs.includes("ingestion")));
  const canResolve =
    profile.role === "admin" ||
    !Array.isArray(tabs) ||
    tabs.length === 0 ||
    tabs.includes("leads");
  return canWrite ? { supabase, canResolve } : null;
}

/** Avoid propagating database details or a hidden lead's existence into the response. */
function writeFailure(
  operation: string,
  error: { code: string } | null,
): Failure {
  console.error("[inquiry] Write did not complete", {
    operation,
    code: error?.code ?? "invalid_response",
  });
  switch (error?.code) {
    case "40001":
      return failure("This inquiry has changed. Reload it and try again.");
    case "42501":
      return failure("You do not have permission to make this change.");
    case "23505":
      return failure(
        "This submission conflicts with a previous entry. Review the inbox before trying again.",
      );
    case "22023":
      return failure(
        "One or more values are no longer valid. Check the selected lead, owner, and status.",
      );
    default:
      return failure("The inquiry could not be saved. Please try again.");
  }
}

/** Revalidate related workspaces only after the database confirms the transaction. */
function refreshInquiryViews(leadChanged = false): void {
  revalidatePath("/admin/ingestion");
  if (leadChanged) {
    revalidatePath("/admin");
    revalidatePath("/admin/leads");
    revalidatePath("/admin/tasks");
    revalidatePath("/admin/analytics");
  }
}

/** Match exact normalized coordinates using caller-scoped SELECT policies. */
export async function findInquiryMatchesAction(
  input: unknown,
): Promise<Result<LeadMatch[]>> {
  const operator = await inquiryOperator();
  if (!operator?.canResolve)
    return failure("You do not have permission to look up leads.");
  const { supabase } = operator;
  const parsed = inquiryContactSchema.safeParse(input);
  if (!parsed.success) return failure(parsed.error.issues[0].message);
  const { email, phone } = parsed.data;
  const { data, error } = await supabase.rpc("find_inquiry_matches", {
    p_email: email,
    p_phone: phone,
  });
  const matches = inquiryLeadMatchesSchema.safeParse(data);
  if (error || !matches.success) {
    console.error("[inquiry] Match lookup failed", { code: error?.code });
    return failure(
      "Lead matches could not be loaded. Try again or save for review.",
    );
  }
  return { success: true, data: matches.data };
}

/** Keep staff provenance server-owned and write inquiry, lead, and history atomically. */
export async function addInquiryAction(
  input: unknown,
): Promise<Result<import("zod").infer<typeof inquiryCaptureResultSchema>>> {
  const operator = await inquiryOperator();
  if (!operator) return failure("You do not have permission to add inquiries.");
  const { supabase } = operator;
  const parsed = addInquirySchema.safeParse(input);
  if (!parsed.success) return failure(parsed.error.issues[0].message);
  const entry = parsed.data;
  if (entry.linkMode !== "review" && !operator.canResolve)
    return failure("You do not have permission to link or create leads.");
  if (entry.receivedAt && Date.parse(entry.receivedAt) > Date.now() + 60_000) {
    return failure("Received time cannot be in the future.");
  }
  const { data, error } = await supabase.rpc("record_inquiry", {
    p_input: {
      origin: "manual",
      idempotency_key: entry.idempotencyKey,
      name: entry.name,
      email: entry.email,
      phone: entry.phone,
      company: entry.company,
      service_category: entry.serviceCategory,
      summary: entry.summary,
      original_channel: entry.originalChannel,
      received_at: entry.receivedAt,
      assigned_to: entry.ownerId,
      linked_lead_id: entry.leadId,
      link_mode: entry.linkMode,
    },
  });
  const committed = inquiryCaptureResultSchema.safeParse(data);
  if (error || !committed.success) return writeFailure("capture", error);
  refreshInquiryViews(Boolean(committed.data.lead_id));
  return { success: true, data: committed.data };
}

/** Resolve a held inquiry without creating a second inquiry event. */
export async function linkInquiryAction(
  input: unknown,
): Promise<Result<import("zod").infer<typeof inquiryCaptureResultSchema>>> {
  const operator = await inquiryOperator();
  if (!operator?.canResolve)
    return failure("You do not have permission to link inquiries.");
  const { supabase } = operator;
  const parsed = linkInquirySchema.safeParse(input);
  if (!parsed.success) return failure(parsed.error.issues[0].message);
  const change = parsed.data;
  const { data, error } = await supabase.rpc("link_inquiry", {
    p_inquiry_id: change.inquiryId,
    p_expected_updated_at: change.expectedUpdatedAt,
    p_link_mode: change.linkMode,
    p_lead_id: change.leadId ?? null,
  });
  const committed = inquiryCaptureResultSchema.safeParse(data);
  if (error || !committed.success) return writeFailure("link", error);
  refreshInquiryViews(Boolean(committed.data.lead_id));
  return { success: true, data: committed.data };
}

/** Persist state and owner together with the audit decision and a revision check. */
export async function updateInquiryAction(
  input: unknown,
): Promise<Result<import("zod").infer<typeof inquiryTriageResultSchema>>> {
  const operator = await inquiryOperator();
  if (!operator)
    return failure("You do not have permission to update inquiries.");
  const { supabase } = operator;
  const parsed = updateInquirySchema.safeParse(input);
  if (!parsed.success) return failure(parsed.error.issues[0].message);
  const change = parsed.data;
  const { data, error } = await supabase.rpc("triage_inquiry", {
    p_inquiry_id: change.inquiryId,
    p_expected_updated_at: change.expectedUpdatedAt,
    p_state: change.state,
    p_owner_id: change.ownerId,
    p_close_reason: change.state === "closed" ? change.closeReason : null,
  });
  const committed = inquiryTriageResultSchema.safeParse(data);
  if (error || !committed.success) return writeFailure("triage", error);
  refreshInquiryViews();
  return { success: true, data: committed.data };
}
