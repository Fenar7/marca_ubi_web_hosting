"use client";

import React, { useState } from "react";
import BackgroundVideoEngine from "../BackgroundVideo/BackgroundVideoEngine";
import ClientHeader from "../ClientHeader/ClientHeader";
import HeroCutout from "../Sections/HeroCutout";
import AboutDoctrineCurtain from "../Sections/AboutDoctrineCurtain";
import ReelCutout from "../Sections/ReelCutout";
import StatementCurtain from "../Sections/StatementCurtain";
import WorksCutout from "../Sections/WorksCutout";
import ValuesCutout from "../Sections/ValuesCutout";
import ProcessCurtain from "../Sections/ProcessCurtain";
import TestimonialsCutout from "../Sections/TestimonialsCutout";
import DispatchesCurtain from "../Sections/DispatchesCurtain";
import GlobalLocationsCloud from "../Sections/GlobalLocationsCloud";
import ConnectCutout from "../Sections/ConnectCutout";
import MonumentalFooter from "../Sections/MonumentalFooter";
import ReelModal from "../ReelModal/ReelModal";
import type { SanityWork } from "../WorksSection/WorksSectionClient";
import type { PostSummary } from "@/sanity/types/blog";

export interface ClientHomeExperienceProps {
  works?: SanityWork[];
  posts?: PostSummary[];
}

/**
 * Master Client Experience Container.
 * Orchestrates the complete 160over90 alternating video cutout & pure white curtain stream.
 * Integrates 100% of authentic agency content across 12 synchronized views.
 *
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */
export function ClientHomeExperience({ works = [], posts = [] }: ClientHomeExperienceProps) {
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

        {/* View 02: About & Doctrine Curtain (Solid Pure White) */}
        <AboutDoctrineCurtain />

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
          kicker="02 / Selected Works"
          ctaLabel="View Works"
          ctaHref="/works"
        />

        {/* View 06: Strategy & Delivery Methodology Curtain (Solid Pure White) */}
        <ProcessCurtain />

        {/* View 07: Guiding Principles Cutout (Transparent Video with Apple HIG Vibrancy Glass Cards) */}
        <ValuesCutout />

        {/* View 08: Client Evidence & Testimonials Cutout (Transparent Video) */}
        <TestimonialsCutout />

        {/* View 09: Studio Dispatches & Insights Curtain (Solid Pure White with latest 3 Sanity posts) */}
        <DispatchesCurtain posts={posts} />

        {/* View 10: Global Studio Footprint & Synchronized Operations Curtain (Solid Pure White) */}
        <GlobalLocationsCloud />

        {/* View 11: Connect & Commercial Desk Cutout (Transparent Video with genuine Kerala desks) */}
        <ConnectCutout />

        {/* View 12: Deep Obsidian Black Monumental Footer (Solid Pitch Black) */}
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
