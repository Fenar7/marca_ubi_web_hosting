/**
 * @file ingestPayload.ts
 * @description The single assembly point for the `POST /api/sales-funnel/ingest` body.
 *
 *              `/start-project`'s wizard and the Chat Pod intake are two ways of collecting the same
 *              seventeen facts, so they must produce the same object. That only holds if one piece of
 *              code builds it: with a second copy of the mapping, the pod's leads would drift from the
 *              form's in some field nobody compares by hand, and the CRM would gain two shapes of the
 *              same lead. `ingest-payload-parity.test.ts` runs both surfaces through this builder and
 *              asserts the only differences are the two attribution strings.
 *
 *              `combinedNotes` order is load-bearing. The commercial team reads that field as a
 *              structured brief (scope, then services, then notes, then references, then the three
 *              qualification lines), so reordering it would silently change how a lead is triaged.
 * @author Fenar Khan <86710532+Fenar7@users.noreply.github.com>
 */

import { mapCategory, splitMultiValue } from "./intakeOptions";

/**
 * Server-side cap on `notes` (`ingestLeadSchema`: `.max(2000)`). A submission over it is a 422, so
 * the pod truncates rather than losing the lead.
 */
export const NOTES_MAX_CHARS = 2000;

/**
 * Appended when the assembled brief overflowed the cap. The untruncated text stays in
 * `brief_payload`, which the schema validates as an uncapped record, so nothing is actually lost.
 */
export const NOTES_OVERFLOW_MARKER = "\n[truncated in transit - full text in brief_payload]";

/** Name of the `brief_payload` key that carries the overflow copy. */
export const NOTES_OVERFLOW_KEY = "combinedNotes";

/** Attribution pair, the only field the two surfaces are allowed to differ on. */
export interface LeadSource {
  name: string;
  detail: string;
}

export const WEBSITE_FORM_SOURCE: LeadSource = {
  name: "Website Form",
  detail: "Start Project Brief Wizard (Multi-Service)",
};

export const CHAT_POD_SOURCE: LeadSource = {
  name: "Chat Pod",
  detail: "Conversational intake (chat pod)",
};

/**
 * The seventeen intake answers as flat strings. `category` and `service` are the `", "`-joined
 * accumulators the wizard stores; the pod's multi-select slots are joined into the same shape before
 * they reach here, which is what makes one builder serve both.
 *
 * Deliberately a structural subset of `ProjectFormData`, so the wizard can pass its own state object
 * without an adapter and the compiler still rejects a missing field.
 */
export interface IntakeBriefFields {
  name: string;
  email: string;
  phone: string;
  instagram: string;
  category: string;
  service: string;
  language: string;
  projectName: string;
  projectDescription: string;
  industry: string;
  website: string;
  agencyStatus: string;
  referral: string;
  timeline: string;
  inspirationLinks: string;
  showcasePermission: string;
  extraNotes: string;
}

export interface BuildPayloadOptions {
  /** Created once per submission intent and reused across retries, so a retry cannot fork a lead. */
  idempotencyKey: string;
  source: LeadSource;
  /**
   * Off for the wizard to preserve its current behaviour byte-for-byte, on for the pod, which would
   * otherwise 422 on a long brief. Enabling it for the form is a one-line change held back as a
   * separate decision: this module must not alter a shipped surface while adding another.
   */
  truncateOverflow?: boolean;
}

/** The body sent to the ingest route. */
export interface IngestPayload {
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  company_website?: string;
  industry?: string;
  service_category: string;
  budget_bracket?: string;
  notes?: string;
  source_name: string;
  source_detail: string;
  brief_payload: Record<string, unknown>;
}

/**
 * The human-readable brief the CRM receives. Assembly order and separators are reproduced from the
 * wizard exactly; `.filter(Boolean)` drops the sections a visitor never filled, so an empty optional
 * leaves no stray blank line.
 */
