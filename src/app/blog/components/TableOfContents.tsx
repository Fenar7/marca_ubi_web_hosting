"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { PortableTextBlock } from "next-sanity";
import { slugify } from "@/app/blog/lib/slugify";
import styles from "./BlogPostComponents.module.scss";

interface TocItem {
  id: string;
  text: string;
}

interface PortableTextChild {
  text?: string;
  _type?: string;
}

interface HeadingBlock {
  _type?: string;
  style?: string;
  children?: PortableTextChild[];
}

export default function TableOfContents({ blocks }: { blocks: PortableTextBlock[] }) {
  const [activeId, setActiveId] = useState<string>("");

  const items: TocItem[] = useMemo(() => {
    const rawBlocks = (blocks || []) as unknown as HeadingBlock[];
    return rawBlocks
      .filter((b) => b._type === "block" && b.style === "h2")
      .map((b, index: number) => {
        const text = b.children?.map((c) => c.text || "").join("") || "";
        return {
          id: slugify(text, index),
          text,
        };
      })
      .filter((item) => item.text.trim().length > 0);
  }, [blocks]);

  useEffect(() => {
    if (items.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      {
        rootMargin: "0px 0px -65% 0px",
        threshold: 0,
      }
    );

    items.forEach((item) => {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [items]);

  if (items.length < 2) return null;

  return (
    <nav className={styles.tocNav} aria-label="Table of contents">
      <p className={styles.tocTitle}>Contents</p>
      <ul className={styles.tocList}>
        {items.map((item) => {
          const isActive = activeId === item.id;
          return (
            <li key={item.id} className={styles.tocItem}>
              <a
                href={`#${item.id}`}
                className={`${styles.tocLink} ${isActive ? styles.tocLinkActive : ""}`}
                onClick={(e) => {
                  e.preventDefault();
                  const target = document.getElementById(item.id);
                  if (target) {
                    /* Honour the OS-level reduce-motion preference: instant
                       jump instead of an animated scroll for vestibular
                       sensitivity, matching the SCSS kill-blocks. */
                    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
                    target.scrollIntoView({ behavior: reduced ? "auto" : "smooth" });
                    window.history.pushState(null, "", `#${item.id}`);
                    setActiveId(item.id);
                  }
                }}
              >
                {item.text}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/**
 * Reading progress rule for the sticky rail.
 *
 * Contract with the compositor: one `getBoundingClientRect` read per animation
 * frame, followed by a single `transform: scaleX()` write on the rule element.
 * No React state is touched, so the scroll handler never re-renders the rail,
 * and no width/height property is mutated, so nothing invalidates layout. The
 * rule lives inside the rail (hidden below 1024px), so the handler short-circuits
 * while the rail is not rendered and skips the read entirely.
 *
 * The measured scope is `[data-article-prose]`, the prose column, so progress
 * reflects the article body rather than the masthead or the related ledger.
 */
export function ReadingProgressRule() {
  const ruleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const rule = ruleRef.current;
    const prose = document.querySelector<HTMLElement>("[data-article-prose]");
    if (!rule || !prose) return;

    let frame = 0;

    const measure = () => {
      frame = 0;
      if (rule.offsetParent === null) return;

      const { top, height } = prose.getBoundingClientRect();
      const scrollable = height - window.innerHeight;
      /* A post shorter than the viewport has nothing left to read: pin the rule
         full width instead of reporting a division by zero. */
      const ratio = scrollable > 0 ? Math.min(1, Math.max(0, -top / scrollable)) : 1;
      rule.style.transform = `scaleX(${ratio.toFixed(4)})`;
    };

    const requestMeasure = () => {
      if (frame === 0) frame = requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener("scroll", requestMeasure, { passive: true });
    window.addEventListener("resize", requestMeasure, { passive: true });

    return () => {
      if (frame !== 0) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", requestMeasure);
      window.removeEventListener("resize", requestMeasure);
    };
  }, []);

  return (
    <div className={styles.progressWrap}>
      <div className={styles.progressTrack} aria-hidden="true">
        <div ref={ruleRef} className={styles.progressRule} />
      </div>
    </div>
  );
}
