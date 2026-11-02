/**
 * @file review.ts
 * @description Turns the pod's slot answers into the two things the visitor confirms: the review card
 *              they read before sending, and the `IntakeBriefFields` record the shared payload builder
 *              consumes.
 *
 *              The card shows the **stored** string, never the compact chip label. Two of the six
 *              timeline chips and all three agency-status chips are shortened to fit a button, so a
 *              visitor who confirmed "Yes, interested" would otherwise be approving a sentence the CRM
 *              never receives. Whatever the card prints is what the lead holds.
 *
 *              Multi-selections are joined with the wizard's own separator before they leave this file,
 *              which is what lets `buildIngestPayload` stay a single implementation for both surfaces.
 * @author Fenar Khan <86710532+Fenar7@users.noreply.github.com>
 */

import { buildIngestPayload, CHAT_POD_SOURCE, type IngestPayload, type IntakeBriefFields } from "@/app/lib/intake/ingestPayload";
import { LINK_VALUE_SEPARATOR, MULTI_VALUE_SEPARATOR, categoriesForServices } from "@/app/lib/intake/intakeOptions";
import { SLOTS, SLOT_ORDER } from "./slots";
import type { SlotId, SlotValue } from "../types";

/** Row of the review card. `label` matches the wizard's own field names so the two read alike. */
export interface ReviewRow {
  slot: SlotId;
  label: string;
  value: string;
}

function displayValue(value: SlotValue): string {
  if (Array.isArray(value)) return value.join(MULTI_VALUE_SEPARATOR);
  return String(value ?? "").trim();
}

/**
 * Flat string fields for the shared builder. `inspirationLinks` is the newline-joined string the form
 * stores and `Step3Details` splits on, so a brief collected in chat replays through the wizard's own
 * repeater without a special case.
 *
 * `category` is **derived from the chosen services**, never the disciplines the visitor tapped through.
 * That is what the wizard has always filed (`Step1Services` recomputes `formData.category` on every
 * toggle), and `mapCategory` escalates on the count, so taking the pod's own tap-list would route the
 * same brief to a different `service_category` depending on which surface collected it. The discipline
 * question still earns its place: it scopes the 52 services down to the ones that fit the brief.
 */
export function slotsToFields(slots: Record<SlotId, SlotValue>): IntakeBriefFields {
  const picked = (key: SlotId): string[] => (Array.isArray(slots[key]) ? (slots[key] as string[]) : []);
  const services = picked("services");

  return {
    name: displayValue(slots.name),
    email: displayValue(slots.email),
    phone: displayValue(slots.phone),
    instagram: displayValue(slots.instagram),
    category: categoriesForServices(services).join(MULTI_VALUE_SEPARATOR),
    service: services.join(MULTI_VALUE_SEPARATOR),
    language: displayValue(slots.language),
    projectName: displayValue(slots.projectName),
    projectDescription: displayValue(slots.projectDescription),
    industry: displayValue(slots.industry),
    website: displayValue(slots.website),
    agencyStatus: displayValue(slots.agencyStatus),
    referral: displayValue(slots.referral),
    timeline: displayValue(slots.timeline),
    inspirationLinks: picked("inspirationLinks").join(LINK_VALUE_SEPARATOR),
    showcasePermission: displayValue(slots.showcasePermission),
    extraNotes: displayValue(slots.extraNotes),
  };
}

/**
 * The review card, in ask order, with empty optional rows omitted rather than printed as a dash. A
 * row that reads "Referral: " tells the visitor nothing; a missing row tells them they skipped it.
 *
 * The Work row prints the derived discipline list rather than the tap buffer, because the rule of this
 * file is that whatever the card shows is whatever the lead carries.
 */
export function reviewRows(slots: Record<SlotId, SlotValue>): ReviewRow[] {
  const fields = slotsToFields(slots);
  const rows: ReviewRow[] = [];
  for (const slot of SLOT_ORDER) {
    const value = slot === "categories" ? fields.category : displayValue(slots[slot]);
    if (value.length === 0) continue;
    rows.push({ slot, label: SLOTS[slot].label, value });
  }
  return rows;
}

/**
 * The pod's submission body. Delegates to the wizard's builder with `truncateOverflow` on, which is
 * the only deliberate behavioural difference between the two surfaces: a chat visitor who typed a
 * long brief should not get a 422 after pressing send.
 */
export function buildPodPayload(slots: Record<SlotId, SlotValue>, idempotencyKey: string): IngestPayload {
  return buildIngestPayload(slotsToFields(slots), {
    idempotencyKey,
    source: CHAT_POD_SOURCE,
    truncateOverflow: true,
  });
}

/** The channel the studio will reply on, for the success line. */
export function replyChannel(slots: Record<SlotId, SlotValue>): string {
  return displayValue(slots.email) || displayValue(slots.phone);
}
