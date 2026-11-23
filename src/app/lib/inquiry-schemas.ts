import { z } from "zod";
import { normalizeEmail, normalizePhone, sanitizeHtml } from "./normalization";

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullish()
    .transform((value) => value || null);
const plainText = (max: number) =>
  optionalText(max).transform((value) =>
    value ? sanitizeHtml(value.replaceAll("\0", ""))?.trim() || null : null,
  );
const requiredText = (max: number, message: string) =>
  z
    .string()
    .trim()
    .max(max)
    .transform(
      (value) => sanitizeHtml(value.replaceAll("\0", ""))?.trim() ?? "",
    )
    .pipe(z.string().min(1, message));
const email = optionalText(255)
  .transform(normalizeEmail)
  .pipe(z.email("Enter a valid email address.").nullable());
const phone = optionalText(50).transform((value, context) => {
  const result = normalizePhone(value);
  if (
    value &&
    (!result.phone || result.warning || !/^\+\d{7,15}$/.test(result.phone))
  ) {
    context.addIssue({
      code: "custom",
      message: "Enter a valid phone number, including its country code.",
    });
    return z.NEVER;
  }
  return result.phone;
});
const uuid = z.uuid();
const state = z.enum(["new", "reviewed", "closed"]);
const datetime = z.iso.datetime({ offset: true });

/** A staff entry carries no caller-supplied origin or mutation authority. */
export const addInquirySchema = z
  .strictObject({
    idempotencyKey: uuid,
    name: requiredText(100, "Enter a contact name."),
    email,
    phone,
    company: plainText(120),
    serviceCategory: z.preprocess(
      (value) => (value === "" ? null : value),
      z
        .enum([
          "Branding",
          "Web & Digital",
          "Mobile Apps",
          "UI/UX Design",
          "Full-Suite Advisory",
          "Other",
        ])
        .nullish(),
    ),
    summary: requiredText(4000, "Enter an inquiry summary."),
    originalChannel: z.enum([
      "email",
      "phone",
      "referral",
      "in_person",
      "other",
    ]),
    receivedAt: datetime.nullish(),
    ownerId: uuid.nullish(),
    leadId: uuid.nullish(),
    linkMode: z.enum(["review", "link", "create"]),
  })
  .superRefine((value, context) => {
    if (!value.email && !value.phone) {
      context.addIssue({
        code: "custom",
        path: ["email"],
        message: "Enter an email address or phone number.",
      });
    }
    if ((value.linkMode === "link") !== Boolean(value.leadId)) {
      context.addIssue({
        code: "custom",
        path: ["leadId"],
        message: "Select an existing lead when choosing to link.",
      });
    }
  });

export const inquiryContactSchema = z
  .strictObject({ email, phone })
  .refine(
    (value) => Boolean(value.email || value.phone),
    "Enter an email address or phone number.",
  );

/** A revision timestamp prevents stale edits from overwriting another operator's decision. */
export const updateInquirySchema = z
  .strictObject({
    inquiryId: uuid,
    expectedUpdatedAt: datetime,
    state,
    ownerId: uuid.nullable(),
    closeReason: plainText(500),
  })
  .refine((value) => value.state !== "closed" || Boolean(value.closeReason), {
    path: ["closeReason"],
    message: "Enter a reason for closing this inquiry.",
  });

export const linkInquirySchema = z
  .strictObject({
    inquiryId: uuid,
    expectedUpdatedAt: datetime,
    linkMode: z.enum(["link", "create"]),
    leadId: uuid.nullish(),
  })
  .refine((value) => (value.linkMode === "link") === Boolean(value.leadId), {
    path: ["leadId"],
    message: "Select an existing lead when choosing to link.",
  });

export const inquiryCaptureResultSchema = z.object({
  id: uuid,
  inquiry_ref: z.string().min(1),
  lead_id: uuid.nullish(),
  lead_ref: z.string().nullish(),
  outcome: z.enum(["created", "linked", "needs_review"]),
  replayed: z.boolean(),
});

export const inquiryLeadMatchesSchema = z
  .array(
    z.object({
      id: uuid,
      lead_ref: z.string(),
      name: z.string(),
      company: z.string().nullable(),
    }),
  )
  .max(20);

export const inquiryTriageResultSchema = z.object({
  id: uuid,
  state,
  updated_at: datetime,
});
