"use client";

/**
 * @file MessageBubble.tsx
 * @description Renders one transcript row from `AnswerBlock`s. The blocks are structured data, never
 *              markdown, and that is the whole rendering contract: formatting authority stays inside
 *              the reviewed corpus, so nothing a visitor types can turn into a heading, a link or a
 *              list here.
 *
 *              Two row kinds exist beside plain text. A `review` row renders the collected answers as
 *              tappable lines, because editing a brief means pointing at the line that is wrong. A
 *              `visitor` row is deliberately quieter than an assistant row: their own text repeating
 *              back at them in the same weight as an answer makes the transcript hard to scan.
 * @author Fenar Khan <86710532+Fenar7@users.noreply.github.com>
 */

import Link from "next/link";

import { PERSONA } from "../knowledge/corpus";
import type { AnswerBlock, SlotId, TranscriptMessage } from "../types";
import styles from "../ChatPod.module.scss";

function isInternal(href: string): boolean {
  return href.startsWith("/");
}

function Block({ block, onNavigate }: { block: AnswerBlock; onNavigate?: () => void }) {
  if (block.t === "p") return <p className={styles.text}>{block.text}</p>;

  if (block.t === "list") {
    return (
      <ul className={styles.list}>
        {block.items.map((item, index) => (
          <li key={`${item.label}-${index}`} className={styles.listItem}>
            <span className={styles.listLabel}>{item.label}</span>
            {item.sub ? <span className={styles.listSub}>{item.sub}</span> : null}
          </li>
        ))}
      </ul>
    );
  }

  return (
    <ul className={styles.linkList}>
      {block.items.map((item, index) => {
        const key = `${item.href}-${index}`;
        const sub = item.sub ? <span className={styles.linkSub}>{item.sub}</span> : null;
        if (isInternal(item.href)) {
          return (
            <li key={key}>
              <Link href={item.href} className={styles.link} onClick={onNavigate}>
                {item.label}
                {sub}
              </Link>
            </li>
          );
        }
        return (
          <li key={key}>
            {/* `tel:` and `mailto:` are filtered at compile time; the coverage test rejects any other
                scheme, so this anchor cannot be pointed at a third-party origin by content drift. */}
            <a href={item.href} className={styles.link} rel="noopener noreferrer">
              {item.label}
              {sub}
            </a>
          </li>
        );
      })}
    </ul>
  );
}

/** The label/value pair, shared by the tappable and the settled form of a review row. */
function RowContent({ label, value }: { label: string; value: string }) {
  return (
    <>
      <span className={styles.reviewLabel}>{label}</span>
      <span className={styles.reviewValue}>{value}</span>
    </>
  );
}

interface Props {
  message: TranscriptMessage;
  /** Review rows are the only in-transcript control: tapping a line jumps back to that question. */
  onEditSlot?: (slot: SlotId) => void;
  /**
   * Whether the rows on this card can still be tapped. The card stays readable after a send, but the
   * machine refuses an edit once the brief has gone, so leaving the buttons up would be a row of
   * controls that cannot control anything.
   */
  rowsActive?: boolean;
  /** Invoked when an internal route link is clicked so the panel closes and unlocks the viewport. */
  onNavigate?: () => void;
}

export default function MessageBubble({ message, onEditSlot, rowsActive = true, onNavigate }: Props) {
  const visitor = message.speaker === "visitor";
  const rows = message.reviewRows ?? [];

  return (
    <div className={`${styles.row} ${visitor ? styles.rowVisitor : styles.rowAssistant}`} data-transcript-row="">
      <div className={`${styles.bubble} ${visitor ? styles.bubbleVisitor : styles.bubbleAssistant} ${message.kind === "error" ? styles.bubbleError : ""}`}>
        {message.blocks.map((block, index) => (
          <Block key={index} block={block} onNavigate={onNavigate} />
        ))}

        {rows.length > 0 ? (
          <ul className={styles.reviewRows}>
            {rows.map((row) => (
              <li key={row.slot}>
                {rowsActive ? (
                  <button type="button" className={styles.reviewRow} onClick={() => onEditSlot?.(row.slot)}>
                    <RowContent label={row.label} value={row.value} />
                  </button>
                ) : (
                  <div className={`${styles.reviewRow} ${styles.reviewRowStatic}`}>
                    <RowContent label={row.label} value={row.value} />
                  </div>
                )}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      <time className={styles.stamp} dateTime={message.timeFull}>
        {message.time}
        <span className={styles.srOnly}>{visitor ? ", your message" : `, from ${PERSONA.name}`}</span>
      </time>
    </div>
  );
}
