"use client";

/**
 * @file Composer.tsx
 * @description The text field. Three behaviours in it are deliberate and all three are easy to "fix"
 *              the wrong way later:
 *
 *              `aria-disabled` rather than the `disabled` attribute. A disabled input leaves the tab
 *              order and disappears from accessibility trees, so a visitor mid-search loses their
 *              place; `aria-disabled` keeps the caret, keeps the announcement and refuses the send.
 *
 *              Enter sends, Shift+Enter breaks a line. This is what people expect from a chat field,
 *              and the newline matters because the pod reads multi-line questions as one utterance.
 *
 *              The send control goes grey on an empty field but stays focusable and keeps a `title`
 *              saying why. It never disappears, because a control that vanishes as you type is a
 *              layout shift at the exact moment the visitor is looking at it.
 * @author Fenar Khan <86710532+Fenar7@users.noreply.github.com>
 */

import { useCallback, useState } from "react";
import type { RefObject } from "react";

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
  /** Tells the visitor the question they are on is already answered, so typing replaces it. */
  helper?: string;
}

export default function Composer({ inputRef, onSubmit, blocked, blockReason, placeholder, helper }: Props) {
  const [value, setValue] = useState("");

  const empty = value.trim().length === 0;

  const send = useCallback(() => {
    const text = value.trim();
    if (text.length === 0 || blocked) return;
    onSubmit(text);
    setValue("");
  }, [blocked, onSubmit, value]);

  const describedBy = [blocked ? "mubi-pod-blocked" : null, helper ? "mubi-pod-helper" : null].filter(Boolean).join(" ") || undefined;

  return (
    <div className={styles.composer}>
      <textarea
        ref={inputRef}
        className={styles.field}
        rows={1}
        maxLength={MAX_CHARS}
        value={value}
        aria-label="Message"
        aria-disabled={blocked || undefined}
        aria-describedby={describedBy}
        placeholder={blocked ? "" : (placeholder ?? "Ask about the work, the services, or a project")}
        onChange={(event) => setValue(event.target.value.slice(0, MAX_CHARS))}
        onKeyDown={(event) => {
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
