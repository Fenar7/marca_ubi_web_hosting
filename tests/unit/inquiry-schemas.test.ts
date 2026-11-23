import assert from "node:assert/strict";
import { test } from "node:test";
import {
  addInquirySchema,
  linkInquirySchema,
  updateInquirySchema,
} from "../../src/app/lib/inquiry-schemas";

const inquiryId = "929cee95-101c-4a12-8c73-21aefda97800";
const receivedAt = "2026-11-23T14:00:00.125013+00:00";
const draft = {
  idempotencyKey: inquiryId,
  name: "  Example client  ",
  email: "CONTACT@example.invalid",
  originalChannel: "referral",
  summary: "A request for a brand audit.",
  linkMode: "review",
};

test("staff inquiry normalizes coordinates and rejects caller-supplied provenance", () => {
  const result = addInquirySchema.parse(draft);
  assert.equal(result.email, "contact@example.invalid");
  assert.equal(result.name, "Example client");
  assert.equal(result.phone, null);
  for (const input of [
    { ...draft, origin: "contact" },
    { ...draft, email: "", phone: "+12" },
    { ...draft, linkMode: "link" },
    { ...draft, leadId: inquiryId },
    { ...draft, receivedAt: "2026-11-23" },
    { ...draft, summary: " " },
  ])
    assert.equal(addInquirySchema.safeParse(input).success, false);
});

test("triage carries full revision precision and requires a closure reason", () => {
  const fields = { inquiryId, expectedUpdatedAt: receivedAt, ownerId: null };
  assert.equal(
    updateInquirySchema.parse({ ...fields, state: "new" }).expectedUpdatedAt,
    receivedAt,
  );
  assert.equal(
    updateInquirySchema.safeParse({
      ...fields,
      state: "closed",
      closeReason: " ",
    }).success,
    false,
  );
  assert.equal(
    updateInquirySchema.safeParse({
      ...fields,
      state: "closed",
      closeReason: "x".repeat(501),
    }).success,
    false,
  );
  assert.equal(
    updateInquirySchema.parse({
      ...fields,
      state: "closed",
      closeReason: " Request withdrawn. ",
    }).closeReason,
    "Request withdrawn.",
  );
  assert.equal(
    linkInquirySchema.safeParse({
      ...fields,
      linkMode: "create",
      leadId: inquiryId,
    }).success,
    false,
  );
});
