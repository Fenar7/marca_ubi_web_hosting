import assert from "node:assert/strict";
import { test } from "node:test";
import { commandLabel, taskReplies } from "../../src/app/chat-pod/ui/replyActions";
import type { Chip } from "../../src/app/chat-pod/types";

test("a long selection cannot bury progression inside its options", () => {
  const choices: Chip[] = Array.from({ length: 22 }, (_, index) => ({
    label: `Choice ${index}`,
    action: { kind: "slot-toggle", slot: "services", value: `${index}` },
  }));
  const proceed: Chip = { label: "Continue (3)", action: { kind: "slot-continue", slot: "services" } };
  const back: Chip = { label: "Back to Work", action: { kind: "slot-edit", slot: "categories" } };
  const separated = taskReplies([...choices, proceed, back]);
  assert.deepEqual(separated.choices, choices);
  assert.equal(separated.primary, proceed);
  assert.deepEqual(separated.secondary, [back]);
  assert.equal(commandLabel(proceed), "Continue");
});

test("review gives the explicit send command priority over optional enrichment and pause", () => {
  const submit: Chip = { label: "Send it", action: { kind: "intake-action", action: "submit" } };
  const details: Chip = { label: "Add more details", action: { kind: "intake-action", action: "details" } };
  const later: Chip = { label: "Not yet", action: { kind: "intake-action", action: "later" } };
  const separated = taskReplies([details, submit, later]);
  assert.equal(separated.primary, submit);
  assert.deepEqual(separated.choices, []);
  assert.deepEqual(separated.secondary, [details, later]);
  assert.equal(commandLabel(submit), "Send brief");
});

test("early review is reachable as the primary action when no choice commitment is pending", () => {
  const review: Chip = { label: "Review brief", action: { kind: "intake-action", action: "review" } };
  const skip: Chip = { label: "Skip", action: { kind: "slot-skip", slot: "timeline" } };
  const separated = taskReplies([skip, review]);
  assert.equal(separated.primary, review);
  assert.deepEqual(separated.secondary, [skip]);
});

test("retry is a command while actual navigation remains available as navigation", () => {
  const retry: Chip = { label: "Send it again", action: { kind: "intake-action", action: "retry" } };
  const form: Chip = { label: "Open the full form", action: { kind: "route", href: "/start-project" } };
  const separated = taskReplies([retry, form]);
  assert.equal(separated.primary, retry);
  assert.deepEqual(separated.choices, [form]);
  assert.equal(commandLabel(retry), "Retry sending");
});
