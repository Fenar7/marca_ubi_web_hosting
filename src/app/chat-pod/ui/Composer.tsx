"use client";

/**
 * @file Composer.tsx
 * @description The conversational intake textarea and send affordance.
 *
 *              Architectural Rationale & Invariants:
 *              - Caret & Selection Stability: Controlled React 19 `<textarea>` elements natively
 *                preserve the cursor position and text selection range as long as `node.value` is
 *                not programmatically overwritten with stale state or manual `setSelectionRange()` calls.
 *                Length limits are enforced by the native DOM `maxLength={limit}` attribute, with defensive
 *                clamping on paste. Composition sessions (IME/accents/mobile swipe) are tracked via
 *                `isComposingRef` to avoid premature form submission during character composition.
 *              - Progressive Auto-Growth: Leverages modern CSS `field-sizing: content;` when supported
 *                by the client browser engine. In legacy engines, a non-destructive `useLayoutEffect`
 *                adjusts `textarea.style.height` between 40px and 140px based on `scrollHeight` without
 *                triggering layout thrashing or selection drops.
 *              - Accessibility: `aria-disabled` retains the control in the tab order and accessibility
 *                tree during network activity rather than removing it with the HTML `disabled` attribute.
 *
 * @author Fenar Khan <86710532+Fenar7@users.noreply.github.com>
 */

import { memo, useCallback, useLayoutEffect, useRef, useState } from "react";
import type { ChangeEvent, KeyboardEvent, RefObject } from "react";

import styles from "../ChatPod.module.scss";

/** Maximum input character count enforced across free-form conversational queries. */
const MAX_CHARS = 500;

interface Props {
  inputRef: RefObject<HTMLTextAreaElement | null>;
  onSubmit: (text: string) => void;
  /** True while the panel is in a mode that does not accept free text. */
  blocked: boolean;
  blockReason: string;
  /** The slot's own example, so an answer like a phone number is not typed as a sentence. */
  placeholder?: string;
  /** Maximum length allowed for input, dynamically configured by slot definition. */
  maxLength?: number;
  /** Tells the visitor the question they are on is already answered, so typing replaces it. */
  helper?: string;
}

function Composer({
  inputRef,
  onSubmit,
  blocked,
  blockReason,
  placeholder,
  maxLength,
  helper,
}: Props) {
  const [value, setValue] = useState("");
  const limit = maxLength ?? MAX_CHARS;
  const isComposingRef = useRef(false);

  const empty = value.trim().length === 0;

  const send = useCallback(() => {
    const text = value.trim();
    if (text.length === 0 || blocked) return;
    onSubmit(text);
    setValue("");
    const textarea = inputRef.current;
    if (textarea) {
      textarea.style.height = "auto";
    }
  }, [blocked, onSubmit, value, inputRef]);

  const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    const next = event.target.value;
    // Native maxLength limits user keystrokes; defensive slice handles external oversized clipboard pastes
    setValue(next.length > limit ? next.slice(0, limit) : next);
  };

  useLayoutEffect(() => {
    const textarea = inputRef.current;
    if (!textarea) return;

    // Progressive enhancement: CSS field-sizing: content handles dynamic height natively in modern engines
    if (typeof CSS !== "undefined" && CSS.supports && CSS.supports("field-sizing", "content")) {
      return;
    }

    // Non-destructive fallback auto-growth for older browser engines
    const prevHeight = textarea.offsetHeight;
    const targetHeight = Math.min(Math.max(textarea.scrollHeight, 40), 140);
    if (Math.abs(prevHeight - targetHeight) > 2) {
      textarea.style.height = `${targetHeight}px`;
    }
    textarea.style.overflowY = textarea.scrollHeight > 140 ? "auto" : "hidden";
  }, [value, inputRef]);

  const describedBy = [
    blocked ? "mubi-pod-blocked" : null,
    helper ? "mubi-pod-helper" : null,
  ]
    .filter(Boolean)
    .join(" ") || undefined;

  return (
    <div className={styles.composer}>
      <textarea
        ref={inputRef}
        className={styles.field}
        rows={1}
        maxLength={limit}
        value={value}
        aria-label="Message"
        aria-disabled={blocked || undefined}
        aria-describedby={describedBy}
        placeholder={blocked ? "" : (placeholder ?? "Ask about the work, the services, or a project")}
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        onChange={handleChange}
        onCompositionStart={() => {
          isComposingRef.current = true;
        }}
        onCompositionEnd={() => {
          isComposingRef.current = false;
        }}
        onKeyDown={(event: KeyboardEvent<HTMLTextAreaElement>) => {
          if (event.nativeEvent.isComposing || isComposingRef.current) return;
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            send();
          }
        }}
      />
      <button
        type="button"
        className={`${styles.send} ${empty || blocked ? styles.sendIdle : ""}`}
        onClick={send}
        aria-disabled={empty || blocked || undefined}
        title={blocked ? blockReason : empty ? "Type something first" : "Send message"}
        aria-label="Send message"
      >
        Send
      </button>
      {helper && !blocked ? (
        <p id="mubi-pod-helper" className={styles.composerHelper}>
          {helper}
        </p>
      ) : null}
      {blocked ? (
        <p id="mubi-pod-blocked" className={styles.blockReason}>
          {blockReason}
        </p>
      ) : null}
    </div>
  );
}

export default memo(Composer);
