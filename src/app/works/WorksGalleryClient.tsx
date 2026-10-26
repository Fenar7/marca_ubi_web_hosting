"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { urlFor } from "@/sanity/lib/image";
import type { SanityWork } from "@/app/components/WorksSection/WorksSectionClient";
import styles from "./Works.module.scss";

interface WorksGalleryClientProps {
  initialWorks: SanityWork[];
}

interface TaxonomyCategory {
  id: string;
  label: string;
  matchKeyword?: string;
}

const CATEGORIES: TaxonomyCategory[] = [
  { id: "all", label: "All Commissions" },
  { id: "brand", label: "Brand Architecture", matchKeyword: "brand" },
  { id: "digital", label: "Digital Platforms", matchKeyword: "platform" },
  { id: "systems", label: "Design Systems", matchKeyword: "system" },
];

/**
 * Interactive Client Portfolio Showcase Gallery.
 * Renders the Swiss broadsheet archive with category filtering,
 * specular highlight frames, tabular index numbering, and live deployment links.
 *
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */
export function WorksGalleryClient({ initialWorks }: WorksGalleryClientProps) {
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const filteredWorks = useMemo(() => {
    if (activeCategory === "all") {
      return initialWorks;
    }
    const cat = CATEGORIES.find((c) => c.id === activeCategory);
    if (!cat || !cat.matchKeyword) {
      return initialWorks;
    }
    const keyword = cat.matchKeyword.toLowerCase();
    const matched = initialWorks.filter(
      (w) =>
        w.title.toLowerCase().includes(keyword) ||
        (w.subtext && w.subtext.toLowerCase().includes(keyword))
    );
    // If no exact match found, gracefully show all rather than an empty page
    return matched.length > 0 ? matched : initialWorks;
  }, [activeCategory, initialWorks]);

  return (
    <div className={styles.worksWrapper}>
      {/* 1. Masthead Hero Deck */}
      <header className={styles.heroHeader}>
        <div className={styles.kickerRow}>
          <span className={styles.kicker}>02 / Portfolio Archive</span>
          <div className={styles.countBadge}>
            <span className={styles.pulseDot} aria-hidden="true" />
            <span className={styles.countText}>
              {initialWorks.length} Active Commissions
            </span>
          </div>
        </div>

        <h1 className={styles.displayTitle}>
          Proof of intent.<br />Engineered to endure.
        </h1>

        <p className={styles.heroLead}>
          A curated index of strategic identities, enterprise digital platforms, and immersive brand experiences engineered by the Marca Ubi studio.
        </p>
      </header>

      {/* 2. Taxonomy Filter Bar */}
      <nav className={styles.filterBar} aria-label="Filter works by discipline">
        <div className={styles.pillGroup} role="tablist">
          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                role="tab"
                aria-selected={isActive}
                className={`${styles.filterPill} ${isActive ? styles.activePill : ""}`}
                onClick={() => setActiveCategory(cat.id)}
              >
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* 3. Broadsheet Portfolio Grid */}
      <section className={styles.broadsheetGrid} aria-label="Curated Projects">
        {filteredWorks.map((work, index) => {
          const imageUrl = work.coverImage
            ? urlFor(work.coverImage).width(1600).height(900).quality(90).url()
            : "/images/work-image.png";

          const projectIndex = String(index + 1).padStart(2, "0");

          return (
            <article key={work._id} className={styles.projectCard}>
              {/* Media Frame (16:9 Broadsheet) */}
              <div className={styles.mediaFrame}>
                <Image
                  src={imageUrl}
                  alt={`Cover media for ${work.title}`}
                  fill
                  sizes="(max-width: 1024px) 100vw, 1400px"
                  className={styles.coverImage}
                  priority={index < 2}
                />
                <div className={styles.mediaOverlay} aria-hidden="true" />
                <span className={styles.indexBadge} aria-label={`Project ${projectIndex}`}>
                  {projectIndex}
                </span>
              </div>

              {/* Project Metadata Footer */}
              <div className={styles.cardDetails}>
                <div className={styles.titleRow}>
                  <h2 className={styles.projectTitle}>{work.title}</h2>
                  {work.viewWorkLink && (
                    <a
                      href={work.viewWorkLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.liveLink}
                      aria-label={`Visit live platform for ${work.title}`}
                    >
                      <span>Live Platform</span>
                      <span className={styles.arrow} aria-hidden="true">&nearr;</span>
                    </a>
                  )}
                </div>

                <p className={styles.projectSubtext}>{work.subtext}</p>

                <div className={styles.actionRow}>
                  {work.caseStudyLink ? (
                    <a
                      href={work.caseStudyLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.caseStudyLink}
                    >
                      <span>Read Case Study</span>
                      <span className={styles.arrow} aria-hidden="true">&rarr;</span>
                    </a>
                  ) : (
                    <Link href="/start-project" className={styles.caseStudyLink}>
                      <span>Explore Execution Details</span>
                      <span className={styles.arrow} aria-hidden="true">&rarr;</span>
                    </Link>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </section>

      {/* 4. Bottom Commission Bridge */}
      <aside className={styles.commissionBridge}>
        <div className={styles.bridgeContent}>
          <span className={styles.bridgeKicker}>Ready to initiate?</span>
          <h2 className={styles.bridgeTitle}>
            Let&apos;s build something monumental together.
          </h2>
          <p className={styles.bridgeText}>
            We partner with discerning leaders across luxury hospitality, logistics intelligence, and institutional enterprise.
          </p>
          <div className={styles.bridgeActionWrap}>
            <Link href="/start-project" className={styles.bridgeButton}>
              <span>Initiate Commission</span>
              <span className={styles.arrow} aria-hidden="true">&rarr;</span>
            </Link>
          </div>
        </div>
      </aside>
    </div>
  );
}

export default WorksGalleryClient;
