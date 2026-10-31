"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { subAnchorKey, type ServiceDetailContent } from "../types";
import styles from "./ServiceDetail.module.scss";

/**
 * ServiceDetailClient — editorial hero + "What we do" accordion island.
 *
 * Architectural Invariants:
 * 1. Anchor Contract: row ids derive from `subAnchorKey(label)`, the identical
 *    function the homepage accordion uses to build deep links, so `#paid-media-strategy`
 *    style URLs can never drift from the DOM.
 * 2. One-Open-Row Semantics: expansion is a single keyed state; the grid-rows 0fr→1fr
 *    technique animates height without JavaScript geometry while `visibility` gating
 *    keeps collapsed copy out of the tab order and a11y tree.
 * 3. Deep-Link Hydration: the initial hash is applied after mount (static prerender
 *    stays hash-agnostic) and re-applied on `hashchange`, with a no-scroll
 *    `replaceState` keeping the URL shareable as rows toggle.
 *
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */
export default function ServiceDetailClient({ content }: { content: ServiceDetailContent }) {
  const anchorKeys = useMemo(
    () => content.subServices.map((sub) => subAnchorKey(sub.label)),
    [content],
  );
  const [openKey, setOpenKey] = useState<string | null>(null);

  const scrollRowIntoView = useCallback((key: string) => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document
      .getElementById(`service-row-${key}`)
      ?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "center" });
  }, []);

  useEffect(() => {
    const applyHash = () => {
      const raw = window.location.hash.replace(/^#/, "");
      if (!raw) return;
      let key = raw;
      try {
        key = decodeURIComponent(raw);
      } catch {
        return; // malformed percent-encoding in a hand-edited URL: ignore, never throw
      }
      if (anchorKeys.includes(key)) {
        setOpenKey(key);
        requestAnimationFrame(() => scrollRowIntoView(key));
      }
    };
    applyHash();
    window.addEventListener("hashchange", applyHash);
    return () => window.removeEventListener("hashchange", applyHash);
  }, [anchorKeys, scrollRowIntoView]);

  const toggleRow = (key: string) => {
    const next = openKey === key ? null : key;
    setOpenKey(next);
    const base = `${window.location.pathname}${window.location.search}`;
    window.history.replaceState(null, "", next ? `${base}#${next}` : base);
    if (next) scrollRowIntoView(next);
  };

  return (
    <div className={styles.container}>
      <nav aria-label="Breadcrumb" className={styles.breadcrumbNav}>
        <ol className={styles.breadcrumbList}>
          <li>
            <Link href="/">Home</Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link href="/#services">Services</Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page">{content.title}</li>
        </ol>
      </nav>

      <header className={styles.intro}>
        <span className={styles.kicker}>
          {content.number} — {content.category === "B2B" ? "B2B Enterprise" : "B2C Consumer"}
        </span>
        <h1 className={styles.pageTitle}>{content.title}</h1>
        <p className={styles.lede}>{content.shortDescription}</p>
      </header>

      <div className={styles.heroFrame}>
        <Image
          src={content.hero.imageUrl}
          alt={content.hero.alt}
          fill
          priority
          sizes="(max-width: 768px) 100vw, (max-width: 1400px) 92vw, 1288px"
        />
      </div>

      <section className={styles.whatWeDo} aria-label={`What we do within ${content.title}`}>
        <h2 className={styles.sectionHeading}>What we do</h2>
        <div className={styles.rows}>
          {content.subServices.map((sub, index) => {
            const key = anchorKeys[index];
            const isOpen = openKey === key;
            return (
              <div
                key={key}
                id={`service-row-${key}`}
                className={styles.row}
                data-open={isOpen || undefined}
              >
                <button
                  type="button"
                  id={`service-trigger-${key}`}
                  className={styles.rowTrigger}
                  aria-expanded={isOpen}
                  aria-controls={`service-panel-${key}`}
                  onClick={() => toggleRow(key)}
                >
                  <span className={styles.rowLabel}>{sub.label}</span>
                  <span className={styles.rowIcon} aria-hidden="true" />
                </button>
                <div
                  id={`service-panel-${key}`}
                  role="region"
                  aria-labelledby={`service-trigger-${key}`}
                  className={styles.rowPanel}
                  data-open={isOpen || undefined}
                >
                  <div className={styles.rowPanelInner}>
                    <p className={styles.rowSummary}>{sub.summary}</p>
                    {sub.body.map((paragraph, paragraphIndex) => (
                      <p key={paragraphIndex} className={styles.rowParagraph}>
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <div className={styles.ctaRow}>
        <Link href="/start-project" className={styles.ctaLink}>
          Brief us on {content.title}
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </Link>
      </div>
    </div>
  );
}
