"use client";

import React, { useState } from "react";
import type { SanityFaqItem } from "@/sanity/lib/faq-queries";
import styles from "./FaqCurtain.module.scss";

export interface FaqCurtainProps {
  faqs?: SanityFaqItem[];
}

/**
 * View: Frequently Asked Questions Curtain.
 * Solid pure white curtain component framing the 160over90 alternating rhythm.
 * Features Swiss hairline thin typography, fine 1px bottom border dividers,
 * and keyboard-accessible accordion disclosure mechanics.
 *
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */
export function FaqCurtain({ faqs = [] }: FaqCurtainProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleItem = (index: number) => {
    setOpenIndex((prev) => (prev === index ? null : index));
  };

  return (
    <section
      className={styles.faqCurtainSection}
      id="faq"
      aria-label="Frequently Asked Questions"
      data-header-theme="light"
    >
      <div className={styles.stageContainer}>
        {/* Top Header Row with Swiss Hairline Thin Typography */}
        <div className={styles.headerRow}>
          <div className={styles.kickerColumn}>
            <span className={styles.kickerBadge}>Frequently Asked Questions</span>
          </div>

          <div className={styles.headlineColumn}>
            <h2 className={styles.displayHeadline}>
              All your questions<span className={styles.brandDot}>.</span> Here<span className={styles.brandDot}>.</span>
            </h2>
          </div>
        </div>

        {/* Accordion Disclosure Stream */}
        <div className={styles.accordionContainer} role="region" aria-label="FAQ Accordion">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            const questionId = `faq-q-${index}`;
            const answerId = `faq-a-${index}`;

            return (
              <div
                key={faq._id || `faq-${index}`}
                className={`${styles.accordionItem} ${isOpen ? styles.itemOpen : ""}`}
              >
                <button
                  type="button"
                  id={questionId}
                  aria-expanded={isOpen}
                  aria-controls={answerId}
                  className={styles.questionTrigger}
                  onClick={() => toggleItem(index)}
                >
                  <span className={styles.questionText}>{faq.question}</span>
                  <span className={styles.iconIndicator} aria-hidden="true">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.75"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className={styles.chevronSvg}
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </span>
                </button>

                <div
                  id={answerId}
                  role="region"
                  aria-labelledby={questionId}
                  className={styles.answerWrapper}
                >
                  <div className={styles.answerInner}>
                    <p className={styles.answerText}>{faq.answer}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default FaqCurtain;
