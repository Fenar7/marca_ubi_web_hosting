"use client";

/**
 * @file ChipRow.tsx
 * @description The one place a `Chip` becomes a button. Both the follow-up row under an answer and the
 *              persistent menu go through here, so a chip cannot be a real action in one surface and a
 *              dead button in another.
 *
 *              The stagger lives on the element, not in JavaScript: five chips that arrive in one frame
 *              read as a wall of buttons, and the 28ms offset is what makes it read as a list you can
 *              scan top to bottom. Under reduced motion the CSS drops the delay entirely.
 * @author Fenar Khan <86710532+Fenar7@users.noreply.github.com>
 */

import type { CSSProperties } from "react";
import type { Chip } from "../types";
import styles from "../ChatPod.module.scss";

interface Props {
  chips: Chip[];
  onChip: (chip: Chip) => void;
  ariaLabel: string;
  /** Selection state for multi-select slot chips, which are toggles rather than pushes. */
  isSelected?: (chip: Chip) => boolean;
  className?: string;
}

export default function ChipRow({ chips, onChip, ariaLabel, isSelected, className }: Props) {
  if (chips.length === 0) return null;

  return (
    <div className={`${styles.chips} ${className ?? ""}`} role="group" aria-label={ariaLabel}>
      {chips.map((chip, index) => {
        const selected = isSelected?.(chip);
        return (
          <button
            key={`${chip.label}-${chip.action.kind}-${"value" in chip.action ? chip.action.value : index}`}
            type="button"
            className={`${styles.chip} ${selected ? styles.chipOn : ""}`}
            style={{ "--chip-index": index } as CSSProperties}
            aria-pressed={selected}
            onClick={() => onChip(chip)}
          >
            {chip.label}
          </button>
        );
      })}
    </div>
  );
}