export function assembleCombinedNotes(fields: IntakeBriefFields, serviceList: readonly string[]): string {
  return [
    fields.projectDescription ? `Project Scope: ${fields.projectDescription}` : "",
    serviceList.length > 0
      ? `Requested Services (${serviceList.length}):\n• ${serviceList.join("\n• ")}`
      : "",
    fields.extraNotes ? `Additional Notes: ${fields.extraNotes}` : "",
    fields.inspirationLinks ? `Inspiration References:\n${fields.inspirationLinks}` : "",
    fields.instagram ? `Instagram: ${fields.instagram}` : "",
    fields.agencyStatus ? `Agency Status: ${fields.agencyStatus}` : "",
    fields.referral ? `Referral Channel: ${fields.referral}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");
}

/**
 * Shortens an over-cap brief to the last whole line that still fits with the marker. Cutting
 * mid-word would leave the reader with a broken sentence, and the line boundary matters here more
 * than the character count because `combinedNotes` is a stack of labelled sections.
 */
export function truncateNotes(notes: string): { notes: string; truncated: boolean } {
  if (notes.length <= NOTES_MAX_CHARS) return { notes, truncated: false };

  const budget = NOTES_MAX_CHARS - NOTES_OVERFLOW_MARKER.length;
  const window = notes.slice(0, budget);
  const lastBreak = window.lastIndexOf("\n");
  const head = lastBreak > 0 ? window.slice(0, lastBreak) : window.trimEnd();

  return { notes: `${head}${NOTES_OVERFLOW_MARKER}`, truncated: true };
}

/**
 * Builds the request body. Empty strings become `undefined` rather than `""`: the schema's transforms
 * already coerce empty to `null`, and the route distinguishes "not offered" from "offered and blank"
 * when it writes the activity log.
 */
export function buildIngestPayload(fields: IntakeBriefFields, options: BuildPayloadOptions): IngestPayload {
  const serviceList = splitMultiValue(fields.service);
  const categoryList = splitMultiValue(fields.category);

  const combinedNotes = assembleCombinedNotes(fields, serviceList);
  const overflow = options.truncateOverflow ? truncateNotes(combinedNotes) : { notes: combinedNotes, truncated: false };

  const blankToUndefined = (value: string): string | undefined => {
    const trimmed = (value ?? "").trim();
    return trimmed.length > 0 ? trimmed : undefined;
  };

  const briefPayload: Record<string, unknown> = {
    category: fields.category,
    service: fields.service,
    services: serviceList,
    categories: categoryList,
    language: fields.language,
    projectName: fields.projectName,
    projectDescription: fields.projectDescription,
    industry: fields.industry,
    website: fields.website,
    agencyStatus: fields.agencyStatus,
    referral: fields.referral,
    timeline: fields.timeline,
    inspirationLinks: fields.inspirationLinks,
    showcasePermission: fields.showcasePermission,
    extraNotes: fields.extraNotes,
    instagram: fields.instagram,
    idempotencyKey: options.idempotencyKey,
  };

  // Only present when something was actually dropped, so a normal brief stays byte-identical to the
  // wizard's and the parity test has one less deliberate difference to forgive.
  if (overflow.truncated) briefPayload[NOTES_OVERFLOW_KEY] = combinedNotes;

  return {
    name: fields.name.trim(),
    email: blankToUndefined(fields.email),
    phone: blankToUndefined(fields.phone),
    company: blankToUndefined(fields.projectName),
    company_website: blankToUndefined(fields.website),
    industry: blankToUndefined(fields.industry),
    service_category: mapCategory(fields.category),
    // The wizard has no money field: `budget_bracket` carries the duration. Never relabel this as a
    // budget or the pod will start asking for a figure no surface collects.
    budget_bracket: blankToUndefined(fields.timeline),
    notes: overflow.notes || undefined,
    source_name: options.source.name,
    source_detail: options.source.detail,
    brief_payload: briefPayload,
  };
}
