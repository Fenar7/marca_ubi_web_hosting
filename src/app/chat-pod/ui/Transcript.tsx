"use client";

/**
 * @file Transcript.tsx
 * @description The scrolling history and the only live region in the pod. One `role="log"` for the
 *              whole conversation, never one per message: a live region per message would make a
 *              screen reader re-announce the entire history every time a reply arrives.
 *
 *              One surface scrolls, and it is this one. The chip row arrives as `children` and sits at
 *              the end of the same column, because two nested scroll areas inside a fixed-height panel
 *              is not a conversation: the visitor meets a wheel that moves one box and then a second box,
 *              the keyboard lands in whichever one has focus, and on a phone the inner one swallows the
 *              swipe. Everything the pod says and everything it offers to do next now travel together.
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
 *              The live region is the messages, not the messages plus the buttons. `aria-relevant` on a
 *              log announces what arrives; a chip row inside it would be re-read on every retap of a
 *              multi-select, which is the screen-reader equivalent of the transcript line the taps used
 *              to append.
 * @author Fenar Khan <86710532+Fenar7@users.noreply.github.com>
 */

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

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
  /** The chip row, and anything else that belongs at the end of the same column. */
  children?: ReactNode;
}

/**
 * Where the end of the column is, in the scroll container's own coordinates.
 *
 * The newest turn and the replies offered for it both sit at the end, so the floor is the position that
 * shows the offer. Parking higher up — at the top of a turn too tall to fit — reads as an answer with no
 * buttons under it, and the visitor then has to scroll to find the thing they were told to press.
 */
function floor(node: HTMLDivElement): number {
  return Math.max(0, node.scrollHeight - node.clientHeight);
}

