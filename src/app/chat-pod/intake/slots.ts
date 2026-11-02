/**
 * @file slots.ts
 * @description The seventeen intake questions, their order, and what a legal answer looks like.
 *
 *              Two rules shape this file. First, **one question per turn**: a message that asks for a
 *              name and an email at once gets one of the two answered, and the visitor has to notice
 *              which one was missed. Second, **six of the seventeen are closed sets**, and a closed
 *              set validates by membership in the same array the wizard renders, never by string
 *              length. "technology" in lower case passes a length check and silently becomes a lead no
 *              CRM filter matches, so membership is the only acceptable test.
 *
 *              The validators mirror `src/app/lib/validations/ingest.ts` deliberately. Catching an
 *              over-long answer here costs the visitor a re-ask; missing it costs them a 422 after they
 *              already pressed send.
 * @author Fenar Khan <86710532+Fenar7@users.noreply.github.com>
 */

import {
  AGENCY_STATUS_CHIP_LABELS,
  INTAKE_AGENCY_STATUS_OPTIONS,
  INTAKE_CATEGORIES,
  INTAKE_INDUSTRIES,
  INTAKE_LANGUAGES,
  INTAKE_REFERRAL_SOURCES,
  INTAKE_SHOWCASE_CHOICES,
  INTAKE_TIMELINE_OPTIONS,
  SERVICES_BY_CATEGORY,
} from "@/app/lib/intake/intakeOptions";
import type { Chip, SlotId, SlotValue } from "../types";

export type SlotKind = "multi" | "single" | "text" | "multiline" | "links";

export type SlotAnswer = { ok: true; value: SlotValue } | { ok: false; message: string };

export interface SlotOption {
  /** The exact string stored and sent to the CRM. */
  value: string;
  /** What the chip shows. Only differs from `value` where the canonical string is too long to fit. */
  chip: string;
}

export interface SlotDefinition {
  id: SlotId;
  /** Row label on the review card. */
  label: string;
  question: string;
  kind: SlotKind;
  /** Refused on `SKIP`, with a reason. */
  required: boolean;
  /** The static members of a closed set. `services` is the one exception: its set is scoped to the
   *  disciplines already chosen, so it is derived by `slotOptions` rather than held here. */
  options?: SlotOption[];
  placeholder?: string;
  maxLength?: number;
  validate: (raw: SlotValue, slots: Record<SlotId, SlotValue>) => SlotAnswer;
}

/** Caps copied from the ingest schema so a re-ask happens before a rejection, not after. */
const LIMITS = {
  name: 100,
  email: 255,
  phone: 50,
  projectName: 120,
  industry: 100,
  projectDescription: 800,
  website: 255,
  instagram: 100,
  link: 255,
  extraNotes: 2000,
  links: 5,
} as const;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Free-text validator: trim, refuse empty when required, refuse over-cap when filled. */
function textSlot(maxLength: number, required: boolean, noun: string) {
  return (raw: SlotValue): SlotAnswer => {
    const value = typeof raw === "string" ? raw.trim() : "";
    if (value.length === 0) {
      return required ? { ok: false, message: `I need ${noun} before I can send this.` } : { ok: true, value: "" };
    }
    if (value.length > maxLength) {
      return {
        ok: false,
        message: `That is ${value.length} characters and I can pass on ${maxLength}. Could you shorten it?`,
      };
    }
    return { ok: true, value };
  };
}

/** Closed-set validator: membership only. Length is irrelevant if the string is not one of ours. */
function closedSet(options: readonly string[], required: boolean): (raw: SlotValue) => SlotAnswer {
  return (raw: SlotValue): SlotAnswer => {
    const value = typeof raw === "string" ? raw.trim() : "";
    if (value.length === 0) return required ? { ok: false, message: "Pick one of those." } : { ok: true, value: "" };
    if (!options.includes(value)) {
      return { ok: false, message: "I can only choose from the options I showed you, or skip." };
    }
    return { ok: true, value };
  };
}

function chipsFrom(options: readonly string[], shortLabels?: Record<string, string>): SlotOption[] {
  return options.map((value) => ({ value, chip: shortLabels?.[value] ?? value }));
}

/** The six durations the wizard offers, with the compact chip copy the pod needs to fit them. */
const TIMELINE_VALUES: readonly string[] = INTAKE_TIMELINE_OPTIONS.map((option) => option.value);

const TIMELINE_OPTIONS: SlotOption[] = INTAKE_TIMELINE_OPTIONS.map((option) => ({
  value: option.value,
  chip: option.chipLabel,
}));

