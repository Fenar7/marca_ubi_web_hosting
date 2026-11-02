"use client";

/**
 * @file ChatPod.tsx
 * @description The pod. It owns the transcript, the two modes (chat and intake), the draft, and the
 *              focus of the page while the panel is open. Nothing else in the module holds state.
 *
 *              The turn choreography is driven from one effect over the intake machine's state rather
 *              than from each handler. Seventeen questions, a re-ask on a failed validation, a review
 *              card, three submission outcomes and an edit path all reduce to "the state changed, so
 *              say the thing that matches the new state", and one emitter cannot disagree with itself.
 *              The signature guard is what keeps React's double-invoked dev effect from printing two
 *              of every question.
 *
 *              Chat mode makes no network call: the resolver is a lookup over the compiled corpus that
 *              arrived as props. The only request the pod can make is a visitor choosing to send a
 *              brief, and that goes to the wizard's endpoint through the wizard's payload builder.
 *
 *              The panel stays mounted and toggles `data-open`. A conditional render would remove the
 *              node before the 220ms exit could run, and §05 §1.1 treats a laggy exit and an absent
 *              exit as the same defect. `visibility: hidden` on the closed state keeps the whole
 *              subtree out of the tab order and the accessibility tree, which is what makes it safe.
 * @author Fenar Khan <86710532+Fenar7@users.noreply.github.com>
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { useRouter } from "next/navigation";

import { prefersReducedMotion } from "@/app/lib/motion";
import { OPTIONAL_TAIL_INTRO, SLOTS, SLOT_ORDER, slotChips, slotOptions } from "./intake/slots";
import type { SlotOption } from "./intake/slots";
import { MAX_SUBMIT_ATTEMPTS, OPTIONAL_TAIL_START, currentSlot, isRequired, useIntakeFlow } from "./intake/useIntakeFlow";
import type { IntakeMode } from "./intake/useIntakeFlow";
import { buildPodPayload, reviewRows } from "./intake/review";
import { createIdempotencyKey, submitBrief } from "./intake/submit";
import { useChatEngine } from "./engine/useChatEngine";
import { PERSISTENT_MENU, PERSONA } from "./knowledge/corpus";
import { clearDraft, hasBeenNudged, hasGrantedConsent, markNudged, readDraft, recordConsent, writeDraft } from "./persistence";
import ChipRow from "./ui/ChipRow";
import Composer from "./ui/Composer";
import PersonaHeader from "./ui/PersonaHeader";
import Transcript from "./ui/Transcript";
import type { AnswerBlock, Chip, KnowledgeBase, Reply, SlotId, SlotValue, TranscriptMessage } from "./types";
import styles from "./ChatPod.module.scss";

/** Typing indicator bounds. Below 320ms it flickers; above 900ms it reads as a stalled request. */
const TYPING_MIN_MS = 320;
const TYPING_MAX_MS = 900;

/** D5: the one permitted nudge fires after 20s with no input, and only above the halfway scroll mark. */
const IDLE_NUDGE_MS = 20_000;
const NUDGE_CUE_MS = 600;
const MAX_SCROLL_DEPTH_PCT = 50;

/** Debounce on the draft write; a burst of chip taps should cost one storage call. */
const DRAFT_WRITE_MS = 400;

/** Gap between the launcher's top edge and the panel's bottom edge, in px. Mirrors the SCSS. */
const PANEL_GAP = 12;

const FOCUSABLE = 'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

/**
 * Words that mean "stop asking me". Checked before every other reading of a typed message, so `stop`
 * can never be filed as the answer to a question. This is the typed half of the `intake.exit` intent,
 * which the matcher cannot reach while the panel is in intake.
 */
const ABORT_WORDS = /^(stop|cancel|exit|quit|never mind|not now)$/i;

/**
 * Words that mean "I am not answering this". A slot's closed set is matched before this list, because
 * `No` is a stored answer to the showcase question and treating it as a decline loses a decision the
 * visitor actually made.
 */
const SKIP_WORDS = /^(skip|no|none|pass|nothing)$/i;

function replyWeight(reply: Reply): number {
  const length = reply.blocks.reduce(
    (total, block) => total + ("text" in block ? block.text.length : block.items.length * 24),
    0,
  );
  return Math.min(TYPING_MAX_MS, Math.max(TYPING_MIN_MS, 220 + length / 6));
}

/**
 * `time` is what the row shows; `timeFull` is the machine value on the `<time>` element. Kept as ISO
 * rather than a pretty date because a pretty date is not a valid `datetime` attribute, and the
 * screen-reader text is written separately instead of read off this string.
 */
