"use client";

import { useEffect, useMemo, useState } from "react";
import type { PortableTextBlock } from "next-sanity";
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

function slugify(text: string, index?: number): string {
  const slug = text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .trim()
    .replace(/\s+/g, "-");
  return slug || `heading-${index ?? 0}`;
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
                    target.scrollIntoView({ behavior: "smooth" });
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
