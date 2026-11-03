"use client";

/**
 * @file Transcript.tsx
 * @description The scrolling history and the only live region in the pod. One `role="log"` for the
 *              whole conversation, never one per message: a live region per message would make a
 *              screen reader re-announce the entire history every time a reply arrives.
 *
 *              Scroll discipline is the part that decides whether this is usable. Auto-scrolling on
 *              every arrival yanks a visitor who has scrolled up to re-read an answer, so the region
 *              only follows when the reader was already at the bottom, and otherwise offers the pill.
 *              "Was" is the whole problem: the distance has to be remembered from before the new row
 *              exists, because measured afterwards it includes that row, and a reply taller than the
 *              anchor window reads as "the reader left" and stops the follow for the rest of the
 *              conversation. The reader's position is therefore held in a ref written by the scroll
 *              handler, and the glide's own intermediate frames are not allowed to overwrite it.
 *
 *              The chips are not here. §05 §1.5 puts them above the composer so they stay reachable
 *              after a scroll, and a chip row inside the flow would scroll away with the message that
 *              produced it.
 * @author Fenar Khan <86710532+Fenar7@users.noreply.github.com>
 */

import { useCallback, useEffect, useRef, useState } from "react";

import { prefersReducedMotion } from "@/app/lib/motion";
import { PERSONA } from "../knowledge/corpus";
import type { SlotId, TranscriptMessage } from "../types";
import MessageBubble from "./MessageBubble";
import styles from "../ChatPod.module.scss";

/** Distance from the bottom that still counts as "the reader is following the end". */
const ANCHOR_PX = 80;

/** How long a programmatic glide is allowed to take before the region's real position is trusted
 *  again. Chrome and Firefox land a `scrollTo` of this distance well inside it; the timer only exists
 *  so an interrupted glide cannot leave the reader pinned to a bottom they walked away from. */
const GLIDE_MS = 600;

function distanceFromEnd(node: HTMLDivElement | null): number {
  if (!node) return 0;
  return node.scrollHeight - node.scrollTop - node.clientHeight;
}

interface Props {
  messages: TranscriptMessage[];
  typing: boolean;
  onEditSlot: (slot: SlotId) => void;
  /** Whether any card on this screen still answers an edit. True only while the review card is open. */
  rowsActive: boolean;
  /** Invoked when an internal route link is clicked so the panel closes and unlocks the viewport. */
  onNavigate?: () => void;
}

