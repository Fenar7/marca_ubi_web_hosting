export const MOBILE_MOTION_BREAKPOINT = 767;

export function shouldUseMobileMotion() {
  if (typeof window === "undefined") {
    return false;
  }

  const phoneSizedViewport = window.matchMedia(`(max-width: ${MOBILE_MOTION_BREAKPOINT}px)`).matches;
  const coarsePointer = window.matchMedia("(pointer: coarse)").matches;

  return phoneSizedViewport && coarsePointer;
}
