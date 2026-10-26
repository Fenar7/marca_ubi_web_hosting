import type { RefObject } from "react";

/**
 * Navigation destination interface for the 160/90 benchmark split navigation overlay.
 * Clean, bold editorial routes without numbering clutter.
 */
export interface NavItem {
  readonly label: string;
  readonly href: string;
  readonly index?: string;
  readonly ariaDescription?: string;
}

/**
 * Props contract for the NavigationOverlay dialog orchestrator.
 */
export interface NavigationOverlayProps {
  /** Controls modal visibility, focus trap lifecycle, and body scroll lock */
  readonly isOpen: boolean;
  /** Invoked when overlay requests closure (Esc key, close button, backdrop click, or nav selection) */
  readonly onClose: () => void;
  /** Ref to the triggering button in ClientHeader for WAI-ARIA focus restoration */
  readonly triggerRef?: RefObject<HTMLButtonElement | null>;
  /** Optional custom nav item array */
  readonly navItems?: readonly NavItem[];
}

/**
 * Props contract for the right-panel KineticStage.
 */
export interface KineticStageProps {
  /** Governs whether the GSAP RAF animation loop and pointer listeners are active */
  readonly isActive: boolean;
}
