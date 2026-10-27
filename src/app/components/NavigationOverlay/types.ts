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
 * Individual kinetic constellation node representing a core studio discipline or nexus hub.
 */
export interface WordNode {
  /** Unique invariant identifier */
  readonly id: string;
  /** Studio ethos or service discipline title */
  readonly label: string;
  /** Optional architectural typographic glyph or symbol */
  readonly glyph?: string;
  /** Constellation anchor X coordinate percentage (0 - 100) */
  readonly xPct: number;
  /** Constellation anchor Y coordinate percentage (0 - 100) */
  readonly yPct: number;
  /** Identifies the central nexus hub that renders the living brand red dot */
  readonly isCenterHub?: boolean;
}

/**
 * Props contract for the right-panel KineticStage.
 */
export interface KineticStageProps {
  /** Governs whether the GSAP autonomous animation loop and pointer listeners are active */
  readonly isActive: boolean;
  /** Optional custom stage words array conforming to readonly WordNode[] */
  readonly words?: readonly WordNode[];
  /** Optional callback invoked when a word node is activated */
  readonly onWordChange?: (wordId: string) => void;
}
