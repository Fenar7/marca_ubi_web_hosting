"use client";

import React, { useState } from "react";
import BackgroundVideoEngine from "../BackgroundVideo/BackgroundVideoEngine";
import ClientHeader from "../ClientHeader/ClientHeader";
import HeroCutout from "../Sections/HeroCutout";
import EditorialManifesto from "../Sections/EditorialManifesto";
import ReelCutout from "../Sections/ReelCutout";
import CapabilitiesCloud from "../Sections/CapabilitiesCloud";
import CareersCutout from "../Sections/CareersCutout";
import GlobalLocationsCloud from "../Sections/GlobalLocationsCloud";
import ConnectCutout from "../Sections/ConnectCutout";
import MonumentalFooter from "../Sections/MonumentalFooter";
import ReelModal from "../ReelModal/ReelModal";

/**
 * Master Client Experience Container.
 * Orchestrates the 160over90 alternating video cutout & white curtain architecture.
 * Manages showreel modal state and synchronizes audio/video playback.
 */
export function ClientHomeExperience() {
  const [isReelOpen, setIsReelOpen] = useState(false);

  const handleOpenReel = () => setIsReelOpen(true);
  const handleCloseReel = () => setIsReelOpen(false);

  return (
    <div data-client-shell="true" style={{ position: "relative", minHeight: "100vh" }}>
      {/* 1. Persistent Living Video Engine (Fixed z-index: -1) */}
      <BackgroundVideoEngine isPausedByModal={isReelOpen} />

      {/* 2. Adaptive Navigation Header (Fixed z-index: 50) */}
      <ClientHeader onOpenReel={handleOpenReel} />

      {/* 3. Main Alternating Content Stream (z-index: 10) */}
      <main id="main-content" tabIndex={-1}>
        {/* View 01: Hero Video Cutout */}
        <HeroCutout
          headline="Engineering Brands That Move The World."
          kicker="Strategic Brand Architecture & Cultural Velocity"
        />

        {/* View 02: Editorial Manifesto Curtain (Solid White) */}
        <EditorialManifesto />

        {/* View 03: Showreel & Curated Work Cutout */}
        <ReelCutout
          onPlayReel={handleOpenReel}
          headline="Everything you expect. A few things you don't."
        />

        {/* View 04: Capabilities & Disciplines Cloud (Solid White) */}
        <CapabilitiesCloud />

        {/* View 05: Careers / Collaboration Cutout */}
        <CareersCutout />

        {/* View 06: Global Footprint / Studio Locations (Solid White) */}
        <GlobalLocationsCloud />

        {/* View 07: Client Inquiries & Socials Cutout */}
        <ConnectCutout />

        {/* View 08: Deep Black Monumental Footer (Solid Black) */}
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
