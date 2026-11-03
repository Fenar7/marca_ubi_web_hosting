/**
 * @file chatpod-composer-and-avatar.test.ts
 * @description Unit tests verifying the Chat Pod Composer caret stability invariants,
 *              the photographic lady concierge avatar contract, and modal overlay mutual exclusion.
 *
 *              Engineering Rationale:
 *              - Prevents regression of reverse-typing defects ("can you" -> "uoynac") caused by
 *                forced synthetic cursor snapping in React 19 controlled inputs.
 *              - Guarantees the authentic lady concierge photographic portrait (/avatars/sophia-sterling.jpg)
 *                maintains Apple HIG squircle geometry (rx=10px), integrated radar beacon, and honest disclosure.
 *              - Enforces complete absence of legacy letter "U" tiles and vector silhouettes.
 *              - Guarantees modal overlay mutual exclusion and focus-theft protection between ChatPod
 *                and NavigationOverlay.
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
const CHAT_POD_PATH = path.resolve(process.cwd(), "src/app/chat-pod/ChatPod.tsx");
const CLIENT_HEADER_PATH = path.resolve(process.cwd(), "src/app/components/ClientHeader/ClientHeader.tsx");
const NAVIGATION_OVERLAY_PATH = path.resolve(process.cwd(), "src/app/components/NavigationOverlay/NavigationOverlay.tsx");

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

describe("Chat Pod: Concierge Photographic Profile Avatar & Disclosure Contract", () => {
  const headerSource = fs.readFileSync(PERSONA_HEADER_PATH, "utf8");
  const scssSource = fs.readFileSync(CHAT_POD_SCSS_PATH, "utf8");

  it("renders authentic high-resolution lady concierge portrait avatar (/avatars/sophia-sterling.jpg)", () => {
    assert.ok(
      headerSource.includes('src="/avatars/sophia-sterling.jpg"') &&
      headerSource.includes('alt="Ubi, Concierge"') &&
      headerSource.includes("className={styles.avatarImg}"),
      "PersonaHeader must render photographic concierge image from /avatars/sophia-sterling.jpg"
    );
    assert.ok(
      headerSource.includes('import Image from "next/image"'),
      "PersonaHeader must consume Next.js Image component for optimal WebP/AVIF compression"
    );
  });

  it("strictly forbids legacy letter 'U' tile and vector silhouettes", () => {
    assert.strictEqual(
      headerSource.includes("<span className={styles.avatarGlyph}>U</span>"),
      false,
      "PersonaHeader must not render the legacy letter U square tile"
    );
    assert.strictEqual(
      headerSource.includes("conciergeSurface") ||
      headerSource.includes("conciergeGlyph") ||
      headerSource.includes("conciergeSpecular") ||
      headerSource.includes("avatarSvg"),
      false,
      "PersonaHeader must not render abstract vector silhouettes in place of the lady concierge portrait"
    );
  });

  it("enforces Apple HIG continuous squircle radius (10px) on avatar image and container", () => {
    assert.ok(
      scssSource.includes(".avatarImg {") &&
      scssSource.includes("border-radius: 10px;"),
      "Avatar image must apply Apple HIG 10px corner radius"
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

  it("renders Sophia Sterling photographic portrait thumbnail on resting launcher button", () => {
    const chatPodSource = fs.readFileSync(CHAT_POD_PATH, "utf8");
    assert.ok(
      chatPodSource.includes('src="/avatars/sophia-sterling.jpg"') &&
      chatPodSource.includes("styles.launcherAvatarImg"),
      "ChatPod launcher must render Sophia Sterling portrait thumbnail in resting state"
    );
    assert.ok(
      chatPodSource.includes('import Image from "next/image"'),
      "ChatPod must import Next.js Image component for launcher avatar"
    );
    assert.ok(
      chatPodSource.includes("styles.statusBeacon") &&
      chatPodSource.includes("styles.statusPulse") &&
      chatPodSource.includes("styles.statusDot"),
      "ChatPod launcher must include active emerald status beacon on resting avatar"
    );
  });

  it("strictly forbids legacy letter 'U' tile on launcher button", () => {
    const chatPodSource = fs.readFileSync(CHAT_POD_PATH, "utf8");
    assert.strictEqual(
      chatPodSource.includes('{open ? "×" : "U"}'),
      false,
      "ChatPod launcher must never render legacy letter 'U' glyph tile"
    );
    assert.strictEqual(
      chatPodSource.includes('>U<'),
      false,
      "ChatPod launcher must not contain naked 'U' letter text node"
    );
  });

  it("renders minimal luxury typographic crosshair when launcher is open", () => {
    const chatPodSource = fs.readFileSync(CHAT_POD_PATH, "utf8");
    assert.ok(
      chatPodSource.includes('{open ? (') &&
      chatPodSource.includes("styles.launcherGlyph") &&
      chatPodSource.includes("×"),
      "ChatPod launcher must render refined crosshair glyph when panel is open"
    );
  });
});

describe("Chat Pod: Swiss Light Editorial Luxury Surface Contract", () => {
  const scssSource = fs.readFileSync(CHAT_POD_SCSS_PATH, "utf8");

  it("enforces pure white paper canvas modal container with 16px radius and layered elevation", () => {
    assert.ok(
      scssSource.includes("$pod-canvas: #ffffff;") &&
      scssSource.includes("border-radius: 16px;") &&
      scssSource.includes("box-shadow: 0 24px 64px -12px rgba(0, 0, 0, 0.16)"),
      "ChatPod panel must apply pure white paper canvas with 16px radius and layered elevation"
    );
  });

  it("applies Apple HIG floating black capsule geometry (border-radius: 9999px) on launcher button", () => {
    assert.ok(
      scssSource.includes(".launcher {") &&
      scssSource.includes("border-radius: 9999px;") &&
      scssSource.includes("background: #0a0a0a;") &&
      scssSource.includes("height: 52px;"),
      "Launcher button must be styled as a floating black capsule pill"
    );
  });

  it("configures quick-action chips and action buttons as Linear/Raycast fluid Swiss pills (9999px)", () => {
    assert.ok(
      scssSource.includes(".chip {") &&
      scssSource.includes("border-radius: 9999px;") &&
      scssSource.includes("background: #ffffff;"),
      "Chips must adopt fluid Swiss pill capsule geometry"
    );
    assert.ok(
      scssSource.includes(".headerBtn,") &&
      scssSource.includes(".iconButton {") &&
      scssSource.includes("border-radius: 9999px;") &&
      scssSource.includes("background: rgba(0, 0, 0, 0.04);"),
      "Header action buttons must adopt fluid pill capsule geometry"
    );
  });

  it("implements signature Brand Red (#ea002a) send button with tactile press feedback and strictly zero #ff6100 orange", () => {
    assert.ok(
      scssSource.includes(".send {") &&
      scssSource.includes("background: #ea002a;") &&
      scssSource.includes("$client-accent-red: #ea002a;"),
      "Send button must use signature Marca Ubi Brand Red (#ea002a)"
    );
    assert.ok(
      scssSource.includes("&:active {") &&
      scssSource.includes("transform: scale(0.96);"),
      "Send button must provide tactile active press feedback"
    );
    assert.strictEqual(
      scssSource.includes("#ff6100"),
      false,
      "ChatPod styles must never contain legacy #ff6100 orange"
    );
  });

  it("strictly purges legacy #cccccc grey from send idle and composer states", () => {
    assert.strictEqual(
      scssSource.includes("#cccccc"),
      false,
      "ChatPod styles must never contain dated #cccccc grey slab"
    );
    assert.ok(
      scssSource.includes(".sendIdle {") &&
      scssSource.includes("background: rgba(0, 0, 0, 0.04);"),
      "Send idle state must use subtle soft neutral tone"
    );
  });

  it("leaves the contrast promise to the test that measures it", () => {
    // The three ink tokens are pinned in `chatpod-contrast.test.ts`, which reads them out of this very
    // stylesheet and computes each pair against the surface it is painted on. Asserting the hexes twice
    // here would only have preserved the old failure: a comment claiming 4.5:1 for a tone at 3.3:1.
    assert.ok(
      scssSource.includes("$ink:") && scssSource.includes("$muted:") && scssSource.includes("$quiet:"),
      "The Swiss light ink scale must stay three tones, named, so the contrast suite can measure it"
    );
    assert.ok(
      fs.readFileSync(path.resolve("tests/unit/chatpod-contrast.test.ts"), "utf8").includes("Chat Pod contrast contract"),
      "The stylesheet's AA claim must have a measuring test behind it"
    );
  });
});

describe("Modal Overlay Mutual Exclusion & Focus Invariant Protection", () => {
  const chatPodSource = fs.readFileSync(CHAT_POD_PATH, "utf8");
  const clientHeaderSource = fs.readFileSync(CLIENT_HEADER_PATH, "utf8");
  const navOverlaySource = fs.readFileSync(NAVIGATION_OVERLAY_PATH, "utf8");

  it("dispatches 'navigation:close' when ChatPod panel opens", () => {
    assert.ok(
      chatPodSource.includes('window.dispatchEvent(new Event("navigation:close"))'),
      "ChatPod openPanel must dispatch navigation:close to dismiss any open site overlay"
    );
  });

  it("registers 'chatpod:close' listener in ChatPod to close panel when requested", () => {
    assert.ok(
      chatPodSource.includes('window.addEventListener("chatpod:close"') &&
      chatPodSource.includes('closePanel()'),
      "ChatPod must dismiss itself upon receiving chatpod:close"
    );
  });

  it("memoizes closeDrawer in ClientHeader to protect child effect stability", () => {
    assert.ok(
      clientHeaderSource.includes("const closeDrawer = useCallback(() => setIsDrawerOpen(false), []);"),
      "ClientHeader must memoize closeDrawer with useCallback to avoid 3.5s effect thrashing"
    );
  });

  it("dismisses NavigationOverlay in ClientHeader when navigation:close or chatpod:open fires", () => {
    assert.ok(
      clientHeaderSource.includes('window.addEventListener("navigation:close"') &&
      clientHeaderSource.includes('window.addEventListener("chatpod:open"'),
      "ClientHeader must listen to navigation:close and chatpod:open"
    );
  });

  it("dispatches 'chatpod:close' when NavigationOverlay opens in ClientHeader", () => {
    assert.ok(
      clientHeaderSource.includes('window.dispatchEvent(new Event("chatpod:close"))'),
      "ClientHeader must dispatch chatpod:close when isDrawerOpen becomes true"
    );
  });

  it("guards focus shift in NavigationOverlay to transition-only edges via prevOpenRef", () => {
    assert.ok(
      navOverlaySource.includes("const prevOpenRef = useRef(false);"),
      "NavigationOverlay must track previous open state with prevOpenRef"
    );
    assert.ok(
      navOverlaySource.includes("const isInitialOpen = !prevOpenRef.current;") &&
      navOverlaySource.includes("if (isInitialOpen) {") &&
      navOverlaySource.includes("prevOpenRef.current = isOpen;"),
      "NavigationOverlay must guard focusTarget?.focus() strictly to !prevOpenRef.current && isOpen"
    );
  });
});
