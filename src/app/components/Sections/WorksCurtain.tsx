"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { urlFor } from "@/sanity/lib/image";
import type { SanityImageSource } from "@sanity/image-url";
import type { SanityWork } from "@/app/components/WorksSection/WorksSectionClient";
import styles from "./WorksCurtain.module.scss";

export interface ClientDisplayWork {
  _id: string;
  title: string;
  subtext: string;
  coverImage?: SanityImageSource | null;
  caseStudyLink?: string;
  testimonialLink?: string;
  viewWorkLink?: string;
}

interface WorksCurtainProps {
  works?: SanityWork[];
}

/**
 * View 04: Curated Works Showcase Curtain.
 * Solid pure white curtain (#ffffff) sliding over the living background video.
 * Enforces the 160over90 Swiss 30/70 broadsheet case study showcase.
 * Displays dynamic client projects from Sanity CMS with full fallback resiliency.
 */
export function WorksCurtain({ works = [] }: WorksCurtainProps) {
  // Safe fallback if Sanity has no records or fetch fails
  const displayWorks: ClientDisplayWork[] = works.length > 0 ? works : [
    {
      _id: "fallback-1",
      title: "PrimeStay Luxury Living",
      subtext: "Complete brand architecture, interior sensory language, and digital hospitality platform.",
      coverImage: null,
      caseStudyLink: undefined,
      viewWorkLink: "https://primestay.ae",
    },
    {
      _id: "fallback-2",
      title: "LogiP Supply Chain Intelligence",
      subtext: "Enterprise design system, executive analytics workspace, and predictive freight platform.",
      coverImage: null,
      caseStudyLink: undefined,
      viewWorkLink: "https://marcaubi.com",
    },
  ];

  return (
    <section
      className={styles.worksSection}
      id="works"
      aria-label="Selected Works Portfolio"
      data-header-theme="light"
    >
      <div className={styles.gridContainer}>
        {/* Left Sticky Rail (30%) */}
        <aside className={styles.leftColumn}>
          <div className={styles.stickyRail}>
            <span className={styles.sectionLabel}>02 / Selected Works</span>
            <h2 className={styles.railHeadline}>
              Proof of intent. Engineered to endure.
            </h2>
            <p className={styles.railSummary}>
              A curated index of strategic identities, enterprise digital platforms, and immersive brand experiences.
            </p>
            <div className={styles.metaRow}>
              <span className={styles.indexCount}>{displayWorks.length}</span>
              <span className={styles.indexLabel}>Active Case Studies</span>
            </div>
            <div className={styles.actionWrap}>
              <Link href="/start-project" className={styles.architecturalButton}>
                <span>Initiate Commission</span>
                <span className={styles.arrow} aria-hidden="true">&rarr;</span>
              </Link>
            </div>
          </div>
        </aside>

        {/* Right Broadsheet Works Stream (70%) */}
        <div className={styles.rightColumn}>
          <div className={styles.worksStream}>
            {displayWorks.map((work, index) => {
              const imageUrl = work.coverImage
                ? urlFor(work.coverImage).width(1600).height(900).quality(90).url()
                : "/images/work-image.png";

              const projectNumber = String(index + 1).padStart(2, "0");

              return (
                <article key={work._id} className={styles.workCard}>
                  {/* Broadsheet 16:9 Image Frame */}
                  <div className={styles.imageFrame}>
                    <Image
                      src={imageUrl}
                      alt={work.title}
                      fill
                      sizes="(max-width: 1024px) 100vw, 70vw"
                      className={styles.projectImage}
                      priority={index < 2}
                    />
                    <div className={styles.imageOverlay} aria-hidden="true" />
                    <span className={styles.projectIndexBadge} aria-hidden="true">
                      {projectNumber}
                    </span>
                  </div>

                  {/* Project Details Footer */}
                  <div className={styles.cardContent}>
                    <div className={styles.titleRow}>
                      <h3 className={styles.projectTitle}>{work.title}</h3>
                      {work.viewWorkLink && (
                        <a
                          href={work.viewWorkLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.liveProjectLink}
                          aria-label={`Open live project for ${work.title}`}
                        >
                          <span>Live Platform</span>
                          <span className={styles.linkArrow} aria-hidden="true">&nearr;</span>
                        </a>
                      )}
                    </div>

                    <p className={styles.projectSubtext}>{work.subtext}</p>

                    {/* Architectural Action Links */}
                    <div className={styles.cardActions}>
                      {work.caseStudyLink ? (
                        <a
                          href={work.caseStudyLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.textAction}
                        >
                          <span>Read Case Study</span>
                          <span className={styles.arrow} aria-hidden="true">&rarr;</span>
                        </a>
                      ) : (
                        <Link href="/start-project" className={styles.textAction}>
                          <span>Explore Execution Details</span>
                          <span className={styles.arrow} aria-hidden="true">&rarr;</span>
                        </Link>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

export default WorksCurtain;