export default function Transcript({ messages, typing, onEditSlot, rowsActive, onNavigate, children }: Props) {
  const region = useRef<HTMLDivElement>(null);
  /** Where the reader is, held as external state so the pill is a fact about the DOM and not a guess. */
  const [following, setFollowing] = useState(true);
  const rowCount = useRef(0);
  /** The reader's position as of the last settled frame, which is the only frame that predates the row arriving. */
  const anchored = useRef(true);
  const gliding = useRef(false);
  const glideTimer = useRef<number | null>(null);
  /**
   * Where the last glide intended to stop, in scroll coordinates.
   *
   * The floor moves even when the reader does not: a taller wall of chips arrives below them, the content
   * grows, and a measurement taken against today's floor calls a stationary reader "scrolled away". The
   * pill and the auto-follow therefore measure against where the reader was last put, which is a fact
   * about them, not against the bottom, which is a fact about the content.
   */
  const destination = useRef(Number.MAX_SAFE_INTEGER);

  /**
   * The column's content height as of the last settled frame.
   *
   * A row arriving pushes everything under it down by that row's height, which is a jump the reader
   * has to re-find their place in — and the layout-shift entry the geometry gate measures. Adding the
   * growth to `scrollTop` in the same frame cancels it: the words on screen do not move, and the only
   * movement left is the glide toward the new end.
   */
  const lastExtent = useRef(0);

  // One card is editable at a time: an older copy of the same brief would jump to a question the
  // visitor has already passed, and two cards claiming to be current is a transcript that lies.
  const lastReview = messages.reduce((found, message, index) => (message.reviewRows?.length ? index : found), -1);

  /** True when the reader is on the turn they are meant to be reading. */
  const atDestination = (node: HTMLDivElement): boolean =>
    Math.abs(node.scrollTop - destination.current) <= ANCHOR_PX || distanceFromEnd(node) <= ANCHOR_PX;

  /** Stop treating the region as in motion and let its measured position decide what happens next. */
  const settle = useCallback(() => {
    gliding.current = false;
    if (glideTimer.current !== null) {
      window.clearTimeout(glideTimer.current);
      glideTimer.current = null;
    }
    const node = region.current;
    const followingTurn = node ? atDestination(node) : true;
    anchored.current = followingTurn;
    setFollowing(followingTurn);
  }, []);

  // The reader's position is a property of the browser, not of React, so it is subscribed to. Written
  // only from the scroll event: an effect that measured and set it on every paint is the version that
  // used to re-render the transcript to answer a question the transcript itself had already settled.
  useEffect(() => {
    const node = region.current;
    if (!node) return;
    const onScroll = () => {
      // Frames produced by our own glide say nothing about the reader's position, so they cannot clear
      // the anchor. What they do say is that the region is moving toward its destination, which is the
      // moment the pill stops being true. The last frame, the one back inside the window, ends the glide.
      if (gliding.current) {
        if (atDestination(node)) settle();
        else setFollowing(true);
        return;
      }
      const followingTurn = atDestination(node);
      anchored.current = followingTurn;
      setFollowing(followingTurn);
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

  /**
   * Move the region and write no React state. The pill and the anchor are facts about the reader, and
   * they are settled by the scroll events this movement produces, not asserted here before the browser
   * has moved anything.
   *
   * The target is the floor: the newest answer with the replies offered for it sitting under it. When the
   * arrival has already been compensated in the frame that inserted it, a reader at the end is standing
   * exactly there, so this is a no-op for them and a glide for whoever was not.
   */
  const scrollToLatest = useCallback(() => {
    const node = region.current;
    if (!node) return;
    const end = floor(node);
    destination.current = end;
    if (!prefersReducedMotion()) {
      gliding.current = true;
      if (glideTimer.current !== null) window.clearTimeout(glideTimer.current);
      glideTimer.current = window.setTimeout(settle, GLIDE_MS);
    }
    node.scrollTo({ top: end, behavior: prefersReducedMotion() ? "auto" : "smooth" });
    anchored.current = true;
  }, [settle]);

  // Runs before the browser paints the arrival, so `scrollHeight` already includes the new row, the
  // chips and the typing reserve — and so the compensation below is never a frame the reader can see.
  // After paint is a jump that lands and then glides back; before paint is a jump that does not happen.
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
  useLayoutEffect(() => {
    const node = region.current;
    if (!node) return;
    const arrived = messages.length !== rowCount.current;
    const firstFill = rowCount.current === 0 && messages.length > 0;
    rowCount.current = messages.length;

    if (firstFill) {
      // The same destination the next glide would choose, reached instantly: the panel is still
      // animating in, so a smooth move here is a swipe under a surface that is not on screen yet.
      const end = floor(node);
      destination.current = end;
      node.scrollTop = end;
      // No `setFollowing` here: the region has never been scrolled at this point, so the reader is
      // wherever the initial state already says they are, and writing it again is a render to answer a
      // question the transcript has not been asked yet.
      anchored.current = true;
      lastExtent.current = node.scrollHeight;
      return;
    }

    const growth = node.scrollHeight - lastExtent.current;
    if (arrived && anchored.current && growth > 0) {
      // View-preserving before it is destination-seeking: the reader keeps the line they were reading,
      // and the glide below is the distance to what arrived rather than a jump over it.
      node.scrollTop += growth;
    }
    lastExtent.current = node.scrollHeight;
    if (arrived && anchored.current) scrollToLatest();
  }, [messages, typing, children, scrollToLatest]);

  /**
   * Keep the two facts the arrival maths depends on true between commits.
   *
   * The column's height is not only moved by arriving rows. A web font swapping in, a seventeen-option
   * rail re-wrapping under a narrower panel, and the soft-keyboard inset all change `scrollHeight` or
   * `clientHeight` while React sits still, and an extent recorded only on a commit is then a number
   * describing a layout that no longer exists: the next arrival compensates by the stale amount, and
   * the pill judges the reader against a bottom that has moved. Both of those are invisible for a frame
   * and then a jump the reader has to re-find their place in.
   *
   * Only a reader who was following the end is moved, and only to the end: this is a reflow, not a
   * delivery, so it snaps rather than glides. A reader who walked up to re-read keeps their position,
   * and the pill stays exactly as honest as they left it.
   */
  useEffect(() => {
    const node = region.current;
    if (!node || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => {
      const end = floor(node);
      const growth = node.scrollHeight - lastExtent.current;
      lastExtent.current = node.scrollHeight;
      if (growth === 0 && end === destination.current) return;
      if (anchored.current) {
        destination.current = end;
        // A glide in flight owns the movement for this beat, so the reflow must not snap the reader past
        // it; retargeting the smooth move keeps them going to the new end instead. The destination is
        // updated either way, because `settle` judges arrival against it and a stale one would read a
        // reflow as a takeover and raise the pill on a reader who never moved.
        if (gliding.current) node.scrollTo({ top: end, behavior: "smooth" });
        else node.scrollTop = end;
      }
    });
    // The box of the scroller answers a panel that changed height; its children answer content that
    // re-flowed inside a panel that did not.
    observer.observe(node);
    for (const child of Array.from(node.children)) observer.observe(child);
    return () => observer.disconnect();
  }, [children]);

  return (
    <div className={styles.transcriptWrap}>
      {/* The one scroll owner in the panel, and the offset parent for the newest-turn measurement above.
          `data-lenis-prevent` lives on the panel itself (see `ChatPod.tsx`), which is what lets the wheel
          work over the header, the chips and the composer as well as the messages. */}
      <div
        ref={region}
        className={styles.flow}
        // The scroller is the thing a keyboard reader has to be able to move, so it takes the tab stop
        // and the name. The live region below it deliberately does not: focus follows the conversation,
        // and a stop inside the stops means two ways to be lost in the same panel.
        tabIndex={0}
        aria-label="Conversation"
      >
        <div className={styles.transcript} role="log" aria-live="polite" aria-relevant="additions">
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

        {children}
      </div>

      {/* The pill is the reader's own scroll position made visible, so its copy promises exactly that
          and not "a message arrived": a cue that lies about why it is here is worse than no cue. It sits
          outside the scroll owner on purpose — inside it, `bottom` measures the content box and the cue
          would slide away with the page instead of staying on the panel. */}
      {!following ? (
        <button type="button" className={styles.newMessage} onClick={scrollToLatest}>
          Jump to the latest
        </button>
      ) : null}
    </div>
  );
}
