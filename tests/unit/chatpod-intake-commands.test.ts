import assert from "node:assert/strict";
import test from "node:test";
import { parseIntakeCommand } from "../../src/app/chat-pod/intake/commands";

test("intake commands match complete messages and allow sentence punctuation", () => {
  assert.equal(parseIntakeCommand("  Go back! "), "back");
  assert.equal(parseIntakeCommand("REVIEW brief."), "review");
  assert.equal(parseIntakeCommand("Contact the studio?"), "contact");
  assert.equal(parseIntakeCommand("Stop"), "exit");
});

test("ordinary project and company text containing command words remains literal", () => {
  assert.equal(parseIntakeCommand("Contact Design Studio"), null);
  assert.equal(parseIntakeCommand("Back to the Future campaign"), null);
  assert.equal(parseIntakeCommand("Review of the brand system"), null);
  assert.equal(parseIntakeCommand("Please contact us about the project"), null);
});
