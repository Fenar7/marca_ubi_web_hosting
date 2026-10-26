"use client";

import React, { useState, useMemo, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { shouldUseMobileMotion, prefersReducedMotion } from "@/app/lib/motion";
import { urlFor } from "@/sanity/lib/image";
import type { SanityWork } from "@/app/components/WorksSection/WorksSectionClient";
import styles from "./Works.module.scss";

gsap.registerPlugin(ScrollTrigger);

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
 * Normalizes raw all-caps strings from legacy CMS entries to natural typography.
 * Preserves existing mixed-case strings (e.g. "PropertySeller UAE", "LogiP") and known acronyms.
 */
function toNaturalCase(text?: string | null): string {
  if (!text) return "";
  const trimmed = text.trim();
  if (!trimmed) return "";

  // If the text contains lowercase characters, respect the original authoring
  if (/[a-z]/.test(trimmed)) {
    return trimmed;
  }

  // Explicit mappings for known luxury commission brands and categories
  const EXACT_MAP: Record<string, string> = {
    KUNSTLERIN: "KünstlerIn",
    ECOMMERCE: "E-Commerce",
    "REAL ESTATE": "Real Estate",
    HOSPITALITY: "Hospitality",
    LOGISTICS: "Logistics",
    ENTERPRISE: "Enterprise",
  };

  if (EXACT_MAP[trimmed.toUpperCase()]) {
    return EXACT_MAP[trimmed.toUpperCase()];
  }

  // Natural Title Case conversion for shouting strings
  return trimmed
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Dedicated Client Works & Portfolio Showcase Gallery.
 * Implements the signature 3D perspective card stacking stream with GSAP ScrollTrigger,
 * synchronized image de-zoom, pinned title scrub fill in Brand Red (#ea002a),
 * and official Circular XX typography.
 *
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */
export function WorksGalleryClient({ initialWorks }: WorksGalleryClientProps) {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const containerRef = useRef<HTMLDivElement>(null);

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
    return matched.length > 0 ? matched : initialWorks;
  }, [activeCategory, initialWorks]);

  // GSAP 3D Card Stacking & Pinned Title Scrub Engine
  useGSAP(
    () => {
      const container = containerRef.current;
      if (!container) return;

      const isMobile = window.matchMedia("(max-width: 56.1875rem)").matches;
      const mobileMotion = shouldUseMobileMotion();
      const isReduced = prefersReducedMotion();

      const titleFill = container.querySelector<HTMLElement>(`.${styles.worksTitleFill}`);
      const titleSection = container.querySelector<HTMLElement>(`.${styles.titleSectionContainer}`);
      const titleH2 = titleSection?.querySelector<HTMLElement>("h2");
      const wrappers = gsap.utils.toArray<HTMLElement>(`.${styles.workDeckWrapper}`, container);

      const setSafeState = (filled: boolean) => {
        if (titleFill) {
          gsap.set(titleFill, { "--title-fill": filled ? "100%" : "0%" });
        }
        if (titleH2) {
          gsap.set(titleH2, { autoAlpha: 1, y: 0 });
        }
        wrappers.forEach((wrapper) => {
          const card = wrapper.querySelector<HTMLElement>(`.${styles.workDeckCard}`);
          const image = card?.querySelector<HTMLElement>(`.${styles.cardCoverMedia} img`);
          if (card) gsap.set(card, { clearProps: "transform" });
          if (image) gsap.set(image, { scale: 1 });
        });
      };

      if (isReduced) {
        setSafeState(true);
        return;
      }

      // 1. Pinned Title Sweep (Brand Red #ea002a)
      if (titleFill && titleSection) {
        if (isMobile) {
          gsap.set(titleFill, { "--title-fill": "0%" });
          if (titleH2) {
            gsap.set(titleH2, { autoAlpha: 0, y: 24 });
            gsap.timeline({
              scrollTrigger: {
                trigger: titleSection,
                start: "top 78%",
                toggleActions: "play none none reverse",
                invalidateOnRefresh: true,
              },
            })
            .to(titleH2, { autoAlpha: 1, y: 0, duration: 0.65, ease: "power3.out" }, 0)
            .to(titleFill, { "--title-fill": "100%", duration: 0.85, ease: "power2.out" }, 0.12);
          }
        } else {
          gsap.timeline({
            scrollTrigger: {
              trigger: titleSection,
              start: "center center",
              end: "+=60%",
              pin: true,
              scrub: true,
              pinSpacing: true,
              anticipatePin: 1,
              invalidateOnRefresh: true,
            },
          })
          .fromTo(titleFill, { "--title-fill": "0%" }, { "--title-fill": "100%", ease: "none" });
        }
      } else {
        setSafeState(true);
      }

      // 2. 3D Perspective Card Entrance & Parallax De-Zoom
      wrappers.forEach((wrapper) => {
        const card = wrapper.querySelector<HTMLElement>(`.${styles.workDeckCard}`);
        const image = card?.querySelector<HTMLElement>(`.${styles.cardCoverMedia} img`);
        if (!card) return;

        gsap.fromTo(
          card,
          {
            rotateZ: mobileMotion ? 8 : 18,
            rotateX: mobileMotion ? 3 : 6,
            y: mobileMotion ? 34 : 0,
            scale: mobileMotion ? 0.88 : 0.72,
            transformOrigin: "center bottom",
            transformPerspective: 1400,
          },
          {
            y: 0,
            rotateZ: 0,
            rotateX: 0,
            scale: 1,
            ease: "power2.out",
            force3D: true,
            scrollTrigger: {
              trigger: wrapper,
              start: "top bottom",
              end: mobileMotion ? "top 24%" : "top 20%",
              scrub: mobileMotion ? 0.9 : true,
              invalidateOnRefresh: true,
            },
          }
        );

        if (image) {
          gsap.fromTo(
            image,
            { scale: mobileMotion ? 1.16 : 1.28 },
            {
              scale: 1,
              ease: "power2.out",
              force3D: true,
              scrollTrigger: {
                trigger: wrapper,
                start: "top bottom",
                end: mobileMotion ? "top 24%" : "top 20%",
                scrub: mobileMotion ? 0.9 : true,
                invalidateOnRefresh: true,
              },
            }
          );
        }
      });

      const refreshTimer = setTimeout(() => {
        ScrollTrigger.refresh();
      }, 250);

      return () => {
        clearTimeout(refreshTimer);
      };
    },
    { scope: containerRef, dependencies: [filteredWorks] }
  );

  return (
    <div className={styles.worksPageWrapper} ref={containerRef}>
      <div className={styles.worksWrapper}>
        {/* 1. Masthead Hero Deck */}
        <header className={styles.heroHeader}>
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
                  type="button"
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
      </div>

      {/* 3. Pinned Title Scrub Deck */}
      <div className={styles.worksTitleWrap}>
        <div className={styles.titleSectionContainer}>
          <h2>
            <span className={styles.worksTitleFill}>CURATED WORKS</span>
          </h2>
        </div>
      </div>

      {/* 4. 3D Perspective Sticky Card Stacking Stream */}
      <section className={styles.worksDeckStream} aria-label="Curated Projects Deck">
        {filteredWorks.map((work, index) => {
          const imageUrl = work.coverImage
            ? urlFor(work.coverImage).width(1920).height(1080).quality(92).url()
            : "/images/work-image.png";

          const projectIndex = String(index + 1).padStart(2, "0");
          const totalCount = String(filteredWorks.length).padStart(2, "0");

          return (
            <div
              key={work._id}
              className={styles.workDeckWrapper}
              style={{ zIndex: index + 1 }}
            >
              <article
                className={`${styles.workDeckCard} ${work.viewWorkLink ? styles.isClickable : ""}`}
                onClick={() => {
                  if (work.viewWorkLink) {
                    window.open(work.viewWorkLink, "_blank", "noopener,noreferrer");
                  }
                }}
                role={work.viewWorkLink ? "link" : undefined}
                tabIndex={work.viewWorkLink ? 0 : undefined}
                onKeyDown={(e) => {
                  if (work.viewWorkLink && (e.key === "Enter" || e.key === " ")) {
                    e.preventDefault();
                    window.open(work.viewWorkLink, "_blank", "noopener,noreferrer");
                  }
                }}
                aria-label={`Project: ${work.title}`}
              >
                {/* 100% Fill Cover Image with Scroll De-Zoom */}
                <div className={styles.cardCoverMedia}>
                  <Image
                    src={imageUrl}
                    alt={`Cover media for ${work.title}`}
                    fill
                    sizes="100vw"
                    priority={index < 2}
                  />
                </div>

                {/* Dark Contrast Scrim Gradient */}
                <div className={styles.cardScrimOverlay} aria-hidden="true" />

                {/* Top-Left Monospace Index Badge */}
                <span className={styles.indexBadge} aria-label={`Project ${projectIndex} of ${totalCount}`}>
                  {projectIndex} / {totalCount}
                </span>

                {/* Left Side Vertically Centered Typographic Block */}
                <div className={styles.cardLeftContent}>
                  <h3 className={styles.cardTitle}>{toNaturalCase(work.title)}</h3>
                  {work.subtext && (
                    <p className={styles.cardSubtext}>{toNaturalCase(work.subtext)}</p>
                  )}
                </div>

                {/* Bottom-Right Interactive Action Buttons */}
                {(work.viewWorkLink || work.caseStudyLink || work.testimonialLink) && (
                  <div
                    className={styles.cardBottomRightActions}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {work.caseStudyLink && (
                      <a
                        href={work.caseStudyLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.actionPillLink}
                        aria-label={`Read case study for ${work.title}`}
                      >
                        <span>Case Study</span>
                        <span className={styles.actionGlyph} aria-hidden="true">↗</span>
                      </a>
                    )}
                    {work.testimonialLink && (
                      <a
                        href={work.testimonialLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.actionPillLink}
                        aria-label={`View testimonial for ${work.title}`}
                      >
                        <span>Testimonial</span>
                        <span className={styles.actionGlyph} aria-hidden="true">↗</span>
                      </a>
                    )}
                    {work.viewWorkLink && (
                      <a
                        href={work.viewWorkLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`${styles.actionPillLink} ${styles.primaryAction}`}
                        aria-label={`View live platform for ${work.title}`}
                      >
                        <span>View Work</span>
                        <span className={styles.actionGlyph} aria-hidden="true">↗</span>
                      </a>
                    )}
                  </div>
                )}
              </article>
            </div>
          );
        })}
      </section>

      {/* 5. Bottom Monumental Commission Bridge */}
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
