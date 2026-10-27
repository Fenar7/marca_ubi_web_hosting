# Kinetic Stage: Glyphs Restoration & Pure Continuous Animation Plan

**Document ID**: `docs/kinetic_stage/kinetic_glyphs_and_continuous_animation_plan.md`  
**Target Reference**: `Screenshot 2026-10-27 134039.png`  
**Target Files**: 
- `src/app/components/NavigationOverlay/KineticStage.tsx`
- `src/app/components/NavigationOverlay/KineticStage.module.scss`
**Target Branch**: `showcase/homepage-works-cutout-and-portfolio-showcase`  
**Target PR**: [Pull Request #84](https://github.com/Fenar7/marca_ubi_web_hosting/pull/84) (Strictly `OPEN`)  

---

## 1. Problem Statement & Root Cause

Based on user review of `Screenshot 2026-10-27 134039.png`:
> *"where is the icons etc for each ? also the arrow is not working that animation thing no need to make the arrow interactive btw it should just keep on animating there"*

1. **Missing Glyphs**: The 4 capability nodes (`Brand Engineering`, `Identity & Art Systems`, `Digital Experience Design`, `Communication & Growth`) lacked their signature icon symbols (`✦`, `✌`, `🌐`, `♡`).
2. **Arrow Animation Stalled / Paused**: 
   - `KineticStage.tsx` previously attached `onPointerMove` listeners that paused the GSAP timeline whenever the mouse hovered over the right panel.
   - Dynamic `getBoundingClientRect()` calls failed or zeroed out during the overlay's entrance transition.
   - **User Requirement**: No mouse interaction hijack. The vector arrow cursor should **purely and continuously loop animate**, gliding between all 5 capability nodes indefinitely.

---

## 2. Technical Blueprint

### A. Restore Signature Glyphs in `KineticStage.tsx`

```typescript
export const DEFAULT_STAGE_WORDS: readonly WordNode[] = [
  {
    id: "brand-engineering",
    label: "Brand Engineering",
    glyph: "✦",
    xPct: 24,
    yPct: 22,
  },
  {
    id: "identity-art-systems",
    label: "Identity & Art Systems",
    glyph: "✌",
    xPct: 76,
    yPct: 22,
  },
  {
    id: "brand-transformation",
    label: "Brand Transformation",
    xPct: 50,
    yPct: 50,
    isCenterHub: true,
  },
  {
    id: "digital-experience-design",
    label: "Digital Experience Design",
    glyph: "🌐",
    xPct: 24,
    yPct: 78,
  },
  {
    id: "communication-growth",
    label: "Communication & Growth",
    glyph: "♡",
    xPct: 76,
    yPct: 78,
  },
] as const;
```

### B. Bulletproof Continuous GSAP Flight Loop

1. **Position Cursor Inside `.wordsContainer`**:
   The cursor wrapper is placed directly within `.wordsContainer` using percentage coordinate interpolation (`left: word.xPct%`, `top: word.yPct%`). This eliminates any dependency on fragile `getBoundingClientRect()` and guarantees exact optical alignment with the button centers.
2. **Eradicate Pointer Interception**:
   Remove `onPointerMove` and pointer pause logic so user mouse movement never halts or derails the flight timeline.
3. **Continuous Timeline**:
   ```typescript
   const startAutonomousLoop = useCallback(() => {
     if (!cursorRef.current || isReducedMotion) return;
     if (timelineRef.current) timelineRef.current.kill();

     const tl = gsap.timeline({ repeat: -1 });

     words.forEach((word) => {
       // 1. Fluid glide to target percentage coordinates
       tl.to(cursorRef.current, {
         left: `${word.xPct}%`,
         top: `${word.yPct}%`,
         duration: 1.25,
         ease: "power2.inOut",
       });

       // 2. Tactile click pulse
       tl.call(() => {
         setActiveWordId(word.id);
         setIsClicking(true);
         triggerNodePulse(word.id);
         setTimeout(() => setIsClicking(false), 130);
       });

       // 3. Dwell phase
       tl.to({}, { duration: 0.85 });
     });

     timelineRef.current = tl;
   }, [isReducedMotion, words, triggerNodePulse]);
   ```

---

## 3. Verification & Compliance Checklist

- [ ] All 4 peripheral capabilities display their iconic glyphs (`✦`, `✌`, `🌐`, `♡`).
- [ ] Central `Brand Transformation` displays its glowing brand red dot (`#ea002a`) with pulsing ring.
- [ ] Vector cursor animates continuously in a seamless loop without stopping or getting paused by mouse hover.
- [ ] PR #84 remains strictly in an `OPEN` state, authored as `Fenar7`.