/**
 * Ask order. Required answers first, then who to reply to, then the optional tail with a `Skip` on
 * every one of it. The visitor reaches "your name and email" only after the conversation has earned
 * the ask, and the tail never reads like an interrogation.
 */
export const SLOT_ORDER: readonly SlotId[] = [
  "categories",
  "services",
  "timeline",
  "name",
  "email",
  "phone",
  "projectName",
  "industry",
  "projectDescription",
  "website",
  "instagram",
  "language",
  "agencyStatus",
  "referral",
  "inspirationLinks",
  "showcasePermission",
  "extraNotes",
];

/** Bridge line printed once, between the required answers and the optional tail. */
export const OPTIONAL_TAIL_INTRO =
  "That is the required part done. The rest is optional and helps us prepare, and you can skip any of it.";

export const SLOTS: Record<SlotId, SlotDefinition> = {
  categories: {
    id: "categories",
    label: "Work",
    question: "What kind of work is this? Pick any that apply, then press continue.",
    kind: "multi",
    required: true,
    options: chipsFrom(INTAKE_CATEGORIES),
    validate: (raw): SlotAnswer => {
      const picked = Array.isArray(raw) ? raw.filter((item) => item.length > 0) : [];
      if (picked.length === 0) return { ok: false, message: "Choose at least one kind of work." };
      const unknown = picked.filter((item) => !INTAKE_CATEGORIES.includes(item));
      if (unknown.length > 0) return { ok: false, message: "I can only choose from the options I showed you." };
      return { ok: true, value: picked };
    },
  },
  services: {
    id: "services",
    label: "Services",
    question: "Which of these do you need? Pick as many as apply, then press continue.",
    kind: "multi",
    required: true,
    validate: (raw, slots): SlotAnswer => {
      const picked = Array.isArray(raw) ? raw.filter((item) => item.length > 0) : [];
      if (picked.length === 0) return { ok: false, message: "Choose at least one service." };
      const allowed = new Set(allowedServices(slots.categories));
      const unknown = picked.filter((item) => !allowed.has(item));
      if (unknown.length > 0) return { ok: false, message: "Those belong to a category you did not pick." };
      return { ok: true, value: picked };
    },
  },
  timeline: {
    id: "timeline",
    label: "Timeline",
    question: "When do you need it?",
    kind: "single",
    required: true,
    options: TIMELINE_OPTIONS,
    validate: closedSet(TIMELINE_VALUES, true),
  },
  name: {
    id: "name",
    label: "Name",
    question: "Your name?",
    kind: "text",
    required: true,
    placeholder: "Your name",
    maxLength: LIMITS.name,
    validate: textSlot(LIMITS.name, true, "your name"),
  },
  email: {
    id: "email",
    label: "Email",
    question: "Best email for this?",
    kind: "text",
    // Skippable while a phone number is still on the table, and the FSM promotes `phone` to required
    // the moment this one is skipped without one.
    required: false,
    placeholder: "you@company.com",
    maxLength: LIMITS.email,
    validate: (raw): SlotAnswer => {
      const value = typeof raw === "string" ? raw.trim() : "";
      if (value.length === 0) return { ok: true, value: "" };
      if (value.length > LIMITS.email) return { ok: false, message: `That email is longer than ${LIMITS.email} characters.` };
      if (!EMAIL_PATTERN.test(value)) return { ok: false, message: "That email did not look right. Can you check it?" };
      return { ok: true, value };
    },
  },
  phone: {
    id: "phone",
    label: "Phone",
    question: "And a number, in case email is slow?",
    kind: "text",
    required: false,
    placeholder: "+91 7012 052 472",
    maxLength: LIMITS.phone,
    validate: textSlot(LIMITS.phone, false, "a number"),
  },
  projectName: {
    id: "projectName",
    label: "Project",
    question: "What are you calling the project?",
    kind: "text",
    required: false,
    placeholder: "Packaging for an organic beverage brand",
    maxLength: LIMITS.projectName,
    validate: textSlot(LIMITS.projectName, false, "a project name"),
  },
  industry: {
    id: "industry",
    label: "Industry",
    question: "What industry is it in?",
    kind: "single",
    required: false,
    options: chipsFrom(INTAKE_INDUSTRIES),
    validate: closedSet(INTAKE_INDUSTRIES, false),
  },
  projectDescription: {
    id: "projectDescription",
    label: "Scope",
    question: "In a sentence or two, what do you need?",
    kind: "multiline",
    required: false,
    placeholder: "Deliverables, audience, anything already decided",
    maxLength: LIMITS.projectDescription,
    validate: textSlot(LIMITS.projectDescription, false, "the scope"),
  },
  website: {
    id: "website",
    label: "Website",
    question: "Your website, if you have one?",
    kind: "text",
    required: false,
    placeholder: "https://yourcompany.com",
    maxLength: LIMITS.website,
    validate: textSlot(LIMITS.website, false, "a website"),
  },
  instagram: {
    id: "instagram",
    label: "Instagram",
    question: "Instagram handle?",
    kind: "text",
    required: false,
    placeholder: "@yourbrand",
    maxLength: LIMITS.instagram,
    validate: textSlot(LIMITS.instagram, false, "a handle"),
  },
  language: {
    id: "language",
    label: "Language",
    question: "Preferred language for the work?",
    kind: "single",
    required: false,
    options: chipsFrom(INTAKE_LANGUAGES),
    validate: closedSet(INTAKE_LANGUAGES, false),
  },
  agencyStatus: {
    id: "agencyStatus",
    label: "Agency status",
    question: "Are you an agency?",
    kind: "single",
    required: false,
    options: chipsFrom(INTAKE_AGENCY_STATUS_OPTIONS, AGENCY_STATUS_CHIP_LABELS),
    validate: closedSet(INTAKE_AGENCY_STATUS_OPTIONS, false),
  },
  referral: {
    id: "referral",
    label: "Referral",
    question: "How did you find us?",
    kind: "single",
    required: false,
    options: chipsFrom(INTAKE_REFERRAL_SOURCES),
    validate: closedSet(INTAKE_REFERRAL_SOURCES, false),
  },
  inspirationLinks: {
    id: "inspirationLinks",
    label: "Inspiration",
    question: `Any links to work you like? Send up to ${LIMITS.links}, one per message, or skip.`,
    kind: "links",
    required: false,
    placeholder: "https://",
    maxLength: LIMITS.link,
    validate: (raw): SlotAnswer => {
      const links = Array.isArray(raw) ? raw.map((link) => link.trim()).filter(Boolean) : [];
      if (links.length === 0) return { ok: true, value: [] };
      if (links.length > LIMITS.links) return { ok: false, message: `I can pass on ${LIMITS.links} links at most.` };
      const tooLong = links.find((link) => link.length > LIMITS.link);
      if (tooLong) return { ok: false, message: "One of those links is longer than I can send." };
      return { ok: true, value: links };
    },
  },
  showcasePermission: {
    id: "showcasePermission",
    label: "Showcase",
    question: "Can we showcase the finished work in our portfolio?",
    kind: "single",
    required: false,
    options: chipsFrom(INTAKE_SHOWCASE_CHOICES),
    validate: closedSet(INTAKE_SHOWCASE_CHOICES, false),
  },
  extraNotes: {
    id: "extraNotes",
    label: "Notes",
    question: "Anything else I should pass on?",
    kind: "multiline",
    required: false,
    placeholder: "Constraints, reference files, deadlines",
    maxLength: LIMITS.extraNotes,
    validate: textSlot(LIMITS.extraNotes, false, "those notes"),
  },
};

/** Every service under the chosen disciplines; what the `services` chips are built from. */
export function allowedServices(categories: SlotValue): string[] {
  const picked = Array.isArray(categories) ? categories : [];
  const list: string[] = [];
  for (const category of picked) {
    const services = SERVICES_BY_CATEGORY[category];
    if (services) list.push(...services);
  }
  return list;
}

/**
 * The answer set for a slot: its own options, or, for the services question, the services under the
 * disciplines already chosen. Both the chips and the typed-answer matcher read this, so a question that
 * can be tapped can also be typed.
 */
export function slotOptions(slot: SlotDefinition, slots: Record<SlotId, SlotValue>): SlotOption[] {
  if (slot.options) return slot.options;
  return slot.kind === "multi" ? chipsFrom(allowedServices(slots.categories)) : [];
}

/** Chips for the current slot: the closed-set options, scoped to the categories already picked. */
export function slotChips(slot: SlotDefinition, slots: Record<SlotId, SlotValue>): Chip[] {
  return slotOptions(slot, slots).map((option) => ({
    label: option.chip,
    action:
      slot.kind === "multi"
        ? { kind: "slot-toggle", slot: slot.id, value: option.value }
        : { kind: "slot-pick", slot: slot.id, value: option.value },
  }));
}
