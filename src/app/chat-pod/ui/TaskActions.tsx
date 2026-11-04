"use client";

import type { Chip } from "../types";
import { commandLabel } from "./replyActions";
import styles from "../ChatPod.module.scss";

interface Props {
  primary: Chip | null;
  secondary: Chip[];
  selectedCount?: number;
  onChip: (chip: Chip) => void;
  onQuestion?: () => void;
  questionOpen?: boolean;
}

/** A fixed place for progression keeps commands distinct from the values they commit. */
export default function TaskActions({ primary, secondary, selectedCount, onChip, onQuestion, questionOpen }: Props) {
  return (
    <div className={styles.taskActions} role="group" aria-label="Brief actions">
      {selectedCount !== undefined ? (
        <p className={styles.selectionSummary} role="status" aria-live="polite" aria-atomic="true">
          {selectedCount} {selectedCount === 1 ? "item" : "items"} selected
        </p>
      ) : null}
      <div className={styles.taskActionRow}>
        <div className={styles.taskSecondaryActions}>
          {secondary.map((chip, index) => (
            <button key={`${chip.action.kind}-${index}`} type="button" className={styles.taskSecondary} onClick={() => onChip(chip)}>
              {commandLabel(chip)}
            </button>
          ))}
        </div>
        {primary ? (
          <button type="button" className={styles.taskPrimary} onClick={() => onChip(primary)}>
            {commandLabel(primary)}
            <span aria-hidden="true">→</span>
          </button>
        ) : null}
      </div>
      {onQuestion ? (
        <button type="button" className={styles.taskQuestion} aria-expanded={questionOpen} onClick={onQuestion}>
          {questionOpen ? "Return to the choices" : "Ask a question or type an answer"}
        </button>
      ) : null}
    </div>
  );
}
