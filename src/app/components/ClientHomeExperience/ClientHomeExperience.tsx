"use client";

import React, { useState } from "react";
import BackgroundVideoEngine from "../BackgroundVideo/BackgroundVideoEngine";
import ClientHeader from "../ClientHeader/ClientHeader";
import HeroCutout from "../Sections/HeroCutout";
import AboutCurtain from "../Sections/AboutCurtain";
import ReelCutout from "../Sections/ReelCutout";
import StatementCurtain from "../Sections/StatementCurtain";
import WorksCutout from "../Sections/WorksCutout";
import ValuesCutout from "../Sections/ValuesCutout";
import ProcessCurtain from "../Sections/ProcessCurtain";
import TestimonialsCutout from "../Sections/TestimonialsCutout";
import FaqCurtain from "../Sections/FaqCurtain";
import DispatchesCurtain from "../Sections/DispatchesCurtain";
import CareersCutout from "../Sections/CareersCutout";
import GlobalLocationsCloud from "../Sections/GlobalLocationsCloud";
import ConnectCutout from "../Sections/ConnectCutout";
import MonumentalFooter from "../Sections/MonumentalFooter";
import ReelModal from "../ReelModal/ReelModal";
import type { SanityWork } from "../WorksSection/WorksSectionClient";
import type { PostSummary } from "@/sanity/types/blog";
import type { SanityFaqItem } from "@/sanity/lib/faq-queries";

export interface ClientHomeExperienceProps {
  works?: SanityWork[];
  posts?: PostSummary[];
  faqs?: SanityFaqItem[];
}

/**
 * Master Client Experience Container.
 * Orchestrates the complete 160over90 alternating video cutout & pure white curtain stream.
 * Integrates 100% of authentic agency content across 12 synchronized views.
 *
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */
export function ClientHomeExperience({ works = [], posts = [], faqs = [] }: ClientHomeExperienceProps) {
  const [isReelOpen, setIsReelOpen] = useState(false);

  const handleOpenReel = () => setIsReelOpen(true);
  const handleCloseReel = () => setIsReelOpen(false);

  return (
    <div data-client-shell="true" style={{ position: "relative", minHeight: "100vh" }}>
      {/* 1. Persistent Living Video Engine (Fixed z-index: -1) */}
      <BackgroundVideoEngine isPausedByModal={isReelOpen} />

      {/* 2. Adaptive Navigation Header (Fixed z-index: 50, IntersectionObserver theme flip) */}
      <ClientHeader onOpenReel={handleOpenReel} />

      {/* 3. Main Alternating Content Stream (z-index: 10) */}
      <main id="main-content" tabIndex={-1}>
        {/* View 01: Hero Video Cutout (Transparent, Pure Monumental 160/90 Headline) */}
        <HeroCutout
          headline={"Engineering Brands\nThat Move The World."}
        />

        {/* View 02: About Curtain (Solid Pure White) */}
        <AboutCurtain />

        {/* View 03: Showreel Cutout (Transparent) */}
        <ReelCutout
          onPlayReel={handleOpenReel}
          headline="Everything you expect. A few things you don't."
        />

        {/* View 04: Monumental Statement Curtain (Solid Pure White) */}
        <StatementCurtain />

        {/* View 05: Curated Works Portfolio Cutout (Transparent Video with Circular XX and link to /works) */}
        <WorksCutout
          headline={"Work\nwith us."}
          ctaLabel="View Works"
          ctaHref="/works"
        />

        {/* View 06: Strategy & Delivery Methodology Curtain (Solid Pure White) */}
        <ProcessCurtain />

        {/* View 07: Guiding Principles Cutout (Transparent Video with Apple HIG Vibrancy Glass Cards) */}
        <ValuesCutout />

        {/* View 08: Client Evidence & Testimonials Curtain (Solid Pure White) */}
        <TestimonialsCutout />

        {/* View 09: Frequently Asked Questions Curtain (Solid Pure White, Swiss Hairline Thin Accordion) */}
        <FaqCurtain faqs={faqs} />

        {/* View 10: Studio Dispatches & Insights Curtain (Solid Pure White with latest 3 Sanity posts) */}
        <DispatchesCurtain posts={posts} />

        {/* View 11: Careers Cutout (Transparent Living Background Video) */}
        <CareersCutout />

        {/* View 12: Global Studio Footprint & Synchronized Operations Curtain (Solid Pure White) */}
        <GlobalLocationsCloud />

        {/* View 13: Connect & Commercial Desk Cutout (Transparent Video with genuine Kerala desks) */}
        <ConnectCutout />

        {/* View 14: Deep Obsidian Black Monumental Footer (Solid Pitch Black) */}
        <MonumentalFooter />
      </main>

      {/* Global Accessible Video Showreel Modal */}
      <ReelModal
        isOpen={isReelOpen}
        onClose={handleCloseReel}
        videoSrc="/video/video-web.mp4"
      />
    </div>
  );
}

export default ClientHomeExperience;
