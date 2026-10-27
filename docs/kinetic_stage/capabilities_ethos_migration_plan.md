# Kinetic Stage Capabilities Migration Plan

**Document ID**: `docs/kinetic_stage/capabilities_ethos_migration_plan.md`  
**Target Reference**: `Screenshot 2026-10-27 132036.png` & `Screenshot 2026-10-27 132110.png`  
**Target Branch**: `showcase/homepage-works-cutout-and-portfolio-showcase`  
**Target PR**: [Pull Request #84](https://github.com/Fenar7/marca_ubi_web_hosting/pull/84) (Strictly `OPEN`)  

---

## 1. Executive Summary

Migrated the right-panel `KineticStage` constellation in `NavigationOverlay` from legacy generic words (`Culture`, `Design`, `Craft`, `Tech`, `Impact`) to Marca Ubi's authentic 5 core agency capabilities:

1. **Brand Engineering** (`xPct: 24, yPct: 22`) — Top-Left Quadrant
2. **Identity & Art Systems** (`xPct: 76, yPct: 22`) — Top-Right Quadrant
3. **Digital Experience Design** (`xPct: 26, yPct: 78`) — Bottom-Left Quadrant
4. **Communication & Growth** (`xPct: 74, yPct: 78`) — Bottom-Right Quadrant
5. **Brand Transformation** (`xPct: 50, yPct: 50`, `isCenterHub: true`) — Center Nexus Anchor with the signature living brand red dot (`#ea002a`) and pulsing ring.

---

## 2. Technical Enhancements

- **Dynamic Bounding Rect Vector Tracking**: Replaced static percentage approximations with `getTargetCoordinates()`, measuring live bounding client rects relative to the stage host, coupled with `repeatRefresh: true` on the GSAP timeline and a dedicated `ResizeObserver`.
- **Positional Stability on Pulse**: Separated outer CSS positioning (`.wordNode: translate(-50%, -50%)`) from animated inner content (`.wordInner: scale(1.08)`), preventing GSAP scale pulses from interfering with absolute positioning.
- **Responsive Geometry**: Expanded `wordsContainer` to `max-width: 820px, max-height: 640px` with safe margins `clamp(2rem, 5vh, 4rem) clamp(2.5rem, 4.5vw, 5rem)`, ensuring multi-word capability titles never overlap or clip against the close trigger.
- **Left Panel Hover State**: Preserved the brilliant brand accent red hover transition (`color: $client-accent-red;`) on all left-panel links (`Work →`, `Services →`, `Locations →`, `Careers →`, `Contact →`).
