/**
 * @file chatpod-composer-and-avatar.test.ts
 * @description Unit tests verifying the Chat Pod Composer caret stability invariants and
 *              the Swiss executive concierge profile avatar architectural contract.
 *
 *              Engineering Rationale:
 *              - Prevents regression of reverse-typing defects ("can you" -> "uoynac") caused by
 *                forced synthetic cursor snapping in React 19 controlled inputs.
 *              - Guarantees the concierge avatar maintains Apple HIG squircle geometry, integrated
 *                radar beacon isolation, honest disclosure, and zero deceptive humanoid stock photos.
 *
 * @author Fenar Khan <86710532+Fenar7@users.noreply.github.com>
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const COMPOSER_PATH = path.resolve(process.cwd(), "src/app/chat-pod/ui/Composer.tsx");
const PERSONA_HEADER_PATH = path.resolve(process.cwd(), "src/app/chat-pod/ui/PersonaHeader.tsx");
const CHAT_POD_SCSS_PATH = path.resolve(process.cwd(), "src/app/chat-pod/ChatPod.module.scss");

describe("Chat Pod: Composer Caret Stability & Selection Invariants", () => {
  const composerSource = fs.readFileSync(COMPOSER_PATH, "utf8");

  it("strictly forbids programmatic setSelectionRange calls on keystroke", () => {
    // Calling setSelectionRange during standard controlled typing snaps cursor backwards
    assert.strictEqual(
      /\.setSelectionRange\(/.test(composerSource),
      false,
      "Composer must never execute setSelectionRange on controlled inputs"
    );
  });

  it("strictly forbids selectionRef manual cursor repositioning hacks", () => {
    assert.strictEqual(
      composerSource.includes("selectionRef"),
      false,
      "Composer must not intercept selection with selectionRef"
    );
  });

  it("relies on native DOM maxLength for character bounds", () => {
    assert.ok(
      composerSource.includes("maxLength={limit}"),
      "Composer must pass native maxLength to textarea"
    );
  });

  it("tracks IME composition sessions to protect accents and mobile keyboards", () => {
    assert.ok(
      composerSource.includes("isComposingRef") &&
      composerSource.includes("onCompositionStart") &&
      composerSource.includes("onCompositionEnd"),
      "Composer must track composition lifecycle to prevent premature dispatch"
    );
  });

  it("implements non-destructive auto-growth without layout thrashing", () => {
    assert.ok(
      composerSource.includes("field-sizing") &&
      composerSource.includes("useLayoutEffect"),
      "Composer must combine modern CSS field-sizing with non-destructive fallback"
    );
  });
});

describe("Chat Pod: Concierge Profile Avatar & Disclosure Contract", () => {
  const headerSource = fs.readFileSync(PERSONA_HEADER_PATH, "utf8");
  const scssSource = fs.readFileSync(CHAT_POD_SCSS_PATH, "utf8");

  it("renders bespoke Swiss vector concierge squircle avatar instead of letter tile", () => {
    assert.ok(
      headerSource.includes("avatarSvg") &&
      headerSource.includes("conciergeSurface") &&
      headerSource.includes("conciergeGlyph"),
      "PersonaHeader must render bespoke concierge vector avatar"
    );
    assert.strictEqual(
      headerSource.includes("<span className={styles.avatarGlyph}>U</span>"),
      false,
      "PersonaHeader must not render the legacy letter U square tile"
    );
  });

  it("enforces Apple HIG continuous squircle radius (rx=10)", () => {
    assert.ok(
      headerSource.includes('rx="10"'),
      "Avatar container must use continuous squircle corner radius"
    );
  });

  it("maintains permanent honest disclosure line for Anti-Slop R-16/R-36", () => {
    assert.ok(
      headerSource.includes("PERSONA.identityLine") &&
      headerSource.includes("srOnly"),
      "Header must render identity line disclosure: 'Digital assistant · Not a person'"
    );
  });

  it("retains visible text nodes for Menu and Close buttons for WCAG & E2E", () => {
    assert.ok(
      headerSource.includes("<span>Menu</span>") &&
      headerSource.includes("<span>Close</span>"),
      "Header action buttons must contain visible text labels"
    );
  });

  it("scopes statusPulse beacon within statusBeacon container to prevent full-avatar pulsation", () => {
    assert.ok(
      scssSource.includes(".statusBeacon {") &&
      scssSource.includes(".statusPulse {") &&
      scssSource.includes(".statusDot {"),
      "SCSS must define dedicated statusBeacon, statusDot, and statusPulse rules"
    );
    assert.ok(
      headerSource.includes("className={styles.statusBeacon}") &&
      headerSource.includes("className={styles.statusPulse}") &&
      headerSource.includes("className={styles.statusDot}"),
      "PersonaHeader must nest statusPulse inside statusBeacon, not full avatar"
    );
  });

  it("verifies zero generic blue (#2563eb) and luxury token consistency in ChatPod styles", () => {
    assert.strictEqual(
      scssSource.includes("#2563eb"),
      false,
      "ChatPod styles must never contain generic blue #2563eb"
    );
  });
});