function timestamps(date: Date): { time: string; timeFull: string } {
  return {
    time: date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
    timeFull: date.toISOString(),
  };
}

function isFilled(value: SlotValue): boolean {
  return Array.isArray(value) ? value.length > 0 : String(value ?? "").trim().length > 0;
}

/**
 * Highest turn number in a restored transcript. Ids are a letter plus a counter, and a new row that
 * reuses a restored id hands React two messages with the same key, which drops one of them.
 */
function lastTurnNumber(messages: TranscriptMessage[]): number {
  let max = 0;
  for (const message of messages) {
    const parsed = Number.parseInt(message.id.replace(/^\D+/, ""), 10);
    if (Number.isFinite(parsed)) max = Math.max(max, parsed);
  }
  return max;
}

/**
 * Maps what the visitor typed onto a closed set. Matching is case-insensitive but never fuzzy:
 * "techology" is not silently repaired into "Technology", it is re-asked, because a guess that files
 * the wrong industry in the CRM is worse than one more question.
 */
function matchOption(raw: string, options: SlotOption[]): string | null {
  const needle = raw.trim().toLowerCase();
  if (needle.length === 0) return null;
  const hits = options.filter((option) => option.value.toLowerCase() === needle || option.chip.toLowerCase() === needle);
  return hits.length === 1 ? hits[0].value : null;
}

/** How far down the page the visitor has read, as a percentage of the scrollable remainder. */
function scrollDepthPct(): number {
  const doc = document.documentElement;
  const travel = doc.scrollHeight - window.innerHeight;
  if (travel <= 0) return 0;
  return Math.min(100, (window.scrollY / travel) * 100);
}

/**
 * The menu as the current mode can actually act on it. `Start a project` is the one entry that means
 * something different once a brief is open: pressing it mid-intake would restart what is already
 * running, so it is replaced by the exit the intake machine honours.
 */
function menuForMode(mode: IntakeMode): Chip[] {
  if (mode === "CHAT") return [...PERSISTENT_MENU];
  return [
    ...PERSISTENT_MENU.filter((chip) => chip.action.kind !== "intake"),
    { label: "Stop the questions", action: { kind: "intake-action", action: "exit" } },
  ];
}

