/**
 * @file chatpod-contrast.test.ts
 * @description The Chat Pod stylesheet makes one promise it cannot show by reading: that every ink tone
 *              clears WCAG AA on the surface it is actually painted on. `ChatPod.module.scss` used to
 *              assert "strictly guarantee WCAG AA 4.5:1" in its own header while `$quiet` measured 3.3:1
 *              and `$muted` measured 4.24:1 inside the assistant bubble it is used in. The claim was the
 *              defect; this file replaced it, because a comment is not evidence.
 *
 *              Every pair is read out of the shipped SCSS instead of restated here, so changing `$muted`
 *              for a content reason re-measures rather than passing a hardcoded number. Translucent tones
 *              (placeholder, idle send, composing dot, progress rail, error tint) are flattened over their
 *              real backing colour first: contrast is computed on what the eye receives, not on the alpha
 *              written in the file. Where a tone is also dimmed by an `opacity` the flattening multiplies
 *              both, because a fill measured alone is not the frame that gets painted.
 *
 *              The second block holds the motion contract that goes with it. The reduced-motion branch,
 *              the fill mode of every entrance, and the two wiring lines the resolver depends on are
 *              pinned here because each one was a live defect at some point in this module's history.
 * @author Fenar Khan <86710532+Fenar7@users.noreply.github.com>
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";

const scss = readFileSync(path.resolve("src/app/chat-pod/ChatPod.module.scss"), "utf8");
const transcript = readFileSync(path.resolve("src/app/chat-pod/ui/Transcript.tsx"), "utf8");
const pod = readFileSync(path.resolve("src/app/chat-pod/ChatPod.tsx"), "utf8");

const CANVAS = "#ffffff";
/** `.bubbleAssistant`: the one tinted surface in the pod, and the reason the body tone needed re-measuring. */
const BUBBLE = "#f7f7f8";

/** Relative luminance per WCAG 2.1, on a plain `#rrggbb`. */
function luminance(hex: string): number {
  const channels = [1, 3, 5].map((at) => Number.parseInt(hex.slice(at, at + 2), 16) / 255);
  const linear = channels.map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
}

function ratio(foreground: string, background: string): number {
  const first = luminance(foreground);
  const second = luminance(background);
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
}

/**
 * An `rgba()` wash composited onto a known surface, returned as the flat colour a checker would sample.
 * `index` is the channel being laid down, so the same function serves black washes and brand red.
 */
function flatten(rgb: [number, number, number], alpha: number, background: string): string {
  const out = rgb.map((value, channel) => {
    const back = Number.parseInt(background.slice(1 + channel * 2, 3 + channel * 2), 16);
    return Math.round(Math.max(0, Math.min(255, value * alpha + back * (1 - alpha))));
  });
  return `#${out.map((value) => value.toString(16).padStart(2, "0")).join("")}`;
}

/** Read a `$token: #rrggbb;` definition out of the shipped module. */
function token(name: string): string {
  const found = new RegExp(`\\$${name}:\\s*(#[0-9a-f]{6})\\s*;`, "i").exec(scss);
  assert.ok(found, `ChatPod.module.scss must define $${name} as a six digit hex so it can be measured`);
  return found[1].toLowerCase();
}

/** Read the four numbers of a specific `rgba()` declaration so an alpha tone is measured, not trusted. */
function rgbaOf(declaration: RegExp, where: string): [number, number, number, number] {
  const found = declaration.exec(scss);
  assert.ok(found, `ChatPod.module.scss must still declare the ${where} tone as an rgba() so it can be composited`);
  return [Number(found[1]), Number(found[2]), Number(found[3]), Number(found[4])];
}

/** A declaration value is either a hex or a token name; both resolve to what the eye actually receives. */
function resolveValue(value: string): string {
  return value.startsWith("$") ? token(value.slice(1)) : value.toLowerCase();
}

/** The ink a rule paints, read out of the shipped module so the test follows the stylesheet, not a copy. */
function inkOf(rule: RegExp, where: string): string {
  const found = rule.exec(scss);
  assert.ok(found, `${where} must declare its ink explicitly, as a hex or a token, so it can be measured`);
  return resolveValue(found[1]);
}

/**
 * Every opacity the composing dot can be painted at: the declaration (what a reduced-motion visitor sees
 * permanently) and each keyframe stop (what a moving one sees at the dimmest point of the wave). A
 * graphic's floor belongs to its faintest frame, so the test needs them all, not one of them.
 */
function dotOpacities(): [string, number][] {
  const declared = /\.dot \{[^}]*?opacity: ([\d.]+);/.exec(scss);
  assert.ok(declared, ".dot must declare a resting opacity so its faintest frame can be measured");
  const frames = [...(keyframesBlock("dotPulse").matchAll(/opacity: ([\d.]+);/g) ?? [])].map((m) => Number(m[1]));
  assert.ok(frames.length >= 2, "the pulse must be read from its keyframes, not from a number restated here");
  return [["at rest", Number(declared[1])], ...frames.map((v, i) => [`keyframe ${i + 1}`, v] as [string, number])];
}

