"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import type { CareerPosting } from "@/sanity/lib/career-queries";
import styles from "./CareersListing.module.scss";

export interface CareersListingClientProps {
  careers: CareerPosting[];
}

/**
 * Careers Listing Client Experience.
 * Renders the studio collaborative workspace photo, Swiss hairline hero headline,
 * and high-contrast editorial position table with keyboard-accessible navigation rows.
 *
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */
export function CareersListingClient({ careers }: CareersListingClientProps) {
  return (
    <div className={styles.container}>
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className={styles.breadcrumbNav}>
        <ol className={styles.breadcrumbList}>
          <li className={styles.breadcrumbItem}>
            <Link href="/" className={styles.breadcrumbLink}>
              Home
            </Link>
          </li>
          <li className={styles.breadcrumbSeparator} aria-hidden="true">
            /
          </li>
          <li className={styles.breadcrumbItem} aria-current="page">
            <span className={styles.breadcrumbCurrent}>Careers</span>
          </li>
        </ol>
      </nav>

      {/* Hero Header with Swiss Hairline Thin Typography */}
      <header className={styles.heroHeader}>
        <h1 className={styles.heroHeadline}>
          We’re always on the lookout for talented people to join our team.
        </h1>
      </header>

      {/* Studio Workspace Banner */}
      <div className={styles.bannerContainer}>
        <Image
          src="/images/careers/team-studio.png"
          alt="Marca Ubi collaborative studio workspace in Kerala"
          width={1600}
          height={900}
          priority
          className={styles.bannerImage}
          sizes="(max-width: 768px) 100vw, (max-width: 1440px) 90vw, 1400px"
        />
      </div>

      {/* Open Positions Section */}
      <section className={styles.positionsSection} aria-label="Open Positions">
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Open Positions</h2>
          <span className={styles.positionCount} aria-label={`${careers.length} open positions`}>
            {careers.length < 10 ? `0${careers.length}` : careers.length} Roles Active
          </span>
        </div>

        <div className={styles.positionsTable} role="list">
          {careers.map((career) => {
            const slug = typeof career.slug === "string" ? career.slug : (career.slug as { current: string })?.current;
            const metaItems = [
              career.location,
              career.workplaceType,
              career.employmentType,
              career.experience,
            ].filter(Boolean);

            return (
              <Link
                key={career._id || slug}
                href={`/careers/${slug}`}
                className={styles.positionRow}
                role="listitem"
                aria-label={`View role details and apply for ${career.title} in ${career.location}`}
              >
                <div className={styles.positionInfo}>
                  <h3 className={styles.roleTitle}>{career.title}</h3>
                  <p className={styles.roleMeta}>{metaItems.join(" · ")}</p>
                </div>

                <div className={styles.actionColumn}>
                  <span className={styles.applyLink}>
                    Apply Now
                    <span className={styles.arrowIcon} aria-hidden="true">
                      &rarr;
                    </span>
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}

export default CareersListingClient;
