"use client";

/**
 * @file Composer.tsx
 * @description The text intake and dispatch affordance.
 *
 *              Architectural Rationale & Invariants:
 *              - Caret & Selection Stability: In React 19 controlled components, invoking `.slice()` on
 *                every keystroke triggers a forced DOM value synchronization. When `node.value` is
 *                re-assigned, browser engines collapse active selection ranges and prematurely cancel
 *                IME composition (Windows predictive text, macOS dead keys, mobile touch swipe).
 *                Length constraints are delegated to native `maxLength={limit}`, composition status
 *                is isolated via `isComposingRef`, and selection bounds are preserved in `selectionRef`.
 *              - Fluid Non-Thrashing Auto-Grow: Progressive enhancement via CSS `field-sizing: content;`
 *                complemented by a non-destructive `useLayoutEffect` threshold check (clamped to 40px - 140px).
 *                Avoids forced synchronous layout reflow loops on rapid keystrokes.
 *              - Accessible Invariant: `aria-disabled` rather than the HTML `disabled` attribute retains
 *                element presence in the accessibility tree and keyboard tab order while blocking send.
 * @author Fenar Khan <86710532+Fenar7@users.noreply.github.com>
 */

import { memo, useCallback, useLayoutEffect, useRef, useState } from "react";
import type { ChangeEvent, KeyboardEvent, RefObject, SyntheticEvent } from "react";

import styles from "../ChatPod.module.scss";

/** Matching is a lookup over a bounded corpus; a novel beyond the first sentences is not an answer. */
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
  const selectionRef = useRef<{ start: number; end: number } | null>(null);

  const empty = value.trim().length === 0;

  const send = useCallback(() => {
    const text = value.trim();
    if (text.length === 0 || blocked) return;
    onSubmit(text);
    setValue("");
    selectionRef.current = null;
    const textarea = inputRef.current;
    if (textarea) {
      textarea.style.height = "auto";
    }
  }, [blocked, onSubmit, value, inputRef]);

  const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    const next = event.target.value;
    // Native maxLength limits user keystrokes; only slice if external paste exceeds limit
    setValue(next.length > limit ? next.slice(0, limit) : next);
  };

  const handleSelect = (event: SyntheticEvent<HTMLTextAreaElement>) => {
    const target = event.currentTarget;
    selectionRef.current = {
      start: target.selectionStart,
      end: target.selectionEnd,
    };
  };

  useLayoutEffect(() => {
    const textarea = inputRef.current;
    if (!textarea) return;

    // Preserve caret position across re-renders if active and not in an active IME composition
    if (
      selectionRef.current &&
      document.activeElement === textarea &&
      !isComposingRef.current
    ) {
      const { start, end } = selectionRef.current;
      if (textarea.selectionStart !== start || textarea.selectionEnd !== end) {
        textarea.setSelectionRange(start, end);
      }
    }

    // Modern progressive auto-grow: if CSS field-sizing is supported, browser engine handles height
    if (typeof CSS !== "undefined" && CSS.supports && CSS.supports("field-sizing", "content")) {
      return;
    }

    // Fallback auto-grow for older engines without layout thrashing
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
        onSelect={handleSelect}
        onCompositionStart={() => {
          isComposingRef.current = true;
        }}
        onCompositionEnd={(event) => {
          isComposingRef.current = false;
          handleSelect(event);
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