/** The text of one `@keyframes` block, so a contract can be measured against the animation it ships in. */
function keyframesBlock(name: string): string {
  const at = scss.indexOf(`@keyframes ${name} {`);
  assert.ok(at >= 0, `the module must still define @keyframes ${name}`);
  let depth = 0;
  for (let i = at + `@keyframes ${name} `.length; i < scss.length; i += 1) {
    if (scss[i] === "{") depth += 1;
    if (scss[i] === "}") {
      depth -= 1;
      if (depth === 0) return scss.slice(at, i);
    }
  }
  assert.fail(`@keyframes ${name} is unbalanced`);
}

describe("Chat Pod contrast contract (measured, not asserted in a comment)", () => {
  it("keeps every ink tone at AA 4.5:1 on the surface it is painted on", () => {
    const pairs: [string, string, number][] = [
      [token("ink"), CANVAS, 4.5],
      [token("ink"), BUBBLE, 4.5],
      [token("muted"), CANVAS, 4.5],
      [token("muted"), BUBBLE, 4.5],
      [token("quiet"), CANVAS, 4.5],
      [token("text-body"), CANVAS, 4.5],
      [token("client-accent-red"), CANVAS, 4.5],
      [CANVAS, token("client-accent-red"), 4.5],
      [CANVAS, token("client-accent-red-hover"), 4.5],
    ];

    for (const [foreground, background, floor] of pairs) {
      const measured = ratio(foreground, background);
      assert.ok(measured >= floor, `${foreground} on ${background} measures ${measured.toFixed(2)}:1, under the ${floor}:1 floor`);
    }
  });

  it("re-measures the body tone inside the tinted bubble that broke the original claim", () => {
    // 767676 clears 4.54 on the canvas and fails at 4.24 on the bubble, which is where `.listSub` and the
    // review labels actually sit. The name is separate from the table so this pair cannot be dropped.
    assert.ok(ratio(token("muted"), BUBBLE) >= 4.5, "$muted must clear AA inside the assistant bubble");
    assert.ok(
      ratio(token("muted"), CANVAS) > ratio(token("quiet"), CANVAS),
      "$quiet is the meta tone and must stay the fainter of the two, at the AA floor and no lower",
    );
  });

  it("composites the translucent tones and clears the floor on what the eye receives", () => {
    const placeholder = rgbaOf(/&::placeholder \{\s*[^}]*?color: rgba\((\d+), (\d+), (\d+), ([\d.]+)\)/, "field placeholder");
    const idleFill = rgbaOf(/\.sendIdle \{\s*background: rgba\((\d+), (\d+), (\d+), ([\d.]+)\)/, "idle send fill");
    const dotFill = rgbaOf(/\.dot \{\s*animation:[^;]+;\s*background: rgba\((\d+), (\d+), (\d+), ([\d.]+)\)/, "composing dot");

    assert.ok(
      ratio(flatten([placeholder[0], placeholder[1], placeholder[2]], placeholder[3], BUBBLE), BUBBLE) >= 4.5,
      "the placeholder is the only hint of what a slot wants, so it is content at AA",
    );
    // The dot's fill is not what is painted: the pulse multiplies it. Measuring `rgba(0,0,0,.55)` on its
    // own returns 4.74 while the frame the visitor actually sees sat at 1.58, and that frame is the
    // *resting* state under reduced motion, so the floor has to be charged to fill × opacity.
    for (const [where, opacity] of dotOpacities()) {
      const painted = flatten([dotFill[0], dotFill[1], dotFill[2]], dotFill[3] * opacity, CANVAS);
      const measured = ratio(painted, CANVAS);
      assert.ok(measured >= 3, `the composing dot ${where} (${painted}) measures ${measured.toFixed(2)}:1; a graphic needs 3:1`);
    }
    assert.ok(
      ratio(token("muted"), flatten([idleFill[0], idleFill[1], idleFill[2]], idleFill[3], CANVAS)) >= 4.5,
      "the idle send label must clear AA on the idle fill it sits in, not on the canvas behind it",
    );
    // A held send is not a dead control: `aria-disabled` keeps the field focusable and keeps the visitor's
    // own brief in it, so the WCAG exception for inactive components cannot be spent on this ink.
    const wash = rgbaOf(/&\[aria-disabled="true"\] \{\s*background: rgba\((\d+), (\d+), (\d+), ([\d.]+)\)/, "blocked field wash");
    const blockedFill = flatten([wash[0], wash[1], wash[2]], wash[3], CANVAS);
    assert.ok(
      ratio(inkOf(/&\[aria-disabled="true"\] \{[^}]*color: (#[0-9a-f]{6}|\$[a-z-]+)/i, "the blocked composer"), blockedFill) >= 4.5,
      "text a visitor can still read and must not lose while the panel is holding their send",
    );
  });

  it("keeps the progress fill legible on its own rail and the error ink on its tint", () => {
    const rail = rgbaOf(/\.progressRail \{\s*background: rgba\((\d+), (\d+), (\d+), ([\d.]+)\)/, "progress rail");
    assert.ok(
      ratio(token("client-accent-red"), flatten([rail[0], rail[1], rail[2]], rail[3], CANVAS)) >= 3,
      "the intake progress fill must clear 3:1 on the rail it is measured against",
    );

    const tint = rgbaOf(/\.bubbleError \{\s*background: rgba\((\d+), (\d+), (\d+), ([\d.]+)\)/, "error bubble tint");
    const compositedTint = flatten([tint[0], tint[1], tint[2]], tint[3], CANVAS);
    assert.ok(
      ratio(inkOf(/\.bubbleError \{[^}]*color: (#[0-9a-f]{6}|\$[a-z-]+)/i, ".bubbleError"), compositedTint) >= 4.5,
      "an error message is the one line a visitor has to be able to read",
    );

    // The route links inside an assistant answer are the only accent-coloured prose the panel ships, and
    // they sit on the tinted bubble, where the published brand red lands at 4.33:1. Measured here because
    // a comment that claims AA for a colour on a tint nobody measured is the defect this file exists to catch.
    const linkInk = inkOf(/\.link \{\s*border-top:[^;]+;\s*color: (#[0-9a-f]{6}|\$[a-z-]+)/i, ".link");
    for (const [surface, name] of [
      [CANVAS, "the canvas"],
      [BUBBLE, "the assistant bubble"],
      [compositedTint, "the error tint"],
    ] as const) {
      const measured = ratio(linkInk, surface);
      assert.ok(measured >= 4.5, `the link ink ${linkInk} on ${name} measures ${measured.toFixed(2)}:1, under AA for text`);
    }
  });

  it("purges the tones that failed and the tones the brand forbids", () => {
    for (const banned of ["#8e8e93", "#999999", "#cccccc", "#ff6100", "#2563eb"]) {
      assert.ok(!scss.includes(banned), `ChatPod.module.scss must not contain ${banned}`);
    }
    assert.ok(scss.includes("chatpod-contrast.test.ts"), "the stylesheet's contrast promise must name the test that measures it");
  });
});

describe("Chat Pod motion contract (fluid, and switched off when motion is refused)", () => {
  it("holds a reduced-motion branch that neutralises every entrance in the module", () => {
    const at = scss.indexOf("@media (prefers-reduced-motion: reduce)");
    assert.ok(at > 0, "the module must ship a reduced-motion branch");
    const reduce = scss.slice(at);
    for (const selector of [".rowAssistant", ".rowVisitor", ".chip", ".dot", ".statusPulse", ".newMessage", ".launcherGlyph", ".launcherAvatarWrap", ".panel"]) {
      assert.ok(reduce.includes(selector), `the reduced-motion branch must cover ${selector}`);
    }
  });

  it("never fills an entrance forwards, so a settled row cannot pin its own transform", () => {
    const pinned = scss.match(/animation:[^;]*\sboth\s*;/g) ?? [];
    assert.deepEqual(pinned, [], "an entrance uses `backwards`: `both` keeps owning transform after the beat and deadens hover and press states");
  });

  it("keeps the composing indicator mounted and faded rather than mounted and popped", () => {
    assert.ok(/\.typing \{[^}]*opacity: 0;/.test(scss), "the indicator fades in from zero");
    assert.ok(scss.includes('&[data-on="true"]'), "the fade is driven by the composing state, not by mounting");
    assert.ok(scss.includes("animation-play-state: paused"), "a faded-out indicator must not keep burning frames");
    assert.ok(transcript.includes("data-on={typing || undefined}"), "the transcript owns the composing flag");
  });

  it("glides on a reply arrival, snaps on a first fill, and never drags a reader who scrolled up", () => {
    assert.ok(transcript.includes('behavior: prefersReducedMotion() ? "auto" : "smooth"'), "a glide is only ever offered when motion is allowed");
    assert.ok(transcript.includes("ANCHOR_PX"), "the follow is conditional on the reader already being at the end");
    assert.ok(transcript.includes('node.addEventListener("scroll", onScroll'), "the pill reads the reader position from the browser, not from a paint effect");
    assert.ok(transcript.includes("node.scrollTop = node.scrollHeight"), "a restored conversation lands at its end instead of at a question already answered");
  });

  it("echoes a tapped reply chip as the visitor's own line", () => {
    // §05 §1.5: the pressed label becomes their message, so the transcript always shows the question
    // before the answer. `slot-pick` already did this; `intent` was the asymmetry left over.
    const intentCase = /case "intent": \{[\s\S]*?\n\s*\}/.exec(pod);
    assert.ok(intentCase, "the chip handler must still route an intent chip");
    assert.ok(intentCase[0].includes("rememberVisitor(chip.label)"), "a chip tap has to appear as a sent message");
  });

  it("tells the resolver what the restored screen is showing", () => {
    assert.ok(pod.includes("engine.seedTurn(PERSISTENT_MENU)"), "a resumed draft must re-seed the turn the visitor can see");
  });
});
