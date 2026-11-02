"use client";

/**
 * @file Transcript.tsx
 * @description The scrolling history and the only live region in the pod. One `role="log"` for the
 *              whole conversation, never one per message: a live region per message would make a
 *              screen reader re-announce the entire history every time a reply arrives.
 *
 *              Scroll discipline is the part that decides whether this is usable. Auto-scrolling on
 *              every arrival yanks a visitor who has scrolled up to re-read an answer, so the region
 *              only follows when the reader is already at the bottom, and otherwise offers the pill.
 *
 *              The chips are not here. §05 §1.5 puts them above the composer so they stay reachable
 *              after a scroll, and a chip row inside the flow would scroll away with the message that
 *              produced it.
 * @author Fenar Khan <86710532+Fenar7@users.noreply.github.com>
 */

import { useCallback, useEffect, useRef, useState } from "react";

import { PERSONA } from "../knowledge/corpus";
import type { SlotId, TranscriptMessage } from "../types";
import MessageBubble from "./MessageBubble";
import styles from "../ChatPod.module.scss";

/** Distance from the bottom that still counts as "the reader is following the end". */
const ANCHOR_PX = 80;

interface Props {
  messages: TranscriptMessage[];
  typing: boolean;
  onEditSlot: (slot: SlotId) => void;
  /** Whether any card on this screen still answers an edit. True only while the review card is open. */
  rowsActive: boolean;
}

export default function Transcript({ messages, typing, onEditSlot, rowsActive }: Props) {
  const region = useRef<HTMLDivElement>(null);
  const [unseen, setUnseen] = useState(false);

  // One card is editable at a time: an older copy of the same brief would jump to a question the
  // visitor has already passed, and two cards claiming to be current is a transcript that lies.
  const lastReview = messages.reduce((found, message, index) => (message.reviewRows?.length ? index : found), -1);

  const atBottom = () => {
    const node = region.current;
    if (!node) return true;
    return node.scrollHeight - node.scrollTop - node.clientHeight <= ANCHOR_PX;
  };

  // Runs after paint so `scrollHeight` already includes the new row and the typing reserve.
  useEffect(() => {
    const node = region.current;
    if (!node) return;
    if (atBottom()) {
      node.scrollTo({ top: node.scrollHeight, behavior: "auto" });
      setUnseen(false);
    } else {
      setUnseen(true);
    }
  }, [messages, typing]);

  const jumpToLatest = useCallback(() => {
    const node = region.current;
    if (!node) return;
    node.scrollTo({ top: node.scrollHeight, behavior: "smooth" });
    setUnseen(false);
  }, []);

  return (
    <div className={styles.transcriptWrap}>
      <div
        ref={region}
        className={styles.transcript}
        role="log"
        aria-live="polite"
        aria-relevant="additions"
        tabIndex={0}
        aria-label="Conversation"
      >
        {messages.map((message, index) => (
          <MessageBubble key={message.id} message={message} onEditSlot={onEditSlot} rowsActive={rowsActive && index === lastReview} />
        ))}

        {/* Reserved height, so the arrival of the indicator moves nothing: this is the CLS-0 rule. */}
        <div className={styles.typingSlot} aria-hidden={typing ? undefined : "true"}>
          {typing ? (
            <div className={styles.typing} role="status">
              <span className={styles.srOnly}>{`${PERSONA.name} is answering`}</span>
              <span className={styles.dot} />
              <span className={styles.dot} />
              <span className={styles.dot} />
            </div>
          ) : null}
        </div>
      </div>

      {unseen ? (
        <button type="button" className={styles.newMessage} onClick={jumpToLatest}>
          New message
        </button>
      ) : null}
    </div>
  );
}
