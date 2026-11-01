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

function Block({ block }: { block: AnswerBlock }) {
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
              <Link href={item.href} className={styles.link}>
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

interface Props {
  message: TranscriptMessage;
  /** Review rows are the only in-transcript control: tapping a line jumps back to that question. */
  onEditSlot?: (slot: SlotId) => void;
}

export default function MessageBubble({ message, onEditSlot }: Props) {
  const visitor = message.speaker === "visitor";
  const rows = message.reviewRows ?? [];

  return (
    <div className={`${styles.row} ${visitor ? styles.rowVisitor : styles.rowAssistant}`}>
      <div className={`${styles.bubble} ${visitor ? styles.bubbleVisitor : styles.bubbleAssistant} ${message.kind === "error" ? styles.bubbleError : ""}`}>
        {message.blocks.map((block, index) => (
          <Block key={index} block={block} />
        ))}

        {rows.length > 0 ? (
          <ul className={styles.reviewRows}>
            {rows.map((row) => (
              <li key={row.slot}>
                <button type="button" className={styles.reviewRow} onClick={() => onEditSlot?.(row.slot)}>
                  <span className={styles.reviewLabel}>{row.label}</span>
                  <span className={styles.reviewValue}>{row.value}</span>
                </button>
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
