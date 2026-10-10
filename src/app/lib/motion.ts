export const MOBILE_MOTION_BREAKPOINT = 1024;

export function shouldUseMobileMotion() {
  if (typeof window === "undefined") {
    return false;
  }

  const mobileOrTabletViewport = window.matchMedia(`(max-width: ${MOBILE_MOTION_BREAKPOINT}px)`).matches;
  const coarsePointer = window.matchMedia("(pointer: coarse)").matches;

  return mobileOrTabletViewport && coarsePointer;
}

export function prefersReducedMotion() {
  if (typeof window === "undefined") {
    return false;
  }

  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
