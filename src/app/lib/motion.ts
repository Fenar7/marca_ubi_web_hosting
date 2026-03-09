export const MOBILE_MOTION_BREAKPOINT = 899;

export function shouldUseMobileMotion() {
  if (typeof window === "undefined") {
    return false;
  }

  const smallViewport = window.matchMedia(`(max-width: ${MOBILE_MOTION_BREAKPOINT}px)`).matches;
  const coarsePointer = window.matchMedia("(hover: none) and (pointer: coarse)").matches;

  return smallViewport || coarsePointer;
}
