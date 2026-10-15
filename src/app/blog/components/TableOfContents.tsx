"use client";

import { useEffect, useState } from "react";
import styles from "./BlogPostComponents.module.scss";

interface TocItem {
  id: string;
  text: string;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-");
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function TableOfContents({ blocks }: { blocks: any[] }) {
  const [activeId, setActiveId] = useState<string>("");

  const items: TocItem[] = (blocks || [])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .filter((b: any) => b._type === "block" && b.style === "h2")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((b: any) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const text = b.children?.map((c: any) => c.text).join("") || "";
      return {
        id: slugify(text),
        text,
      };
    })
    .filter((item) => item.text.trim().length > 0);

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