export default function ChatPod({ knowledge }: { knowledge: KnowledgeBase }) {
  const router = useRouter();
  const engine = useChatEngine(knowledge);
  const { state, slot, send } = useIntakeFlow();

  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [messages, setMessages] = useState<TranscriptMessage[]>([]);
  const [chips, setChips] = useState<Chip[]>([]);
  const [typing, setTyping] = useState(false);
  /** Working buffer for multi-select and link slots; committed to the machine by `Continue`. */
  const [selection, setSelection] = useState<string[]>([]);
  const [nudge, setNudge] = useState(false);
  const [consented, setConsented] = useState<boolean | null>(null);
  const [storageFailed, setStorageFailed] = useState(false);
  /** Height in px currently covered by an on-screen keyboard. */
  const [keyboardInset, setKeyboardInset] = useState(0);
  /** Panel position and scale origin, measured from the right-docked launcher when opened. */
  const [anchor, setAnchor] = useState<{ right: number; y: number; originX: number } | null>(null);

  const launcherRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const sequence = useRef(0);
  const timers = useRef(new Set<number>());
  const emittedTurn = useRef("");
  const submittedKey = useRef<string | null>(null);
  const seeded = useRef(false);
  const chipCount = useRef(0);
  /** Focus recovery is a keyboard concern only: see the effect that reads it. */
  const usedKeyboard = useRef(false);

  // A Set that is never reassigned. An array replaced on each firing leaves the unmount cleanup holding
  // a stale reference, and the timers added afterwards survive the panel.
  const later = useCallback((fn: () => void, ms: number) => {
    const pending = timers.current;
    const id = window.setTimeout(() => {
      pending.delete(id);
      fn();
    }, ms);
    pending.add(id);
  }, []);

  useEffect(() => {
    const pending = timers.current;
    return () => {
      pending.forEach((id) => window.clearTimeout(id));
      pending.clear();
    };
  }, []);

  const append = useCallback((message: Omit<TranscriptMessage, "id" | "time" | "timeFull">, attached: Chip[] = []) => {
    sequence.current += 1;
    const { time, timeFull } = timestamps(new Date());
    setMessages((prev) => [...prev, { ...message, id: `t${sequence.current}`, time, timeFull }]);
    setChips(attached);
  }, []);

  /** Say something as the assistant, with the typing beat that makes a lookup look like a reply. */
  const say = useCallback(
    (reply: Reply, extra?: { kind?: TranscriptMessage["kind"]; rows?: TranscriptMessage["reviewRows"] }) => {
      setTyping(true);
      later(() => {
        setTyping(false);
        append({ speaker: "assistant", blocks: reply.blocks, kind: extra?.kind, reviewRows: extra?.rows }, reply.chips);
      }, replyWeight(reply));
    },
    [append, later],
  );

  const rememberVisitor = useCallback(
    (text: string) => append({ speaker: "visitor", blocks: [{ t: "p", text }] }),
    [append],
  );

  // Open, close, focus
  const closePanel = useCallback(() => {
    setOpen(false);
    setMenuOpen(false);
    window.dispatchEvent(new Event("menu:close"));
    launcherRef.current?.focus();
  }, []);

  const openPanel = useCallback(() => {
    const node = launcherRef.current;
    if (node) {
      const rect = node.getBoundingClientRect();
      setAnchor({
        right: Math.max(0, window.innerWidth - rect.right),
        // The panel sits above the button, so its bottom edge is the launcher's top edge plus the gap.
        y: window.innerHeight - rect.top + PANEL_GAP,
        originX: rect.width / 2,
      });
    }
    setNudge(false);
    setOpen(true);
    // The same event pair the header and the modals use: the smooth-scroll controller stops Lenis so
    // the page behind the panel cannot move while the transcript owns the wheel.
    window.dispatchEvent(new Event("menu:open"));
  }, []);

  // Greeting or restored history, exactly once per page load. A ref rather than a length check
  // because React 19 double-invokes effects in dev, and two greetings would be a bug a visitor sees.
  useEffect(() => {
    if (!open || seeded.current) return;
    seeded.current = true;

    const { time, timeFull } = timestamps(new Date());
    const draft = readDraft();

    if (draft && draft.messages.length > 0) {
      // Restored history is real conversation, so it sits under the resume line rather than above the
      // visitor's own last question, which would read as amnesia.
      sequence.current = Math.max(sequence.current, lastTurnNumber(draft.messages));
      engine.seedFallbacks(draft.fallbackCount);

      // The answers go into the machine, not only onto the screen. A resume line that promised "carry
      // on with your brief" while the slots stayed empty sent the visitor back to question one, which
      // is the opposite of what the draft was written for.
      send({ t: "RESTORE_DRAFT", slots: draft.slots });
      const hasAnswers = SLOT_ORDER.some((entry) => isFilled(draft.slots[entry] ?? ""));

      setMessages([
        ...draft.messages,
        {
          id: `t${(sequence.current += 1)}`,
          speaker: "assistant",
          blocks: [
            {
              t: "p",
              text: hasAnswers
                ? "I still have your answers from earlier in this browser. Press Start a project and I will pick up at the first question you left open."
                : "I still have this conversation from earlier in this browser. Ask me anything, or start a brief.",
            },
          ],
          time,
          timeFull,
        },
      ]);
      setChips([...PERSISTENT_MENU]);
      return;
    }

    sequence.current += 1;
    setMessages([{ id: `t${sequence.current}`, speaker: "assistant", blocks: engine.opening.blocks, time, timeFull }]);
    setChips(engine.opening.chips);
  }, [engine, open, send]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        if (menuOpen) {
          setMenuOpen(false);
          return;
        }
        // §05 §2.4: during intake the first `Esc` stops the questions and keeps the answers. Only a
        // second press closes the panel, so nobody loses a brief by reaching for the wrong key.
        if (state.mode !== "CHAT" && state.mode !== "DONE") {
          send({ t: "EXIT_TO_CHAT" });
          return;
        }
        closePanel();
        return;
      }
      if (event.key !== "Tab") return;

      const node = panelRef.current;
      if (!node) return;
      const focusables = Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (element) => element.offsetParent !== null,
      );
      if (focusables.length === 0) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement as HTMLElement | null;

      // Focus that is somehow outside a modal dialog is pulled to the nearer end instead of being
      // allowed to wander the page behind it.
      if (!node.contains(active)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
        return;
      }
      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown, true);

    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
    };
  }, [closePanel, menuOpen, open, send, state.mode]);

  useEffect(() => {
    if (!open) return;
    const focusId = window.setTimeout(() => inputRef.current?.focus(), 150);
    return () => window.clearTimeout(focusId);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  useEffect(() => setConsented(hasGrantedConsent()), []);

  // Focus discipline: which device the visitor is working with decides whether focus is handed back.
  useEffect(() => {
    const onKey = () => {
      usedKeyboard.current = true;
    };
    const onPointer = () => {
      usedKeyboard.current = false;
    };
    window.addEventListener("keydown", onKey, true);
    window.addEventListener("pointerdown", onPointer, true);
    return () => {
      window.removeEventListener("keydown", onKey, true);
      window.removeEventListener("pointerdown", onPointer, true);
    };
  }, []);

  /**
   * A tapped chip unmounts with the turn that printed it, and focus on a removed node lands on the
   * document body. The trap recovers it on the next Tab, but the visitor has lost their place, so the
   * composer takes it here. It is `aria-disabled` rather than `disabled` while a send is in flight,
   * which is what keeps it a legal target. Pointer visitors get nothing: refocusing a text area on a
   * phone raises the keyboard unasked.
   */
  useEffect(() => {
    const previous = chipCount.current;
    chipCount.current = chips.length;
    if (previous === 0 || !usedKeyboard.current) return;
    const node = panelRef.current;
    const active = document.activeElement;
    if (node && (active === null || active === document.body)) inputRef.current?.focus();
  }, [chips]);

  const grantConsent = useCallback((allowed: boolean) => {
    recordConsent(allowed);
    setConsented(allowed);
    // Withdrawal deletes, not pauses. A visitor who says do not keep it should not be trusting a
    // module that kept the old copy anyway.
    if (!allowed) clearDraft();
  }, []);

  // Persistence
  useEffect(() => {
    // `DONE` is the one state that must not reach storage. The send succeeded, the machine cleared the
    // answers, and a draft written now reappears next load as a receipt for a brief already with the
    // studio, with `clearDraft()` in the success turn undone.
    if (!open || consented !== true || messages.length === 0 || state.mode === "DONE") return;

    const id = window.setTimeout(() => {
      const stored = writeDraft({ messages, slots: state.slots, fallbackCount: engine.fallbackCount() });
      // Quota and blocked storage are reported once in the panel rather than silently dropping the
      // visitor's answers.
      setStorageFailed(!stored);
    }, DRAFT_WRITE_MS);

    return () => window.clearTimeout(id);
  }, [consented, engine, messages, open, state.mode, state.slots]);

  // Intake turns
  const chipsForSlot = useCallback(
    (target: SlotId): Chip[] => {
      const definition = SLOTS[target];
      const optionChips = slotChips(definition, state.slots);

      if (definition.kind === "multi") return [...optionChips, { label: "Continue", action: { kind: "slot-continue", slot: target } }];
      if (definition.kind === "links") return [...optionChips, { label: "That is every link", action: { kind: "slot-continue", slot: target } }];
      if (isRequired(target, state)) return optionChips;
      return [...optionChips, { label: "Skip", action: { kind: "slot-skip", slot: target } }];
    },
    [state],
  );

  useEffect(() => {
    if (state.mode === "CHAT") {
      emittedTurn.current = "";
      return;
    }

    const active = currentSlot(state);
    // Read once, before the re-ask branch returns: a second `state.error` test would be narrowed away
    // by TypeScript even though the ERROR branch below is a different turn of the machine.
    const failureMessage = state.error?.message ?? "";
    const failureSlot = state.error?.slot;
    const signature = [state.mode, active, state.slotIndex, state.attempt, failureMessage, state.phoneRequired].join("|");
    if (emittedTurn.current === signature) return;
    emittedTurn.current = signature;

    if (state.mode === "INTAKE_FORM") {
      const definition = SLOTS[active];
      const blocks: AnswerBlock[] = [];
      if (state.slotIndex === OPTIONAL_TAIL_START) blocks.push({ t: "p", text: OPTIONAL_TAIL_INTRO });

      // A failed validation re-asks the same question with the reason above it and the same buttons
      // under it. The visitor never has to remember which chip they were aiming at.
      if (failureMessage.length > 0) {
        say({
          blocks: [{ t: "p", text: failureMessage }, ...blocks, { t: "p", text: definition.question }],
          chips: failureSlot && failureSlot === active ? chipsForSlot(active) : menuForMode(state.mode),
        });
        return;
      }

      // The reason a promoted question is now mandatory belongs inside the question, not in a
      // separate apology line above it.
      blocks.push({
        t: "p",
        text:
          active === "phone" && state.phoneRequired
            ? "You passed on the email, so I do need a number to send this to. What is it?"
            : definition.question,
      });

      const stored = state.slots[active];
      setSelection(Array.isArray(stored) ? [...stored] : []);
      say({ blocks, chips: chipsForSlot(active) });
      return;
    }

    if (state.mode === "REVIEW") {
      const rows = reviewRows(state.slots);
      say(
        {
          blocks: [
            ...(failureMessage.length > 0 ? [{ t: "p", text: failureMessage } as AnswerBlock] : []),
            { t: "p", text: "Here is what I have. Tap any line to change it." },
          ],
          chips: [
            { label: "Send it", action: { kind: "intake-action", action: "submit" } },
            { label: "Not yet", action: { kind: "intake-action", action: "later" } },
            { label: "Stop and ask questions instead", action: { kind: "intake-action", action: "exit" } },
          ],
        },
        { kind: "review", rows },
      );
      return;
    }

    if (state.mode === "SUBMITTING") {
      setChips([]);
      return;
    }

    if (state.mode === "DONE") {
      // `sentTo` comes off the machine rather than being recomputed from `state.slots`: `SUBMIT_OK`
      // cleared the answers on the same turn, so the contact fields are empty by now and this line
      // would end with "come back to you at" and nothing after it.
      say({
        blocks: [{ t: "p", text: `Sent. It is with the studio now, and someone will come back to you at ${state.sentTo}.` }],
        chips: [...PERSISTENT_MENU.slice(0, 3), { label: "Close", action: { kind: "close" } }],
      });
      clearDraft();
      engine.reset();
      return;
    }

    if (state.mode === "ERROR") {
      const exhausted = state.attempt >= MAX_SUBMIT_ATTEMPTS;
      const options: Chip[] = [
        { label: "Open the full form", action: { kind: "route", href: "/start-project" } },
        { label: "Talk to a person", action: { kind: "intent", id: "contact" } },
      ];
      // Withheld once the machine has stopped accepting a send, so the row cannot offer a press that
      // the reducer will refuse.
      if (!exhausted) options.unshift({ label: "Send it again", action: { kind: "intake-action", action: "retry" } });

      say({
        blocks: [
          { t: "p", text: failureMessage.length > 0 ? failureMessage : "That did not reach us." },
          {
            t: "p",
            text: exhausted
              ? "Three tries is where I stop rather than keep you here. Your answers are still saved in this chat on this device, or you can use the full form to start fresh."
              : "I cannot tell whether that reached us. If you send again from the same contact details the studio updates the lead rather than opening a second one.",
          },
        ],
        chips: options,
      });
    }
  }, [chipsForSlot, engine, say, state]);

  // Submission
  useEffect(() => {
    if (state.mode !== "SUBMITTING") return;
    const key = state.idempotencyKey;
    if (!key) return;
    // Strict mode mounts this effect twice against the same state. One request per submission intent
    // is the rule, and the key is what makes the second harmless even if it were sent.
    if (submittedKey.current === key) return;
    submittedKey.current = key;

    let cancelled = false;

    const run = async () => {
      const outcome = await submitBrief(buildPodPayload(state.slots, key), { idempotencyKey: key });
      if (cancelled) return;

      submittedKey.current = null;
      if (outcome.ok) {
        send({ t: "SUBMIT_OK" });
        return;
      }

      if (outcome.status === 429) {
        // The route's own ceiling, quoted honestly with the studio's published contact details, and
        // the draft stays so the visitor can try later.
        const wait = outcome.retryAfterSeconds ? ` for the next ${Math.ceil(outcome.retryAfterSeconds / 60)} minutes` : "";
        send({
          t: "SUBMIT_FAIL",
          status: 429,
          message: `That is too many attempts from here${wait}. Call ${knowledge.studio.phone} or email ${knowledge.studio.email} and we will pick it up.`,
        });
        return;
      }

      send({
        t: "SUBMIT_FAIL",
        // The route answers a Zod refusal with 400 and names the field. The machine treats any named
        // field failure the same way: back to the one question, not to a generic error state.
        status: outcome.status === 400 ? 422 : outcome.status,
        message: outcome.message,
        ...(outcome.slot ? { slot: outcome.slot } : {}),
      });
    };

    void run();
    return () => {
      cancelled = true;
      if (submittedKey.current === key) {
        submittedKey.current = null;
      }
    };
  }, [knowledge.studio.email, knowledge.studio.phone, send, state.idempotencyKey, state.mode, state.slots]);

  // Starting intake
  const startIntake = useCallback(() => {
    emittedTurn.current = "";
    const reply = engine.byId("intake.trigger");
    send({ t: "START_INTAKE" });
    // The trigger line explains the rules; the machine's own emitter prints the first question under
    // it, so the chip row here would only be in the way for half a second.
    if (reply) say({ blocks: reply.blocks, chips: [] });
  }, [engine, say, send]);

  // Chip handling
  /** Multi-select taps answer nothing on their own: they join a buffer the `Continue` chip commits. */
  const toggleIntoSelection = useCallback(
    (value: string, target: SlotId) => {
      const definition = SLOTS[target];
      // Read through `slotOptions`, not `definition.options`: the services question has no static set,
      // so a label looked up here would fall back to the raw value for every service chip.
      const label = slotOptions(definition, state.slots).find((option) => option.value === value)?.chip ?? value;
      const next = selection.includes(value) ? selection.filter((item) => item !== value) : [...selection, value];
      setSelection(next);
      // Outside the state updater: React may run an updater twice, and an `append` in here would print
      // the count line twice under the same tap.
      append(
        { speaker: "assistant", blocks: [{ t: "p", text: `${label}${next.includes(value) ? " added" : " removed"}. ${next.length} picked.` }] },
        chipsForSlot(target),
      );
    },
    [append, chipsForSlot, selection, state.slots],
  );

  const editSlot = useCallback(
    (target: SlotId) => {
      const row = reviewRows(state.slots).find((entry) => entry.slot === target);
      rememberVisitor(row ? `Change: ${row.label}` : `Change ${SLOTS[target].label}`);
      emittedTurn.current = "";
      send({ t: "EDIT_SLOT", slot: target });
    },
    [rememberVisitor, send, state.slots],
  );

  const onChip = useCallback(
    (chip: Chip) => {
      const action = chip.action;
      setMenuOpen(false);

      switch (action.kind) {
        case "intent": {
          const reply = engine.byId(action.id);
          if (reply) say(reply);
          return;
        }
        case "route": {
          closePanel();
          router.push(action.href);
          return;
        }
        case "external": {
          // `tel:` and `mailto:` only. The coverage test rejects any other origin in a compiled link,
          // so a content edit cannot turn a chip into an off-site redirect.
          window.location.href = action.href;
          return;
        }
        case "close": {
          closePanel();
          return;
        }
        case "intake": {
          if (state.mode === "CHAT") startIntake();
          return;
        }
        case "slot-toggle": {
          if (currentSlot(state) !== action.slot) return;
          toggleIntoSelection(action.value, action.slot);
          return;
        }
        case "slot-pick": {
          const active = currentSlot(state);
          if (active !== action.slot) return;
          rememberVisitor(chip.label);
          send({ t: "ANSWER", slot: active, value: action.value });
          return;
        }
        case "slot-continue": {
          const active = currentSlot(state);
          if (active !== action.slot) return;
          rememberVisitor(selection.length > 0 ? selection.join(", ") : "Nothing more");
          send({ t: "ANSWER", slot: active, value: [...selection] });
          setSelection([]);
          return;
        }
        case "slot-skip": {
          const active = currentSlot(state);
          if (active !== action.slot) return;
          rememberVisitor("Skip");
          send({ t: "SKIP", slot: active });
          return;
        }
        case "slot-edit": {
          editSlot(action.slot);
          return;
        }
        case "intake-action": {
          if (action.action === "submit") send({ t: "SUBMIT", idempotencyKey: createIdempotencyKey() });
          if (action.action === "retry") send({ t: "RETRY", idempotencyKey: createIdempotencyKey() });
          if (action.action === "later") closePanel();
          if (action.action === "exit") send({ t: "EXIT_TO_CHAT" });
          return;
        }
      }
    },
    [closePanel, editSlot, engine, rememberVisitor, router, selection, send, startIntake, state, toggleIntoSelection],
  );

  // Free text
  const onFreeText = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (trimmed.length === 0) return;
      rememberVisitor(trimmed);

      if (state.mode === "SUBMITTING") return;

      if (state.mode === "INTAKE_FORM" && slot) {
        // Before every other reading of the word: "stop" typed at a question has to leave the questions,
        // not become the answer to them.
        if (ABORT_WORDS.test(trimmed)) {
          send({ t: "EXIT_TO_CHAT" });
          return;
        }

        const definition = SLOTS[slot];

        if (definition.kind === "links") {
          const link = /^https?:\/\/\S+$/i.test(trimmed) ? trimmed : null;
          if (link === null) {
            say({ blocks: [{ t: "p", text: "I need the full link, starting with https." }], chips: chipsForSlot(slot) });
            return;
          }
          if (selection.length >= 5) {
            say({
              blocks: [{ t: "p", text: "I can take up to 5 links at most. Press continue to move on." }],
              chips: chipsForSlot(slot),
            });
            return;
          }
          const next = [...selection, link];
          setSelection(next);
          say({
            blocks: [
              {
                t: "p",
                text:
                  next.length >= 5
                    ? "Got it, that is 5 links (the maximum). Press continue to move on."
                    : `Got it, ${next.length} so far. Another one, or is that everything?`,
              },
            ],
            chips: chipsForSlot(slot),
          });
          return;
        }

        const options = slotOptions(definition, state.slots);
        const matched = matchOption(trimmed, options);

        // A closed set is tried first. `No` is the stored answer to the showcase question, and a skip
        // test that runs ahead of it loses a decision the visitor actually made.
        if (matched === null && SKIP_WORDS.test(trimmed)) {
          send({ t: "SKIP", slot });
          return;
        }

        if (definition.kind === "multi") {
          if (matched) toggleIntoSelection(matched, slot);
          else say({ blocks: [{ t: "p", text: "Pick one of the buttons, or type the name of one exactly." }], chips: chipsForSlot(slot) });
          return;
        }

        if (matched) {
          send({ t: "ANSWER", slot, value: matched });
          return;
        }

        // A typed answer for a question with buttons never goes to the validator as free text: a
        // misspelt industry has to be re-asked, not filed.
        if (options.length > 0) {
          say({ blocks: [{ t: "p", text: "I can only choose from the options I showed you, or skip." }], chips: chipsForSlot(slot) });
          return;
        }

        send({ t: "ANSWER", slot, value: trimmed });
        return;
      }

      if (state.mode === "REVIEW") {
        say({
          blocks: [{ t: "p", text: "Tap the line that needs changing, or press send it. I will not send anything on a typed word." }],
          chips: reviewRows(state.slots).map((row) => ({ label: row.label, action: { kind: "slot-edit", slot: row.slot } as const })),
        });
        return;
      }

      if (state.mode === "DONE") send({ t: "RESET" });

      const turn = engine.ask(trimmed);
      if (turn.kind === "answer" && turn.intentId === "intake.trigger") {
        startIntake();
        return;
      }
      say(turn.reply);
    },
    [chipsForSlot, engine, rememberVisitor, say, selection, send, slot, startIntake, state],
  );

  // Idle nudge (D5)
  useEffect(() => {
    if (open || prefersReducedMotion()) return;

    const events: (keyof WindowEventMap)[] = ["pointermove", "pointerdown", "keydown", "scroll", "wheel"];
    let timer = 0;

    const restart = () => {
      // Checked at the moment of the cue as well as when the effect ran: without this, a second tab
      // opened in the same session would fire its own nudge, and D5 allows one per session.
      if (hasBeenNudged()) {
        window.clearTimeout(timer);
        events.forEach((name) => window.removeEventListener(name, restart));
        return;
      }
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        // Past the halfway mark the visitor is reading, not browsing, and a cue is an interruption.
        if (scrollDepthPct() > MAX_SCROLL_DEPTH_PCT) return;
        markNudged();
        setNudge(true);
        later(() => setNudge(false), NUDGE_CUE_MS);
      }, IDLE_NUDGE_MS);
    };

    restart();
    events.forEach((name) => window.addEventListener(name, restart, { passive: true }));

    return () => {
      window.clearTimeout(timer);
      events.forEach((name) => window.removeEventListener(name, restart));
    };
  }, [later, open]);

  // Derived
  /**
   * M6: a full-height sheet on a phone is only usable if the composer stays above the keyboard.
   * `visualViewport` is the only signal that knows a keyboard is open, and the inset is handed to the
   * stylesheet rather than applied as a transform, so the sheet's own layout does the work.
   */
  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;

    const measure = () => {
      const covered = window.innerHeight - viewport.height - viewport.offsetTop;
      setKeyboardInset(covered > 0 ? Math.round(covered) : 0);
    };

    measure();
    viewport.addEventListener("resize", measure);
    viewport.addEventListener("scroll", measure);
    return () => {
      viewport.removeEventListener("resize", measure);
      viewport.removeEventListener("scroll", measure);
    };
  }, []);

  const progress = useMemo(() => {
    const answered = SLOT_ORDER.filter((entry) => isFilled(state.slots[entry])).length;
    return { answered, total: SLOT_ORDER.length };
  }, [state.slots]);

  const activeDefinition = slot ? SLOTS[slot] : null;
  const composerBlocked = state.mode === "SUBMITTING";
  const isSelected = useCallback(
    (chip: Chip): boolean => chip.action.kind === "slot-toggle" && selection.includes(chip.action.value),
    [selection],
  );

  const panelStyle = {
    "--pod-keyboard": `${keyboardInset}px`,
    ...(anchor
      ? {
          "--pod-right": `${anchor.right}px`,
          "--pod-y": `${anchor.y}px`,
          // §05 §1.2: the panel grows out of the launcher button docked at bottom-right.
          "--pod-origin": `calc(100% - ${anchor.originX}px) 100%`,
        }
      : null),
  } as CSSProperties;

  return (
    <>
      <button
        ref={launcherRef}
        type="button"
        className={styles.launcher}
        data-open={open || undefined}
        data-nudge={nudge || undefined}
        onClick={() => (open ? closePanel() : openPanel())}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-controls="mubi-pod-panel"
      >
        <span className={styles.launcherGlyph} aria-hidden="true">
          {open ? "×" : "U"}
        </span>
        <span className={styles.launcherText}>
          <span className={styles.launcherName}>{PERSONA.name}</span>
          <span className={styles.launcherHint}>{open ? "Close" : "Ask"}</span>
        </span>
        {/* Named from its own content rather than an `aria-label`: the two visible words are separate flex
            lines, so a label that spelled them "Ubi Ask" did not contain the concatenated text a checker
            reads, and SC 2.5.3 failed on our own launcher. Only the disclosure rides along invisibly. */}
        <span className={styles.srOnly}>{`${PERSONA.roleLine} for Marca Ubi`}</span>
      </button>

      <div className={styles.scrim} data-open={open || undefined} onClick={closePanel} aria-hidden="true" />

      <section
        ref={panelRef}
        id="mubi-pod-panel"
        className={styles.panel}
        data-open={open || undefined}
        style={panelStyle}
        role="dialog"
        aria-modal="true"
        aria-labelledby="mubi-pod-title"
      >
        <PersonaHeader titleId="mubi-pod-title" menuOpen={menuOpen} onMenu={() => setMenuOpen((prev) => !prev)} onClose={closePanel} />

        {state.mode !== "CHAT" ? (
          <div className={styles.progress}>
            <span className={styles.progressLabel}>Your brief</span>
            <span className={styles.progressRail} aria-hidden="true">
              <span
                className={styles.progressFill}
                style={{ "--fill": `${Math.round((progress.answered / progress.total) * 100)}%` } as CSSProperties}
              />
            </span>
            <span className={styles.progressValue}>{`${progress.answered} of ${progress.total}`}</span>
            {/* Hidden rather than inert mid-flight: the machine refuses to leave intake while a request
                is outstanding, and a control that cannot do its job is a defect, not an affordance. */}
            {state.mode !== "SUBMITTING" ? (
              <button type="button" className={styles.progressExit} onClick={() => send({ t: "EXIT_TO_CHAT" })}>
                Stop the questions
              </button>
            ) : null}
          </div>
        ) : null}

        {menuOpen ? (
          <div id="mubi-pod-menu" className={styles.menu}>
            <p className={styles.menuNote}>What I can do</p>
            <ChipRow chips={menuForMode(state.mode)} onChip={onChip} ariaLabel="Persistent menu" />
          </div>
        ) : null}

        <Transcript messages={messages} typing={typing} onEditSlot={editSlot} rowsActive={state.mode === "REVIEW"} onNavigate={closePanel} />

        <div className={styles.tray} data-count={chips.length}>
          <ChipRow chips={chips} onChip={onChip} isSelected={isSelected} ariaLabel="Choose a reply" />
        </div>

        {consented === null ? (
          <div className={styles.consent}>
            <p>
              Nothing you type leaves this browser unless you send a brief. If you do start one, I can keep
              your answers on this device for a fortnight so you can come back to them.
            </p>
            <div className={styles.consentActions}>
              <button type="button" className={styles.consentYes} onClick={() => grantConsent(true)}>
                Keep them here
              </button>
              <button type="button" className={styles.consentNo} onClick={() => grantConsent(false)}>
                Do not save
              </button>
            </div>
          </div>
        ) : consented === false ? (
          <p className={styles.consentQuiet}>
            Not saving answers on this device.
            <button type="button" className={styles.consentLink} onClick={() => grantConsent(true)}>
              Allow saving
            </button>
          </p>
        ) : null}

        {storageFailed ? (
          <p className={styles.storageWarning} role="status">
            This browser will not let me save anything, so your answers only live while this tab stays open.
          </p>
        ) : null}

        <Composer
          inputRef={inputRef}
          onSubmit={onFreeText}
          blocked={composerBlocked}
          blockReason="Sending your brief. One moment."
          placeholder={activeDefinition?.placeholder}
          maxLength={activeDefinition?.maxLength}
          helper={
            activeDefinition && isFilled(state.slots[activeDefinition.id]) ? `${activeDefinition.label} is already answered. Typing replaces it.` : undefined
          }
        />
      </section>
    </>
  );
}