export default function Transcript({ messages, typing, onEditSlot, rowsActive, onNavigate }: Props) {
  const region = useRef<HTMLDivElement>(null);
  /** Where the reader is, held as external state so the pill is a fact about the DOM and not a guess. */
  const [following, setFollowing] = useState(true);
  const rowCount = useRef(0);
  /** The reader's position as of the last settled frame, which is the only frame that predates the row arriving. */
  const anchored = useRef(true);
  const gliding = useRef(false);
  const glideTimer = useRef<number | null>(null);

  // One card is editable at a time: an older copy of the same brief would jump to a question the
  // visitor has already passed, and two cards claiming to be current is a transcript that lies.
  const lastReview = messages.reduce((found, message, index) => (message.reviewRows?.length ? index : found), -1);

  /** Stop treating the region as in motion and let its measured position decide what happens next. */
  const settle = useCallback(() => {
    gliding.current = false;
    if (glideTimer.current !== null) {
      window.clearTimeout(glideTimer.current);
      glideTimer.current = null;
    }
    const atEnd = distanceFromEnd(region.current) <= ANCHOR_PX;
    anchored.current = atEnd;
    setFollowing(atEnd);
  }, []);

  // The reader's position is a property of the browser, not of React, so it is subscribed to. Written
  // only from the scroll event: an effect that measured and set it on every paint is the version that
  // used to re-render the transcript to answer a question the transcript itself had already settled.
  useEffect(() => {
    const node = region.current;
    if (!node) return;
    const onScroll = () => {
      // Frames produced by our own glide say nothing about the reader's position, so they cannot clear
      // the anchor. What they do say is that the region is moving toward its end, which is the moment
      // the pill stops being true. The last frame, the one back inside the window, ends the glide.
      if (gliding.current) {
        if (distanceFromEnd(node) <= ANCHOR_PX) settle();
        else setFollowing(true);
        return;
      }
      const atEnd = distanceFromEnd(node) <= ANCHOR_PX;
      anchored.current = atEnd;
      setFollowing(atEnd);
    };
    // Any input the reader makes with their own hand is a takeover: the glide stops being ours from
    // that moment, and where they leave the region is the position the next reply is judged against.
    const takeover = () => {
      if (gliding.current) settle();
    };
    node.addEventListener("scroll", onScroll, { passive: true });
    node.addEventListener("wheel", takeover, { passive: true });
    node.addEventListener("touchstart", takeover, { passive: true });
    node.addEventListener("keydown", takeover);
    return () => {
      node.removeEventListener("scroll", onScroll);
      node.removeEventListener("wheel", takeover);
      node.removeEventListener("touchstart", takeover);
      node.removeEventListener("keydown", takeover);
      if (glideTimer.current !== null) window.clearTimeout(glideTimer.current);
    };
  }, [settle]);

  /** Moves the region and writes no React state. The pill and the anchor are facts about the reader, and
   *  they are settled by the scroll events this movement produces, not asserted here before the browser
   *  has moved anything. */
  const scrollToLatest = useCallback(() => {
    const node = region.current;
    if (!node) return;
    if (!prefersReducedMotion()) {
      gliding.current = true;
      if (glideTimer.current !== null) window.clearTimeout(glideTimer.current);
      glideTimer.current = window.setTimeout(settle, GLIDE_MS);
    }
    node.scrollTo({ top: node.scrollHeight, behavior: prefersReducedMotion() ? "auto" : "smooth" });
    anchored.current = true;
  }, [settle]);

  // Runs after paint so `scrollHeight` already includes the new row and the typing reserve.
  //
  // Three cases, and only one of them moves the reader on their own account:
  // - the first fill (a restored brief is read from its end, and a fresh one has nothing to read yet)
  //   snaps instantly, while the panel is still animating in;
  // - an arrival while the reader was following the end glides, which is the beat that makes a reply
  //   look delivered rather than pasted;
  // - the typing indicator is a 2.25rem height change inside the same beat, so it snaps: smoothing that
  //   too would leave the reader mid-glide twice per message, which reads as lag, not motion.
  //
  // A reader who scrolled up to re-read is never pulled back down. That is what the pill is for.
  useEffect(() => {
    const node = region.current;
    if (!node) return;
    const arrived = messages.length !== rowCount.current;
    const firstFill = rowCount.current === 0 && messages.length > 0;
    rowCount.current = messages.length;

    if (firstFill) {
      node.scrollTop = node.scrollHeight;
      // No `setFollowing` here: the region has never been scrolled at this point, so the reader is
      // wherever the initial state already says they are, and writing it again is a render to answer a
      // question the transcript has not been asked yet.
      anchored.current = true;
      return;
    }
    if (arrived && anchored.current) scrollToLatest();
  }, [messages, typing, scrollToLatest]);

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
        // The site runs Lenis for smooth scrolling, and opening the panel calls `lenis.stop()`. A stopped
        // Lenis still cancels every wheel and touchmove it sees, except inside a `data-lenis-prevent`
        // subtree: without this attribute the transcript has a scrollbar that no mouse can move.
        data-lenis-prevent
      >
        {messages.map((message, index) => (
          <MessageBubble
            key={message.id}
            message={message}
            onEditSlot={onEditSlot}
            rowsActive={rowsActive && index === lastReview}
            onNavigate={onNavigate}
          />
        ))}

        {/* Reserved height, so the arrival of the indicator moves nothing: this is the CLS-0 rule.
            The dots stay mounted and fade, because the reply animates up from exactly where they were;
            unmounting them mid-beat is what made the answer look like it replaced something rather than
            grew out of it. The animation is paused while faded so a hidden indicator costs no frames. */}
        <div className={styles.typingSlot} aria-hidden={typing ? undefined : "true"}>
          <div className={styles.typing} data-on={typing || undefined} role="status">
            {typing ? <span className={styles.srOnly}>{`${PERSONA.name} is answering`}</span> : null}
            <span className={styles.dot} />
            <span className={styles.dot} />
            <span className={styles.dot} />
          </div>
        </div>
      </div>

      {/* The pill is the reader's own scroll position made visible, so its copy promises exactly that
          and not "a message arrived": a cue that lies about why it is here is worse than no cue. */}
      {!following ? (
        <button type="button" className={styles.newMessage} onClick={scrollToLatest}>
          Jump to the latest
        </button>
      ) : null}
    </div>
  );
}
